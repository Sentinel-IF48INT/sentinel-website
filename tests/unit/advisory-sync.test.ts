import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseRiskLevelFromTitle,
  syncAllAdvisories,
} from "@/lib/advisory-sync";

describe("Advisory Sync Service (lib/advisory-sync.ts)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.__sentinelAdvisoryCache = undefined;
  });

  it("parses Level 1–4 from State Department advisory titles", () => {
    expect(parseRiskLevelFromTitle("Japan - Level 1: Exercise Normal Precautions")).toBe(1);
    expect(parseRiskLevelFromTitle("France - Level 2: Exercise Increased Caution")).toBe(2);
    expect(parseRiskLevelFromTitle("Egypt - Level 3: Reconsider Travel")).toBe(3);
    expect(parseRiskLevelFromTitle("Syria - Level 4: Do Not Travel")).toBe(4);
    expect(parseRiskLevelFromTitle("Unknown Title")).toBeNull();
  });

  it("syncs live State Department advisories with clickable URLs and lastUpdated", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Title: "Japan - Level 2: Exercise Increased Caution",
          Link: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/japan-travel-advisory.html",
          Updated: "2026-11-17T10:00:00Z",
          Category: ["JP", "JPN"],
        },
      ],
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await syncAllAdvisories(true);
    expect(result.feedStatus).toBe("live");
    expect(result.lastSyncedAt).toBeTruthy();
    expect(result.overlays.jpn.riskLevel).toBe(2);
    expect(result.overlays.jpn.lastUpdated).toBe("2026-11-17T10:00:00.000Z");
    expect(result.overlays.jpn.sources.some((s) => s.url.includes("travel.state.gov"))).toBe(true);
  });

  it("falls back gracefully to seed data when external API is unreachable", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));
    vi.stubGlobal("fetch", mockFetch);

    const result = await syncAllAdvisories(true);
    expect(result.feedStatus).toBe("seed");
    expect(result.overlays.jpn.riskLevel).toBe(1);
    expect(result.overlays.jpn.sources.length).toBeGreaterThan(0);
  });
});
