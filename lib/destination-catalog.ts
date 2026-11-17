/**
 * SENTINEL — 15-Country Curated Benchmark Catalog & WNI Entry Documents
 *
 * Country IDs (1..15) match `db/seed.sql` SERIAL order so PostgreSQL and
 * `demo-seed` fallback expose identical identifiers.
 */

import type {
  DestinationRow,
  EmergencyContactRow,
  RiskCategory,
  RiskLevel,
  SafetyAlertRow,
} from "./models";

export interface RequiredDocumentItem {
  id: string;
  label: string;
  category:
    | "Identity"
    | "Visa & Permit"
    | "Health & Insurance"
    | "Diplomatic & Travel";
  mandatory: boolean;
  note?: string;
}

export interface CatalogDestinationEntry {
  countryId: number;
  slug: string;
  iso2: string;
  iso3: string;
  countryName: string;
  nameId: string;
  aliases: string[];
  region: string;
  capital: string;
  riskLevel: RiskLevel;
  riskCategory: RiskCategory;
  lng: number;
  lat: number;
  imageUrl: string;
  lastUpdated: string;
  generalInfo: string;
  alert: {
    alertId: number;
    severity: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    date: string;
    detail: string;
  };
  embassy: {
    contactId: number;
    missionName: string;
    address: string;
    hotline: string;
    localEmergency: string;
    email: string;
  };
}

