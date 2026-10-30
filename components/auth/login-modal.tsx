"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck, X, AlertCircle } from "lucide-react";

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
  { label: "Traveler", email: "raka.pratama@email.com" },
  { label: "Administrator", email: "dimas.handoko@email.com" },
] as const;

const DEMO_PASSWORD = "Sentinel@2026";

/**
 * UC-5 Login — HCI layer.
 * Sends credentials to POST /api/auth/login and reports the result.
 */
export default function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white relative">
          <button
            id="login-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close login dialog"
            className="absolute right-4 top-4 p-1 rounded hover:bg-white/15"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/15 flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 id="login-title" className="text-lg font-extrabold tracking-tight">
                Sign in to SENTINEL
              </h2>
              <p className="text-xs text-teal-100">UC-5 Basic Authentication • Traveler &amp; Administrator</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
          {error && (
            <div
              id="login-error"
              role="alert"
              className="flex items-start gap-2 text-sm bg-red-50 text-red-900 border border-red-300 px-3 py-2.5 rounded-lg"
            >
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-sm font-bold text-gray-800">
              Email address
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-sm font-bold text-gray-800">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                id="login-toggle-password"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2.5 rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {loading ? "Verifying credentials…" : "Sign In"}
          </button>

          {/* Demo accounts helper */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Demo accounts (password: <code className="font-mono normal-case">{DEMO_PASSWORD}</code>)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  id={`login-demo-${acc.label.toLowerCase()}`}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="text-left text-xs bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg px-2.5 py-2 transition-colors"
                >
                  <span className="block font-bold text-gray-900">{acc.label}</span>
                  <span className="block text-gray-600 truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
