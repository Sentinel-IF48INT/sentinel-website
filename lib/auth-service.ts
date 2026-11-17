/**
 * SENTINEL — AuthService (UC-5 Login controller logic, server-only).
 *
 * Flow:  validate input → parameterized SQL on `Users` → User.fromRow()
 *        → user.verifyPassword() → return PublicUserProfile.
 */
import { randomBytes } from "node:crypto";
import { getPool } from "./db";
import { getDemoStore } from "./demo-store";
import { validateRegistrationInput } from "./form-validators";
import { User, UserRole, type PublicUserProfile } from "./models";

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
      const store = getDemoStore();
      row = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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

  /** Registers a new TRAVELER account (PostgreSQL or demo-seed). */
  public static async register(rawInput: {
    fullName?: unknown;
    username?: unknown;
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  }): Promise<
    | { ok: true; user: PublicUserProfile; dataSource: LoginDataSource }
    | { ok: false; status: 400 | 409 | 503; error: string }
  > {
    const validation = validateRegistrationInput({
      fullName: typeof rawInput.fullName === "string" ? rawInput.fullName : "",
      username: typeof rawInput.username === "string" ? rawInput.username : "",
      email: typeof rawInput.email === "string" ? rawInput.email : "",
      password: typeof rawInput.password === "string" ? rawInput.password : "",
      confirmPassword:
        typeof rawInput.confirmPassword === "string"
          ? rawInput.confirmPassword
          : "",
    });

    if (!validation.valid) {
      const firstError =
        Object.values(validation.errors)[0] ?? "Invalid registration input.";
      return { ok: false, status: 400, error: firstError };
    }

    const { fullName, username, email, password } = validation.sanitized;
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] ?? fullName;
    const lastName = nameParts.slice(1).join(" ");
    const saltHex = randomBytes(16).toString("hex");
    const passwordHash = User.hashPassword(password, saltHex);

    const pool = getPool();
    if (pool) {
      try {
        const existing = await pool.query<{ user_id: number }>(
          `SELECT user_id FROM Users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2) LIMIT 1;`,
          [email, username],
        );
        if (existing.rows.length > 0) {
          return {
            ok: false,
            status: 409,
            error: "An account with that email or username already exists.",
          };
        }

        const inserted = await pool.query<UserRow>(
          `INSERT INTO Users (email, username, first_name, last_name, user_role, password_hash)
           VALUES ($1, $2, $3, $4, 'TRAVELER', $5)
           RETURNING user_id, email, username, first_name, last_name, user_role, password_hash;`,
          [email, username, firstName, lastName, passwordHash],
        );
        const user = User.fromRow(inserted.rows[0]);
        return {
          ok: true,
          user: user.toPublicProfile(),
          dataSource: "postgresql",
        };
      } catch (err) {
        console.error("[AuthService] Register PostgreSQL failed:", err);
        return {
          ok: false,
          status: 503,
          error: "Registration service unavailable. Please try again later.",
        };
      }
    }

    const store = getDemoStore();
    const duplicate = store.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        u.username.toLowerCase() === username.toLowerCase(),
    );
    if (duplicate) {
      return {
        ok: false,
        status: 409,
        error: "An account with that email or username already exists.",
      };
    }

    const newRow = {
      user_id: store.nextUserId++,
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      user_role: UserRole.TRAVELER,
      password_hash: passwordHash,
    };
    store.users.push(newRow);
    const user = User.fromRow(newRow);
    return { ok: true, user: user.toPublicProfile(), dataSource: "demo-seed" };
  }
}
