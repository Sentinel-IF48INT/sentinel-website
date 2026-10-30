/**
 * ============================================================================
 *  SENTINEL — Travel Safety & Threat Advisory Platform (WNI)
 *  Week #6 Assignment — Class Diagram → Object-Oriented Skeleton Code
 *  Group  : Bluish Pinkies Coco Puff
 *  Course : Software Implementation and Testing (IMPAL)
 * ----------------------------------------------------------------------------
 *  This file is the 1:1 TypeScript translation of the Sentinel UML Class
 *  Diagram. Each class maps to one PostgreSQL table from the Week #5 schema:
 *
 *    User (abstract) ─┬─ Traveler        → table "Users" (user_role = TRAVELER)
 *                     └─ Administrator   → table "Users" (user_role = ADMINISTRATOR)
 *    Destination                         → table "Destination"
 *    SafetyAlert                         → table "SafetyAlert"
 *    EmergencyContact                    → table "EmergencyContact"
 *    Watchlist                           → table "Watchlist"
 *
 *  Conventions
 *   - `private`   : attribute is fully encapsulated; accessed via getters.
 *   - `protected` : visible to subclasses (Traveler / Administrator).
 *   - `public`    : part of the class' external contract (UML "+").
 *   - Method bodies are intentionally left as placeholders (`TODO`) because
 *     Week #6 only requires skeleton code. The ONLY fully implemented
 *     behaviour is credential verification (used by the Login feature).
 * ============================================================================
 */

import { scryptSync, timingSafeEqual } from "node:crypto";

/* --------------------------------------------------------------------------
 *  Enumerations & value types (UML <<enumeration>>)
 * ------------------------------------------------------------------------ */

/** Only two roles are allowed in the MVP scope. */
export enum UserRole {
  TRAVELER = "TRAVELER",
  ADMINISTRATOR = "ADMINISTRATOR",
}

/** Destination-level risk band shown on the map and safety profile. */
export enum RiskCategory {
  LOW = "LOW", // Level 1
  ELEVATED = "ELEVATED", // Level 2–3
  CRITICAL = "CRITICAL", // Level 4
}

/** Numeric advisory level (L1–L4) carried by every SafetyAlert. */
export type RiskLevel = 1 | 2 | 3 | 4;

/** Safe, serialisable projection of a user (never contains the hash). */
export interface PublicUserProfile {
  userId: number;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
}

/** Aggregated read-model returned by UC-1 / UC-10 (Safety Profile). */
export interface SafetyProfile {
  destination: Destination;
  riskLevel: RiskLevel;
  activeAlerts: SafetyAlert[];
  emergencyContacts: EmergencyContact[];
}

/* ==========================================================================
 *  1. USER (abstract)  — table "Users"
 * ======================================================================== */
export abstract class User {
  private readonly userId: number;
  private email: string;
  private username: string;
  private firstName: string;
  private lastName: string;
  protected readonly userRole: UserRole;
  /** Stored as `scrypt$<saltHex>$<hashHex>`; never exposed publicly. */
  private passwordHash: string;

  protected constructor(
    userId: number,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    userRole: UserRole,
    passwordHash: string,
  ) {
    this.userId = userId;
    this.email = email;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userRole = userRole;
    this.passwordHash = passwordHash;
  }

  // ---- Getters (encapsulation) -------------------------------------------
  public getUserId(): number {
    return this.userId;
  }
  public getEmail(): string {
    return this.email;
  }
  public getUsername(): string {
    return this.username;
  }
  public getFirstName(): string {
    return this.firstName;
  }
  public getLastName(): string {
    return this.lastName;
  }
  public getRole(): UserRole {
    return this.userRole;
  }
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // ---- Behaviour ----------------------------------------------------------

  /**
   * UC-5 Login — verifies a plaintext password against the stored scrypt hash.
   * Implemented (not a placeholder) because the Login flow is required to be
   * fully working end-to-end. Uses constant-time comparison.
   */
  public verifyPassword(plainPassword: string): boolean {
    return User.verifyHash(plainPassword, this.passwordHash);
  }

