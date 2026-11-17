/**
 * SENTINEL — Live Risk Advisory Sync Service (server-only)
 *
 * Hybrid verification model:
 *   1. Automated feeds: U.S. State Department Consular Affairs Data API
 *      (cadataapi.state.gov) + UK FCDO Content API (gov.uk/api/content/...)
 *      with 1-hour TTL caching and 5s timeout fallback.
 *   2. Admin-curated sources: stored in PostgreSQL `AdvisorySource` or
 *      `getDemoStore().customSources`.
 */

import { getPool } from "./db";
import { getDemoStore } from "./demo-store";
import {
  DESTINATION_CATALOG,
  type CatalogDestinationEntry,
} from "./destination-catalog";
import { RiskCategory, type RiskLevel } from "./models";

export interface VerificationSource {
  id: string;
  name: string;
  url: string;
  origin: "AUTOMATED" | "ADMIN";
  publishedAt?: string;
  fetchedAt: string;
}

export interface LiveCountryOverlay {
  slug: string;
  riskLevel: RiskLevel;
  riskCategory: RiskCategory;
  lastUpdated: string;
  feedStatus: "live" | "cached" | "seed";
  sources: VerificationSource[];
  liveTitle?: string;
}

interface StateDeptAdvisoryItem {
  Title?: string;
  Link?: string;
  Updated?: string;
  Category?: string[];
  Summary?: string;
}

interface UkFcdoResponse {
  web_url?: string;
  public_updated_at?: string;
  title?: string;
}

interface AdvisoryCacheState {
  overlays: Map<string, LiveCountryOverlay>;
  lastSyncedAt: string | null;
  fetchedAtMs: number;
  feedStatus: "live" | "cached" | "seed";
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 5000;

const UK_GOV_SLUGS: Record<string, string> = {
  jpn: "japan",
  aus: "australia",
  fra: "france",
  syr: "syria",
  che: "switzerland",
  sgp: "singapore",
  nzl: "new-zealand",
  tha: "thailand",
  tur: "turkey",
  bra: "brazil",
  egy: "egypt",
  mli: "mali",
  hti: "haiti",
  yem: "yemen",
  som: "somalia",
};

declare global {
  var __sentinelAdvisoryCache: AdvisoryCacheState | undefined;
}

function getCache(): AdvisoryCacheState {
  if (!globalThis.__sentinelAdvisoryCache) {
    globalThis.__sentinelAdvisoryCache = {
      overlays: new Map(),
      lastSyncedAt: null,
      fetchedAtMs: 0,
      feedStatus: "seed",
    };
  }
  return globalThis.__sentinelAdvisoryCache;
}

export function riskLevelToCategory(level: RiskLevel): RiskCategory {
  if (level === 1) return RiskCategory.LOW;
  if (level === 4) return RiskCategory.CRITICAL;
  return RiskCategory.ELEVATED;
}

export function parseRiskLevelFromTitle(title: string): RiskLevel | null {
  const match = title.match(/Level\s*([1-4])/i);
  if (!match) return null;
  const num = Number(match[1]);
  if (num === 1 || num === 2 || num === 3 || num === 4) return num;
  return null;
}

function buildBaselineSources(entry: CatalogDestinationEntry): VerificationSource[] {
  const ukSlug = UK_GOV_SLUGS[entry.slug] ?? entry.countryName.toLowerCase().replace(/\s+/g, "-");
  return [
    {
      id: `kemlu-${entry.slug}`,
      name: "Kemlu RI — Peduli WNI Portal",
      url: "https://peduliwni.kemlu.go.id/",
      origin: "AUTOMATED",
      publishedAt: entry.lastUpdated,
      fetchedAt: entry.lastUpdated,
    },
    {
      id: `ukfcdo-base-${entry.slug}`,
      name: `UK FCDO Travel Advice (${entry.countryName})`,
      url: `https://www.gov.uk/foreign-travel-advice/${ukSlug}`,
      origin: "AUTOMATED",
      publishedAt: entry.lastUpdated,
      fetchedAt: entry.lastUpdated,
    },
  ];
}

function matchesStateDeptEntry(
  item: StateDeptAdvisoryItem,
  entry: CatalogDestinationEntry,
): boolean {
  const titleLower = (item.Title ?? "").toLowerCase();
  const categories = (item.Category ?? []).map((c) => c.toLowerCase());
  const nameLower = entry.countryName.toLowerCase();
  return (
    titleLower.startsWith(`${nameLower} `) ||
    titleLower.includes(`${nameLower} -`) ||
    categories.includes(entry.iso2.toLowerCase()) ||
    categories.includes(entry.iso3.toLowerCase())
  );
}

export async function syncAllAdvisories(force = false): Promise<{
  lastSyncedAt: string | null;
  feedStatus: "live" | "cached" | "seed";
  overlays: Record<string, LiveCountryOverlay>;
}> {
  const cache = getCache();
  const isFresh =
    !force &&
    cache.overlays.size > 0 &&
    Date.now() - cache.fetchedAtMs < CACHE_TTL_MS;

  if (isFresh) {
    return {
      lastSyncedAt: cache.lastSyncedAt,
      feedStatus: "cached",
      overlays: Object.fromEntries(cache.overlays),
    };
  }

  const nowIso = new Date().toISOString();
  try {
    const res = await fetch(
      "https://cadataapi.state.gov/api/TravelAdvisories",
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) {
      throw new Error(`State Dept API HTTP ${res.status}`);
    }

    const data = (await res.json()) as unknown;
    const items: StateDeptAdvisoryItem[] = Array.isArray(data) ? data : [];

    for (const entry of DESTINATION_CATALOG) {
      const match = items.find((item) => matchesStateDeptEntry(item, entry));
      const parsedLevel =
        (match?.Title ? parseRiskLevelFromTitle(match.Title) : null) ??
        entry.riskLevel;
      const updatedIso = match?.Updated
        ? new Date(match.Updated).toISOString()
        : entry.lastUpdated;

      const sources: VerificationSource[] = [];
      if (match?.Link) {
        sources.push({
          id: `statedept-${entry.slug}`,
          name: "U.S. Department of State Travel Advisory",
          url: match.Link,
          origin: "AUTOMATED",
          publishedAt: updatedIso,
          fetchedAt: nowIso,
        });
      }
      sources.push(...buildBaselineSources(entry));

      cache.overlays.set(entry.slug, {
        slug: entry.slug,
        riskLevel: parsedLevel,
        riskCategory: riskLevelToCategory(parsedLevel),
        lastUpdated: updatedIso,
        feedStatus: "live",
        sources,
        liveTitle: match?.Title,
      });
    }

    cache.lastSyncedAt = nowIso;
    cache.fetchedAtMs = Date.now();
    cache.feedStatus = "live";

    return {
      lastSyncedAt: cache.lastSyncedAt,
      feedStatus: "live",
      overlays: Object.fromEntries(cache.overlays),
    };
  } catch {
    // Graceful offline / timeout fallback: preserve prior cache if available, else seed
    if (cache.overlays.size > 0) {
      cache.feedStatus = "cached";
      return {
        lastSyncedAt: cache.lastSyncedAt,
        feedStatus: "cached",
        overlays: Object.fromEntries(cache.overlays),
      };
    }

    const seedMap: Record<string, LiveCountryOverlay> = {};
    for (const entry of DESTINATION_CATALOG) {
      seedMap[entry.slug] = {
        slug: entry.slug,
        riskLevel: entry.riskLevel,
        riskCategory: entry.riskCategory,
        lastUpdated: entry.lastUpdated,
        feedStatus: "seed",
        sources: buildBaselineSources(entry),
      };
    }

    return {
      lastSyncedAt: null,
      feedStatus: "seed",
      overlays: seedMap,
    };
  }
}

export async function fetchUkFcdoSource(
  entry: CatalogDestinationEntry,
): Promise<VerificationSource | null> {
  const ukSlug = UK_GOV_SLUGS[entry.slug];
  if (!ukSlug) return null;

  try {
    const res = await fetch(
      `https://www.gov.uk/api/content/foreign-travel-advice/${ukSlug}`,
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as UkFcdoResponse;
    return {
      id: `ukfcdo-${entry.slug}`,
      name: `UK FCDO Travel Advice (${entry.countryName})`,
      url: json.web_url
        ? `https://www.gov.uk${json.web_url.startsWith("/") ? "" : "/"}${json.web_url}`.replace(
            "https://www.gov.ukhttps://www.gov.uk",
            "https://www.gov.uk",
          )
        : `https://www.gov.uk/foreign-travel-advice/${ukSlug}`,
      origin: "AUTOMATED",
      publishedAt: json.public_updated_at ?? entry.lastUpdated,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAdminSourcesForCountry(
  countryId: number,
  slug: string,
): Promise<VerificationSource[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query<{
        source_id: number;
        source_name: string;
        source_url: string;
        source_origin: "AUTOMATED" | "ADMIN";
        published_at: string | null;
        updated_at: string;
      }>(
        `SELECT source_id, source_name, source_url, source_origin, published_at, updated_at
         FROM AdvisorySource
         WHERE destination_country_id = $1
         ORDER BY updated_at DESC, source_id DESC;`,
        [countryId],
      );
      return res.rows.map((r) => ({
        id: `db-${r.source_id}`,
        name: r.source_name,
        url: r.source_url,
        origin: r.source_origin,
        publishedAt: r.published_at ?? r.updated_at,
        fetchedAt: r.updated_at,
      }));
    } catch {
      // Fallback to demo store if table isn't migrated yet
    }
  }

  const custom = getDemoStore().customSources.get(slug) ?? [];
  return custom.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    origin: s.origin,
    publishedAt: s.publishedAt,
    fetchedAt: s.fetchedAt,
  }));
}

