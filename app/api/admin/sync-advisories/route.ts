/**
 * POST /api/admin/sync-advisories
 * Forces an immediate refresh from live government travel advisory APIs.
 * Requires ADMINISTRATOR session.
 */

import { NextResponse, type NextRequest } from "next/server";
import { syncAllAdvisories } from "@/lib/advisory-sync";
import { UserRole } from "@/lib/models";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request: NextRequest) {
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

  const result = await syncAllAdvisories(true);
  return NextResponse.json(
    {
      success: true,
      lastSyncedAt: result.lastSyncedAt,
      feedStatus: result.feedStatus,
      count: Object.keys(result.overlays).length,
      advisories: result.overlays,
    },
    { status: 200 },
  );
}