  /** Projection safe to send to the client (no password hash). */
  public toPublicProfile(): PublicUserProfile {
    return {
      userId: this.userId,
      email: this.email,
      username: this.username,
      fullName: this.getFullName(),
      role: this.userRole,
    };
  }

  /** Updates editable profile fields. */
  public updateProfile(firstName: string, lastName: string): void {
    // TODO (Week 7+): validate input, persist via UserRepository.update()
    void firstName;
    void lastName;
  }

  /** Each subclass declares which use cases it may perform. */
  public abstract getPermissions(): string[];

  // ---- Static helpers -----------------------------------------------------

  /** Factory: builds the correct subclass from a raw "Users" table row. */
  public static fromRow(row: {
    user_id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    user_role: string;
    password_hash: string;
  }): User {
    const args = [
      row.user_id,
      row.email,
      row.username,
      row.first_name,
      row.last_name,
      row.password_hash,
    ] as const;
    return row.user_role === UserRole.ADMINISTRATOR
      ? new Administrator(...args)
      : new Traveler(...args);
  }

  /** Creates a `scrypt$salt$hash` string (used by the seed script). */
  public static hashPassword(plainPassword: string, saltHex: string): string {
    const hash = scryptSync(plainPassword, Buffer.from(saltHex, "hex"), 32);
    return `scrypt$${saltHex}$${hash.toString("hex")}`;
  }

