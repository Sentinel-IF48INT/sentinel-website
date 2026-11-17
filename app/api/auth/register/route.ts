/**
 * POST /api/auth/register — Registers a TRAVELER account and sets HttpOnly session cookie.
 */
import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth-service";
import { attachSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = await AuthService.register({
    fullName: body.fullName,
    username: body.username,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status },
    );
  }

  const response = NextResponse.json(
    { success: true, user: result.user, dataSource: result.dataSource },
    { status: 201 },
  );
  attachSessionCookie(response, result.user, result.dataSource);
  return response;
}
