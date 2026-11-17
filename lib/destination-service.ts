/**
 * SENTINEL — DestinationController (UC-01, UC-02, UC-10, server-only).
 *
 * Dual-mode persistence:
 *   - PostgreSQL (`pg`) when DATABASE_URL is configured (returns 503 on error)
 *   - In-memory 15-country catalog (`demo-seed`) when DATABASE_URL is omitted
 */

import { getPool } from "./db";
import { getDemoStore } from "./demo-store";
import {
  DESTINATION_CATALOG,
  findCatalogEntry,
  type CatalogDestinationEntry,
} from "./destination-catalog";
import {
  Destination,
  EmergencyContact,
  RiskCategory,
  SafetyAlert,
  type DestinationRow,
  type EmergencyContactRow,
  type RiskLevel,
  type SafetyAlertRow,
} from "./models";

export interface DestinationProfileDTO {
  slug: string;
  iso2: string;
  countryName: string;
  nameId: string;
  region: string;
  capital: string;
  riskLevel: RiskLevel;
  riskCategory: "LOW" | "ELEVATED" | "CRITICAL";
  lng: number;
  lat: number;
  imageUrl: string;
  lastUpdated: string;
  summary: string;
  generalInfo: string;
  destination: {
    countryId: number;
    countryName: string;
    isoAlpha3Code: string;
    riskCategory: "LOW" | "ELEVATED" | "CRITICAL";
    generalInfo: string;
  };
  activeAlerts: Array<{
    id: string;
    alertId: number;
    riskLevel: RiskLevel;
    severity: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    date: string;
    detail: string;
  }>;
  embassy: {
    missionName: string;
    address: string;
    hotline: string;
    localEmergency: string;
    email: string;
  };
}

export type DestinationSearchResult =
  | {
      ok: true;
      status: 200;
      code: "OK";
      dataSource: "postgresql" | "demo-seed";
      query: string;
      profile: DestinationProfileDTO;
    }
  | {
      ok: false;
      status: 400 | 404 | 503;
      code: "INVALID_QUERY" | "NOT_WHITELISTED" | "DB_UNAVAILABLE";
      dataSource: "postgresql" | "demo-seed";
      query: string;
      profile: null;
      error: string;
    };