export const DESTINATION_CATALOG: CatalogDestinationEntry[] = [
  {
    countryId: 1,
    slug: "jpn",
    iso2: "JP",
    iso3: "JPN",
    countryName: "Japan",
    nameId: "Jepang",
    aliases: ["japan", "jepang", "nihon", "jpn", "jp"],
    region: "East Asia",
    capital: "Tokyo",
    riskLevel: 1,
    riskCategory: "LOW" as RiskCategory,
    lng: 139.6917,
    lat: 35.6895,
    imageUrl:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    generalInfo:
      "Exercise normal safety precautions. Japan maintains very low violent crime rates and high public transport reliability for WNI travelers.",
    alert: {
      alertId: 1,
      severity: "INFO",
      title: "Seismic & Tsunami Preparedness Protocol",
      date: "2026-10-15",
      detail:
        "Monitor Japan Meteorological Agency (JMA) advisories and local ward evacuation signs.",
    },
    embassy: {
      contactId: 1,
      missionName: "KBRI Tokyo (Embassy of Indonesia in Japan)",
      address: "5-2-9 Higashi-Gotanda, Shinagawa-ku, Tokyo 141-0022 [DEMO]",
      hotline: "+81-3-0000-0101 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 110 | Ambulance: 119 [DEMO]",
      email: "consular.tokyo@demo-sentinel.id",
    },
  },
  {
    countryId: 2,
    slug: "aus",
    iso2: "AU",
    iso3: "AUS",
    countryName: "Australia",
    nameId: "Australia",
    aliases: ["australia", "aus", "au"],
    region: "Oceania",
    capital: "Canberra",
    riskLevel: 1,
    riskCategory: "LOW" as RiskCategory,
    lng: 149.13,
    lat: -35.2809,
    imageUrl:
      "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    generalInfo:
      "Exercise normal precautions. Urban centers are safe; observe biosecurity rules and seasonal bushfire advisories.",
    alert: {
      alertId: 2,
      severity: "INFO",
      title: "Biosecurity & Coastal Rip Current Advisory",
      date: "2026-10-12",
      detail:
        "Declare all food/plant items at border control and swim only between patrolled beach flags.",
    },
    embassy: {
      contactId: 2,
      missionName: "KBRI Canberra (Embassy of Indonesia in Australia)",
      address: "8 Darwin Avenue, Yarralumla ACT 2600, Canberra [DEMO]",
      hotline: "+61-2-0000-0104 [DEMO - DO NOT DIAL]",
      localEmergency: "Triple Zero (000) [DEMO]",
      email: "consular.canberra@demo-sentinel.id",
    },
  },
  {
    countryId: 3,
    slug: "fra",
    iso2: "FR",
    iso3: "FRA",
    countryName: "France",
    nameId: "Prancis",
    aliases: ["france", "prancis", "fra", "fr"],
    region: "Western Europe",
    capital: "Paris",
    riskLevel: 2,
    riskCategory: "ELEVATED" as RiskCategory,
    lng: 2.3522,
    lat: 48.8566,
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-19",
    generalInfo:
      "Exercise increased caution in France due to elevated Vigipirate security posture, urban demonstrations, and transit pickpocketing.",
    alert: {
      alertId: 3,
      severity: "WARNING",
      title: "Vigipirate Heightened Security Posture",
      date: "2026-10-18",
      detail:
        "Expect armed patrols and bag checks at major transport terminals, museums, and public squares.",
    },
    embassy: {
      contactId: 3,
      missionName: "KBRI Paris (Embassy of Indonesia in France)",
      address: "47-49 Rue Cortambert, 75116 Paris [DEMO]",
      hotline: "+33-1-0000-0201 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 17 | EU Emergency: 112 [DEMO]",
      email: "consular.paris@demo-sentinel.id",
    },
  },
  {
    countryId: 4,
    slug: "syr",
    iso2: "SY",
    iso3: "SYR",
    countryName: "Syria",
    nameId: "Suriah",
    aliases: ["syria", "suriah", "syr", "sy"],
    region: "Middle East",
    capital: "Damascus",
    riskLevel: 4,
    riskCategory: "CRITICAL" as RiskCategory,
    lng: 36.2765,
    lat: 33.5138,
    imageUrl:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    generalInfo:
      "DO NOT TRAVEL. Ongoing armed hostilities, airstrikes, unexploded ordnance, and severe infrastructure damage.",
    alert: {
      alertId: 4,
      severity: "CRITICAL",
      title: "CRITICAL: Active Armed Conflict & Mandatory Registration",
      date: "2026-10-21",
      detail:
        "All WNI remaining in Syria must maintain daily contact with the KBRI Damascus Protection Task Force.",
    },
    embassy: {
      contactId: 4,
      missionName: "KBRI Damaskus (Embassy of Indonesia in Syria)",
      address: "Al-Mazzeh Eastern Villas, Damascus [DEMO]",
      hotline: "+963-11-000-0403 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Damascus Emergency: 112 / 110 [DEMO]",
      email: "sos.damascus@demo-sentinel.id",
    },
  },
  {
    countryId: 5,
    slug: "che",
    iso2: "CH",
    iso3: "CHE",
    countryName: "Switzerland",
    nameId: "Swiss",
    aliases: ["switzerland", "swiss", "che", "ch"],
    region: "Western Europe",
    capital: "Bern",
    riskLevel: 1,
    riskCategory: "LOW" as RiskCategory,
    lng: 7.4474,
    lat: 46.948,
    imageUrl:
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-19",
    generalInfo:
      "Exercise normal precautions. Public security and infrastructure across Swiss cantons remain highly stable.",
    alert: {
      alertId: 5,
      severity: "INFO",
      title: "Alpine Weather & Rail Transit Notice",
      date: "2026-10-14",
      detail:
        "Observe high-altitude trail warnings and keep valuables secure at Geneva and Zurich rail hubs.",
    },
    embassy: {
      contactId: 5,
      missionName: "KBRI Bern (Embassy of Indonesia in Switzerland)",
      address: "Elfenauweg 51, 3006 Bern [DEMO]",
      hotline: "+41-31-000-0102 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 117 | Medical: 144 [DEMO]",
      email: "consular.bern@demo-sentinel.id",
    },
  },
  {
    countryId: 6,
    slug: "sgp",
    iso2: "SG",
    iso3: "SGP",
    countryName: "Singapore",
    nameId: "Singapura",
    aliases: ["singapore", "singapura", "sgp", "sg"],
    region: "Southeast Asia",
    capital: "Singapore",
    riskLevel: 1,
    riskCategory: "LOW" as RiskCategory,
    lng: 103.8198,
    lat: 1.3521,
    imageUrl:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    generalInfo:
      "Exercise normal precautions. Singapore enforces strict public order regulations and maintains very low crime rates.",
    alert: {
      alertId: 6,
      severity: "INFO",
      title: "Strict Customs & E-Vaporizer Prohibition",
      date: "2026-10-10",
      detail:
        "Importing e-cigarettes/vapes or controlled medications without prior permit carries strict penalties.",
    },
    embassy: {
      contactId: 6,
      missionName: "KBRI Singapura (Embassy of Indonesia in Singapore)",
      address: "7 Chatsworth Road, Singapore 249761 [DEMO]",
      hotline: "+65-6737-0103 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 999 | Ambulance: 995 [DEMO]",
      email: "consular.singapore@demo-sentinel.id",
    },
  },
  {
    countryId: 7,
    slug: "nzl",
    iso2: "NZ",
    iso3: "NZL",
    countryName: "New Zealand",
    nameId: "Selandia Baru",
    aliases: ["new zealand", "selandia baru", "nzl", "nz"],
    region: "Oceania",
    capital: "Wellington",
    riskLevel: 1,
    riskCategory: "LOW" as RiskCategory,
    lng: 174.7762,
    lat: -41.2865,
    imageUrl:
      "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-18",
    generalInfo:
      "Exercise normal safety precautions. New Zealand has a stable security environment and strong emergency infrastructure.",
    alert: {
      alertId: 7,
      severity: "INFO",
      title: "Alpine Tramping & Geothermal Safety",
      date: "2026-10-11",
      detail:
        "Register backcountry routes with DOC and stay on marked boardwalks in geothermal zones.",
    },
    embassy: {
      contactId: 7,
      missionName: "KBRI Wellington (Embassy of Indonesia in New Zealand)",
      address: "70 Glen Road, Kelburn, Wellington 6012 [DEMO]",
      hotline: "+64-4-000-0105 [DEMO - DO NOT DIAL]",
      localEmergency: "Emergency: 111 [DEMO]",
      email: "consular.wellington@demo-sentinel.id",
    },
  },
  {
    countryId: 8,
    slug: "tha",
    iso2: "TH",
    iso3: "THA",
    countryName: "Thailand",
    nameId: "Thailand",
    aliases: ["thailand", "tha", "th", "muangthai"],
    region: "Southeast Asia",
    capital: "Bangkok",
    riskLevel: 2,
    riskCategory: "ELEVATED" as RiskCategory,
    lng: 100.5018,
    lat: 13.7563,
    imageUrl:
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-19",
    generalInfo:
      "Exercise increased caution due to periodic rallies in Bangkok and martial law restrictions in far southern border provinces.",
    alert: {
      alertId: 8,
      severity: "WARNING",
      title: "Southern Border Provinces Security Advisory",
      date: "2026-10-16",
      detail:
        "Avoid non-essential travel to Yala, Pattani, Narathiwat, and southern Songkhla provinces.",
    },
    embassy: {
      contactId: 8,
      missionName: "KBRI Bangkok (Embassy of Indonesia in Thailand)",
      address: "600-602 Phetchaburi Road, Ratchathewi, Bangkok [DEMO]",
      hotline: "+66-2-000-0202 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 191 | Tourist Police: 1155 [DEMO]",
      email: "consular.bangkok@demo-sentinel.id",
    },
  },
  {
    countryId: 9,
    slug: "tur",
    iso2: "TR",
    iso3: "TUR",
    countryName: "Turkey",
    nameId: "Turki",
    aliases: ["turkey", "turkiye", "turki", "tur", "tr"],
    region: "Eurasia",
    capital: "Ankara",
    riskLevel: 3,
    riskCategory: "ELEVATED" as RiskCategory,
    lng: 32.8597,
    lat: 39.9334,
    imageUrl:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    generalInfo:
      "Reconsider travel to southeastern border zones and exercise increased caution nationwide due to security operations.",
    alert: {
      alertId: 9,
      severity: "WARNING",
      title: "Restricted 10-km Syrian Border Zone",
      date: "2026-10-17",
      detail:
        "Avoid travel near Hatay, Kilis, Gaziantep, Sanliurfa, and Mardin border zones.",
    },
    embassy: {
      contactId: 9,
      missionName: "KBRI Ankara (Embassy of Indonesia in Turkey)",
      address: "Prof. Dr. Aziz Sancar Cd. No.10, Cankaya, Ankara [DEMO]",
      hotline: "+90-312-000-0301 [DEMO - DO NOT DIAL]",
      localEmergency: "Emergency: 112 [DEMO]",
      email: "consular.ankara@demo-sentinel.id",
    },
  },
  {
    countryId: 10,
    slug: "bra",
    iso2: "BR",
    iso3: "BRA",
    countryName: "Brazil",
    nameId: "Brasil",
    aliases: ["brazil", "brasil", "bra", "br"],
    region: "South America",
    capital: "Brasilia",
    riskLevel: 2,
    riskCategory: "ELEVATED" as RiskCategory,
    lng: -47.9292,
    lat: -15.7801,
    imageUrl:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-18",
    generalInfo:
      "Exercise increased caution in Brazil due to high rates of urban armed robbery and gang activity in informal settlements.",
    alert: {
      alertId: 10,
      severity: "WARNING",
      title: "Urban Armed Robbery & Favela Exclusion",
      date: "2026-10-14",
      detail:
        "Do not enter informal housing developments (favelas) and use only registered transit at night.",
    },
    embassy: {
      contactId: 10,
      missionName: "KBRI Brasilia (Embassy of Indonesia in Brazil)",
      address: "SES Av. das Nacoes Qd. 805 Lt. 20, Brasilia [DEMO]",
      hotline: "+55-61-0000-0203 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 190 | Medical: 192 [DEMO]",
      email: "consular.brasilia@demo-sentinel.id",
    },
  },
  {
    countryId: 11,
    slug: "egy",
    iso2: "EG",
    iso3: "EGY",
    countryName: "Egypt",
    nameId: "Mesir",
    aliases: ["egypt", "mesir", "egy", "eg"],
    region: "North Africa",
    capital: "Cairo",
    riskLevel: 3,
    riskCategory: "ELEVATED" as RiskCategory,
    lng: 31.2357,
    lat: 30.0444,
    imageUrl:
      "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    generalInfo:
      "Reconsider travel to North Sinai and Western Desert border corridors due to militant operations and military exclusion zones.",
    alert: {
      alertId: 11,
      severity: "WARNING",
      title: "North Sinai & Western Desert Exclusion Zones",
      date: "2026-10-19",
      detail:
        "Civilian travel to North Sinai and Libyan border corridors is strictly prohibited.",
    },
    embassy: {
      contactId: 11,
      missionName: "KBRI Kairo (Embassy of Indonesia in Egypt)",
      address: "13 Aisha El-Taimouria, Garden City, Cairo [DEMO]",
      hotline: "+20-2-0000-0302 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 122 | Tourist Police: 126 [DEMO]",
      email: "consular.cairo@demo-sentinel.id",
    },
  },
  {
    countryId: 12,
    slug: "mli",
    iso2: "ML",
    iso3: "MLI",
    countryName: "Mali",
    nameId: "Mali",
    aliases: ["mali", "mli", "ml"],
    region: "West Africa",
    capital: "Bamako",
    riskLevel: 4,
    riskCategory: "CRITICAL" as RiskCategory,
    lng: -8.0029,
    lat: 12.6392,
    imageUrl:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    generalInfo:
      "DO NOT TRAVEL. Critical threat of armed conflict, kidnapping, and IED attacks across Mali.",
    alert: {
      alertId: 12,
      severity: "CRITICAL",
      title: "CRITICAL: Armed Conflict & Kidnapping Threat",
      date: "2026-10-20",
      detail:
        "Armed groups actively target transport corridors and foreign nationals. Remote consular support via KBRI Dakar.",
    },
    embassy: {
      contactId: 12,
      missionName: "KBRI Dakar (Accredited to Mali)",
      address: "Rue de Diourbel, Point E, Dakar, Senegal [DEMO]",
      hotline: "+221-33-000-0401 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Bamako Emergency: 17 / 15 [DEMO]",
      email: "sos.dakar-mali@demo-sentinel.id",
    },
  },
  {
    countryId: 13,
    slug: "hti",
    iso2: "HT",
    iso3: "HTI",
    countryName: "Haiti",
    nameId: "Haiti",
    aliases: ["haiti", "hti", "ht"],
    region: "Caribbean",
    capital: "Port-au-Prince",
    riskLevel: 4,
    riskCategory: "CRITICAL" as RiskCategory,
    lng: -72.3074,
    lat: 18.5944,
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    generalInfo:
      "DO NOT TRAVEL. Widespread armed gang violence, kidnapping for ransom, and severe infrastructure disruption.",
    alert: {
      alertId: 13,
      severity: "CRITICAL",
      title: "CRITICAL: State of Emergency & Gang Blockades",
      date: "2026-10-21",
      detail:
        "WNI in Haiti should shelter in place and contact KBRI Havana immediately for evacuation coordination.",
    },
    embassy: {
      contactId: 13,
      missionName: "KBRI Havana (Accredited to Haiti)",
      address: "5ta Avenida No. 1607, Miramar, Havana, Cuba [DEMO]",
      hotline: "+53-7-000-0402 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Port-au-Prince Emergency: 114 [DEMO]",
      email: "sos.havana-haiti@demo-sentinel.id",
    },
  },
  {
    countryId: 14,
    slug: "yem",
    iso2: "YE",
    iso3: "YEM",
    countryName: "Yemen",
    nameId: "Yaman",
    aliases: ["yemen", "yaman", "yem", "ye"],
    region: "Middle East",
    capital: "Sanaa",
    riskLevel: 4,
    riskCategory: "CRITICAL" as RiskCategory,
    lng: 44.191,
    lat: 15.3694,
    imageUrl:
      "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    generalInfo:
      "DO NOT TRAVEL. Active military conflict, Red Sea maritime/aerial strikes, landmines, and acute humanitarian crisis.",
    alert: {
      alertId: 14,
      severity: "CRITICAL",
      title: "CRITICAL: Aerial Strike Hazard & Evacuation Corridor",
      date: "2026-10-21",
      detail:
        "Coordinate overland evacuation clearance via KBRI Muscat (Oman).",
    },
    embassy: {
      contactId: 14,
      missionName: "KBRI Muscat (Accredited to Yemen)",
      address: "Way 3017, Shatti Al Qurum, Muscat, Oman [DEMO]",
      hotline: "+968-24-000-0404 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Sanaa Emergency: 199 [DEMO]",
      email: "sos.muscat-yemen@demo-sentinel.id",
    },
  },
  {
    countryId: 15,
    slug: "som",
    iso2: "SO",
    iso3: "SOM",
    countryName: "Somalia",
    nameId: "Somalia",
    aliases: ["somalia", "som", "so"],
    region: "East Africa",
    capital: "Mogadishu",
    riskLevel: 4,
    riskCategory: "CRITICAL" as RiskCategory,
    lng: 45.3182,
    lat: 2.0469,
    imageUrl:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    generalInfo:
      "DO NOT TRAVEL. Extreme threat of terrorist bombings, kidnapping, and maritime piracy off the Horn of Africa.",
    alert: {
      alertId: 15,
      severity: "CRITICAL",
      title: "CRITICAL: Complex Terrorist Threat",
      date: "2026-10-21",
      detail:
        "Frequent mortar and VBIED attacks in Mogadishu. Remote protection coordinated via KBRI Nairobi.",
    },
    embassy: {
      contactId: 15,
      missionName: "KBRI Nairobi (Accredited to Somalia)",
      address: "Menengai Road, Upper Hill, Nairobi, Kenya [DEMO]",
      hotline: "+254-20-000-0405 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Mogadishu Emergency: 888 / 999 [DEMO]",
      email: "sos.nairobi-somalia@demo-sentinel.id",
    },
  },
];

