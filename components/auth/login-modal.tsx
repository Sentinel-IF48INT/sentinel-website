"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import {
  getPasswordRequirements,
  validateRegistrationField,
  validateRegistrationInput,
  type RegistrationField,
  type RegistrationFieldErrors,
  type RegistrationInput,
} from "@/lib/form-validators";

export interface SessionUser {
  userId: number;
  email: string;
  username: string;
  fullName: string;
  role: "TRAVELER" | "ADMINISTRATOR";
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: SessionUser, dataSource: string) => void;
}

type AuthModalMode = "signin" | "register";

interface RegisteredAccountSummary {
  fullName: string;
  username: string;
  email: string;
  user?: SessionUser;
  dataSource?: string;
}

const DEMO_ACCOUNTS = [
  {
    label: "Traveler",
    badge: "WNI",
    email: "raka.pratama@email.com",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 group-hover:bg-emerald-100/80",
  },
  {
    label: "Administrator",
    badge: "STAFF",
    email: "dimas.handoko@email.com",
    badgeClass:
      "bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 group-hover:bg-teal-100/80",
  },
] as const;

const DEMO_PASSWORD = "Sentinel@2026";

const INITIAL_REGISTRATION: RegistrationInput = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const TEXT_REGISTER_FIELDS: ReadonlyArray<{
  field: "fullName" | "username" | "email";
  id: string;
  label: string;
  type: "text" | "email";
  placeholder: string;
  autoComplete: string;
  hint: string;
}> = [
  {
    field: "fullName",
    id: "register-full-name",
    label: "Full Name",
    type: "text",
    placeholder: "Raka Pratama",
    autoComplete: "name",
    hint: "2-60 letters, spaces, apostrophes ('), periods (.), or hyphens (-).",
  },
  {
    field: "username",
    id: "register-username",
    label: "Username",
    type: "text",
    placeholder: "raka_pratama",
    autoComplete: "username",
    hint: "3-20 characters: letters, digits, and underscores only.",
  },
  {
    field: "email",
    id: "register-email",
    label: "Email Address",
    type: "email",
    placeholder: "raka.pratama@email.com",
    autoComplete: "email",
    hint: "Standard email address format (name@domain.com).",
  },
];

function getFieldInputClasses(hasError: boolean, isValid: boolean, withRightPad = false): string {
  const base =
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4";
  const rightPad = withRightPad ? "pr-10" : "";

  if (hasError) {
    return `${base} ${rightPad} border-rose-400 bg-rose-50/40 focus:bg-white focus:border-rose-500 focus:ring-rose-500/15`;
  }
  if (isValid) {
    return `${base} ${rightPad} border-emerald-400 bg-emerald-50/25 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/15`;
  }
  return `${base} ${rightPad} border-slate-200 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-teal-500/15`;
}

/**
 * UC-5 Login & Defensive Registration — HCI layer.
 * Preserves Sign In via POST /api/auth/login while adding client-side RegExp
 * registration validation and real-time IMK error feedback.
 */
