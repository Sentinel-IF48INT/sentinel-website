/**
 * SENTINEL — Shared In-Memory Store for `demo-seed` Mode (server-only).
 *
 * Used ONLY when DATABASE_URL is omitted so that registration, watchlist
 * persistence, and admin risk overrides work seamlessly without PostgreSQL.
 */

import { UserRole, type RiskCategory, type RiskLevel } from "./models";

export interface DemoUserRecord {
  user_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_role: UserRole;
  password_hash: string;
}

export interface DemoWatchlistRecord {
  watchlist_id: number;
  user_id: number;
  slug: string;
  country_id: number;
  reminder_note: string | null;
  saved_at: string;
}

interface DemoStoreState {
  users: DemoUserRecord[];
  watchlists: Map<number, DemoWatchlistRecord[]>;
  riskOverrides: Map<string, { riskLevel: RiskLevel; riskCategory: RiskCategory }>;
  nextUserId: number;
  nextWatchlistId: number;
}

declare global {
  var __sentinelDemoStore: DemoStoreState | undefined;
}

function createInitialStore(): DemoStoreState {
  const watchlists = new Map<number, DemoWatchlistRecord[]>();
  // Default seeded watchlist for Raka Pratama (user_id = 1)
  watchlists.set(1, [
    {
      watchlist_id: 1,
      user_id: 1,
      slug: "jpn",
      country_id: 1,
      reminder_note: "Register Visit Japan Web QR before departure.",
      saved_at: "2026-10-20T08:00:00.000Z",
    },
    {
      watchlist_id: 2,
      user_id: 1,
      slug: "aus",
      country_id: 2,
      reminder_note: null,
      saved_at: "2026-10-20T08:05:00.000Z",
    },
    {
      watchlist_id: 3,
      user_id: 1,
      slug: "syr",
      country_id: 4,
      reminder_note: "Do not travel — L4 active conflict.",
      saved_at: "2026-10-20T08:10:00.000Z",
    },
  ]);

  return {
    users: [
      {
        user_id: 1,
        email: "raka.pratama@email.com",
        username: "rakapratama",
        first_name: "Raka",
        last_name: "Pratama",
        user_role: UserRole.TRAVELER,
        password_hash:
          "scrypt$5e4711e1a7a0b1c2d3e4f5a6b7c8d9e0$7839585252e91229bc6801c241d344a7bb47429e4548d0a30652ccd5dfa73141",
      },
      {
        user_id: 2,
        email: "dimas.handoko@email.com",
        username: "dimashandoko",
        first_name: "Dimas",
        last_name: "Handoko",
        user_role: UserRole.ADMINISTRATOR,
        password_hash:
          "scrypt$d1a5a0c0c0ffee00b1015000000000a1$bd4a6e5e583908abf975c60a7b070013543aa929deb524be0ffbf759e6cce8a0",
      },
    ],
    watchlists,
    riskOverrides: new Map(),
    nextUserId: 3,
    nextWatchlistId: 4,
  };
}

export function getDemoStore(): DemoStoreState {
  if (!globalThis.__sentinelDemoStore) {
    globalThis.__sentinelDemoStore = createInitialStore();
  }
  return globalThis.__sentinelDemoStore;
}
