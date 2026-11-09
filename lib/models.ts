/**
 * ============================================================================
 *  SENTINEL — Travel Safety & Threat Advisory Platform (WNI)
 *  Week #6 & Week #8 — Object-Oriented Entity Layer (<<entity>>)
 *  Group  : Bluish Pinkies Coco Puff
 *  Course : Software Implementation and Testing (IMPAL)
 * ----------------------------------------------------------------------------
 *  1:1 TypeScript translation of the Sentinel UML Class Diagram with full
 *  domain logic for UC-01 (Search Destination), UC-02 (Safety Alerts & KBRI
 *  Emergency Contacts), UC-05 (Login), and UC-10 (View Safety Profile).
 * ============================================================================
 */

import { scryptSync, timingSafeEqual } from "node:crypto";

/* --------------------------------------------------------------------------
 *  Enumerations & Value Types
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

/** Safe, serialisable projection of a user (never contains the password hash). */
export interface PublicUserProfile {
  userId: number;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
}

/** Aggregated read-model returned by UC-01 / UC-10 (Safety Profile). */
export interface SafetyProfile {
  destination: Destination;
  riskLevel: RiskLevel;
  activeAlerts: SafetyAlert[];
  emergencyContacts: EmergencyContact[];
}

/* --------------------------------------------------------------------------
 *  Database Row Interfaces (PostgreSQL & In-Memory Seed Catalog)
 * ------------------------------------------------------------------------ */

export interface DestinationRow {
  country_id: number;
  country_name: string;
  iso_alpha_3_code: string;
  is_whitelisted: boolean;
  risk_category: RiskCategory | "LOW" | "ELEVATED" | "CRITICAL" | string;
  general_info: string | null;
}

export interface SafetyAlertRow {
  alert_id: number;
  destination_country_id: number;
  risk_level: RiskLevel | number;
  title: string;
  detail: string;
  is_active: boolean;
  date?: string;
}

export interface EmergencyContactRow {
  contact_id: number;
  destination_country_id: number;
  mission_name: string;
  hotline: string;
  email: string | null;
}

/** Narrows an arbitrary number (e.g. SMALLINT column) to a valid RiskLevel. */
function toRiskLevel(value: number): RiskLevel {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  if (value < 1) return 1;
  return 4;
}

/** Narrows a DB string to the RiskCategory enum. */
function toRiskCategory(value: string): RiskCategory {
  switch (value.toUpperCase()) {
    case RiskCategory.LOW:
      return RiskCategory.LOW;
    case RiskCategory.ELEVATED:
      return RiskCategory.ELEVATED;
    case RiskCategory.CRITICAL:
      return RiskCategory.CRITICAL;
    default:
      return RiskCategory.LOW;
  }
}

/* ==========================================================================
 *  1. DESTINATION (<<entity>>) — table "Destination"
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
    this.isoAlpha3Code = isoAlpha3Code.trim().toUpperCase();
    this.isWhitelisted = isWhitelisted;
    this.riskCategory = riskCategory;
    this.generalInfo = generalInfo;
  }

  /** Static factory: hydrates a Destination entity from a DB/catalog row. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromRow(row: DestinationRow | Record<string, any>): Destination {
    return new Destination(
      Number(row.country_id),
      String(row.country_name ?? ""),
      String(row.iso_alpha_3_code ?? ""),
      Boolean(row.is_whitelisted),
      toRiskCategory(String(row.risk_category ?? "LOW")),
      String(row.general_info ?? ""),
    );
  }

  /** Normalizes a string: strips diacritics, trims, collapses spaces, lowercases. */
  public static normalizeTerm(term: string): string {
    return term
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
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

  /**
   * UC-01: Checks whether the raw query matches this destination's English name,
   * ISO Alpha-3 code, or any provided localized aliases (e.g. Bahasa Indonesia).
   */
  public matchesQuery(rawQuery: string, aliases: string[] = []): boolean {
    const normalizedQuery = Destination.normalizeTerm(rawQuery);
    if (!normalizedQuery) return false;

    if (Destination.normalizeTerm(this.countryName) === normalizedQuery) {
      return true;
    }
    if (Destination.normalizeTerm(this.isoAlpha3Code) === normalizedQuery) {
      return true;
    }
    return aliases.some((alias) => Destination.normalizeTerm(alias) === normalizedQuery);
  }

  /** Admin-only mutation (called by Administrator.updateRiskCategory). */
  public setRiskCategory(category: RiskCategory): void {
    this.riskCategory = category;
  }

  /**
   * Derived attribute: returns the maximum risk level across active alerts,
   * or falls back to a category-based level (LOW -> 1, ELEVATED -> 2, CRITICAL -> 4).
   */
  public getCurrentRiskLevel(): RiskLevel {
    const active = this.getActiveAlerts();
    if (active.length > 0) {
      return active.reduce<RiskLevel>(
        (max, alert) => (alert.getRiskLevel() > max ? alert.getRiskLevel() : max),
        1,
      );
    }
    switch (this.riskCategory) {
      case RiskCategory.LOW:
        return 1;
      case RiskCategory.ELEVATED:
        return 2;
      case RiskCategory.CRITICAL:
        return 4;
    }
  }

  /** UC-02: Filters and returns only active safety alerts (highest severity first). */
  public getActiveAlerts(): SafetyAlert[] {
    return this.safetyAlerts
      .filter((alert) => alert.isActive())
      .sort((a, b) => b.getRiskLevel() - a.getRiskLevel());
  }

  /** UC-02: Returns KBRI / consular emergency contacts for this destination. */
  public getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts];
  }

  /** UC-10: Assembles and returns the aggregated SafetyProfile read-model. */
  public getSafetyProfile(): SafetyProfile {
    return {
      destination: this,
      riskLevel: this.getCurrentRiskLevel(),
      activeAlerts: this.getActiveAlerts(),
      emergencyContacts: this.getEmergencyContacts(),
    };
  }

  public addSafetyAlert(alert: SafetyAlert): void {
    this.safetyAlerts.push(alert);
  }

  public addEmergencyContact(contact: EmergencyContact): void {
    this.emergencyContacts.push(contact);
  }
}

