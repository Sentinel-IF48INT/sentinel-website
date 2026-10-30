/**
 * SENTINEL — PostgreSQL connection layer (server-only).
 *
 * A single shared `pg.Pool` is created lazily from DATABASE_URL.
 * If DATABASE_URL is not configured, `getPool()` returns null and the
 * AuthService falls back to the in-memory demo seed (clearly flagged as
 * `dataSource: "demo-seed"` in API responses).
 */
import { Pool } from "pg";

declare global {
  // Re-use the pool across Next.js hot reloads in development.
  var __sentinelPgPool: Pool | undefined;
}

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalThis.__sentinelPgPool) {
    globalThis.__sentinelPgPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalThis.__sentinelPgPool;
}
