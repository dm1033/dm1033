"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const inputCls =
  "w-full rounded border border-steel-300 bg-white px-3 py-2.5 text-sm text-steel-800 placeholder-steel-400 focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand";
const labelCls = "mb-1.5 block text-sm font-semibold text-navy-900";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const isPlaceholder = site.forms.contact.includes("REPLACE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (isPlaceholder) {
      setError(
        "Form processing is not connected yet. Please email " + site.email +
          " directly — or connect Formspree in src/lib/site.ts.",
      );
      return;
    }
    setSending(true);
    try {
      const res = await fetch(site.forms.contact, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      if (res.ok) setSubmitted(true);
      else setError("Something went wrong. Please try again or email " + site.email);
    } catch {
      setError("Network error. Please try again or email " + site.email);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-steel-200 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <h3 className="mt-3 text-xl font-bold text-navy-900">Message sent</h3>
        <p className="mt-2 text-sm text-steel-600">
          Thanks — David will reply by email, usually within one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-steel-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={labelCls}>Name *</label>
          <input id="c-name" name="name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>Email *</label>
          <input id="c-email" name="email" type="email" required className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="c-subject" className={labelCls}>Subject</label>
        <input id="c-subject" name="subject" className={inputCls} placeholder="e.g. Question about the CV rewrite" />
      </div>
      <div>
        <label htmlFor="c-message" className={labelCls}>Message *</label>
        <textarea id="c-message" name="message" rows={6} required className={inputCls} />
      </div>
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="rounded bg-amber-brand px-8 py-3 text-sm font-bold text-navy-950 transition hover:bg-amber-bright disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