const SUSPICIOUS_QUERY_PATTERN =
  /(<|>|;|--|\/\*|\*\/|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|SCRIPT)\b|['"`=])/i;

function riskLevelToSeverity(
  level: RiskLevel,
): "INFO" | "WARNING" | "CRITICAL" {
  if (level >= 4) return "CRITICAL";
  if (level >= 2) return "WARNING";
  return "INFO";
}

function buildDTOFromEntities(
  dest: Destination,
  catalogMeta: CatalogDestinationEntry,
): DestinationProfileDTO {
  const profile = dest.getSafetyProfile();
  const primaryContact = profile.emergencyContacts[0];

  return {
    slug: catalogMeta.slug,
    iso2: catalogMeta.iso2,
    countryName: dest.getCountryName(),
    nameId: catalogMeta.nameId,
    region: catalogMeta.region,
    capital: catalogMeta.capital,
    riskLevel: profile.riskLevel,
    riskCategory: dest.getRiskCategory(),
    lng: catalogMeta.lng,
    lat: catalogMeta.lat,
    imageUrl: catalogMeta.imageUrl,
    lastUpdated: catalogMeta.lastUpdated,
    summary: dest.getGeneralInfo(),
    generalInfo: dest.getGeneralInfo(),
    destination: {
      countryId: dest.getCountryId(),
      countryName: dest.getCountryName(),
      isoAlpha3Code: dest.getIsoAlpha3Code(),
      riskCategory: dest.getRiskCategory(),
      generalInfo: dest.getGeneralInfo(),
    },
    activeAlerts: profile.activeAlerts.map((alert) => ({
      id: `${catalogMeta.slug}-${alert.getAlertId()}`,
      alertId: alert.getAlertId(),
      riskLevel: alert.getRiskLevel(),
      severity: riskLevelToSeverity(alert.getRiskLevel()),
      title: alert.getTitle(),
      date: catalogMeta.lastUpdated,
      detail: alert.getDetail(),
    })),
    embassy: {
      missionName:
        primaryContact?.getMissionName() ?? catalogMeta.embassy.missionName,
      address: catalogMeta.embassy.address,
      hotline: primaryContact?.getHotline() ?? catalogMeta.embassy.hotline,
      localEmergency: catalogMeta.embassy.localEmergency,
      email: primaryContact?.getEmail() ?? catalogMeta.embassy.email,
    },
  };
}

export class DestinationController {
  public static validateSearchQuery(rawQuery: string): {
    valid: boolean;
    normalized: string;
    error?: string;
  } {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return {
        valid: false,
        normalized: "",
        error: "Search query cannot be empty.",
      };
    }
    if (trimmed.length > 80) {
      return {
        valid: false,
        normalized: trimmed,
        error: "Search query exceeds the 80-character limit.",
      };
    }
    if (SUSPICIOUS_QUERY_PATTERN.test(trimmed)) {
      return {
        valid: false,
        normalized: trimmed,
        error: "Search query contains disallowed characters or patterns.",
      };
    }
    return { valid: true, normalized: trimmed };
  }

  public static async searchDestination(
    rawQuery: string,
  ): Promise<DestinationSearchResult> {
    const validation = DestinationController.validateSearchQuery(rawQuery);
    const pool = getPool();
    const dataSource: "postgresql" | "demo-seed" = pool
      ? "postgresql"
      : "demo-seed";

    if (!validation.valid) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_QUERY",
        dataSource,
        query: rawQuery,
        profile: null,
        error: validation.error ?? "Invalid search query.",
      };
    }

    const catalogMatch = findCatalogEntry(validation.normalized);
    if (!catalogMatch) {
      return {
        ok: false,
        status: 404,
        code: "NOT_WHITELISTED",
        dataSource,
        query: validation.normalized,
        profile: null,
        error: "Destination not found in the 15-country WNI whitelist.",
      };
    }

    if (pool) {
      try {
        const destRes = await pool.query<DestinationRow>(
          `SELECT country_id, country_name, iso_alpha_3_code, is_whitelisted, risk_category, general_info
           FROM Destination
           WHERE UPPER(iso_alpha_3_code) = UPPER($1) AND is_whitelisted = TRUE
           LIMIT 1;`,
          [catalogMatch.iso3],
        );

        const row = destRes.rows[0];
        if (!row) {
          return {
            ok: false,
            status: 404,
            code: "NOT_WHITELISTED",
            dataSource: "postgresql",
            query: validation.normalized,
            profile: null,
            error: "Destination not found in the 15-country WNI whitelist.",
          };
        }

        const dest = Destination.fromRow(row);

        const [alertsRes, contactsRes] = await Promise.all([
          pool.query<SafetyAlertRow>(
            `SELECT alert_id, destination_country_id, risk_level, title, detail, is_active
             FROM SafetyAlert
             WHERE destination_country_id = $1 AND is_active = TRUE
             ORDER BY risk_level DESC, alert_id ASC;`,
            [dest.getCountryId()],
          ),
          pool.query<EmergencyContactRow>(
            `SELECT contact_id, destination_country_id, mission_name, hotline, email
             FROM EmergencyContact
             WHERE destination_country_id = $1
             ORDER BY contact_id ASC;`,
            [dest.getCountryId()],
          ),
        ]);

        for (const alertRow of alertsRes.rows) {
          dest.addSafetyAlert(SafetyAlert.fromRow(alertRow));
        }
        for (const contactRow of contactsRes.rows) {
          dest.addEmergencyContact(EmergencyContact.fromRow(contactRow));
        }

        return {
          ok: true,
          status: 200,
          code: "OK",
          dataSource: "postgresql",
          query: validation.normalized,
          profile: buildDTOFromEntities(dest, catalogMatch),
        };
      } catch (err) {
        console.error("[DestinationController] PostgreSQL query failed:", err);
        return {
          ok: false,
          status: 503,
          code: "DB_UNAVAILABLE",
          dataSource: "postgresql",
          query: validation.normalized,
          profile: null,
          error: "Destination service unavailable. Please try again later.",
        };
      }
    }

    // Demo-seed mode (with any in-memory admin risk overrides applied)
    const demoOverride = getDemoStore().riskOverrides.get(catalogMatch.slug);
    const effectiveCategory = demoOverride
      ? demoOverride.riskCategory
      : (catalogMatch.riskCategory as RiskCategory);
    const effectiveRiskLevel = demoOverride
      ? demoOverride.riskLevel
      : catalogMatch.riskLevel;

    const dest = new Destination(
      catalogMatch.countryId,
      catalogMatch.countryName,
      catalogMatch.iso3,
      true,
      effectiveCategory,
      catalogMatch.generalInfo,
    );
    dest.addSafetyAlert(
      new SafetyAlert(
        catalogMatch.alert.alertId,
        catalogMatch.countryId,
        effectiveRiskLevel,
        catalogMatch.alert.title,
        catalogMatch.alert.detail,
        true,
      ),
    );
    dest.addEmergencyContact(
      new EmergencyContact(
        catalogMatch.embassy.contactId,
        catalogMatch.countryId,
        catalogMatch.embassy.missionName,
        catalogMatch.embassy.hotline,
        catalogMatch.embassy.email,
      ),
    );

    const dto = buildDTOFromEntities(dest, catalogMatch);
    // Ensure riskLevel reflects admin override even when alert level differs
    dto.riskLevel = effectiveRiskLevel;

    return {
      ok: true,
      status: 200,
      code: "OK",
      dataSource: "demo-seed",
      query: validation.normalized,
      profile: dto,
    };
  }

  public static async listDestinations(): Promise<{
    dataSource: "postgresql" | "demo-seed";
    overrides: Record<string, { riskLevel: RiskLevel; riskCategory: RiskCategory }>;
  }> {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query<{
          iso_alpha_3_code: string;
          risk_category: string;
          max_risk: number | null;
        }>(
          `SELECT d.iso_alpha_3_code, d.risk_category, MAX(a.risk_level) AS max_risk
           FROM Destination d
           LEFT JOIN SafetyAlert a ON a.destination_country_id = d.country_id AND a.is_active = TRUE
           WHERE d.is_whitelisted = TRUE
           GROUP BY d.country_id, d.iso_alpha_3_code, d.risk_category;`,
        );
        const overrides: Record<
          string,
          { riskLevel: RiskLevel; riskCategory: RiskCategory }
        > = {};
        for (const row of res.rows) {
          const slug = row.iso_alpha_3_code.trim().toLowerCase();
          const cat = (row.risk_category as RiskCategory) || RiskCategory.LOW;
          const level = (row.max_risk ??
            (cat === RiskCategory.CRITICAL
              ? 4
              : cat === RiskCategory.ELEVATED
                ? 2
                : 1)) as RiskLevel;
          overrides[slug] = { riskLevel: level, riskCategory: cat };
        }
        return { dataSource: "postgresql", overrides };
      } catch {
        // Fallback to empty overrides if DB is temporarily unreachable on initial list
      }
    }

    const overrides: Record<
      string,
      { riskLevel: RiskLevel; riskCategory: RiskCategory }
    > = {};
    for (const entry of DESTINATION_CATALOG) {
      const ov = getDemoStore().riskOverrides.get(entry.slug);
      if (ov) overrides[entry.slug] = ov;
    }
    return { dataSource: "demo-seed", overrides };
  }
}