export async function getEnrichedCountryAdvisory(
  entry: CatalogDestinationEntry,
): Promise<{
  riskLevel: RiskLevel;
  riskCategory: RiskCategory;
  lastUpdated: string;
  lastSyncedAt: string | null;
  feedStatus: "live" | "cached" | "seed";
  sources: VerificationSource[];
}> {
  const syncResult = await syncAllAdvisories(false);
  const liveOverlay = syncResult.overlays[entry.slug];
  const adminSources = await getAdminSourcesForCountry(entry.countryId, entry.slug);
  const demoOverride = getDemoStore().riskOverrides.get(entry.slug);

  const ukLive = await fetchUkFcdoSource(entry);
  const baseSources = liveOverlay?.sources ?? buildBaselineSources(entry);
  const mergedAutoSources = ukLive
    ? [
        ...baseSources.filter((s) => !s.id.startsWith("ukfcdo")),
        ukLive,
      ]
    : baseSources;

  const effectiveRiskLevel =
    demoOverride?.riskLevel ?? liveOverlay?.riskLevel ?? entry.riskLevel;
  const effectiveCategory =
    demoOverride?.riskCategory ??
    liveOverlay?.riskCategory ??
    entry.riskCategory;
  const effectiveUpdated =
    demoOverride?.updatedAt ?? liveOverlay?.lastUpdated ?? entry.lastUpdated;

  return {
    riskLevel: effectiveRiskLevel,
    riskCategory: effectiveCategory,
    lastUpdated: effectiveUpdated,
    lastSyncedAt: syncResult.lastSyncedAt,
    feedStatus: syncResult.feedStatus,
    sources: [...adminSources, ...mergedAutoSources],
  };
}
