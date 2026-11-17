/**
 * SENTINEL — Watchlist API Route Handler (UC-8 & UC-15)
 *
 * GET    /api/watchlist           -> list authenticated TRAVELER's saved destinations
 * POST   /api/watchlist           -> add destination (body: { countrySlug, reminderNote? })
 * DELETE /api/watchlist?slug=...  -> remove destination from watchlist
 */

import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getDemoStore } from "@/lib/demo-store";
import { findCatalogEntry } from "@/lib/destination-catalog";
import { UserRole } from "@/lib/models";
import { getSessionFromRequest } from "@/lib/session";

function requireTraveler(request: NextRequest) {
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
  if (session.user.role !== UserRole.TRAVELER) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Only Traveler accounts can manage a personal watchlist.",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}

export async function GET(request: NextRequest) {
  const auth = requireTraveler(request);
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.userId;
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query<{
        watchlist_id: number;
        iso_alpha_3_code: string;
        reminder_note: string | null;
        saved_at: string;
      }>(
        `SELECT w.watchlist_id, d.iso_alpha_3_code, w.reminder_note, w.saved_at
         FROM Watchlist w
         JOIN Destination d ON d.country_id = w.destination_country_id
         WHERE w.user_id = $1
         ORDER BY w.saved_at DESC;`,
        [userId],
      );

      const items = res.rows.map((r) => ({
        watchlistId: r.watchlist_id,
        slug: r.iso_alpha_3_code.trim().toLowerCase(),
        reminderNote: r.reminder_note,
        savedAt: r.saved_at,
      }));

      return NextResponse.json(
        { success: true, dataSource: "postgresql", items },
        { status: 200 },
      );
    } catch (err) {
      console.error("[Watchlist GET] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Watchlist service unavailable." },
        { status: 503 },
      );
    }
  }

  const store = getDemoStore();
  const records = store.watchlists.get(userId) ?? [];
  const items = records.map((r) => ({
    watchlistId: r.watchlist_id,
    slug: r.slug,
    reminderNote: r.reminder_note,
    savedAt: r.saved_at,
  }));

  return NextResponse.json(
    { success: true, dataSource: "demo-seed", items },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const auth = requireTraveler(request);
  if (!auth.ok) return auth.response;

  let body: { countrySlug?: unknown; reminderNote?: unknown };
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
      { success: false, error: "Destination is not in the 15-country whitelist." },
      { status: 404 },
    );
  }

  const reminderNote =
    typeof body.reminderNote === "string"
      ? body.reminderNote.trim().slice(0, 255) || null
      : null;
  const userId = auth.session.user.userId;
  const pool = getPool();

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO Watchlist (user_id, destination_country_id, reminder_note)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, destination_country_id)
         DO UPDATE SET reminder_note = COALESCE(EXCLUDED.reminder_note, Watchlist.reminder_note);`,
        [userId, entry.countryId, reminderNote],
      );
      return NextResponse.json(
        { success: true, dataSource: "postgresql", slug: entry.slug },
        { status: 201 },
      );
    } catch (err) {
      console.error("[Watchlist POST] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Watchlist service unavailable." },
        { status: 503 },
      );
    }
  }

  const store = getDemoStore();
  const list = store.watchlists.get(userId) ?? [];
  const existing = list.find((item) => item.slug === entry.slug);
  if (existing) {
    if (reminderNote !== null) existing.reminder_note = reminderNote;
  } else {
    list.unshift({
      watchlist_id: store.nextWatchlistId++,
      user_id: userId,
      slug: entry.slug,
      country_id: entry.countryId,
      reminder_note: reminderNote,
      saved_at: new Date().toISOString(),
    });
    store.watchlists.set(userId, list);
  }

  return NextResponse.json(
    { success: true, dataSource: "demo-seed", slug: entry.slug },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const auth = requireTraveler(request);
  if (!auth.ok) return auth.response;

  const slugInput = request.nextUrl.searchParams.get("slug") ?? "";
  const entry = findCatalogEntry(slugInput);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Destination is not in the 15-country whitelist." },
      { status: 404 },
    );
  }

  const userId = auth.session.user.userId;
  const pool = getPool();

  if (pool) {
    try {
      await pool.query(
        `DELETE FROM Watchlist WHERE user_id = $1 AND destination_country_id = $2;`,
        [userId, entry.countryId],
      );
      return NextResponse.json(
        { success: true, dataSource: "postgresql", slug: entry.slug },
        { status: 200 },
      );
    } catch (err) {
      console.error("[Watchlist DELETE] PostgreSQL failed:", err);
      return NextResponse.json(
        { success: false, error: "Watchlist service unavailable." },
        { status: 503 },
      );
    }
  }

  const store = getDemoStore();
  const list = store.watchlists.get(userId) ?? [];
  store.watchlists.set(
    userId,
    list.filter((item) => item.slug !== entry.slug),
  );

  return NextResponse.json(
    { success: true, dataSource: "demo-seed", slug: entry.slug },
    { status: 200 },
  );
}
