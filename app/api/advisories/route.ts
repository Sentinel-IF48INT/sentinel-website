/**
 * GET /api/advisories
 * Returns live/cached risk levels, lastUpdated timestamps, and clickable
 * verification sources (automated + admin-curated) for all 15 whitelisted countries.
 */

import { NextResponse } from "next/server";
import {
  getAdminSourcesForCountry,
  syncAllAdvisories,
  type LiveCountryOverlay,
} from "@/lib/advisory-sync";
import { getDemoStore } from "@/lib/demo-store";
import { DESTINATION_CATALOG } from "@/lib/destination-catalog";

export async function GET() {
  const syncResult = await syncAllAdvisories(false);
  const demoStore = getDemoStore();

  const merged: Record<string, LiveCountryOverlay> = {};
  await Promise.all(
    DESTINATION_CATALOG.map(async (entry) => {
      const base = syncResult.overlays[entry.slug];
      const adminSources = await getAdminSourcesForCountry(
        entry.countryId,
        entry.slug,
      );
      const override = demoStore.riskOverrides.get(entry.slug);

      merged[entry.slug] = {
        slug: entry.slug,
        riskLevel: override?.riskLevel ?? base?.riskLevel ?? entry.riskLevel,
        riskCategory:
          override?.riskCategory ?? base?.riskCategory ?? entry.riskCategory,
        lastUpdated:
          override?.updatedAt ?? base?.lastUpdated ?? entry.lastUpdated,
        feedStatus: base?.feedStatus ?? syncResult.feedStatus,
        sources: [...adminSources, ...(base?.sources ?? [])],
        liveTitle: base?.liveTitle,
      };
    }),
  );

  return NextResponse.json(
    {
      success: true,
      lastSyncedAt: syncResult.lastSyncedAt,
      feedStatus: syncResult.feedStatus,
      advisories: merged,
    },
    { status: 200 },
  );
}