  protected static verifyHash(plainPassword: string, stored: string): boolean {
    const [algo, saltHex, hashHex] = stored.split("$");
    if (algo !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(plainPassword, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

/* ==========================================================================
 *  1a. TRAVELER  — specialisation of User (user_role = 'TRAVELER')
 * ======================================================================== */
export class Traveler extends User {
  private watchlist: Watchlist[] = [];

  public constructor(
    userId: number,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
  ) {
    super(userId, email, username, firstName, lastName, UserRole.TRAVELER, passwordHash);
  }

  public getPermissions(): string[] {
    return ["UC-1", "UC-2", "UC-5", "UC-7", "UC-8", "UC-10", "UC-15"];
  }

  /** UC-1: search a whitelisted destination by EN/ID name, alias or ISO code. */
  public searchDestination(query: string): Destination | null {
    // TODO: normalise query, call DestinationRepository.findWhitelisted(query)
    void query;
    return null;
  }

  /** UC-10: view the aggregated safety profile of a destination. */
  public viewSafetyProfile(destination: Destination): SafetyProfile {
    // TODO: delegate to destination.getSafetyProfile()
    return destination.getSafetyProfile();
  }

  /** UC-8: save a destination to the personal watchlist. */
  public addToWatchlist(destination: Destination, reminderNote?: string): Watchlist {
    // TODO: INSERT INTO "Watchlist" … RETURNING *
    void destination;
    void reminderNote;
    throw new Error("Not implemented (Week 6 skeleton)");
  }

  /** UC-8: remove a destination from the watchlist. */
  public removeFromWatchlist(watchlistId: number): boolean {
    // TODO: DELETE FROM "Watchlist" WHERE watchlist_id = $1 AND user_id = $2
    void watchlistId;
    return false;
  }

  /** UC-15: attach / edit a reminder note on a saved destination. */
  public setReminder(watchlistId: number, note: string): void {
    // TODO: find watchlist item, call item.updateReminderNote(note)
    void watchlistId;
    void note;
  }

  public getWatchlist(): Watchlist[] {
    return [...this.watchlist];
  }
}

/* ==========================================================================
 *  1b. ADMINISTRATOR  — specialisation of User (user_role = 'ADMINISTRATOR')
 * ======================================================================== */
export class Administrator extends User {
  public constructor(
    userId: number,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
  ) {
    super(userId, email, username, firstName, lastName, UserRole.ADMINISTRATOR, passwordHash);
  }

  public getPermissions(): string[] {
    return ["UC-1", "UC-2", "UC-5", "UC-7", "UC-10", "ADMIN-RISK", "ADMIN-ALERT", "ADMIN-CONTACT"];
  }

  /** Re-classify the risk band of a destination. */
  public updateRiskCategory(destination: Destination, category: RiskCategory): void {
    // TODO: destination.setRiskCategory(category); persist; audit log
    void destination;
    void category;
  }

  /** UC-2 (admin side): publish a new safety alert. */
  public publishSafetyAlert(
    destination: Destination,
    riskLevel: RiskLevel,
    title: string,
    detail: string,
  ): SafetyAlert {
    // TODO: INSERT INTO "SafetyAlert" … RETURNING *
    void destination;
    void riskLevel;
    void title;
    void detail;
    throw new Error("Not implemented (Week 6 skeleton)");
  }

  /** UC-2 (admin side): retire an outdated alert. */
  public deactivateAlert(alert: SafetyAlert): void {
    // TODO: alert.deactivate(); persist
    void alert;
  }

  /** UC-2 (admin side): create or update a KBRI emergency contact. */
  public manageEmergencyContact(contact: EmergencyContact): EmergencyContact {
    // TODO: UPSERT INTO "EmergencyContact"
    return contact;
  }
}

/* ==========================================================================
 *  2. DESTINATION  — table "Destination"
 * ======================================================================== */
export class Destination {
  private readonly countryId: number;
  private countryName: string;
  private isoAlpha3Code: string;
  private isWhitelisted: boolean;
  private riskCategory: RiskCategory;
  private generalInfo: string;
  /** Composition: 1 Destination ◆── 0..* SafetyAlert */
  private safetyAlerts: SafetyAlert[] = [];
  /** Composition: 1 Destination ◆── 1..* EmergencyContact */
  private emergencyContacts: EmergencyContact[] = [];

  public constructor(
    countryId: number,
    countryName: string,
    isoAlpha3Code: string,
    isWhitelisted: boolean,
    riskCategory: RiskCategory,
    generalInfo: string,
  ) {
    this.countryId = countryId;
    this.countryName = countryName;
    this.isoAlpha3Code = isoAlpha3Code;
    this.isWhitelisted = isWhitelisted;
    this.riskCategory = riskCategory;
    this.generalInfo = generalInfo;
  }

  public getCountryId(): number {
    return this.countryId;
  }
  public getCountryName(): string {
    return this.countryName;
  }
  public getIsoAlpha3Code(): string {
    return this.isoAlpha3Code;
  }
  public getRiskCategory(): RiskCategory {
    return this.riskCategory;
  }
  public getGeneralInfo(): string {
    return this.generalInfo;
  }
  public isSearchable(): boolean {
    return this.isWhitelisted;
  }

  /** Admin-only mutation (called by Administrator.updateRiskCategory). */
  public setRiskCategory(category: RiskCategory): void {
    // TODO: guard + persist
    this.riskCategory = category;
  }

  /** Derived attribute: highest risk_level among active alerts (L1 fallback). */
  public getCurrentRiskLevel(): RiskLevel {
    // TODO: return max(alert.riskLevel) over getActiveAlerts(), default 1
    return 1;
  }

  /** UC-2: only alerts where is_active = TRUE. */
  public getActiveAlerts(): SafetyAlert[] {
    // TODO: filter this.safetyAlerts by alert.isActive()
    return [];
  }

  /** UC-2: KBRI / consular contacts for this destination. */
  public getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts];
  }

  /** UC-10: aggregated safety profile. */
  public getSafetyProfile(): SafetyProfile {
    // TODO: assemble from getCurrentRiskLevel(), getActiveAlerts(), getEmergencyContacts()
    return {
      destination: this,
      riskLevel: this.getCurrentRiskLevel(),
      activeAlerts: this.getActiveAlerts(),
      emergencyContacts: this.getEmergencyContacts(),
    };
  }

  public addSafetyAlert(alert: SafetyAlert): void {
    // TODO: validate alert.destinationCountryId === this.countryId
    this.safetyAlerts.push(alert);
  }

  public addEmergencyContact(contact: EmergencyContact): void {
    // TODO: validate contact.destinationCountryId === this.countryId
    this.emergencyContacts.push(contact);
  }
}

/* ==========================================================================
 *  3. SAFETY ALERT  — table "SafetyAlert"
 * ======================================================================== */
export class SafetyAlert {
  private readonly alertId: number;
  private readonly destinationCountryId: number; // FK → Destination.country_id
  private riskLevel: RiskLevel;
  private title: string;
  private detail: string;
  private active: boolean; // column: is_active

  public constructor(
    alertId: number,
    destinationCountryId: number,
    riskLevel: RiskLevel,
    title: string,
    detail: string,
    isActive: boolean = true,
  ) {
    this.alertId = alertId;
    this.destinationCountryId = destinationCountryId;
    this.riskLevel = riskLevel;
    this.title = title;
    this.detail = detail;
    this.active = isActive;
  }

  public getAlertId(): number {
    return this.alertId;
  }
  public getDestinationCountryId(): number {
    return this.destinationCountryId;
  }
  public getRiskLevel(): RiskLevel {
    return this.riskLevel;
  }
  public getTitle(): string {
    return this.title;
  }
  public getDetail(): string {
    return this.detail;
  }
  public isActive(): boolean {
    return this.active;
  }

  /** Level 4 alerts trigger the SOS / KBRI shortcut in the UI. */
  public isCritical(): boolean {
    return this.riskLevel === 4;
  }

  public activate(): void {
    // TODO: persist
    this.active = true;
  }

  public deactivate(): void {
    // TODO: persist
    this.active = false;
  }

  public updateContent(title: string, detail: string, riskLevel: RiskLevel): void {
    // TODO: validate + persist
    void title;
    void detail;
    void riskLevel;
  }
}

/* ==========================================================================
 *  4. EMERGENCY CONTACT  — table "EmergencyContact"
 * ======================================================================== */
export class EmergencyContact {
  private readonly contactId: number;
  private readonly destinationCountryId: number; // FK → Destination.country_id
  private missionName: string;
  private hotline: string;
  private email: string;

  public constructor(
    contactId: number,
    destinationCountryId: number,
    missionName: string,
    hotline: string,
    email: string,
  ) {
    this.contactId = contactId;
    this.destinationCountryId = destinationCountryId;
    this.missionName = missionName;
    this.hotline = hotline;
    this.email = email;
  }

  public getContactId(): number {
    return this.contactId;
  }
  public getDestinationCountryId(): number {
    return this.destinationCountryId;
  }
  public getMissionName(): string {
    return this.missionName;
  }
  public getHotline(): string {
    return this.hotline;
  }
  public getEmail(): string {
    return this.email;
  }

  /** Formatted card shown in the "Diplomatic Protection (WNI)" panel. */
  public getContactCard(): string {
    // TODO: richer formatting / i18n
    return `${this.missionName} | ${this.hotline} | ${this.email}`;
  }

  public updateHotline(hotline: string): void {
    // TODO: validate E.164 format + persist
    void hotline;
  }
}

/* ==========================================================================
 *  5. WATCHLIST  — table "Watchlist" (association class User ↔ Destination)
 * ======================================================================== */
export class Watchlist {
  private readonly watchlistId: number;
  private readonly userId: number; // FK → Users.user_id
  private readonly destinationCountryId: number; // FK → Destination.country_id
  private reminderNote: string | null;
  private readonly savedAt: Date;

  public constructor(
    watchlistId: number,
    userId: number,
    destinationCountryId: number,
    reminderNote: string | null,
    savedAt: Date = new Date(),
  ) {
    this.watchlistId = watchlistId;
    this.userId = userId;
    this.destinationCountryId = destinationCountryId;
    this.reminderNote = reminderNote;
    this.savedAt = savedAt;
  }

  public getWatchlistId(): number {
    return this.watchlistId;
  }
  public getUserId(): number {
    return this.userId;
  }
  public getDestinationCountryId(): number {
    return this.destinationCountryId;
  }
  public getReminderNote(): string | null {
    return this.reminderNote;
  }
  public getSavedAt(): Date {
    return this.savedAt;
  }

  /** Ownership check used before update/delete. */
  public belongsTo(userId: number): boolean {
    return this.userId === userId;
  }

  /** UC-15: edit reminder note. */
  public updateReminderNote(note: string): void {
    // TODO: trim, max length 255, persist
    void note;
  }
}
