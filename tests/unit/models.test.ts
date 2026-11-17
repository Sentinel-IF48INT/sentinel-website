import { describe, expect, it } from "vitest";
import {
  Administrator,
  Destination,
  RiskCategory,
  SafetyAlert,
  Traveler,
  User,
  UserRole,
} from "@/lib/models";

describe("Sentinel Domain Entities (lib/models.ts)", () => {
  it("normalizes search terms and matches name, ISO3, and aliases", () => {
    const dest = new Destination(
      1,
      "Japan",
      "JPN",
      true,
      RiskCategory.LOW,
      "Exercise normal precautions.",
    );

    expect(Destination.normalizeTerm("  Jepang  ")).toBe("jepang");
    expect(dest.matchesQuery("Japan")).toBe(true);
    expect(dest.matchesQuery("jpn")).toBe(true);
    expect(dest.matchesQuery("Jepang", ["jepang", "nihon"])).toBe(true);
    expect(dest.matchesQuery("Mars", ["jepang"])).toBe(false);
  });

  it("computes derived risk level from highest active alert", () => {
    const dest = new Destination(
      9,
      "Turkey",
      "TUR",
      true,
      RiskCategory.ELEVATED,
      "Reconsider travel to border zones.",
    );
    dest.addSafetyAlert(
      new SafetyAlert(9, 9, 3, "Border Zone", "Restricted 10km zone", true),
    );
    dest.addSafetyAlert(
      new SafetyAlert(99, 9, 4, "Inactive Alert", "Archived", false),
    );

    expect(dest.getCurrentRiskLevel()).toBe(3);
    expect(dest.getActiveAlerts()).toHaveLength(1);
  });

  it("hashes and verifies scrypt passwords in constant time", () => {
    const hash = User.hashPassword("Sentinel@2026", "5e4711e1a7a0b1c2d3e4f5a6b7c8d9e0");
    const traveler = new Traveler(
      1,
      "raka@email.com",
      "rakapratama",
      "Raka",
      "Pratama",
      hash,
    );

    expect(traveler.getRole()).toBe(UserRole.TRAVELER);
    expect(traveler.verifyPassword("Sentinel@2026")).toBe(true);
    expect(traveler.verifyPassword("WrongPassword")).toBe(false);
  });

  it("supports Traveler watchlist CRUD and Administrator risk overrides", () => {
    const dest = new Destination(1, "Japan", "JPN", true, RiskCategory.LOW, "Safe");
    const traveler = new Traveler(1, "t@test.com", "trav", "Raka", "P", "scrypt$a$b");
    const admin = new Administrator(2, "a@test.com", "adm", "Dimas", "H", "scrypt$a$b");

    const item = traveler.addToWatchlist(dest, "Bring passport");
    expect(traveler.getWatchlist()).toHaveLength(1);
    expect(item.getReminderNote()).toBe("Bring passport");

    traveler.setReminder(item.getWatchlistId(), "Updated note");
    expect(traveler.getWatchlist()[0].getReminderNote()).toBe("Updated note");
    expect(traveler.removeFromWatchlist(item.getWatchlistId())).toBe(true);
    expect(traveler.getWatchlist()).toHaveLength(0);

    admin.updateRiskCategory(dest, RiskCategory.ELEVATED);
    expect(dest.getRiskCategory()).toBe(RiskCategory.ELEVATED);
  });
});
