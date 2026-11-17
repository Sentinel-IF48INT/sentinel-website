/**
 * SENTINEL — Signed HttpOnly Session Cookie Utilities (server-only).
 *
 * Uses HMAC-SHA256 via Node.js `crypto` to sign and verify session payloads
 * stored in an `HttpOnly`, `SameSite=Lax` cookie (`sentinel_session`).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { PublicUserProfile } from "./models";

export const SESSION_COOKIE_NAME = "sentinel_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

interface SessionPayload {
  user: PublicUserProfile;
  dataSource: "postgresql" | "demo-seed";
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    "sentinel-impal-dev-secret-do-not-use-in-production"
  );
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  user: PublicUserProfile,
  dataSource: "postgresql" | "demo-seed",
): string {
  const payload: SessionPayload = {
    user,
    dataSource,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = sign(encoded);
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!parsed?.user?.userId || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(
  request: NextRequest,
): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function attachSessionCookie(
  response: NextResponse,
  user: PublicUserProfile,
  dataSource: "postgresql" | "demo-seed",
): void {
  const token = createSessionToken(user, dataSource);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
