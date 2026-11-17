import { describe, expect, it } from "vitest";
import {
  getPasswordRequirements,
  validateRegistrationField,
  validateRegistrationInput,
  type RegistrationInput,
} from "@/lib/form-validators";

const VALID_INPUT: RegistrationInput = {
  fullName: "Raka Pratama",
  username: "raka_pratama",
  email: "Raka.Pratama@Email.com",
  password: "Sentinel@2026",
  confirmPassword: "Sentinel@2026",
};

describe("Registration RegExp Validators (lib/form-validators.ts)", () => {
  it("accepts valid registration input and normalizes email/name", () => {
    const result = validateRegistrationInput(VALID_INPUT);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.sanitized.email).toBe("raka.pratama@email.com");
  });

  it("rejects invalid fullName, username, email, and mismatched confirmPassword", () => {
    const result = validateRegistrationInput({
      fullName: "1",
      username: "ab",
      email: "not-an-email",
      password: "weak",
      confirmPassword: "different",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.fullName).toBeDefined();
    expect(result.errors.username).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.password).toBeDefined();
    expect(result.errors.confirmPassword).toBeDefined();
  });

  it("evaluates all 5 password complexity requirements", () => {
    const unmet = getPasswordRequirements("abc");
    expect(unmet.filter((r) => r.met)).toHaveLength(1); // lowercase only

    const met = getPasswordRequirements("Sentinel@2026");
    expect(met.every((r) => r.met)).toBe(true);
  });

  it("validates single fields independently", () => {
    expect(validateRegistrationField("username", VALID_INPUT)).toBeUndefined();
    expect(
      validateRegistrationField("username", { ...VALID_INPUT, username: "bad user!" }),
    ).toBeDefined();
  });
});
