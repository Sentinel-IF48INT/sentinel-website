import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import {
  GET as watchlistGET,
  POST as watchlistPOST,
  DELETE as watchlistDELETE,
} from "@/app/api/watchlist/route";
import { PATCH as adminPATCH } from "@/app/api/admin/destinations/route";
import { SESSION_COOKIE_NAME } from "@/lib/session";

function extractSessionCookie(res: Response): string {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? "";
}

describe("Auth, Signed HttpOnly Session & RBAC Integration Tests", () => {
  it("logs in valid Traveler, sets HttpOnly cookie, and restores session via /api/auth/me", async () => {
    const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "RAKA.PRATAMA@email.com",
        password: "Sentinel@2026",
      }),
    });

    const loginRes = await loginPOST(loginReq);
    const loginBody = await loginRes.json();
    expect(loginRes.status).toBe(200);
    expect(loginBody.success).toBe(true);
    expect(loginBody.user.role).toBe("TRAVELER");
    expect(loginBody.user.passwordHash).toBeUndefined();

    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain("httponly");

    const token = extractSessionCookie(loginRes);
    const meReq = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const meRes = await meGET(meReq);
    const meBody = await meRes.json();
    expect(meRes.status).toBe(200);
    expect(meBody.authenticated).toBe(true);
    expect(meBody.user.email).toBe("raka.pratama@email.com");
  });

  it("returns identical 401 message for unknown email and wrong password (anti-enumeration)", async () => {
    const unknownRes = await loginPOST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nobody@email.com", password: "Sentinel@2026" }),
      }),
    );
    const wrongPassRes = await loginPOST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "raka.pratama@email.com", password: "Wrong!" }),
      }),
    );

    expect(unknownRes.status).toBe(401);
    expect(wrongPassRes.status).toBe(401);
    expect((await unknownRes.json()).error).toBe((await wrongPassRes.json()).error);
  });

  it("enforces RBAC on /api/watchlist and /api/admin/destinations", async () => {
    // Unauthenticated -> 401
    const unauthWatchlist = await watchlistGET(
      new NextRequest("http://localhost:3000/api/watchlist"),
    );
    expect(unauthWatchlist.status).toBe(401);

    // Login as Traveler
    const travLogin = await loginPOST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "raka.pratama@email.com",
          password: "Sentinel@2026",
        }),
      }),
    );
    const travToken = extractSessionCookie(travLogin);

    // Traveler can add & remove watchlist items
    const addRes = await watchlistPOST(
      new NextRequest("http://localhost:3000/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${travToken}`,
        },
        body: JSON.stringify({ countrySlug: "fra" }),
      }),
    );
    expect(addRes.status).toBe(201);

    const delRes = await watchlistDELETE(
      new NextRequest("http://localhost:3000/api/watchlist?slug=fra", {
        method: "DELETE",
        headers: { cookie: `${SESSION_COOKIE_NAME}=${travToken}` },
      }),
    );
    expect(delRes.status).toBe(200);

    // Traveler cannot call admin endpoint -> 403
    const travAdmin = await adminPATCH(
      new NextRequest("http://localhost:3000/api/admin/destinations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${travToken}`,
        },
        body: JSON.stringify({ countrySlug: "jpn", riskLevel: 2 }),
      }),
    );
    expect(travAdmin.status).toBe(403);

    // Logout clears cookie
    const logoutRes = await logoutPOST();
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
