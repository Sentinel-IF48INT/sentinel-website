// app/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerLabel,
} from "@/components/ui/mapcn-marker-content";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Search,
  RotateCcw,
  Bookmark,
  PhoneCall,
  Building2,
  UserCheck,
  RefreshCw,
  Globe,
  Compass,
  LogIn,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import LoginModal, { type SessionUser } from "@/components/auth/login-modal";
import DocumentChecklist from "@/components/destination/document-checklist";
import { getRequiredDocumentsForCountry } from "@/lib/destination-catalog";
import type { DestinationProfileDTO } from "@/lib/destination-service";

type RiskCategory = "LOW" | "ELEVATED" | "CRITICAL";

interface SafetyAlert {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  date: string;
  detail: string;
}

interface Destination {
  id: string;
  iso: string;
  nameEn: string;
  nameId: string;
  aliases: string[];
  region: string;
  capital: string;
  riskLevel: 1 | 2 | 3 | 4;
  riskCategory: RiskCategory;
  lng: number;
  lat: number;
  imageUrl: string;
  lastUpdated: string;
  summary: string;
  alerts: SafetyAlert[];
  embassy: {
    missionName: string;
    address: string;
    hotline: string;
    localEmergency: string;
    email: string;
  };
}

const INITIAL_WHITELIST_DB: Destination[] = [
  // ================= LOW RISK (L1) =================
  {
    id: "jpn",
    iso: "JP",
    nameEn: "Japan",
    nameId: "Jepang",
    aliases: ["japan", "jepang", "nihon"],
    region: "East Asia",
    capital: "Tokyo",
    riskLevel: 1,
    riskCategory: "LOW",
    lng: 139.6917,
    lat: 35.6895,
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    summary: "Exercise normal safety precautions. Japan maintains very low violent crime rates and high public transport reliability for WNI travelers.",
    alerts: [
      {
        id: "jpn-1",
        severity: "INFO",
        title: "Seismic & Tsunami Preparedness Protocol",
        date: "2026-10-15",
        detail: "Monitor Japan Meteorological Agency (JMA) advisories and local ward evacuation signs.",
      },
    ],
    embassy: {
      missionName: "KBRI Tokyo (Embassy of Indonesia in Japan)",
      address: "5-2-9 Higashi-Gotanda, Shinagawa-ku, Tokyo 141-0022 [DEMO]",
      hotline: "+81-3-0000-0101 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 110 | Ambulance: 119 [DEMO]",
      email: "consular.tokyo@demo-sentinel.id",
    },
  },
  {
    id: "che",
    iso: "CH",
    nameEn: "Switzerland",
    nameId: "Swiss",
    aliases: ["switzerland", "swiss"],
    region: "Western Europe",
    capital: "Bern",
    riskLevel: 1,
    riskCategory: "LOW",
    lng: 7.4474,
    lat: 46.948,
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-19",
    summary: "Exercise normal precautions. Public security and infrastructure across Swiss cantons remain highly stable.",
    alerts: [
      {
        id: "che-1",
        severity: "INFO",
        title: "Alpine Weather & Rail Transit Notice",
        date: "2026-10-14",
        detail: "Observe high-altitude trail warnings and keep valuables secure at Geneva and Zurich rail hubs.",
      },
    ],
    embassy: {
      missionName: "KBRI Bern (Embassy of Indonesia in Switzerland)",
      address: "Elfenauweg 51, 3006 Bern, Switzerland [DEMO]",
      hotline: "+41-31-000-0102 [DEMO - DO NOT DIAL]",
      localEmergency: "Emergency: 112 | Police: 117 [DEMO]",
      email: "consular.bern@demo-sentinel.id",
    },
  },
  {
    id: "sgp",
    iso: "SG",
    nameEn: "Singapore",
    nameId: "Singapura",
    aliases: ["singapore", "singapura"],
    region: "Southeast Asia",
    capital: "Singapore",
    riskLevel: 1,
    riskCategory: "LOW",
    lng: 103.8198,
    lat: 1.3521,
    imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "Exercise normal precautions. Singapore enforces strict public order regulations and maintains very low crime rates.",
    alerts: [
      {
        id: "sgp-1",
        severity: "INFO",
        title: "Strict Customs & E-Vaporizer Prohibition",
        date: "2026-10-18",
        detail: "Importing e-cigarettes/vapes or controlled medications without prior permit carries strict penalties.",
      },
    ],
    embassy: {
      missionName: "KBRI Singapura (Embassy of Indonesia in Singapore)",
      address: "7 Chatsworth Road, Singapore 249761 [DEMO]",
      hotline: "+65-6000-0103 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 999 | Ambulance: 995 [DEMO]",
      email: "consular.singapore@demo-sentinel.id",
    },
  },
  {
    id: "aus",
    iso: "AU",
    nameEn: "Australia",
    nameId: "Australia",
    aliases: ["australia", "aus"],
    region: "Oceania",
    capital: "Canberra",
    riskLevel: 1,
    riskCategory: "LOW",
    lng: 149.13,
    lat: -35.2809,
    imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-18",
    summary: "Exercise normal precautions. Urban centers are safe; observe biosecurity rules and seasonal bushfire advisories.",
    alerts: [
      {
        id: "aus-1",
        severity: "INFO",
        title: "Biosecurity & Coastal Rip Current Advisory",
        date: "2026-10-11",
        detail: "Declare all food/plant items at border control and swim only between patrolled beach flags.",
      },
    ],
    embassy: {
      missionName: "KBRI Canberra (Embassy of Indonesia in Australia)",
      address: "8 Darwin Avenue, Yarralumla ACT 2600, Canberra [DEMO]",
      hotline: "+61-2-0000-0104 [DEMO - DO NOT DIAL]",
      localEmergency: "National Emergency: 000 [DEMO]",
      email: "consular.canberra@demo-sentinel.id",
    },
  },
  {
    id: "nzl",
    iso: "NZ",
    nameEn: "New Zealand",
    nameId: "Selandia Baru",
    aliases: ["new zealand", "selandia baru", "nz"],
    region: "Oceania",
    capital: "Wellington",
    riskLevel: 1,
    riskCategory: "LOW",
    lng: 174.7762,
    lat: -41.2865,
    imageUrl: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-17",
    summary: "Exercise normal safety precautions. New Zealand has a stable security environment and strong emergency infrastructure.",
    alerts: [
      {
        id: "nzl-1",
        severity: "INFO",
        title: "Alpine Tramping & Geothermal Safety",
        date: "2026-10-09",
        detail: "Register backcountry routes with DOC and stay on marked boardwalks in geothermal zones.",
      },
    ],
    embassy: {
      missionName: "KBRI Wellington (Embassy of Indonesia in New Zealand)",
      address: "70 Glen Road, Kelburn, Wellington 6012 [DEMO]",
      hotline: "+64-4-000-0105 [DEMO - DO NOT DIAL]",
      localEmergency: "Police / Fire / Ambulance: 111 [DEMO]",
      email: "consular.wellington@demo-sentinel.id",
    },
  },

  // ================= ELEVATED RISK (L2-L3) =================
  {
    id: "fra",
    iso: "FR",
    nameEn: "France",
    nameId: "Prancis",
    aliases: ["france", "prancis", "perancis"],
    region: "Western Europe",
    capital: "Paris",
    riskLevel: 2,
    riskCategory: "ELEVATED",
    lng: 2.3522,
    lat: 48.8566,
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    summary: "Exercise increased caution in France due to elevated Vigipirate security posture, urban demonstrations, and transit pickpocketing.",
    alerts: [
      {
        id: "fra-1",
        severity: "WARNING",
        title: "Vigipirate Heightened Security Posture",
        date: "2026-10-18",
        detail: "Expect armed patrols and bag checks at major transport terminals, museums, and public squares.",
      },
    ],
    embassy: {
      missionName: "KBRI Paris (Embassy of Indonesia in France)",
      address: "47-49 Rue Cortambert, 75116 Paris, France [DEMO]",
      hotline: "+33-1-0000-0201 [DEMO - DO NOT DIAL]",
      localEmergency: "Emergency: 112 | Police: 17 [DEMO]",
      email: "consular.paris@demo-sentinel.id",
    },
  },
  {
    id: "tha",
    iso: "TH",
    nameEn: "Thailand",
    nameId: "Thailand",
    aliases: ["thailand", "siam"],
    region: "Southeast Asia",
    capital: "Bangkok",
    riskLevel: 2,
    riskCategory: "ELEVATED",
    lng: 100.5018,
    lat: 13.7563,
    imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-19",
    summary: "Exercise increased caution due to periodic rallies in Bangkok and martial law restrictions in far southern border provinces.",
    alerts: [
      {
        id: "tha-1",
        severity: "WARNING",
        title: "Southern Border Provinces Security Advisory",
        date: "2026-10-16",
        detail: "Avoid non-essential travel to Yala, Pattani, Narathiwat, and southern Songkhla provinces.",
      },
    ],
    embassy: {
      missionName: "KBRI Bangkok (Embassy of Indonesia in Thailand)",
      address: "600-602 Petchburi Road, Ratchathewi, Bangkok 10400 [DEMO]",
      hotline: "+66-2-000-0202 [DEMO - DO NOT DIAL]",
      localEmergency: "Tourist Police: 1155 | Police: 191 [DEMO]",
      email: "consular.bangkok@demo-sentinel.id",
    },
  },
  {
    id: "tur",
    iso: "TR",
    nameEn: "Turkey",
    nameId: "Turki",
    aliases: ["turkey", "turki", "turkiye"],
    region: "Eurasia / Middle East",
    capital: "Ankara",
    riskLevel: 3,
    riskCategory: "ELEVATED",
    lng: 32.8597,
    lat: 39.9334,
    imageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-20",
    summary: "Reconsider travel to southeastern border zones and exercise increased caution nationwide due to security operations.",
    alerts: [
      {
        id: "tur-1",
        severity: "WARNING",
        title: "Restricted 10-km Syrian Border Zone",
        date: "2026-10-17",
        detail: "Avoid travel near Hatay, Kilis, Gaziantep, Sanliurfa, and Mardin border zones.",
      },
    ],
    embassy: {
      missionName: "KBRI Ankara (Embassy of Indonesia in Türkiye)",
      address: "Prof. Dr. Aziz Sancar Sokak No. 10, Çankaya, Ankara [DEMO]",
      hotline: "+90-312-000-0301 [DEMO - DO NOT DIAL]",
      localEmergency: "National Emergency: 112 [DEMO]",
      email: "consular.ankara@demo-sentinel.id",
    },
  },
  {
    id: "bra",
    iso: "BR",
    nameEn: "Brazil",
    nameId: "Brasil",
    aliases: ["brazil", "brasil"],
    region: "South America",
    capital: "Brasília",
    riskLevel: 2,
    riskCategory: "ELEVATED",
    lng: -47.9292,
    lat: -15.7801,
    imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-18",
    summary: "Exercise increased caution in Brazil due to high rates of urban armed robbery and gang activity in informal settlements.",
    alerts: [
      {
        id: "bra-1",
        severity: "WARNING",
        title: "Urban Armed Robbery & Favela Exclusion",
        date: "2026-10-15",
        detail: "Do not enter informal housing developments (favelas) and use only registered transit at night.",
      },
    ],
    embassy: {
      missionName: "KBRI Brasília (Embassy of Indonesia in Brazil)",
      address: "SES Avenida das Nações Quadra 805 Lote 20, Brasília-DF [DEMO]",
      hotline: "+55-61-0000-0204 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 190 | SAMU: 192 [DEMO]",
      email: "consular.brasilia@demo-sentinel.id",
    },
  },
  {
    id: "egy",
    iso: "EG",
    nameEn: "Egypt",
    nameId: "Mesir",
    aliases: ["egypt", "mesir"],
    region: "North Africa / Middle East",
    capital: "Cairo",
    riskLevel: 3,
    riskCategory: "ELEVATED",
    lng: 31.2357,
    lat: 30.0444,
    imageUrl: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "Reconsider travel to North Sinai and Western Desert border corridors due to militant operations and military exclusion zones.",
    alerts: [
      {
        id: "egy-1",
        severity: "WARNING",
        title: "North Sinai & Western Desert Exclusion Zones",
        date: "2026-10-19",
        detail: "Civilian travel to North Sinai and Libyan border corridors is strictly prohibited.",
      },
    ],
    embassy: {
      missionName: "KBRI Kairo (Embassy of Indonesia in Egypt)",
      address: "13 Aisha El-Taimouria St., Garden City, Cairo [DEMO]",
      hotline: "+20-2-0000-0302 [DEMO - DO NOT DIAL]",
      localEmergency: "Police: 122 | Ambulance: 123 [DEMO]",
      email: "consular.cairo@demo-sentinel.id",
    },
  },

  // ================= CRITICAL RISK (L4) =================
  {
    id: "mli",
    iso: "ML",
    nameEn: "Mali",
    nameId: "Mali",
    aliases: ["mali"],
    region: "West Africa (Sahel)",
    capital: "Bamako",
    riskLevel: 4,
    riskCategory: "CRITICAL",
    lng: -8.0029,
    lat: 12.6392,
    imageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "DO NOT TRAVEL. Critical threat of armed conflict, kidnapping, and IED attacks across Mali.",
    alerts: [
      {
        id: "mli-1",
        severity: "CRITICAL",
        title: "CRITICAL: Armed Conflict & Kidnapping Threat",
        date: "2026-10-20",
        detail: "Armed groups actively target transport corridors and foreign nationals. Remote consular support via KBRI Dakar.",
      },
    ],
    embassy: {
      missionName: "KBRI Dakar (Accredited to Republic of Mali)",
      address: "Avenue Cheikh Anta Diop, Dakar, Senegal [DEMO]",
      hotline: "+221-33-000-0401 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Mali Police: 17 | Ambulance: 15 [DEMO]",
      email: "sos.dakar-mali@demo-sentinel.id",
    },
  },
  {
    id: "hti",
    iso: "HT",
    nameEn: "Haiti",
    nameId: "Haiti",
    aliases: ["haiti"],
    region: "Caribbean",
    capital: "Port-au-Prince",
    riskLevel: 4,
    riskCategory: "CRITICAL",
    lng: -72.3074,
    lat: 18.5944,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "DO NOT TRAVEL. Widespread armed gang violence, kidnapping for ransom, and severe infrastructure disruption.",
    alerts: [
      {
        id: "hti-1",
        severity: "CRITICAL",
        title: "CRITICAL: State of Emergency & Gang Blockades",
        date: "2026-10-20",
        detail: "WNI in Haiti should shelter in place and contact KBRI Havana immediately for evacuation coordination.",
      },
    ],
    embassy: {
      missionName: "KBRI Havana (Accredited to Republic of Haiti)",
      address: "5ta Avenida No. 1607, Miramar, Havana, Cuba [DEMO]",
      hotline: "+53-7-000-0402 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Haiti Police: 114 [DEMO]",
      email: "sos.havana-haiti@demo-sentinel.id",
    },
  },
  {
    id: "syr",
    iso: "SY",
    nameEn: "Syria",
    nameId: "Suriah",
    aliases: ["syria", "suriah"],
    region: "Middle East / Levant",
    capital: "Damascus",
    riskLevel: 4,
    riskCategory: "CRITICAL",
    lng: 36.2765,
    lat: 33.5138,
    imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "DO NOT TRAVEL. Ongoing armed hostilities, airstrikes, unexploded ordnance, and severe infrastructure damage.",
    alerts: [
      {
        id: "syr-1",
        severity: "CRITICAL",
        title: "CRITICAL: Active Armed Conflict & Mandatory Registration",
        date: "2026-10-21",
        detail: "All WNI remaining in Syria must maintain daily contact with the KBRI Damascus Protection Task Force.",
      },
    ],
    embassy: {
      missionName: "KBRI Damaskus (Embassy of Indonesia in Syria)",
      address: "Mezzeh Eastern Villas, Damascus [DEMO]",
      hotline: "+963-11-000-0403 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Ambulance: 110 | Police: 112 [DEMO]",
      email: "sos.damascus@demo-sentinel.id",
    },
  },
  {
    id: "yem",
    iso: "YE",
    nameEn: "Yemen",
    nameId: "Yaman",
    aliases: ["yemen", "yaman"],
    region: "Middle East / Arabian Peninsula",
    capital: "Sanaa",
    riskLevel: 4,
    riskCategory: "CRITICAL",
    lng: 44.2075,
    lat: 15.3694,
    imageUrl: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "DO NOT TRAVEL. Active military conflict, Red Sea maritime/aerial strikes, landmines, and acute humanitarian crisis.",
    alerts: [
      {
        id: "yem-1",
        severity: "CRITICAL",
        title: "CRITICAL: Aerial Strike Hazard & Evacuation Corridor",
        date: "2026-10-20",
        detail: "Coordinate overland evacuation clearance via KBRI Muscat (Oman).",
      },
    ],
    embassy: {
      missionName: "KBRI Muscat (Accredited Evacuation Mission for Yemen)",
      address: "Way 3022, Building 1845, Shatti Al-Qurum, Muscat, Oman [DEMO]",
      hotline: "+968-24-000-0404 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Local Emergency: 199 [DEMO]",
      email: "sos.muscat-yemen@demo-sentinel.id",
    },
  },
  {
    id: "som",
    iso: "SO",
    nameEn: "Somalia",
    nameId: "Somalia",
    aliases: ["somalia"],
    region: "East Africa (Horn of Africa)",
    capital: "Mogadishu",
    riskLevel: 4,
    riskCategory: "CRITICAL",
    lng: 45.3182,
    lat: 2.0469,
    imageUrl: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=400&q=80",
    lastUpdated: "2026-10-21",
    summary: "DO NOT TRAVEL. Extreme threat of terrorist bombings, kidnapping, and maritime piracy off the Horn of Africa.",
    alerts: [
      {
        id: "som-1",
        severity: "CRITICAL",
        title: "CRITICAL: Complex Terrorist Threat",
        date: "2026-10-21",
        detail: "Frequent mortar and VBIED attacks in Mogadishu. Remote protection coordinated via KBRI Nairobi.",
      },
    ],
    embassy: {
      missionName: "KBRI Nairobi (Accredited to Somalia)",
      address: "Menengai Road, Upper Hill, Nairobi, Kenya [DEMO]",
      hotline: "+254-20-000-0405 [DEMO SOS - DO NOT DIAL]",
      localEmergency: "Mogadishu Emergency: 888 / 999 [DEMO]",
      email: "sos.nairobi-somalia@demo-sentinel.id",
    },
  },
];