export function findCatalogEntry(
  isoOrSlugOrName: string,
): CatalogDestinationEntry | undefined {
  const norm = isoOrSlugOrName.trim().toLowerCase();
  if (!norm) return undefined;
  return DESTINATION_CATALOG.find(
    (entry) =>
      entry.slug === norm ||
      entry.iso2.toLowerCase() === norm ||
      entry.iso3.toLowerCase() === norm ||
      entry.countryName.toLowerCase() === norm ||
      entry.nameId.toLowerCase() === norm ||
      entry.aliases.includes(norm),
  );
}

export function getCatalogDestinationRows(): DestinationRow[] {
  return DESTINATION_CATALOG.map((c) => ({
    country_id: c.countryId,
    country_name: c.countryName,
    iso_alpha_3_code: c.iso3,
    is_whitelisted: true,
    risk_category: c.riskCategory,
    general_info: c.generalInfo,
  }));
}

export function getCatalogAlertRows(): SafetyAlertRow[] {
  return DESTINATION_CATALOG.map((c) => ({
    alert_id: c.alert.alertId,
    destination_country_id: c.countryId,
    risk_level: c.riskLevel,
    title: c.alert.title,
    detail: c.alert.detail,
    is_active: true,
    date: c.alert.date,
  }));
}

export function getCatalogContactRows(): EmergencyContactRow[] {
  return DESTINATION_CATALOG.map((c) => ({
    contact_id: c.embassy.contactId,
    destination_country_id: c.countryId,
    mission_name: c.embassy.missionName,
    hotline: c.embassy.hotline,
    email: c.embassy.email,
  }));
}

