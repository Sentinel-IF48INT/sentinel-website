import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as advisoriesGET } from "@/app/api/advisories/route";
import { POST as syncPOST } from "@/app/api/admin/sync-advisories/route";
import {
  POST as sourcesPOST,
  DELETE as sourcesDELETE,
} from "@/app/api/admin/sources/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { SESSION_COOKIE_NAME } from "@/lib/session";

function extractCookie(res: Response): string {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? "";
}

describe("Live Advisories & Admin Verification Sources API Integration Tests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.__sentinelAdvisoryCache = undefined;
  });

  it("returns advisories with clickable sources and timestamps via GET /api/advisories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Offline test mode")),
    );
    const res = await advisoriesGET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.advisories.jpn.lastUpdated).toBeTruthy();
    expect(body.advisories.jpn.sources.length).toBeGreaterThan(0);
  });

  it("enforces ADMINISTRATOR RBAC on sync-advisories and admin sources CRUD", async () => {
    // Unauthenticated -> 401
    const unauthSync = await syncPOST(
      new NextRequest("http://localhost:3000/api/admin/sync-advisories", {
        method: "POST",
      }),
    );
    expect(unauthSync.status).toBe(401);

    // Traveler -> 403
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
    const travToken = extractCookie(travLogin);
    const travSync = await syncPOST(
      new NextRequest("http://localhost:3000/api/admin/sync-advisories", {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE_NAME}=${travToken}` },
      }),
    );
    expect(travSync.status).toBe(403);

    // Admin -> 201 add source + 400 invalid URL + 200 delete source
    const adminLogin = await loginPOST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "dimas.handoko@email.com",
          password: "Sentinel@2026",
        }),
      }),
    );
    const adminToken = extractCookie(adminLogin);

    const badUrlRes = await sourcesPOST(
      new NextRequest("http://localhost:3000/api/admin/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: JSON.stringify({
          countrySlug: "jpn",
          name: "Bad Link",
          url: "javascript:alert(1)",
        }),
      }),
    );
    expect(badUrlRes.status).toBe(400);

    const addRes = await sourcesPOST(
      new NextRequest("http://localhost:3000/api/admin/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        },
        body: JSON.stringify({
          countrySlug: "jpn",
          name: "KBRI Tokyo Official Notice",
          url: "https://kemlu.go.id/tokyo",
        }),
      }),
    );
    const addBody = await addRes.json();
    expect(addRes.status).toBe(201);
    expect(addBody.source.origin).toBe("ADMIN");

    const delRes = await sourcesDELETE(
      new NextRequest(
        `http://localhost:3000/api/admin/sources?slug=jpn&id=${encodeURIComponent(addBody.source.id)}`,
        {
          method: "DELETE",
          headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
        },
      ),
    );
    expect(delRes.status).toBe(200);
  });
});
