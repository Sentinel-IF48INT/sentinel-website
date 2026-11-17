/**
 * GET /api/auth/me — Verifies the signed HttpOnly session cookie.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { success: false, authenticated: false, user: null },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      authenticated: true,
      user: session.user,
      dataSource: session.dataSource,
    },
    { status: 200 },
  );
}
