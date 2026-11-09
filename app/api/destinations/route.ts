/**
 * ============================================================================
 *  SENTINEL — API Route Handler: GET /api/destinations?q=<query>
 *  Group  : Bluish Pinkies Coco Puff
 *  Course : Software Implementation and Testing (IMPAL) — Week #8
 * ----------------------------------------------------------------------------
 *  Status codes:
 *   - 200 OK              : Whitelisted destination found (profile returned)
 *   - 400 INVALID_QUERY   : Empty, >80 chars, or SQLi/XSS pattern blocked
 *   - 404 NOT_WHITELISTED : Unlisted country (triggers Alternative Flow UI)
 *   - 503 DB_UNAVAILABLE  : DATABASE_URL configured but PostgreSQL unreachable
 * ============================================================================
 */

import { NextResponse, type NextRequest } from "next/server";
import { DestinationController } from "@/lib/destination-service";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const result = await DestinationController.searchDestination(query);

  if (!result.ok || !result.profile) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        status: result.status,
        code: result.code,
        dataSource: result.dataSource,
        query: result.query,
        profile: null,
        error: result.error ?? "Destination search failed.",
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      success: true,
      status: 200,
      code: result.code,
      dataSource: result.dataSource,
      query: result.query,
      profile: result.profile,
    },
    { status: 200 },
  );
}