export default function SentinelMapPage() {
  const [countries, setCountries] = useState<Destination[]>(INITIAL_WHITELIST_DB);
  const [selectedId, setSelectedId] = useState<string>("aus");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [invalidQuery, setInvalidQuery] = useState<string | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const searchRequestId = useRef<number>(0);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(["jpn", "aus", "syr"]);
  const [watchlistNotes, setWatchlistNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | RiskCategory>("ALL");
  const role: "traveler" | "admin" = sessionUser?.role === "ADMINISTRATOR" ? "admin" : "traveler";
  const canUseWatchlist = sessionUser?.role === "TRAVELER";
  const [viewport, setViewport] = useState<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  }>({
    center: [149.13, -35.2809], // Default centered on Australia (matches your screenshot)
    zoom: 2.2,
    bearing: 0,
    pitch: 0,
  });

  const activeCountry = countries.find((c) => c.id === selectedId) ?? countries[0];

  // Restore HttpOnly session and any persisted admin risk overrides on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [meRes, overridesRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/destinations"),
        ]);
        if (!active) return;
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setSessionUser(meData.user as SessionUser);
          }
        }
        if (overridesRes.ok) {
          const ovData = await overridesRes.json();
          const overrides = ovData.overrides as Record<
            string,
            { riskLevel: 1 | 2 | 3 | 4; riskCategory: RiskCategory }
          >;
          if (overrides && Object.keys(overrides).length > 0) {
            setCountries((prev) =>
              prev.map((c) =>
                overrides[c.id]
                  ? {
                      ...c,
                      riskLevel: overrides[c.id].riskLevel,
                      riskCategory: overrides[c.id].riskCategory,
                    }
                  : c,
              ),
            );
          }
        }
      } catch {
        // Ignore network errors on initial hydration
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Sync Traveler watchlist from backend when signed in
  useEffect(() => {
    if (sessionUser?.role !== "TRAVELER") return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setWatchlist(
            data.items.map((item: { slug: string }) => item.slug),
          );
          const notesMap: Record<string, string> = {};
          for (const item of data.items as Array<{
            slug: string;
            reminderNote?: string | null;
          }>) {
            if (item.reminderNote) notesMap[item.slug] = item.reminderNote;
          }
          setWatchlistNotes(notesMap);
        }
      } catch {
        // Keep local state if offline
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionUser]);

  const handleSelectCountry = (country: Destination) => {
    setInvalidQuery(null);
    setSelectedId(country.id);
    setViewport((prev) => ({
      ...prev,
      center: [country.lng, country.lat],
      zoom: 4,
    }));
  };

  /** UC-01 / UC-10: <<boundary>> → GET /api/destinations?q=… (<<controller>>). */
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchQuery.trim();

    // 1. Validate input length locally (Alternative Flow 3a)
    if (!raw || raw.length > 80) {
      setSearchSource(null);
      setInvalidQuery(searchQuery || "[EMPTY INPUT]");
      return;
    }

    // 2. Set searching state
    const requestId = ++searchRequestId.current;
    setSearching(true);

    try {
      // 3. Fetch from Controller API route
      const res = await fetch(`/api/destinations?q=${encodeURIComponent(raw)}`);

      // 4. If !res.ok (404 / 400), trigger the Alternative Flow UI
      if (!res.ok) {
        if (requestId === searchRequestId.current) {
          setSearchSource(null);
          setInvalidQuery(searchQuery);
        }
        return;
      }

      const data = await res.json();
      if (requestId !== searchRequestId.current) return;

      const profile = data.profile as DestinationProfileDTO | null;
      if (!profile) {
        setSearchSource(null);
        setInvalidQuery(searchQuery);
        return;
      }

      // 5. If 200 OK, merge profile and update selected country via handleSelectCountry(matched)
      const slug =
        profile.slug ?? profile.destination.isoAlpha3Code.toLowerCase();
      const baseCountry =
        countries.find(
          (c) =>
            c.id === slug ||
            c.nameEn.toLowerCase() === profile.countryName.toLowerCase() ||
            c.iso.toLowerCase() === profile.iso2.toLowerCase()
        ) ?? countries[0];

      const matched: Destination = {
        ...baseCountry,
        id: slug,
        iso: profile.iso2 ?? baseCountry.iso,
        nameEn: profile.countryName ?? baseCountry.nameEn,
        nameId: profile.nameId ?? baseCountry.nameId,
        region: profile.region ?? baseCountry.region,
        capital: profile.capital ?? baseCountry.capital,
        riskLevel: profile.riskLevel,
        riskCategory: profile.riskCategory,
        lng: profile.lng ?? baseCountry.lng,
        lat: profile.lat ?? baseCountry.lat,
        imageUrl: profile.imageUrl ?? baseCountry.imageUrl,
        lastUpdated: profile.lastUpdated ?? baseCountry.lastUpdated,
        summary: profile.summary ?? profile.generalInfo ?? baseCountry.summary,
        alerts: profile.activeAlerts.map((a) => ({
          id: a.id ?? `${slug}-${a.alertId}`,
          severity: a.severity,
          title: a.title,
          date: a.date,
          detail: a.detail,
        })),
        embassy: profile.embassy ?? baseCountry.embassy,
      };

      setCountries((prev) =>
        prev.map((c) => (c.id === matched.id ? matched : c))
      );
      setSearchSource((data.dataSource as string) ?? "demo-seed");
      handleSelectCountry(matched);
    } catch {
      if (requestId !== searchRequestId.current) return;
      // 6. Graceful local fallback when API is offline
      const norm = raw.replace(/\s+/g, " ").toLowerCase();
      const matched = countries.find(
        (c) =>
          c.nameEn.toLowerCase() === norm ||
          c.nameId.toLowerCase() === norm ||
          c.iso.toLowerCase() === norm ||
          c.aliases.includes(norm)
      );
      if (matched) {
        setSearchSource("local-fallback");
        handleSelectCountry(matched);
      } else {
        setSearchSource(null);
        setInvalidQuery(searchQuery);
      }
    } finally {
      if (requestId === searchRequestId.current) {
        setSearching(false);
      }
    }
  };

  const handleLoginSuccess = (user: SessionUser, dataSource: string) => {
    setSessionUser(user);
    setLoginOpen(false);
    setLoginNotice(
      `Signed in as ${user.fullName} (${user.role}) — verified via ${
        dataSource === "postgresql" ? "PostgreSQL Users table" : "demo seed (no DATABASE_URL)"
      }.`
    );
    window.setTimeout(() => setLoginNotice(null), 5000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    setSessionUser(null);
    setLoginNotice(null);
  };

  const toggleWatchlist = async (id: string) => {
    if (!sessionUser) {
      setLoginOpen(true);
      return;
    }
    if (!canUseWatchlist) return;
    const isSaved = watchlist.includes(id);
    setWatchlist((prev) =>
      isSaved ? prev.filter((item) => item !== id) : [id, ...prev]
    );
    try {
      if (isSaved) {
        await fetch(`/api/watchlist?slug=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countrySlug: id }),
        });
      }
    } catch {
      // Keep optimistic state if offline
    }
  };

  const saveWatchlistNote = async (slug: string) => {
    const trimmed = noteDraft.trim().slice(0, 255);
    setWatchlistNotes((prev) => {
      const next = { ...prev };
      if (trimmed) next[slug] = trimmed;
      else delete next[slug];
      return next;
    });
    setEditingNoteId(null);
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countrySlug: slug, reminderNote: trimmed }),
      });
    } catch {
      // Keep optimistic note if offline
    }
  };

  const resetWorldView = () => {
    setViewport({
      center: [60, 15],
      zoom: 1.4,
      bearing: 0,
      pitch: 0,
    });
  };

  const getRiskStyle = (level: 1 | 2 | 3 | 4) => {
    if (level === 1) {
      return {
        glyph: "●",
        badge: "LEVEL 1 • LOW RISK",
        code: "L1",
        sub: "EXERCISE NORMAL PRECAUTIONS",
        bannerBg:
          "bg-gradient-to-br from-emerald-50/60 via-white/45 to-teal-50/50 backdrop-blur-2xl ring-1 ring-emerald-500/25 border border-white/75 border-l-4 border-l-emerald-600 shadow-[0_14px_38px_-10px_rgba(0,150,138,0.16)] text-slate-900",
        iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/25",
        badgeBg:
          "bg-emerald-100/90 text-emerald-900 ring-1 ring-emerald-600/20",
        subText: "text-emerald-800",
        pinBg: "bg-emerald-500 border-white",
        chipIdle:
          "bg-white/50 backdrop-blur-md text-slate-800 ring-1 ring-white/75 hover:bg-emerald-50/75 hover:text-emerald-950 hover:ring-emerald-300",
        chipActive:
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-600/30 shadow-sm",
        chipCode: "text-emerald-700",
        Icon: ShieldCheck,
      };
    }
    if (level === 2 || level === 3) {
      return {
        glyph: "▲",
        badge: `LEVEL ${level} • ELEVATED RISK`,
        code: `L${level}`,
        sub: level === 2 ? "EXERCISE INCREASED CAUTION" : "RECONSIDER TRAVEL",
        bannerBg:
          "bg-gradient-to-br from-amber-50/60 via-white/45 to-orange-50/45 backdrop-blur-2xl ring-1 ring-amber-500/30 border border-white/75 border-l-4 border-l-amber-500 shadow-[0_14px_38px_-10px_rgba(245,158,11,0.18)] text-slate-900",
        iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25",
        badgeBg: "bg-amber-100/90 text-amber-900 ring-1 ring-amber-600/25",
        subText: "text-amber-800",
        pinBg: "bg-amber-500 border-white",
        chipIdle:
          "bg-white/50 backdrop-blur-md text-slate-800 ring-1 ring-white/75 hover:bg-amber-50/80 hover:text-amber-950 hover:ring-amber-300",
        chipActive:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-500/30 shadow-sm",
        chipCode: "text-amber-700",
        Icon: AlertTriangle,
      };
    }
    return {
      glyph: "◆",
      badge: "LEVEL 4 • CRITICAL RISK",
      code: "L4",
      sub: "DO NOT TRAVEL — HIGH RISK",
      bannerBg:
        "bg-gradient-to-br from-rose-50/60 via-white/45 to-red-50/45 backdrop-blur-2xl ring-1 ring-rose-500/30 border border-white/75 border-l-4 border-l-rose-600 shadow-[0_14px_38px_-10px_rgba(225,29,72,0.18)] text-slate-900",
      iconWrap: "bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-sm shadow-rose-600/25",
      badgeBg: "bg-rose-100/90 text-rose-900 ring-1 ring-rose-600/25",
      subText: "text-rose-800",
      pinBg: "bg-rose-600 border-white",
      chipIdle:
        "bg-white/50 backdrop-blur-md text-slate-800 ring-1 ring-white/75 hover:bg-rose-50/80 hover:text-rose-950 hover:ring-rose-300",
      chipActive:
        "bg-gradient-to-r from-rose-600 to-red-600 text-white ring-2 ring-rose-600/30 shadow-sm",
      chipCode: "text-rose-700",
      Icon: ShieldAlert,
    };
  };

  const activeTheme = getRiskStyle(activeCountry.riskLevel);
  const ActiveIcon = activeTheme.Icon;
  const filteredCountries =
    riskFilter === "ALL"
      ? countries
      : countries.filter((c) => c.riskCategory === riskFilter);

  return (
    <div className="min-h-screen sentinel-mesh-bg text-slate-900 font-sans antialiased pb-24 md:pb-10">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/55 backdrop-blur-2xl border-b border-white/70 shadow-[0_4px_24px_rgba(2,27,67,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-[#00968A] to-[#021B43] text-white font-bold text-lg flex items-center justify-center shadow-md shadow-teal-800/20 ring-1 ring-inset ring-white/25">
              S
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  SENTINEL
                </h1>
                <span className="text-[11px] font-semibold bg-teal-50 text-teal-800 ring-1 ring-teal-600/20 px-2.5 py-0.5 rounded-full">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Geopolitical Travel Safety &amp; Threat Advisory Platform •{" "}
                <span className="font-medium text-slate-700">
                  Origin Locked: WNI (Indonesia)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {sessionUser ? (
              <>
                <div
                  id="session-badge"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-2xs"
                >
                  <UserCheck className="size-4 text-teal-400" />
                  <span>{sessionUser.fullName}</span>
                  <span className="font-mono bg-white/15 text-teal-200 px-2 py-0.5 rounded-md text-[10px] tracking-wider">
                    {sessionUser.role === "ADMINISTRATOR"
                      ? "ADMIN"
                      : "TRAVELER • WNI"}
                  </span>
                </div>
                <button
                  id="logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 ring-1 ring-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
                >
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              </>
            ) : (
              <button
                id="open-login-btn"
                type="button"
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
              >
                <LogIn className="size-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {loginNotice && (
        <div
          id="login-success-toast"
          role="status"
          className="fixed bottom-5 right-5 z-40 max-w-sm flex items-start gap-2.5 bg-slate-900 text-white text-xs font-medium px-4 py-3.5 rounded-xl shadow-xl ring-1 ring-white/10 border-l-4 border-teal-400 animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
          <span>{loginNotice}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        {/* Administrator Override Bar */}
        {role === "admin" && (
          <section className="sentinel-no-print rounded-2xl bg-slate-900 text-white p-5 shadow-sm ring-1 ring-slate-800 border-l-4 border-l-teal-400 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <RefreshCw className="size-4 text-teal-400" />
              <span>
                Administrator Mode: Simulate Risk Level Change for{" "}
                <span className="text-teal-300 font-bold">
                  {activeCountry.nameEn}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={async () => {
                    const nextCategory: RiskCategory =
                      lvl === 1
                        ? "LOW"
                        : lvl === 4
                          ? "CRITICAL"
                          : "ELEVATED";
                    setCountries((prev) =>
                      prev.map((c) =>
                        c.id === activeCountry.id
                          ? {
                              ...c,
                              riskLevel: lvl,
                              riskCategory: nextCategory,
                            }
                          : c
                      )
                    );
                    try {
                      await fetch("/api/admin/destinations", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          countrySlug: activeCountry.id,
                          riskLevel: lvl,
                        }),
                      });
                    } catch {
                      // Keep optimistic UI state if offline
                    }
                  }}
                  className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    activeCountry.riskLevel === lvl
                      ? "bg-teal-500 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Set L{lvl}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search & Watchlist Bento Grid */}
        <div id="search-section" className="sentinel-no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 sentinel-glass rounded-3xl p-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="country-search"
                  className="block text-sm font-bold tracking-tight text-slate-900"
                >
                  Search Whitelisted Destination (UC-1)
                </label>
                <span className="text-xs text-slate-500">
                  English, Bahasa Indonesia, or ISO Code
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="size-4 text-slate-400 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="country-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country (e.g., Japan, Jepang, Prancis, Suriah, Australia)..."
                    className="w-full rounded-2xl border border-white/80 bg-white/55 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition focus:outline-none focus:bg-white/85 focus:border-[#00968A] focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={searching}
                    className="rounded-2xl bg-gradient-to-r from-[#00968A] to-teal-700 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 shadow-sm shadow-teal-700/20 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Search className="size-4" />
                    {searching ? "Searching…" : "Search"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setInvalidQuery(null);
                      setSearchSource(null);
                      setRiskFilter("ALL");
                      handleSelectCountry(countries[0]);
                    }}
                    className="rounded-2xl bg-white/80 hover:bg-white text-slate-700 ring-1 ring-slate-200/80 font-medium text-sm px-3.5 py-2.5 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="size-3.5" /> Reset
                  </button>
                </div>
              </div>

              {/* Risk Band Filter Pills (Geopolitical Threat Triage) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {(
                  [
                    { key: "ALL", label: `All (${countries.length})` },
                    {
                      key: "LOW",
                      label: `● Low (${countries.filter((c) => c.riskCategory === "LOW").length})`,
                    },
                    {
                      key: "ELEVATED",
                      label: `▲ Elevated (${countries.filter((c) => c.riskCategory === "ELEVATED").length})`,
                    },
                    {
                      key: "CRITICAL",
                      label: `◆ Critical (${countries.filter((c) => c.riskCategory === "CRITICAL").length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRiskFilter(tab.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                      riskFilter === tab.key
                        ? "bg-[#021B43] text-white shadow-xs"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick-Select Country Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {filteredCountries.map((c) => {
                  const chipStyle = getRiskStyle(c.riskLevel);
                  const isActive = c.id === selectedId && !invalidQuery;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={`rounded-xl text-xs font-medium px-3 py-1.5 transition-all inline-flex items-center gap-1.5 ${
                        isActive ? chipStyle.chipActive : chipStyle.chipIdle
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-semibold ${
                          isActive ? "text-white/95" : chipStyle.chipCode
                        }`}
                      >
                        {chipStyle.glyph} L{c.riskLevel}
                      </span>
                      <span>{c.nameEn}</span>
                    </button>
                  );
                })}
              </div>

              <p
                id="search-status"
                role="status"
                aria-live="polite"
                className="text-xs text-slate-500 min-h-4"
              >
                {searching
                  ? "Searching whitelisted destinations…"
                  : searchSource === "postgresql"
                    ? "Safety profile loaded from PostgreSQL via GET /api/destinations."
                    : searchSource === "demo-seed"
                      ? "Safety profile loaded from the demo seed (no DATABASE_URL) via GET /api/destinations."
                      : searchSource === "local-fallback"
                        ? "API unreachable — showing bundled local whitelist data."
                        : ""}
              </p>
            </form>
          </section>

          {/* Watchlist Panel */}
          <section className="sentinel-glass rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Bookmark className="size-4 text-[#00968A]" /> Saved Watchlist
                  (UC-8)
                </h2>
                <span className="font-mono text-xs font-semibold bg-white/85 text-slate-700 px-2.5 py-0.5 rounded-full ring-1 ring-slate-200/80">
                  {canUseWatchlist ? watchlist.length : 0} Saved
                </span>
              </div>
              {!canUseWatchlist ? (
                <div className="text-xs text-slate-700 bg-white/40 backdrop-blur-md border border-dashed border-slate-300/80 rounded-2xl p-4 space-y-2.5">
                  <p className="leading-relaxed">
                    {sessionUser
                      ? "The Saved Watchlist (UC-8) is a Traveler feature. Administrators manage destination advisories instead."
                      : "Sign in as a Traveler to bookmark destinations and track real-time KBRI safety alerts."}
                  </p>
                  {!sessionUser && (
                    <button
                      id="watchlist-login-btn"
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[#00968A] font-semibold hover:text-teal-800 hover:underline"
                    >
                      <LogIn className="size-3.5" /> Sign In to Access
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {watchlist.map((wId) => {
                    const item = countries.find((c) => c.id === wId);
                    if (!item) return null;
                    const itemStyle = getRiskStyle(item.riskLevel);
                    const note = watchlistNotes[item.id];
                    const isEditing = editingNoteId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="text-xs bg-white/50 hover:bg-white/75 backdrop-blur-md px-3 py-2.5 rounded-2xl ring-1 ring-white/80 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectCountry(item)}
                            className="font-semibold text-slate-800 text-left hover:text-[#00968A] inline-flex items-center gap-2 min-w-0"
                          >
                            <span
                              className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${itemStyle.badgeBg}`}
                            >
                              {itemStyle.glyph} L{item.riskLevel}
                            </span>
                            <span className="truncate">
                              {item.nameEn}{" "}
                              <span className="text-slate-400 font-normal">
                                ({item.nameId})
                              </span>
                            </span>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(isEditing ? null : item.id);
                                setNoteDraft(note ?? "");
                              }}
                              className="text-[10px] font-semibold text-slate-500 hover:text-[#00968A] px-1.5 py-0.5 rounded-md hover:bg-teal-50 transition-colors"
                            >
                              {note ? "Edit note" : "+ Note"}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleWatchlist(item.id)}
                              className="text-slate-400 hover:text-rose-600 font-semibold px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors"
                              aria-label={`Remove ${item.nameEn}`}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="flex gap-1.5 pt-1">
                            <input
                              type="text"
                              value={noteDraft}
                              maxLength={255}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Reminder note (e.g., Check visa, Lapor Diri)..."
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-[#00968A]"
                            />
                            <button
                              type="button"
                              onClick={() => saveWatchlistNote(item.id)}
                              className="rounded-lg bg-[#00968A] text-white px-2.5 py-1 text-[11px] font-semibold hover:brightness-105"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          note && (
                            <p className="text-[11px] text-slate-500 pl-1 truncate">
                              Note: {note}
                            </p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-200/60 mt-4">
              Single Source of Truth • Synchronized with MapLibre GL markers
            </p>
          </section>
        </div>

        {/* UC-7: Interactive Regional Risk Map */}
        <section id="map-section" className="sentinel-no-print sentinel-glass rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Globe className="size-5 text-[#00968A]" /> Interactive Regional
                Risk Map (UC-7 — MapLibre GL)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hover over any marker to preview destination imagery or click to
                inspect full KBRI advisories.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={resetWorldView}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#021B43] text-white hover:bg-[#032863] transition-colors shadow-xs"
              >
                <Compass className="size-3.5" /> Reset World View
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 text-emerald-900 ring-1 ring-emerald-600/20">
                <span className="text-emerald-600 text-[10px]">●</span>
                <span className="font-mono text-[11px] font-semibold">L1</span>
                Low Risk
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/90 text-amber-900 ring-1 ring-amber-600/20">
                <span className="text-amber-600 text-[10px]">▲</span>
                <span className="font-mono text-[11px] font-semibold">
                  L2–L3
                </span>
                Elevated
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50/90 text-rose-900 ring-1 ring-rose-600/20">
                <span className="text-rose-600 text-[10px]">◆</span>
                <span className="font-mono text-[11px] font-semibold">L4</span>
                Critical
              </span>
            </div>
          </div>

          <div className="relative h-[450px] w-full rounded-2xl overflow-hidden ring-1 ring-slate-900/10 shadow-lg">
            {/* Floating Glass Telemetry Overlay */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2.5 rounded-2xl bg-[#021B43]/75 backdrop-blur-md px-3.5 py-2 text-xs text-white border border-white/15 shadow-lg">
              <span className="font-mono text-[11px] font-semibold text-teal-300">
                {activeTheme.glyph} {activeTheme.code}
              </span>
              <span className="font-semibold">{activeCountry.nameEn}</span>
              <span className="hidden sm:inline font-mono text-[10px] text-slate-300">
                {activeCountry.lat.toFixed(2)}°, {activeCountry.lng.toFixed(2)}°
              </span>
            </div>
            <Map
              theme="dark"
              viewport={viewport}
              onViewportChange={setViewport}
            >
              {countries.map((country) => {
                const style = getRiskStyle(country.riskLevel);
                const IconComponent = style.Icon;
                const isSelected = country.id === selectedId && !invalidQuery;

                return (
                  <MapMarker
                    key={country.id}
                    longitude={country.lng}
                    latitude={country.lat}
                    onClick={() => handleSelectCountry(country)}
                  >
                    <MarkerContent>
                      <div
                        data-mapcn-marker={country.nameEn}
                        className={`flex size-7 items-center justify-center rounded-full border-2 text-white shadow-lg transition-transform hover:scale-125 ${
                          style.pinBg
                        } ${isSelected ? "ring-4 ring-teal-400 scale-125" : ""}`}
                      >
                        <IconComponent className="size-3.5" />
                      </div>
                      <MarkerLabel
                        position="top"
                        className="font-mono rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white border border-slate-700"
                      >
                        {country.iso} (L{country.riskLevel})
                      </MarkerLabel>
                    </MarkerContent>

                    <MarkerTooltip className="p-2.5 bg-slate-950 text-white border border-slate-800 rounded-xl shadow-xl">
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <img
                          src={country.imageUrl}
                          alt={country.nameEn}
                          className="size-12 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <span
                            className={`font-mono inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badgeBg}`}
                          >
                            L{country.riskLevel} • {country.riskCategory}
                          </span>
                          <p className="font-bold text-xs mt-1">
                            {country.nameEn} ({country.nameId})
                          </p>
                          <p className="text-[10px] text-slate-300">
                            Capital: {country.capital}
                          </p>
                        </div>
                      </div>
                    </MarkerTooltip>
                  </MapMarker>
                );
              })}
            </Map>
          </div>
        </section>

        {/* Conditional Result Flow: Alternative Flow vs Normal Flow */}
        {invalidQuery ? (
          <section className="sentinel-glass rounded-3xl p-6 ring-1 ring-amber-400/70 border-l-4 border-l-amber-500 space-y-2.5">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 ring-1 ring-amber-500/30 px-2.5 py-1 rounded-lg">
              Alternative Flow • No Results Found
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Destination Not Found in 15-Country WNI Whitelist
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your query{" "}
              <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md ring-1 ring-slate-200">
                {invalidQuery}
              </code>{" "}
              is outside the 15 benchmark countries. Please select one of the
              whitelisted destinations above to inspect its safety profile.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            {/* Dynamic Risk Banner */}
            <div
              className={`sentinel-no-print rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 ${activeTheme.bannerBg}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3.5 rounded-2xl shrink-0 ${activeTheme.iconWrap}`}
                >
                  <ActiveIcon className="size-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full ${activeTheme.badgeBg}`}
                    >
                      {activeTheme.glyph} [{activeTheme.code}] {activeTheme.badge}
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${activeTheme.subText}`}
                    >
                      {activeTheme.sub}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      • ISO: {activeCountry.iso} • Updated{" "}
                      {activeCountry.lastUpdated}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    {activeCountry.nameEn} ({activeCountry.nameId}) —{" "}
                    <span className="font-medium text-slate-600">
                      Capital: {activeCountry.capital}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                    {activeCountry.summary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {role !== "admin" && (
                  <button
                    id="save-watchlist-btn"
                    type="button"
                    onClick={() => toggleWatchlist(activeCountry.id)}
                    className="bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2"
                  >
                    <Bookmark className="size-4 text-teal-600" />
                    {!sessionUser
                      ? "Sign in to Save"
                      : watchlist.includes(activeCountry.id)
                        ? "Saved in Watchlist"
                        : "Save to Watchlist"}
                  </button>
                )}
                {activeCountry.riskLevel === 4 && (
                  <a
                    href="#kbri-card"
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm shadow-rose-600/20 transition-colors"
                  >
                    <PhoneCall className="size-4" /> SOS Embassy Link (KBRI)
                  </a>
                )}
              </div>
            </div>

            {/* Alerts & KBRI Contacts Grid */}
            <div id="advisories-section" className="sentinel-no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Safety Bulletins */}
              <div className="lg:col-span-2 sentinel-glass rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <h4 className="text-base font-bold tracking-tight text-slate-900">
                    Active Safety Bulletins (UC-2)
                  </h4>
                  <span className="font-mono text-xs text-slate-500">
                    {activeCountry.alerts.length} Active Advisory
                  </span>
                </div>
                <div className="space-y-3">
                  {activeCountry.alerts.map((al) => (
                    <div
                      key={al.id}
                      className="p-4 rounded-2xl bg-white/50 backdrop-blur-md ring-1 ring-white/80 border-l-4 border-l-[#00968A] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider bg-white text-slate-800 px-2 py-0.5 rounded-md ring-1 ring-slate-200">
                          {al.severity}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {al.date}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-slate-900">
                        {al.title}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {al.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diplomatic Protection (KBRI) Card */}
              <div
                id="kbri-card"
                className="sentinel-glass rounded-3xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg ring-1 ring-teal-600/20">
                      Diplomatic Protection (WNI)
                    </span>
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Building2 className="size-4" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      {activeCountry.embassy.missionName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {activeCountry.embassy.address}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/50 backdrop-blur-md rounded-2xl ring-1 ring-white/80 font-mono text-xs space-y-1.5">
                  <p className="font-semibold text-slate-900">
                    Hotline: {activeCountry.embassy.hotline}
                  </p>
                  <p className="text-slate-600">
                    {activeCountry.embassy.localEmergency}
                  </p>
                  <p className="text-teal-700 font-medium break-all">
                    {activeCountry.embassy.email}
                  </p>
                </div>
              </div>
            </div>

            <DocumentChecklist
              countryIsoOrId={activeCountry.id}
              countryName={activeCountry.nameEn}
              countryNameId={activeCountry.nameId}
              riskLevel={activeCountry.riskLevel}
              embassy={activeCountry.embassy}
              documents={getRequiredDocumentsForCountry(
                activeCountry.id || activeCountry.iso || activeCountry.nameEn,
              )}
            />
          </section>
        )}
      </main>

      {/* Mobile Floating Glass Navigation Dock (Continuity / HCI) */}
      <nav
        aria-label="Quick section navigation"
        className="md:hidden fixed bottom-4 inset-x-4 z-30 flex items-center justify-around rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_32px_rgba(2,27,67,0.14)] ring-1 ring-slate-900/5 px-2 py-2"
      >
        <a
          href="#search-section"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-[#00968A]"
        >
          <Search className="size-4" />
          <span>Search</span>
        </a>
        <a
          href="#map-section"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-[#00968A]"
        >
          <Globe className="size-4" />
          <span>Map</span>
        </a>
        <a
          href="#advisories-section"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-[#00968A]"
        >
          <ShieldAlert className="size-4" />
          <span>Alerts</span>
        </a>
        <a
          href="#checklist-section"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-[#00968A]"
        >
          <CheckCircle2 className="size-4" />
          <span>Checklist</span>
        </a>
      </nav>
    </div>
  );
}