/**
 * POST /api/auth/login
 * Body:     { "email": string, "password": string }
 * 200 OK:   { "success": true,  "user": PublicUserProfile, "dataSource": "postgresql" | "demo-seed" }
 *           + Set-Cookie: sentinel_session (HttpOnly, SameSite=Lax, HMAC-SHA256 signed)
 * 400/401/503: { "success": false, "error": string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth-service";
import { attachSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = await AuthService.login(body.email, body.password);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status },
    );
  }

  const response = NextResponse.json(
    { success: true, user: result.user, dataSource: result.dataSource },
    { status: 200 },
  );
  attachSessionCookie(response, result.user, result.dataSource);
  return response;
}
