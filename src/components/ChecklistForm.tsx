"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";
import { leadMagnets } from "@/lib/data";

export default function ChecklistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPlaceholder = site.forms.checklist.includes("REPLACE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (isPlaceholder) {
      // No form processor connected yet — let the visitor straight through.
      setSubmitted(true);
      return;
    }
    try {
      const res = await fetch(site.forms.checklist, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      if (res.ok) setSubmitted(true);
      else setError("Something went wrong — please try again.");
    } catch {
      setError("Network error — please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-steel-200 bg-white p-8">
        <h3 className="text-xl font-bold text-navy-900">Your downloads are ready</h3>
        <p className="mt-2 text-sm text-steel-600">
          Download the checklist pack below. (Placeholder PDFs — final designed
          versions to follow.)
        </p>
        <ul className="mt-5 space-y-2">
          {leadMagnets.slice(0, 5).map((m) => (
            <li key={m.slug}>
              <a
                href={m.file}
                className="font-semibold text-navy-800 underline hover:text-amber-brand"
                download
              >
                ⬇ {m.title}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-steel-600">
          Want the full library?{" "}
          <Link href="/resources" className="font-semibold underline">
            Browse all free resources →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-steel-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="First name"
          aria-label="First name"
          className="rounded border border-steel-300 px-3 py-2.5 text-sm focus:border-amber-brand focus:outline-none"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          aria-label="Email address"
          className="rounded border border-steel-300 px-3 py-2.5 text-sm focus:border-amber-brand focus:outline-none"
        />
      </div>
      <label className="mt-4 flex items-start gap-2 text-xs text-steel-600">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-amber-brand" />
        <span>
          Email me the checklist and occasional construction career tips. You
          can unsubscribe at any time — see the privacy policy.
        </span>
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="mt-5 w-full rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 transition hover:bg-amber-bright"
      >
        Send Me the Free Checklist Pack
      </button>
    </form>
  );
}