/* ==========================================================================
 *  2. SAFETY ALERT (<<entity>>) — table "SafetyAlert"
 * ======================================================================== */
export class SafetyAlert {
  private readonly alertId: number;
  private readonly destinationCountryId: number;
  private riskLevel: RiskLevel;
  private title: string;
  private detail: string;
  private active: boolean;

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

  /** Static factory: hydrates a SafetyAlert entity from a DB/catalog row. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromRow(row: SafetyAlertRow | Record<string, any>): SafetyAlert {
    return new SafetyAlert(
      Number(row.alert_id),
      Number(row.destination_country_id),
      toRiskLevel(Number(row.risk_level ?? 1)),
      String(row.title ?? ""),
      String(row.detail ?? ""),
      Boolean(row.is_active ?? true),
    );
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
  public isCritical(): boolean {
    return this.riskLevel === 4;
  }
  public activate(): void {
    this.active = true;
  }
  public deactivate(): void {
    this.active = false;
  }

  public updateContent(title: string, detail: string, riskLevel: RiskLevel): void {
    this.title = title.trim();
    this.detail = detail.trim();
    this.riskLevel = toRiskLevel(riskLevel);
  }
}

/* ==========================================================================
 *  3. EMERGENCY CONTACT (<<entity>>) — table "EmergencyContact"
 * ======================================================================== */
export class EmergencyContact {
  private readonly contactId: number;
  private readonly destinationCountryId: number;
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

  /** Static factory: hydrates an EmergencyContact entity from a DB/catalog row. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromRow(row: EmergencyContactRow | Record<string, any>): EmergencyContact {
    return new EmergencyContact(
      Number(row.contact_id),
      Number(row.destination_country_id),
      String(row.mission_name ?? ""),
      String(row.hotline ?? ""),
      String(row.email ?? ""),
    );
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

  public getContactCard(): string {
    return [this.missionName, this.hotline, this.email].filter(Boolean).join(" | ");
  }

  public updateHotline(hotline: string): void {
    this.hotline = hotline.trim();
  }
}

/* ==========================================================================
 *  4. USER (abstract <<entity>>) — table "Users" (UC-05 Login & RBAC)
 * ======================================================================== */
export abstract class User {
  private readonly userId: number;
  private email: string;
  private username: string;
  private firstName: string;
  private lastName: string;
  protected readonly userRole: UserRole;
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

  public verifyPassword(plainPassword: string): boolean {
    return User.verifyHash(plainPassword, this.passwordHash);
  }

  public toPublicProfile(): PublicUserProfile {
    return {
      userId: this.userId,
      email: this.email,
      username: this.username,
      fullName: this.getFullName(),
      role: this.userRole,
    };
  }

  public updateProfile(firstName: string, lastName: string): void {
    this.firstName = firstName.trim();
    this.lastName = lastName.trim();
  }

  public abstract getPermissions(): string[];

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
 *  4a. TRAVELER — specialisation of User (user_role = 'TRAVELER')
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

  public searchDestination(
    query: string,
    candidates: Destination[] = [],
  ): Destination | null {
    return candidates.find((d) => d.isSearchable() && d.matchesQuery(query)) ?? null;
  }

  public viewSafetyProfile(destination: Destination): SafetyProfile {
    return destination.getSafetyProfile();
  }

  public addToWatchlist(destination: Destination, reminderNote?: string): Watchlist {
    const item = new Watchlist(
      this.watchlist.length + 1,
      this.getUserId(),
      destination.getCountryId(),
      reminderNote ?? null,
    );
    this.watchlist.push(item);
    return item;
  }

  public removeFromWatchlist(watchlistId: number): boolean {
    const before = this.watchlist.length;
    this.watchlist = this.watchlist.filter((w) => w.getWatchlistId() !== watchlistId);
    return this.watchlist.length < before;
  }

  public setReminder(watchlistId: number, note: string): void {
    const item = this.watchlist.find((w) => w.getWatchlistId() === watchlistId);
    if (item) item.updateReminderNote(note);
  }

  public getWatchlist(): Watchlist[] {
    return [...this.watchlist];
  }
}

/* ==========================================================================
 *  4b. ADMINISTRATOR — specialisation of User (user_role = 'ADMINISTRATOR')
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

  public updateRiskCategory(destination: Destination, category: RiskCategory): void {
    destination.setRiskCategory(category);
  }

  public publishSafetyAlert(
    destination: Destination,
    riskLevel: RiskLevel,
    title: string,
    detail: string,
  ): SafetyAlert {
    const alert = new SafetyAlert(Date.now(), destination.getCountryId(), riskLevel, title, detail, true);
    destination.addSafetyAlert(alert);
    return alert;
  }

  public deactivateAlert(alert: SafetyAlert): void {
    alert.deactivate();
  }

  public manageEmergencyContact(contact: EmergencyContact): EmergencyContact {
    return contact;
  }
}

/* ==========================================================================
 *  5. WATCHLIST (<<entity>>) — table "Watchlist"
 * ======================================================================== */
export class Watchlist {
  private readonly watchlistId: number;
  private readonly userId: number;
  private readonly destinationCountryId: number;
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
  public belongsTo(userId: number): boolean {
    return this.userId === userId;
  }
  public updateReminderNote(note: string): void {
    this.reminderNote = note.trim().slice(0, 255);
  }
}
