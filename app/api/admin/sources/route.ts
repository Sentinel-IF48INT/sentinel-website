/**
 * SENTINEL — Admin Verification Sources API
 *
 * POST   /api/admin/sources -> Add a clickable verification source (ADMINISTRATOR only)
 * DELETE /api/admin/sources?slug=...&id=... -> Remove an admin source (ADMINISTRATOR only)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getDemoStore } from "@/lib/demo-store";
import { findCatalogEntry } from "@/lib/destination-catalog";
import { UserRole } from "@/lib/models";
import { getSessionFromRequest } from "@/lib/session";

function requireAdmin(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      ),
    };
  }
  if (session.user.role !== UserRole.ADMINISTRATOR) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Administrator privileges required." },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}

function isValidHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: { countrySlug?: unknown; name?: unknown; url?: unknown };
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!name || name.length > 150) {
    return NextResponse.json(
      { success: false, error: "Source name is required (max 150 characters)." },
      { status: 400 },
    );
  }
  if (!url || url.length > 500 || !isValidHttpsUrl(url)) {
    return NextResponse.json(
      { success: false, error: "A valid http(s):// source URL is required." },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();
  const pool = getPool();

  if (pool) {
    try {
      const inserted = await pool.query<{ source_id: number }>(
        `INSERT INTO AdvisorySource (destination_country_id, source_name, source_url, source_origin, published_at, updated_at)
         VALUES ($1, $2, $3, 'ADMIN', $4, $4)
         RETURNING source_id;`,
        [entry.countryId, name, url, nowIso],
      );
      return NextResponse.json(
        {
          success: true,
          dataSource: "postgresql",
          source: {
            id: `db-${inserted.rows[0].source_id}`,
            name,
            url,
            origin: "ADMIN",
            publishedAt: nowIso,
            fetchedAt: nowIso,
          },
        },
        { status: 201 },
      );
    } catch (err) {
      console.error("[AdminSources POST] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Admin sources service unavailable." },
        { status: 503 },
      );
    }
  }

  const store = getDemoStore();
  const existing = store.customSources.get(entry.slug) ?? [];
  const newSource = {
    id: `admin-${Date.now()}`,
    slug: entry.slug,
    name,
    url,
    origin: "ADMIN" as const,
    publishedAt: nowIso,
    fetchedAt: nowIso,
  };
  store.customSources.set(entry.slug, [newSource, ...existing]);

  return NextResponse.json(
    { success: true, dataSource: "demo-seed", source: newSource },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const entry = findCatalogEntry(slug);
  if (!entry || !id) {
    return NextResponse.json(
      { success: false, error: "Valid country slug and source id are required." },
      { status: 400 },
    );
  }

  const pool = getPool();
  if (pool && id.startsWith("db-")) {
    const numericId = Number(id.replace("db-", ""));
    try {
      await pool.query(
        `DELETE FROM AdvisorySource WHERE source_id = $1 AND destination_country_id = $2;`,
        [numericId, entry.countryId],
      );
      return NextResponse.json({ success: true, id }, { status: 200 });
    } catch (err) {
      console.error("[AdminSources DELETE] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Admin sources service unavailable." },
        { status: 503 },
      );
    }
  }

  const store = getDemoStore();
  const existing = store.customSources.get(entry.slug) ?? [];
  store.customSources.set(
    entry.slug,
    existing.filter((s) => s.id !== id),
  );
  return NextResponse.json({ success: true, id }, { status: 200 });
}
