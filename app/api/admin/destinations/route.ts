/**
 * SENTINEL — Admin Destination Risk Override API Route Handler
 *
 * GET   /api/admin/destinations -> list current risk overrides (public read for initial sync)
 * PATCH /api/admin/destinations -> update a whitelisted destination's riskLevel (ADMINISTRATOR only)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getDemoStore } from "@/lib/demo-store";
import { findCatalogEntry } from "@/lib/destination-catalog";
import { DestinationController } from "@/lib/destination-service";
import { RiskCategory, UserRole, type RiskLevel } from "@/lib/models";
import { getSessionFromRequest } from "@/lib/session";

function riskLevelToCategory(level: RiskLevel): RiskCategory {
  if (level === 1) return RiskCategory.LOW;
  if (level === 4) return RiskCategory.CRITICAL;
  return RiskCategory.ELEVATED;
}

export async function GET() {
  const result = await DestinationController.listDestinations();
  return NextResponse.json(
    { success: true, dataSource: result.dataSource, overrides: result.overrides },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  if (session.user.role !== UserRole.ADMINISTRATOR) {
    return NextResponse.json(
      { success: false, error: "Administrator privileges required." },
      { status: 403 },
    );
  }

  let body: { countrySlug?: unknown; riskLevel?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const slugInput =
    typeof body.countrySlug === "string" ? body.countrySlug.trim() : "";
  const entry = findCatalogEntry(slugInput);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Destination not found in 15-country whitelist." },
      { status: 404 },
    );
  }

  const rawLevel = Number(body.riskLevel);
  if (![1, 2, 3, 4].includes(rawLevel)) {
    return NextResponse.json(
      { success: false, error: "riskLevel must be 1, 2, 3, or 4." },
      { status: 400 },
    );
  }

  const riskLevel = rawLevel as RiskLevel;
  const riskCategory = riskLevelToCategory(riskLevel);
  const pool = getPool();

  if (pool) {
    try {
      await pool.query(
        `UPDATE Destination SET risk_category = $1 WHERE country_id = $2;`,
        [riskCategory, entry.countryId],
      );
      await pool.query(
        `UPDATE SafetyAlert SET risk_level = $1 WHERE destination_country_id = $2 AND is_active = TRUE;`,
        [riskLevel, entry.countryId],
      );
      return NextResponse.json(
        {
          success: true,
          dataSource: "postgresql",
          slug: entry.slug,
          riskLevel,
          riskCategory,
        },
        { status: 200 },
      );
    } catch (err) {
      console.error("[AdminDestinations PATCH] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Admin destination service unavailable." },
        { status: 503 },
      );
    }
  }

  const updatedAt = new Date().toISOString();
  getDemoStore().riskOverrides.set(entry.slug, {
    riskLevel,
    riskCategory,
    updatedAt,
  });

  return NextResponse.json(
    {
      success: true,
      dataSource: "demo-seed",
      slug: entry.slug,
      riskLevel,
      riskCategory,
      updatedAt,
    },
    { status: 200 },
  );
}
