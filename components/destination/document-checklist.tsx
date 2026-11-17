"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
  FileCheck2,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import type { RequiredDocumentItem } from "@/lib/destination-catalog";

interface DocumentChecklistProps {
  countryIsoOrId: string;
  countryName: string;
  riskLevel: 1 | 2 | 3 | 4;
  documents: RequiredDocumentItem[];
}

interface ChecklistState {
  storageKey: string;
  ids: string[];
  hydrated: boolean;
}

const CATEGORY_STYLES: Record<RequiredDocumentItem["category"], string> = {
  Identity: "bg-slate-100 text-slate-700 ring-slate-300/70",
  "Visa & Permit": "bg-teal-50 text-teal-800 ring-teal-600/20",
  "Health & Insurance": "bg-amber-50 text-amber-800 ring-amber-600/20",
  "Diplomatic & Travel": "bg-sky-50 text-sky-800 ring-sky-600/20",
};

function parseStoredIds(
  raw: string | null,
  validIds: Set<string>,
): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && validIds.has(item) && !seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function DocumentChecklist({
  countryIsoOrId,
  countryName,
  riskLevel,
  documents,
}: DocumentChecklistProps) {
  const storageKey = `sentinel_checklist_${countryIsoOrId.toLowerCase()}`;
  const validDocIds = useMemo(
    () => new Set(documents.map((doc) => doc.id)),
    [documents],
  );

  const [state, setState] = useState<ChecklistState>({
    storageKey,
    ids: [],
    hydrated: false,
  });

  // Load persisted checklist selections in a microtask so SSR matches client hydration
  // and satisfies React 19 ESLint rules against synchronous setState inside effects.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const saved = parseStoredIds(
        window.localStorage.getItem(storageKey),
        validDocIds,
      );
      setState({
        storageKey,
        ids: saved,
        hydrated: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey, validDocIds]);

  // Persist checked IDs only when state belongs to the currently active country key.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.hydrated || state.storageKey !== storageKey) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.ids));
    } catch {
      // Ignore storage quota or private browsing errors gracefully.
    }
  }, [state, storageKey]);

  const activeCheckedIds = useMemo(() => {
    if (state.storageKey !== storageKey) return [];
    return state.ids.filter((id) => validDocIds.has(id));
  }, [state, storageKey, validDocIds]);

  const checkedSet = useMemo(
    () => new Set(activeCheckedIds),
    [activeCheckedIds],
  );

  const totalCount = documents.length;
  const readyCount = activeCheckedIds.length;
  const percentage =
    totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
  const allReady = totalCount > 0 && readyCount === totalCount;

  const handleToggle = (docId: string) => {
    setState((prev) => {
      const currentIds =
        prev.storageKey === storageKey
          ? prev.ids.filter((id) => validDocIds.has(id))
          : [];
      const exists = currentIds.includes(docId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== docId)
        : [...currentIds, docId];

      return {
        storageKey,
        ids: nextIds,
        hydrated: true,
      };
    });
  };

  const handleReset = () => {
    setState({
      storageKey,
      ids: [],
      hydrated: true,
    });
  };

  return (
    <div id="checklist-section" className="sentinel-glass rounded-3xl p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/20">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-sans text-base font-bold tracking-tight text-slate-900">
                Required Documents (WNI Entry Checklist)
              </h3>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                {countryName}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Pre-departure readiness checklist for Indonesian Passport (WNI)
              holders. Progress saves automatically in your browser.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold ring-1 ${
              allReady
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                : "bg-slate-50 text-slate-700 ring-slate-200"
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            {readyCount} / {totalCount} Ready
          </span>

          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-xs font-semibold ring-1 ${
              allReady
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-teal-50 text-teal-700 ring-teal-600/20"
            }`}
          >
            {percentage}%
          </span>

          <button
            type="button"
            onClick={handleReset}
            disabled={readyCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Animated Readiness Progress Bar */}
      <div className="mt-4">
        <div
          role="progressbar"
          aria-label="WNI entry document readiness"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Rows */}
      {documents.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-slate-200/70">
          No specific entry document checklist is configured for this
          destination yet. Always verify requirements with Kemlu RI and the
          destination embassy prior to departure.
        </p>
      ) : (
        <div className="mt-5 grid gap-2.5">
          {documents.map((doc) => {
            const isChecked = checkedSet.has(doc.id);
            const isCriticalLaporDiri =
              riskLevel === 4 &&
              doc.mandatory &&
              (doc.id.includes("lapor-diri") ||
                doc.label.toLowerCase().includes("lapor diri"));

            return (
              <button
                key={doc.id}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => handleToggle(doc.id)}
                className={`group flex w-full items-start gap-3.5 rounded-xl p-3.5 text-left transition-all duration-150 ${
                  isChecked
                    ? "bg-emerald-50/80 ring-1 ring-emerald-500/30"
                    : isCriticalLaporDiri
                      ? "bg-rose-50/35 ring-1 ring-rose-200/80 hover:bg-rose-50/60"
                      : "bg-white/50 backdrop-blur-md ring-1 ring-white/80 hover:bg-white/75"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isChecked
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-slate-300 bg-white text-transparent group-hover:border-teal-500"
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.75]" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-sans text-sm font-semibold transition-colors ${
                        isChecked
                          ? "text-emerald-900 line-through decoration-emerald-600/70"
                          : "text-slate-800"
                      }`}
                    >
                      {doc.label}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ring-1 ${
                        CATEGORY_STYLES[doc.category]
                      }`}
                    >
                      {doc.category}
                    </span>

                    {doc.mandatory ? (
                      <span className="inline-flex items-center rounded-md bg-slate-900/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Mandatory
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500">
                        Advisory
                      </span>
                    )}

                    {isCriticalLaporDiri && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-600/20">
                        <ShieldAlert className="h-3 w-3" />
                        CRITICAL PROTOCOL
                      </span>
                    )}
                  </div>

                  {doc.note && (
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isChecked ? "text-emerald-800/75" : "text-slate-500"
                      }`}
                    >
                      {doc.note}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DocumentChecklist;

