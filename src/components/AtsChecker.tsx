"use client";

import Link from "next/link";
import { useState } from "react";
import { compliance } from "@/lib/site";

/**
 * Advisory, client-side screening-readiness review.
 * Everything runs in the visitor's browser — no CV text leaves the page.
 * It deliberately gives guidance, never a "pass/fail".
 */

const STOP_WORDS = new Set(
  `a an and are as at be been but by for from has have if in into is it its of on or our so than that the their then there these they this to was we will with within you your not all can may must should would about across after also any more most other over per such up out work working role roles job jobs candidate applicant company team please apply application experience experienced years year strong good excellent ability able skills skill knowledge understanding required require requirements desirable essential including include includes etc eg ie will-be looking join offer offers salary benefits location based day days week hours full time part new well us uk`
    .split(/\s+/),
);

const STANDARD_HEADINGS = [
  "profile",
  "summary",
  "experience",
  "employment",
  "education",
  "qualifications",
  "skills",
  "projects",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+&/\- ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

function topTerms(words: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

type Result = {
  matched: string[];
  missing: string[];
  matchPct: number;
  notes: { kind: "good" | "warn"; text: string }[];
};

function analyse(cv: string, advert: string): Result {
  const cvLower = cv.toLowerCase();
  const advertTerms = topTerms(tokenize(advert), 25);
  const matched = advertTerms.filter((t) => cvLower.includes(t));
  const missing = advertTerms.filter((t) => !cvLower.includes(t));
  const matchPct = advertTerms.length
    ? Math.round((matched.length / advertTerms.length) * 100)
    : 0;

  const notes: Result["notes"] = [];
  const words = cv.split(/\s+/).filter(Boolean).length;

  if (words < 250)
    notes.push({ kind: "warn", text: "Your CV text looks short. Construction recruiters expect concrete project detail — scope, scale, your responsibility and outcomes." });
  else if (words > 1400)
    notes.push({ kind: "warn", text: "Your CV looks long. Aim for a focused 2-page core CV; move older roles into brief summaries." });
  else
    notes.push({ kind: "good", text: "CV length looks reasonable for a 2-page construction CV." });

  const headingsFound = STANDARD_HEADINGS.filter((h) => cvLower.includes(h));
  if (headingsFound.length >= 3)
    notes.push({ kind: "good", text: `Standard headings detected (${headingsFound.join(", ")}) — these help parsing.` });
  else
    notes.push({ kind: "warn", text: "Few standard headings detected. Use conventional headings such as Profile, Experience, Education, Skills — screening systems map sections by these labels." });

  if (/\d{4}\s*[–-]\s*(\d{4}|present|current)/i.test(cv))
    notes.push({ kind: "good", text: "Date ranges detected — clear employment dates help both parsers and recruiters." });
  else
    notes.push({ kind: "warn", text: "No clear date ranges detected (e.g. \"2019 – 2023\"). Add start and end dates for every role." });

  if (/@/.test(cv))
    notes.push({ kind: "good", text: "Contact email found in the CV text." });
  else
    notes.push({ kind: "warn", text: "No email address detected in the text. If your contact details sit inside a header graphic or text box, some parsers will miss them — keep them in the body text." });

  if (/%|£|\$|km\b|m²|m3|m³|tonne|kn\b/i.test(cv))
    notes.push({ kind: "good", text: "Measurable detail detected (values, quantities or percentages) — evidence like this builds recruiter trust." });
  else
    notes.push({ kind: "warn", text: "Little measurable detail detected. Where truthful, add scale: project value bands, programme durations, team sizes, quantities delivered." });

  if (advert && matchPct < 40)
    notes.push({ kind: "warn", text: "Low alignment with the advert's key terms. If you genuinely have this experience, name it explicitly using the advert's terminology. Never claim experience you do not have." });
  if (advert && matchPct >= 70)
    notes.push({ kind: "good", text: "Strong alignment with the advert's key terms. Check each matched term is backed by real project evidence in the CV body." });

  return { matched, missing, matchPct, notes };
}

const areaCls =
  "h-56 w-full rounded border border-steel-300 bg-white p-3 text-sm text-steel-800 placeholder-steel-400 focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand";

export default function AtsChecker() {
  const [cv, setCv] = useState("");
  const [advert, setAdvert] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="rounded-xl border border-steel-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="ats-cv" className="mb-1.5 block text-sm font-semibold text-navy-900">
            1. Paste your CV text
          </label>
          <textarea
            id="ats-cv"
            className={areaCls}
            placeholder="Open your CV, select all, copy, and paste the text here. Nothing is uploaded — the review runs entirely in your browser."
            value={cv}
            onChange={(e) => setCv(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ats-advert" className="mb-1.5 block text-sm font-semibold text-navy-900">
            2. Paste the job advert
          </label>
          <textarea
            id="ats-advert"
            className={areaCls}
            placeholder="Paste the job advert or role description you are targeting."
            value={advert}
            onChange={(e) => setAdvert(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!cv.trim() || !advert.trim()}
        onClick={() => setResult(analyse(cv, advert))}
        className="mt-6 w-full rounded bg-amber-brand px-6 py-3.5 text-sm font-bold text-navy-950 transition hover:bg-amber-bright disabled:cursor-not-allowed disabled:opacity-50"
      >
        Run Advisory Screening-Readiness Review
      </button>
      <p className="mt-2 text-center text-xs text-steel-500">
        Runs locally in your browser. Your CV text is not sent to any server.
      </p>

      {result && (
        <div className="mt-8 space-y-6 border-t border-steel-200 pt-8">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-steel-600">Keyword alignment with this advert</p>
              <p className="text-5xl font-extrabold text-navy-900">{result.matchPct}%</p>
            </div>
            <div className="h-3 min-w-40 flex-1 overflow-hidden rounded-full bg-steel-100">
              <div
                className="h-full rounded-full bg-amber-brand transition-all"
                style={{ width: `${result.matchPct}%` }}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-bold text-navy-900">✓ Advert terms found in your CV</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matched.length ? (
                  result.matched.map((t) => (
                    <span key={t} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-800">
                      {t}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-steel-500">None of the advert's key terms were found.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-navy-900">✗ Advert terms not found</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.missing.map((t) => (
                  <span key={t} className="rounded-full bg-amber-brand/15 px-3 py-1 text-xs font-medium text-steel-700">
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-steel-500">
                Only add a term if it reflects experience you genuinely have.
                Keyword stuffing and false claims are unethical and easily
                exposed at interview.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-navy-900">Formatting and evidence notes</h3>
            <ul className="mt-3 space-y-2">
              {result.notes.map((n) => (
                <li
                  key={n.text}
                  className={`flex items-start gap-2 rounded p-3 text-sm ${
                    n.kind === "good" ? "bg-green-50 text-green-900" : "bg-amber-brand/10 text-steel-700"
                  }`}
                >
                  <span aria-hidden>{n.kind === "good" ? "✓" : "△"}</span>
                  {n.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-lg border-l-4 border-amber-brand bg-amber-brand/10 p-4 text-sm text-steel-700">
            <strong>Please note:</strong> {compliance.toolDisclaimer}
          </p>

          <div className="rounded-xl bg-navy-900 p-6 text-center">
            <p className="font-bold text-white">Want a human expert review instead?</p>
            <p className="mt-1 text-sm text-steel-300">
              David reviews your CV against your target role personally — with a
              written action report.
            </p>
            <Link
              href="/upload-cv"
              className="mt-4 inline-block rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
            >
              Get a Professional CV Review
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
