/**
 * SENTINEL — Client & Server Registration Form Validators (UC-5 / Defensive HCI)
 */

export type RegistrationField =
  | "fullName"
  | "username"
  | "email"
  | "password"
  | "confirmPassword";

export interface RegistrationInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>;

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface SanitizedRegistration {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

const FULL_NAME_PATTERN = /^[A-Za-z\s'.-]{2,60}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "min-length",
      label: "8+ chars",
      met: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "Uppercase",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Lowercase",
      met: /[a-z]/.test(password),
    },
    {
      id: "digit",
      label: "Number",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "Symbol",
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
}

export function validateRegistrationField(
  field: RegistrationField,
  input: RegistrationInput,
): string | undefined {
  switch (field) {
    case "fullName": {
      const value = input.fullName.trim();
      if (!value) return "Full name is required.";
      if (!FULL_NAME_PATTERN.test(value)) {
        return "Full name must be 2–60 characters (letters, spaces, ', ., -).";
      }
      return undefined;
    }
    case "username": {
      const value = input.username.trim();
      if (!value) return "Username is required.";
      if (!USERNAME_PATTERN.test(value)) {
        return "Username must be 3–20 characters using letters, digits, or underscores.";
      }
      return undefined;
    }
    case "email": {
      const value = input.email.trim();
      if (!value) return "Email address is required.";
      if (value.length > 254 || !EMAIL_PATTERN.test(value)) {
        return "Please enter a valid email address (name@domain.com).";
      }
      return undefined;
    }
    case "password": {
      const value = input.password;
      if (!value) return "Password is required.";
      if (/\s/.test(value)) return "Password cannot contain whitespace.";
      const unmet = getPasswordRequirements(value).filter((r) => !r.met);
      if (unmet.length > 0) {
        return `Password missing: ${unmet.map((r) => r.label.toLowerCase()).join(", ")}.`;
      }
      return undefined;
    }
    case "confirmPassword": {
      if (!input.confirmPassword) return "Please confirm your password.";
      if (input.confirmPassword !== input.password) {
        return "Passwords do not match.";
      }
      return undefined;
    }
  }
}

export function validateRegistrationInput(input: RegistrationInput): {
  valid: boolean;
  errors: RegistrationFieldErrors;
  sanitized: SanitizedRegistration;
} {
  const fields: RegistrationField[] = [
    "fullName",
    "username",
    "email",
    "password",
    "confirmPassword",
  ];

  const errors: RegistrationFieldErrors = {};
  for (const field of fields) {
    const err = validateRegistrationField(field, input);
    if (err) errors[field] = err;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      fullName: input.fullName.trim().replace(/\s+/g, " "),
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    },
  };
}
