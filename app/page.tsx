// app/page.tsx
"use client";

import React, { useState } from "react";
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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(["jpn", "aus", "syr"]);
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

  const handleSelectCountry = (country: Destination) => {
    setInvalidQuery(null);
    setSelectedId(country.id);
    setViewport((prev) => ({
      ...prev,
      center: [country.lng, country.lat],
      zoom: 4,
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = searchQuery.trim().replace(/\s+/g, " ").toLowerCase();
    if (!norm || norm.length > 80) {
      setInvalidQuery(searchQuery || "[EMPTY INPUT]");
      return;
    }
    const found = countries.find(
      (c) =>
        c.nameEn.toLowerCase() === norm ||
        c.nameId.toLowerCase() === norm ||
        c.iso.toLowerCase() === norm ||
        c.aliases.includes(norm)
    );
    if (found) {
      handleSelectCountry(found);
    } else {
      setInvalidQuery(searchQuery);
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

  const handleLogout = () => {
    setSessionUser(null);
    setLoginNotice(null);
  };

  const toggleWatchlist = (id: string) => {
    if (!sessionUser) {
      setLoginOpen(true);
      return;
    }
    if (!canUseWatchlist) return;
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
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
        badge: "[L1] LEVEL 1: LOW RISK",
        sub: "EXERCISE NORMAL PRECAUTIONS",
        bannerBg: "bg-emerald-50 border-emerald-600 text-emerald-950",
        badgeBg: "bg-emerald-800 text-white",
        pinBg: "bg-emerald-500 border-white",
        Icon: ShieldCheck,
      };
    }
    if (level === 2 || level === 3) {
      return {
        badge: `[L${level}] LEVEL ${level}: ELEVATED RISK`,
        sub: level === 2 ? "EXERCISE INCREASED CAUTION" : "RECONSIDER TRAVEL",
        bannerBg: "bg-amber-50 border-amber-600 text-amber-950",
        badgeBg: "bg-amber-800 text-white",
        pinBg: "bg-amber-500 border-white",
        Icon: AlertTriangle,
      };
    }
    return {
      badge: "[L4] LEVEL 4: CRITICAL RISK",
      sub: "DO NOT TRAVEL — HIGH RISK",
      bannerBg: "bg-red-50 border-red-700 text-red-950",
      badgeBg: "bg-red-800 text-white",
      pinBg: "bg-red-600 border-white",
      Icon: ShieldAlert,
    };
  };

  const activeTheme = getRiskStyle(activeCountry.riskLevel);
  const ActiveIcon = activeTheme.Icon;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-teal-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">SENTINEL</h1>
                <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300 px-2 py-0.5 rounded">
                  MVP v1.0 (Next.js + MapLibre)
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Geopolitical Travel Safety &amp; Threat Advisory Platform • Origin Locked: WNI (Indonesia)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionUser ? (
              <>
                <div
                  id="session-badge"
                  className="inline-flex items-center gap-2 bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                >
                  <UserCheck className="size-4" />
                  <span>{sessionUser.fullName}</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                    {sessionUser.role === "ADMINISTRATOR" ? "ADMINISTRATOR" : "TRAVELER (WNI)"}
                  </span>
                </div>
                <button
                  id="logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold px-3 py-2 rounded-lg"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              </>
            ) : (
              <button
                id="open-login-btn"
                type="button"
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
              >
                <LogIn className="size-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />

      {loginNotice && (
        <div
          id="login-success-toast"
          role="status"
          className="fixed bottom-5 right-5 z-40 max-w-sm flex items-start gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border-l-4 border-teal-400 animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
          <span>{loginNotice}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Administrator Override Bar */}
        {role === "admin" && (
          <section className="bg-slate-900 text-white p-4 rounded-lg border-l-8 border-teal-500 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <RefreshCw className="size-4 text-teal-400" />
              <span>Administrator Mode: Simulate Risk Level Change for {activeCountry.nameEn}</span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setCountries((prev) =>
                      prev.map((c) =>
                        c.id === activeCountry.id
                          ? {
                              ...c,
                              riskLevel: lvl,
                              riskCategory: lvl === 1 ? "LOW" : lvl === 4 ? "CRITICAL" : "ELEVATED",
                            }
                          : c
                      )
                    );
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded border ${
                    activeCountry.riskLevel === lvl
                      ? "bg-teal-500 text-slate-950 border-white"
                      : "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700"
                  }`}
                >
                  Set L{lvl}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search & Watchlist Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <label htmlFor="country-search" className="block text-sm font-bold text-gray-800">
                Search Whitelisted Destination (UC-1) — English or Bahasa Indonesia
              </label>
              <div className="flex gap-2">
                <input
                  id="country-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter country (e.g., Japan, Jepang, Prancis, Suriah, Australia)..."
                  className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-sm"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Search className="size-4" /> Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setInvalidQuery(null);
                    handleSelectCountry(countries[0]);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm px-3 py-2 rounded-lg inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3.5" /> Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`text-xs font-bold px-2.5 py-1 rounded border transition-all ${
                      c.id === selectedId && !invalidQuery
                        ? "ring-2 ring-teal-600 bg-teal-50 text-teal-950 border-teal-500"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  >
                    [L{c.riskLevel}] {c.nameEn}
                  </button>
                ))}
              </div>
            </form>
          </section>

          {/* Watchlist Panel */}
          <section className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Bookmark className="size-4 text-teal-600" /> Saved Watchlist (UC-8)
                </h2>
                <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
                  {canUseWatchlist ? watchlist.length : 0} Saved
                </span>
              </div>
              {!canUseWatchlist ? (
                <div className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded p-3 space-y-2">
                  <p>
                    {sessionUser
                      ? "The Saved Watchlist (UC-8) is a Traveler feature. Administrators manage destinations instead."
                      : "Sign in as a Traveler to view and manage your saved watchlist."}
                  </p>
                  {!sessionUser && (
                    <button
                      id="watchlist-login-btn"
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline"
                    >
                      <LogIn className="size-3.5" /> Sign In
                    </button>
                  )}
                </div>
              ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {watchlist.map((wId) => {
                  const item = countries.find((c) => c.id === wId);
                  if (!item) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectCountry(item)}
                        className="font-bold text-left hover:text-teal-700"
                      >
                        [L{item.riskLevel}] {item.nameEn} ({item.nameId})
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWatchlist(item.id)}
                        className="text-gray-400 hover:text-red-600 font-bold"
                        aria-label={`Remove ${item.nameEn}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-2">
              Single Source of Truth: Synchronized with MapLibre GL markers.
            </p>
          </section>
        </div>

        {/* UC-7: Interactive Regional Risk Map powered by mapcn-marker-content.tsx */}
        <section className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Globe className="size-5 text-teal-600" /> Interactive Regional Risk Map (UC-7 — MapLibre GL)
              </h2>
              <p className="text-xs text-gray-600">
                Hover over any marker to preview destination imagery or click to inspect full KBRI advisories.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={resetWorldView}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800"
              >
                <Compass className="size-3.5" /> Reset World View
              </button>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-300">
                ● [L1] Low Risk
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300">
                ▲ [L2–L3] Elevated
              </span>
              <span className="px-2.5 py-1 rounded bg-red-50 text-red-900 border border-red-300">
                ◆ [L4] Critical
              </span>
            </div>
          </div>

          <div className="relative h-[450px] w-full overflow-hidden rounded-lg border border-slate-800 shadow-inner">
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
                        className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white border border-slate-700"
                      >
                        {country.iso} (L{country.riskLevel})
                      </MarkerLabel>
                    </MarkerContent>

                    <MarkerTooltip className="p-2.5 bg-slate-950 text-white border border-slate-700">
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <img
                          src={country.imageUrl}
                          alt={country.nameEn}
                          className="size-12 rounded object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${style.badgeBg}`}>
                            L{country.riskLevel} • {country.riskCategory}
                          </span>
                          <p className="font-bold text-xs mt-0.5">
                            {country.nameEn} ({country.nameId})
                          </p>
                          <p className="text-[10px] text-slate-300">Capital: {country.capital}</p>
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
          <section className="bg-white p-6 rounded-lg border-2 border-amber-500 shadow-sm space-y-3">
            <span className="inline-block text-xs font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-400 px-2.5 py-0.5 rounded">
              Alternative Flow: No Results Found
            </span>
            <h3 className="text-xl font-extrabold text-gray-900">
              Destination Not Found in 15-Country WNI Whitelist
            </h3>
            <p className="text-sm text-gray-700">
              Your query <code className="bg-gray-100 px-2 py-0.5 rounded border font-mono">{invalidQuery}</code> is outside the 15 benchmark countries. Select a whitelisted destination above to inspect its safety profile.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            {/* Dynamic Risk Banner */}
            <div className={`rounded-lg p-5 border-l-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${activeTheme.bannerBg}`}>
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-lg ${activeTheme.badgeBg}`}>
                  <ActiveIcon className="size-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded ${activeTheme.badgeBg}`}>
                      {activeTheme.badge}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {activeTheme.sub}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold mt-1">
                    {activeCountry.nameEn} ({activeCountry.nameId}) — Capital: {activeCountry.capital}
                  </h3>
                  <p className="text-sm mt-1">{activeCountry.summary}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {role !== "admin" && (
                  <button
                    id="save-watchlist-btn"
                    type="button"
                    onClick={() => toggleWatchlist(activeCountry.id)}
                    className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 text-xs font-bold px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5"
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
                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="size-4" /> SOS Embassy Link (KBRI)
                  </a>
                )}
              </div>
            </div>

            {/* Alerts & KBRI Contacts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200 space-y-3">
                <h4 className="text-base font-bold text-gray-900">
                  Active Safety Bulletins (UC-2)
                </h4>
                {activeCountry.alerts.map((al) => (
                  <div key={al.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 border-l-4 border-l-teal-600">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span className="font-bold text-gray-900">[{al.severity}]</span>
                      <span className="font-mono">{al.date}</span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">{al.title}</p>
                    <p className="text-xs text-gray-700 mt-1">{al.detail}</p>
                  </div>
                ))}
              </div>

              <div id="kbri-card" className="bg-white p-5 rounded-lg border-2 border-gray-300 space-y-2.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-extrabold uppercase text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Diplomatic Protection (WNI)
                  </span>
                  <Building2 className="size-5 text-teal-700" />
                </div>
                <p className="font-bold text-sm text-gray-900">{activeCountry.embassy.missionName}</p>
                <p className="text-xs text-gray-600">{activeCountry.embassy.address}</p>
                <div className="p-3 bg-gray-50 rounded border text-xs space-y-1 font-mono">
                  <p className="font-bold text-gray-900">Hotline: {activeCountry.embassy.hotline}</p>
                  <p className="text-gray-700">{activeCountry.embassy.localEmergency}</p>
                  <p className="text-teal-800">{activeCountry.embassy.email}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}