export default function LoginModal({
  open,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [mode, setMode] = useState<AuthModalMode>("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register state
  const [regInput, setRegInput] =
    useState<RegistrationInput>(INITIAL_REGISTRATION);
  const [regTouched, setRegTouched] = useState<
    Partial<Record<RegistrationField, boolean>>
  >({});
  const [regErrors, setRegErrors] = useState<RegistrationFieldErrors>({});
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [registeredAccount, setRegisteredAccount] =
    useState<RegisteredAccountSummary | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "signin") {
      emailRef.current?.focus();
    } else if (!registeredAccount) {
      fullNameRef.current?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mode, registeredAccount, onClose]);

  const passwordRequirements = useMemo(
    () => getPasswordRequirements(regInput.password),
    [regInput.password],
  );

  if (!open) return null;

  const switchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setError(null);
    if (nextMode === "signin") {
      setRegisteredAccount(null);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation (mirrors server rules for fast feedback)
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      onSuccess(data.user as SessionUser, data.dataSource as string);
      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const updateRegField = (field: RegistrationField, value: string) => {
    const nextInput: RegistrationInput = {
      ...regInput,
      [field]: value,
    };
    const nextTouched: Partial<Record<RegistrationField, boolean>> = {
      ...regTouched,
      [field]: true,
    };

    const nextErrors: RegistrationFieldErrors = {
      ...regErrors,
      [field]: validateRegistrationField(field, nextInput),
    };

    // Keep Confirm Password mismatch feedback synchronized whenever Password changes.
    if (
      field === "password" &&
      (nextTouched.confirmPassword || nextInput.confirmPassword.length > 0)
    ) {
      nextTouched.confirmPassword = true;
      nextErrors.confirmPassword = validateRegistrationField(
        "confirmPassword",
        nextInput,
      );
    }

    setRegInput(nextInput);
    setRegTouched(nextTouched);
    setRegErrors(nextErrors);
    setRegisteredAccount(null);
  };

  const blurRegField = (field: RegistrationField) => {
    setRegTouched((prev) => ({ ...prev, [field]: true }));
    setRegErrors((prev) => ({
      ...prev,
      [field]: validateRegistrationField(field, regInput),
    }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateRegistrationInput(regInput);
    setRegTouched({
      fullName: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setRegErrors(validation.errors);

    if (!validation.valid) {
      const firstInvalidField = (
        ["fullName", "username", "email", "password", "confirmPassword"] as const
      ).find((key) => Boolean(validation.errors[key]));

      const fieldIdMap: Record<RegistrationField, string> = {
        fullName: "register-full-name",
        username: "register-username",
        email: "register-email",
        password: "register-password",
        confirmPassword: "register-confirm-password",
      };

      if (firstInvalidField) {
        document.getElementById(fieldIdMap[firstInvalidField])?.focus();
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: validation.sanitized.fullName,
          username: validation.sanitized.username,
          email: validation.sanitized.email,
          password: regInput.password,
          confirmPassword: regInput.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegErrors((prev) => ({
          ...prev,
          email: data.error ?? "Registration failed.",
        }));
        return;
      }

      setRegisteredAccount({
        ...validation.sanitized,
        user: data.user as SessionUser,
        dataSource: (data.dataSource as string) ?? "demo-seed",
      });
    } catch {
      setRegErrors((prev) => ({
        ...prev,
        email: "Network error. Please check your connection.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateRegisteredSession = () => {
    if (!registeredAccount) return;

    onSuccess(
      registeredAccount.user ?? {
        userId: Date.now(),
        email: registeredAccount.email,
        username: registeredAccount.username,
        fullName: registeredAccount.fullName,
        role: "TRAVELER",
      },
      registeredAccount.dataSource ?? "demo-seed",
    );
    setRegInput(INITIAL_REGISTRATION);
    setRegTouched({});
    setRegErrors({});
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setRegisteredAccount(null);
    setMode("signin");
  };

  const handleResetRegistrationForm = () => {
    setRegInput(INITIAL_REGISTRATION);
    setRegTouched({});
    setRegErrors({});
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setRegisteredAccount(null);
  };

  const renderFieldFeedback = (
    field: RegistrationField,
    errorId: string,
    hint?: string,
  ) => {
    const fieldError = regTouched[field] ? regErrors[field] : undefined;
    if (fieldError) {
      return (
        <p
          id={errorId}
          role="alert"
          className="mt-1 flex items-start gap-1.5 text-xs font-medium text-rose-600"
        >
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>{fieldError}</span>
        </p>
      );
    }
    if (hint) {
      return <p className="mt-1 text-[11px] text-slate-400">{hint}</p>;
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#021B43]/35 backdrop-blur-md transition-opacity p-4 animate-in fade-in duration-150 font-sans"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_24px_64px_-12px_rgba(2,27,67,0.28)] ring-1 ring-slate-900/5 p-6 sm:p-8 animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          id="login-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Mode Switcher */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/85 p-1 mb-5 mr-8 ring-1 ring-slate-200/60"
        >
          <button
            id="auth-tab-signin"
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => switchMode("signin")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "signin"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-register"
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => switchMode("register")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Register
          </button>
        </div>

        {/* Modern Header */}
        <div className="flex items-start gap-3.5 mb-6">
          <div className="bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 p-2.5 rounded-xl shadow-2xs shrink-0">
            {mode === "signin" ? (
              <ShieldCheck className="size-6" />
            ) : (
              <UserPlus className="size-6" />
            )}
          </div>
          <div>
            <h2
              id="login-title"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {mode === "signin"
                ? "Sign in to Sentinel"
                : "Create Sentinel Account"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {mode === "signin"
                ? "Access your WNI travel watchlist and diplomatic safety alerts."
                : "Register a WNI traveler profile with real-time defensive validation."}
            </p>
          </div>
        </div>

        {mode === "signin" ? (
          /* Sign In Form */
          <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                id="login-error"
                role="alert"
                className="flex items-start gap-2.5 text-xs font-medium bg-rose-50 text-rose-900 border border-rose-200 px-3.5 py-3 rounded-xl"
              >
                <AlertCircle className="size-4 mt-0.5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Email Address
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15"
                />
                <button
                  id="login-toggle-password"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 shadow-sm transition-all inline-flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {loading ? "Verifying credentials…" : "Sign In"}
            </button>

            {/* Quick-Fill Demo Account Cards */}
            <div className="pt-5 mt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Sparkles className="size-3.5 text-teal-600" /> Quick-Fill Demo Accounts
                </span>
                <code className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {DEMO_PASSWORD}
                </code>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    id={`login-demo-${acc.label.toLowerCase()}`}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="text-left rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50/50 hover:border-teal-300 p-3 transition group"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-teal-900">
                        {acc.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${acc.badgeClass}`}
                      >
                        {acc.badge}
                      </span>
                    </div>
                    <span className="block text-[11px] text-slate-500 group-hover:text-slate-700 truncate">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : registeredAccount ? (
          /* Registration Confirmation State */
          <div
            id="register-confirmation"
            role="status"
            className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Registration Validated &amp; Ready
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                  All inputs passed strict client-side RegExp checks. Start a
                  session directly or switch to Sign In.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-2 rounded-lg bg-white/90 p-3 text-xs ring-1 ring-emerald-200/80">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Full Name</dt>
                <dd className="font-semibold text-slate-900">
                  {registeredAccount.fullName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Username</dt>
                <dd className="font-mono font-medium text-slate-800">
                  @{registeredAccount.username}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-mono text-slate-800 truncate">
                  {registeredAccount.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Role</dt>
                <dd className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  TRAVELER
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 pt-1">
              <button
                id="register-continue-btn"
                type="button"
                onClick={handleActivateRegisteredSession}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 px-4 shadow-sm transition inline-flex items-center justify-center gap-2"
              >
                <LogIn className="size-4" />
                Continue as {registeredAccount.fullName}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail(registeredAccount.email);
                    setPassword("");
                    switchMode("signin");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={handleResetRegistrationForm}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Register Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Register Form with Real-Time RegExp Validation */
          <form
            onSubmit={handleRegisterSubmit}
            className="space-y-3.5"
            noValidate
          >
            {TEXT_REGISTER_FIELDS.map(
              ({ field, id, label, type, placeholder, autoComplete, hint }) => {
                const touched = Boolean(regTouched[field]);
                const fieldError = touched ? regErrors[field] : undefined;
                const isValid =
                  touched && !fieldError && regInput[field].trim().length > 0;
                const errorId = `${id}-error`;

                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor={id}
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        {label}
                      </label>
                      {isValid && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700">
                          <Check className="size-3" /> Valid
                        </span>
                      )}
                    </div>
                    <input
                      ref={field === "fullName" ? fullNameRef : undefined}
                      id={id}
                      type={type}
                      autoComplete={autoComplete}
                      value={regInput[field]}
                      onChange={(e) => updateRegField(field, e.target.value)}
                      onBlur={() => blurRegField(field)}
                      placeholder={placeholder}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? errorId : undefined}
                      className={getFieldInputClasses(
                        Boolean(fieldError),
                        isValid,
                      )}
                    />
                    {renderFieldFeedback(field, errorId, hint)}
                  </div>
                );
              },
            )}

            {/* Password Input + Complexity Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                {Boolean(regTouched.password) &&
                  !regErrors.password &&
                  regInput.password.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700">
                      <Check className="size-3" /> Strong
                    </span>
                  )}
              </div>
              <div className="relative">
                <input
                  id="register-password"
                  type={showRegPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={regInput.password}
                  onChange={(e) => updateRegField("password", e.target.value)}
                  onBlur={() => blurRegField("password")}
                  placeholder="Min 8 chars, mixed case, digit & symbol"
                  aria-invalid={Boolean(
                    regTouched.password && regErrors.password,
                  )}
                  aria-describedby={
                    regTouched.password && regErrors.password
                      ? "register-password-error"
                      : undefined
                  }
                  className={getFieldInputClasses(
                    Boolean(regTouched.password && regErrors.password),
                    Boolean(
                      regTouched.password &&
                        !regErrors.password &&
                        regInput.password.length > 0,
                    ),
                    true,
                  )}
                />
                <button
                  id="register-toggle-password"
                  type="button"
                  onClick={() => setShowRegPassword((v) => !v)}
                  aria-label={
                    showRegPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {showRegPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {renderFieldFeedback("password", "register-password-error")}

              {/* Live Password Requirement Pills (IMK Error Prevention) */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {passwordRequirements.map((req) => (
                  <span
                    key={req.id}
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium ring-1 transition-colors ${
                      req.met
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-slate-50 text-slate-500 ring-slate-200"
                    }`}
                  >
                    {req.met ? (
                      <Check className="size-2.5" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-slate-300" />
                    )}
                    {req.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Confirm Password
                </label>
                {Boolean(regTouched.confirmPassword) &&
                  !regErrors.confirmPassword &&
                  regInput.confirmPassword.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700">
                      <Check className="size-3" /> Matches
                    </span>
                  )}
              </div>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showRegConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={regInput.confirmPassword}
                  onChange={(e) =>
                    updateRegField("confirmPassword", e.target.value)
                  }
                  onBlur={() => blurRegField("confirmPassword")}
                  placeholder="Re-enter password"
                  aria-invalid={Boolean(
                    regTouched.confirmPassword && regErrors.confirmPassword,
                  )}
                  aria-describedby={
                    regTouched.confirmPassword && regErrors.confirmPassword
                      ? "register-confirm-password-error"
                      : undefined
                  }
                  className={getFieldInputClasses(
                    Boolean(
                      regTouched.confirmPassword && regErrors.confirmPassword,
                    ),
                    Boolean(
                      regTouched.confirmPassword &&
                        !regErrors.confirmPassword &&
                        regInput.confirmPassword.length > 0,
                    ),
                    true,
                  )}
                />
                <button
                  id="register-toggle-confirm-password"
                  type="button"
                  onClick={() => setShowRegConfirmPassword((v) => !v)}
                  aria-label={
                    showRegConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  {showRegConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {renderFieldFeedback(
                "confirmPassword",
                "register-confirm-password-error",
              )}
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-sm font-semibold py-2.5 px-4 shadow-sm transition-all inline-flex items-center justify-center gap-2 mt-1"
            >
              <UserPlus className="size-4" />
              Create Traveler Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
