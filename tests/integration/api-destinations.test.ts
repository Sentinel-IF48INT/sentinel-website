import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/destinations/route";

function makeRequest(q: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/destinations?q=${encodeURIComponent(q)}`,
  );
}

describe("GET /api/destinations Integration Tests", () => {
  it("returns 200 OK for whitelisted English, Bahasa Indonesia, and ISO3 queries", async () => {
    for (const q of ["Japan", "Jepang", "SYR", "Prancis"]) {
      const res = await GET(makeRequest(q));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.code).toBe("OK");
      expect(body.profile).toBeTruthy();
      expect(body.profile.embassy.missionName).toContain("KBRI");
    }
  });

  it("returns 404 NOT_WHITELISTED for countries outside the 15-country whitelist", async () => {
    const res = await GET(makeRequest("Narnia"));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("NOT_WHITELISTED");
  });

  it("returns 400 INVALID_QUERY for empty, >80 char, or SQLi/XSS queries", async () => {
    const invalidQueries = [
      "",
      "a".repeat(81),
      "' OR 1=1 --",
      "<script>alert(1)</script>",
      "Japan; DROP TABLE Destination;",
    ];

    for (const q of invalidQueries) {
      const res = await GET(makeRequest(q));
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.ok).toBe(false);
      expect(body.code).toBe("INVALID_QUERY");
    }
  });
});
