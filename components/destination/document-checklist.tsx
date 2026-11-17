"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
  FileCheck2,
  FileDown,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import type { RequiredDocumentItem } from "@/lib/destination-catalog";

interface EmbassySummary {
  missionName: string;
  address: string;
  hotline: string;
  localEmergency: string;
  email: string;
}

interface DocumentChecklistProps {
  countryIsoOrId: string;
  countryName: string;
  countryNameId?: string;
  riskLevel: 1 | 2 | 3 | 4;
  documents: RequiredDocumentItem[];
  embassy?: EmbassySummary;
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
  countryNameId,
  riskLevel,
  documents,
  embassy,
}: DocumentChecklistProps) {
  const [pdfNotice, setPdfNotice] = useState<string>("");
  const [generatedDate, setGeneratedDate] = useState<string>("");
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

  const handleSaveAsPdf = () => {
    if (typeof window === "undefined") return;
    const prevTitle = document.title;
    const safeIso = (countryIsoOrId || countryName)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    document.title = `SENTINEL-WNI-Checklist-${safeIso}`;
    document.body.classList.add("printing-checklist");
    setGeneratedDate(new Date().toISOString().slice(0, 10));
    setPdfNotice(`Preparing PDF checklist for ${countryName}.`);

    const cleanup = () => {
      document.body.classList.remove("printing-checklist");
      document.title = prevTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.requestAnimationFrame(() => {
      window.print();
      // Fallback cleanup in case afterprint does not fire in some environments
      window.setTimeout(cleanup, 1500);
    });
  };

  const riskSummaryLabel =
    riskLevel === 1
      ? "● Level 1 — Low Risk (Exercise Normal Precautions)"
      : riskLevel === 2
        ? "▲ Level 2 — Elevated Risk (Exercise Increased Caution)"
        : riskLevel === 3
          ? "▲ Level 3 — Elevated Risk (Reconsider Travel)"
          : "◆ Level 4 — Critical Risk (Do Not Travel)";

  return (
    <div id="checklist-section" className="sentinel-glass rounded-3xl p-6 sm:p-7">
      <div className="print:hidden">
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
            id="checklist-save-pdf-btn"
            type="button"
            onClick={handleSaveAsPdf}
            aria-label={`Save ${countryName} required documents checklist as PDF`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#021B43] px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-[#032863] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00968A] focus-visible:ring-offset-2"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
            Save as PDF
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={readyCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00968A] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {pdfNotice}
      </span>

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

      {/* Dedicated A4 Print / Save-as-PDF Dossier */}
      <article
        aria-label={`Printable WNI Entry Document Checklist for ${countryName}`}
        className="hidden print:block text-slate-900 space-y-5"
      >
        <header className="border-b-2 border-[#021B43] pb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#00968A]">
              SENTINEL • Geopolitical Travel Safety Advisory (WNI)
            </p>
            <h2 className="text-2xl font-bold text-[#021B43] mt-1">
              Pre-Departure Entry Document Checklist
            </h2>
            <p className="text-sm text-slate-700 mt-0.5">
              Destination:{" "}
              <strong>
                {countryName}
                {countryNameId && countryNameId !== countryName
                  ? ` (${countryNameId})`
                  : ""}
              </strong>{" "}
              • Code: <strong>{countryIsoOrId.toUpperCase()}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-[#021B43]">
              Origin: Indonesian Citizen (WNI)
            </p>
            <p>
              Readiness:{" "}
              <strong>
                {readyCount} / {totalCount} ({percentage}%)
              </strong>
            </p>
            {generatedDate && <p>Generated: {generatedDate}</p>}
          </div>
        </header>

        <section className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-xs space-y-1">
          <p className="font-bold text-[#021B43]">
            Travel Advisory Classification: {riskSummaryLabel}
          </p>
          {riskLevel === 4 && (
            <p className="font-semibold text-rose-700">
              CRITICAL PROTOCOL: Non-essential WNI travel is advised against.
              Mandatory Peduli WNI / KBRI Lapor Diri registration applies.
            </p>
          )}
        </section>

        <section aria-label="Required documents list" className="space-y-2.5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#021B43]">
            Required Documents ({totalCount})
          </h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-left text-[#021B43]">
                <th className="py-2 px-2.5 w-20">Status</th>
                <th className="py-2 px-2.5">Document &amp; Guidance</th>
                <th className="py-2 px-2.5 w-32">Category</th>
                <th className="py-2 px-2.5 w-24">Requirement</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isChecked = checkedSet.has(doc.id);
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-200 break-inside-avoid align-top"
                  >
                    <td className="py-2.5 px-2.5 font-semibold">
                      {isChecked ? "[✓] Ready" : "[ ] Pending"}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <p className="font-bold text-slate-900">{doc.label}</p>
                      {doc.note && (
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          {doc.note}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700">
                      {doc.category}
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold text-slate-800">
                      {doc.mandatory ? "Mandatory" : "Advisory"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {embassy && (
          <section className="rounded-lg border border-slate-300 p-4 text-xs space-y-1 break-inside-avoid">
            <h3 className="font-bold uppercase tracking-wider text-[#021B43]">
              Accredited Indonesian Diplomatic Mission (KBRI)
            </h3>
            <p className="font-semibold text-slate-900">{embassy.missionName}</p>
            <p className="text-slate-700">{embassy.address}</p>
            <p className="text-slate-800">
              <strong>Hotline:</strong> {embassy.hotline} •{" "}
              <strong>Local Emergency:</strong> {embassy.localEmergency}
            </p>
            <p className="text-slate-700">
              <strong>Email:</strong> {embassy.email}
            </p>
          </section>
        )}

        <footer className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 flex justify-between gap-4">
          <span>
            Verify final visa &amp; entry rules with Kemlu RI (peduliwni.kemlu.go.id)
            and the destination embassy before departure.
          </span>
          <span>SENTINEL IMPAL MVP • [DEMO] Dataset</span>
        </footer>
      </article>
    </div>
  );
}

export default DocumentChecklist;

