/**
 * SENTINEL — AuthService (UC-5 Login controller logic, server-only).
 *
 * Flow:  validate input → parameterized SQL on `Users` → User.fromRow()
 *        → user.verifyPassword() → return PublicUserProfile.
 */
import { getPool } from "./db";
import { User, type PublicUserProfile } from "./models";

export type LoginDataSource = "postgresql" | "demo-seed";

export type LoginResult =
  | { ok: true; user: PublicUserProfile; dataSource: LoginDataSource }
  | { ok: false; status: 400 | 401 | 503; error: string };

interface UserRow {
  user_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_role: string;
  password_hash: string;
}

/**
 * Parameterized query — `$1` is bound by the pg driver, so user input is
 * NEVER concatenated into SQL (prevents SQL injection).
 */
export const FIND_USER_BY_EMAIL_SQL = `
  SELECT user_id, email, username, first_name, last_name, user_role, password_hash
  FROM   Users
  WHERE  LOWER(email) = LOWER($1)
  LIMIT  1;
`;

/**
 * In-memory mirror of db/seed.sql. Used ONLY when DATABASE_URL is not set,
 * so the Login demo still works on machines without PostgreSQL installed.
 * Demo password for both accounts: Sentinel@2026
 */
const DEMO_SEED_USERS: UserRow[] = [
  {
    user_id: 1,
    email: "raka.pratama@email.com",
    username: "rakapratama",
    first_name: "Raka",
    last_name: "Pratama",
    user_role: "TRAVELER",
    password_hash:
      "scrypt$5e4711e1a7a0b1c2d3e4f5a6b7c8d9e0$7839585252e91229bc6801c241d344a7bb47429e4548d0a30652ccd5dfa73141",
  },
  {
    user_id: 2,
    email: "dimas.handoko@email.com",
    username: "dimashandoko",
    first_name: "Dimas",
    last_name: "Handoko",
    user_role: "ADMINISTRATOR",
    password_hash:
      "scrypt$d1a5a0c0c0ffee00b1015000000000a1$bd4a6e5e583908abf975c60a7b070013543aa929deb524be0ffbf759e6cce8a0",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_AUTH_ERROR = "Invalid email or password.";

export class AuthService {
  /** Main entry point used by POST /api/auth/login. */
  public static async login(rawEmail: unknown, rawPassword: unknown): Promise<LoginResult> {
    // 1. Input validation (server-side; never trust the client)
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";

    if (!email || !password) {
      return { ok: false, status: 400, error: "Email and password are required." };
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return { ok: false, status: 400, error: "Please enter a valid email address." };
    }

    // 2. Look up the user row
    let row: UserRow | undefined;
    let dataSource: LoginDataSource;
    const pool = getPool();

    if (pool) {
      dataSource = "postgresql";
      try {
        const result = await pool.query<UserRow>(FIND_USER_BY_EMAIL_SQL, [email]);
        row = result.rows[0];
      } catch (err) {
        console.error("[AuthService] PostgreSQL query failed:", err);
        return { ok: false, status: 503, error: "Authentication service unavailable. Please try again later." };
      }
    } else {
      dataSource = "demo-seed";
      row = DEMO_SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    // 3. Verify credentials via the domain model (same generic error for
    //    unknown email and wrong password → prevents account enumeration)
    if (!row) return { ok: false, status: 401, error: GENERIC_AUTH_ERROR };

    const user = User.fromRow(row);
    if (!user.verifyPassword(password)) {
      return { ok: false, status: 401, error: GENERIC_AUTH_ERROR };
    }

    // 4. Success → only the safe public profile leaves the server
    return { ok: true, user: user.toPublicProfile(), dataSource };
  }
}