/**
 * Returns pre-departure WNI entry document checklist items tailored by
 * destination risk band and country-specific entry rules.
 */
export function getRequiredDocumentsForCountry(
  countryIsoOrId: string,
): RequiredDocumentItem[] {
  const entry = findCatalogEntry(countryIsoOrId);
  const riskLevel = entry?.riskLevel ?? 1;
  const slug = entry?.slug ?? countryIsoOrId.toLowerCase();

  const baseDocs: RequiredDocumentItem[] = [
    {
      id: "passport-6m",
      label: "Indonesian Passport (Min. 6 Months Validity)",
      category: "Identity",
      mandatory: true,
      note: "Ensure at least 2 blank pages remain for entry/exit stamps.",
    },
    {
      id: "return-ticket",
      label: "Confirmed Return / Onward Flight Itinerary",
      category: "Diplomatic & Travel",
      mandatory: true,
      note: "Required by immigration officers on arrival.",
    },
    {
      id: "travel-insurance",
      label: "International Travel & Medical Insurance",
      category: "Health & Insurance",
      mandatory: riskLevel >= 2,
      note:
        riskLevel >= 2
          ? "Recommended minimum USD 50,000 emergency evacuation & medical coverage."
          : "Covers unexpected hospitalization or flight disruption.",
    },
  ];

  const visaDocByCountry: Record<string, RequiredDocumentItem> = {
    jpn: {
      id: "jpn-visa-waiver",
      label: "Japan e-Passport Visa Waiver / Visit Japan Web QR",
      category: "Visa & Permit",
      mandatory: true,
      note: "Register WNI IC-passport waiver prior to departure or obtain a short-term visa.",
    },
    sgp: {
      id: "sgp-sgac",
      label: "SG Arrival Card (SGAC) Electronic Declaration",
      category: "Visa & Permit",
      mandatory: true,
      note: "Submit online within 3 days prior to arrival; visa-free for WNI up to 30 days.",
    },
    tha: {
      id: "tha-tdac",
      label: "Thailand Digital Arrival Card / Proof of Funds",
      category: "Visa & Permit",
      mandatory: true,
      note: "Visa-exempt for WNI tourism; carry THB 10,000–20,000 equivalent.",
    },
    aus: {
      id: "aus-visitor-visa",
      label: "Australian Visitor Visa (Subclass 600)",
      category: "Visa & Permit",
      mandatory: true,
      note: "Apply via ImmiAccount with biometric & financial evidence.",
    },
    fra: {
      id: "fra-schengen",
      label: "Schengen Short-Stay Visa (Type C)",
      category: "Visa & Permit",
      mandatory: true,
      note: "Requires Schengen-compliant EUR 30,000 medical insurance.",
    },
    che: {
      id: "che-schengen",
      label: "Schengen Short-Stay Visa (Type C)",
      category: "Visa & Permit",
      mandatory: true,
      note: "Valid across Switzerland and Schengen Area.",
    },
    nzl: {
      id: "nzl-visitor-visa",
      label: "New Zealand Visitor Visa",
      category: "Visa & Permit",
      mandatory: true,
      note: "Submit online via Immigration New Zealand before travel.",
    },
    tur: {
      id: "tur-evisa",
      label: "Republic of Turkey Visa / e-Visa",
      category: "Visa & Permit",
      mandatory: true,
      note: "Verify current WNI e-Visa eligibility and passport validity.",
    },
    bra: {
      id: "bra-visa-exempt",
      label: "Brazil Visa-Free Tourism Entry (Max 30 Days)",
      category: "Visa & Permit",
      mandatory: true,
      note: "Carry hotel confirmation and proof of financial means.",
    },
    egy: {
      id: "egy-visa",
      label: "Egypt Tourist Visa (Embassy / e-Visa)",
      category: "Visa & Permit",
      mandatory: true,
      note: "Obtain prior approval from the Egyptian Embassy in Jakarta if required.",
    },
  };

  if (visaDocByCountry[slug]) {
    baseDocs.push(visaDocByCountry[slug]);
  } else {
    baseDocs.push({
      id: `${slug}-consular-clearance`,
      label: "Official Diplomatic / Entry Clearance",
      category: "Visa & Permit",
      mandatory: true,
      note: "Non-essential WNI travel is strongly advised against for L4 destinations.",
    });
  }

  if (riskLevel >= 3) {
    baseDocs.push({
      id: `${slug}-lapor-diri`,
      label: "Mandatory Peduli WNI / KBRI Lapor Diri Registration",
      category: "Diplomatic & Travel",
      mandatory: true,
      note:
        riskLevel === 4
          ? "CRITICAL PROTOCOL: Register immediately with the accredited KBRI for emergency evacuation tracking."
          : "Register arrival and local address via peduliwni.kemlu.go.id.",
    });
  }

  return baseDocs;
}
