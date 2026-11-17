"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";

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

/**
 * UC-5 Login — HCI layer.
 * Sends credentials to POST /api/auth/login and reports the result.
 */
export default function LoginModal({
  open,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md transition-opacity p-4 animate-in fade-in duration-150 font-sans"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 p-6 sm:p-8 animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          id="login-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Modern Header */}
        <div className="flex items-start gap-3.5 mb-6">
          <div className="bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 p-2.5 rounded-xl shadow-2xs shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2
              id="login-title"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Sign in to Sentinel
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Access your WNI travel watchlist and diplomatic safety alerts.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
      </div>
    </div>
  );
}
