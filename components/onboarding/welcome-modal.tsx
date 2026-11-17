"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Compass,
  Lock,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";

export interface WelcomeDestinationOption {
  id: string;
  iso: string;
  nameEn: string;
  nameId: string;
  riskLevel: 1 | 2 | 3 | 4;
}

interface WelcomeModalProps {
  open: boolean;
  destinations: WelcomeDestinationOption[];
  onBegin: (destinationQuery: string) => void;
  onOpenAuth: (mode: "signin" | "register") => void;
  onDismiss: () => void;
}

function getRiskGlyph(level: 1 | 2 | 3 | 4): {
  glyph: string;
  classes: string;
} {
  if (level === 1) {
    return {
      glyph: "●",
      classes: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    };
  }
  if (level === 4) {
    return {
      glyph: "◆",
      classes: "bg-rose-50 text-rose-800 ring-rose-600/20",
    };
  }
  return {
    glyph: "▲",
    classes: "bg-amber-50 text-amber-800 ring-amber-600/20",
  };
}

export default function WelcomeModal({
  open,
  destinations,
  onBegin,
  onOpenAuth,
  onDismiss,
}: WelcomeModalProps) {
  const [destinationInput, setDestinationInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = destinationInput.trim().toLowerCase();
    if (!q) return destinations.slice(0, 6);
    return destinations
      .filter(
        (d) =>
          d.nameEn.toLowerCase().includes(q) ||
          d.nameId.toLowerCase().includes(q) ||
          d.iso.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [destinationInput, destinations]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBegin(destinationInput.trim());
  };

  return (
    <div
      id="welcome-gate-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#021B43]/35 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans"
      role="presentation"
    >
      <div
        id="welcome-gate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_24px_64px_-12px_rgba(2,27,67,0.28)] ring-1 ring-slate-900/5 p-7 sm:p-8 animate-in zoom-in-95 duration-200"
      >
        <button
          id="welcome-close-btn"
          type="button"
          onClick={onDismiss}
          aria-label="Skip welcome setup"
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#00968A] to-[#021B43] text-white font-bold text-xl flex items-center justify-center shadow-md shadow-teal-800/20 ring-1 ring-inset ring-white/25 mb-3">
            S
          </div>
          <h2
            id="welcome-title"
            className="text-2xl font-bold tracking-[0.28em] text-[#021B43] pl-[0.28em]"
          >
            SENTINEL
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Geopolitical Travel Safety &amp; KBRI Advisory Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passport Country (Locked on Indonesia) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="welcome-passport"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                Your Passport Country
              </label>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-[#00968A] ring-1 ring-teal-600/20">
                <Lock className="size-2.5" /> Locked on Indonesia
              </span>
            </div>
            <div className="relative">
              <ShieldCheck className="size-4 text-[#00968A] pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="welcome-passport"
                type="text"
                readOnly
                value="Indonesia — Warga Negara Indonesia (WNI)"
                aria-readonly="true"
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-100/80 pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-700 cursor-not-allowed focus:outline-none"
              />
              <Lock className="size-3.5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Destination Country Input + Quick Suggestions */}
          <div className="space-y-1.5 relative">
            <label
              htmlFor="welcome-destination"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              Your Destination Country
            </label>
            <div className="relative">
              <MapPin className="size-4 text-slate-400 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="welcome-destination"
                type="text"
                autoComplete="off"
                value={destinationInput}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setDropdownOpen(false), 150);
                }}
                onChange={(e) => {
                  setDestinationInput(e.target.value);
                  setDropdownOpen(true);
                }}
                placeholder="e.g., Japan, Jepang, France, Syria..."
                className="w-full rounded-2xl border border-slate-200 bg-white/80 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:bg-white focus:border-[#00968A] focus:ring-4 focus:ring-teal-500/15"
              />
            </div>

            {/* Quick-pick Dropdown */}
            {dropdownOpen && suggestions.length > 0 && (
              <div
                role="listbox"
                aria-label="Suggested destinations"
                className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl p-1.5 max-h-48 overflow-y-auto"
              >
                {suggestions.map((d) => {
                  const badge = getRiskGlyph(d.riskLevel);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDestinationInput(d.nameEn);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-teal-50/70 transition-colors"
                    >
                      <span className="font-semibold text-slate-800">
                        {d.nameEn}{" "}
                        <span className="font-normal text-slate-400">
                          ({d.nameId})
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${badge.classes}`}
                      >
                        {badge.glyph} L{d.riskLevel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick-pick Popular Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Japan", "France", "Turkey", "Syria"].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setDestinationInput(quick)}
                  className="rounded-full bg-slate-100/80 hover:bg-teal-50 hover:text-[#00968A] px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/70 transition-colors"
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar: Log In | Register + Begin */}
          <div className="pt-4 mt-2 border-t border-slate-200/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <button
                id="welcome-signin-link"
                type="button"
                onClick={() => onOpenAuth("signin")}
                className="hover:text-[#00968A] transition-colors"
              >
                Log In
              </button>
              <span className="text-slate-300 select-none">|</span>
              <button
                id="welcome-register-link"
                type="button"
                onClick={() => onOpenAuth("register")}
                className="hover:text-[#00968A] transition-colors"
              >
                Register
              </button>
            </div>

            <button
              id="welcome-begin-btn"
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00968A] to-teal-700 hover:brightness-105 active:scale-[0.99] text-white text-sm font-semibold px-6 py-2.5 shadow-sm shadow-teal-700/20 transition-all"
            >
              <Compass className="size-4" />
              <span>Begin</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
