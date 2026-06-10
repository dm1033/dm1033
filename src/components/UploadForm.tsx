"use client";

import { useState } from "react";
import { site, compliance } from "@/lib/site";

const inputCls =
  "w-full rounded border border-steel-300 bg-white px-3 py-2.5 text-sm text-steel-800 placeholder-steel-400 focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand";
const labelCls = "mb-1.5 block text-sm font-semibold text-navy-900";

const serviceOptions = [
  "CV Review",
  "Full CV Rewrite",
  "LinkedIn Optimisation",
  "Job Application Pack",
  "Career Coaching Call",
  "Executive Profile",
  "International CV Pack",
  "Graduate / Junior Engineer Pack",
  "Not sure yet — please advise",
];

const sectorOptions = [
  "Civil engineering / infrastructure",
  "Temporary works",
  "Buildings / commercial",
  "Data centres",
  "Energy / HV / utilities",
  "Rail",
  "Highways",
  "Oil and gas",
  "Water",
  "Residential",
  "Other",
];

export default function UploadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const isPlaceholder = site.forms.upload.includes("REPLACE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (isPlaceholder) {
      setError(
        "Form processing is not connected yet. Please email your CV and details to " +
          site.email +
          " — or connect Formspree in src/lib/site.ts (see docs/FORMS-AND-BOOKING-SETUP.md).",
      );
      return;
    }

    setSending(true);
    try {
      const res = await fetch(site.forms.upload, {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      if (res.ok) setSubmitted(true);
      else setError("Something went wrong sending the form. Please try again or email " + site.email);
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
        <h3 className="mt-3 text-xl font-bold text-navy-900">CV received — thank you</h3>
        <p className="mt-2 text-sm text-steel-600">
          David will review your details and reply by email, usually within one
          working day, with the recommended next step.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-steel-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Name *</label>
          <input id="name" name="name" required className={inputCls} placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email *</label>
          <input id="email" name="email" type="email" required className={inputCls} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>Phone</label>
          <input id="phone" name="phone" type="tel" className={inputCls} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="current_role" className={labelCls}>Current role *</label>
          <input id="current_role" name="current_role" required className={inputCls} placeholder="e.g. Site Engineer" />
        </div>
        <div>
          <label htmlFor="target_role" className={labelCls}>Target role *</label>
          <input id="target_role" name="target_role" required className={inputCls} placeholder="e.g. Project Manager" />
        </div>
        <div>
          <label htmlFor="target_country" className={labelCls}>Target country</label>
          <input id="target_country" name="target_country" className={inputCls} placeholder="e.g. UK, UAE, Singapore" />
        </div>
        <div>
          <label htmlFor="years_experience" className={labelCls}>Years of experience</label>
          <input id="years_experience" name="years_experience" type="number" min="0" max="60" className={inputCls} placeholder="e.g. 8" />
        </div>
        <div>
          <label htmlFor="sector" className={labelCls}>Construction sector</label>
          <select id="sector" name="sector" className={inputCls} defaultValue="">
            <option value="" disabled>Select sector…</option>
            {sectorOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="service" className={labelCls}>Service required *</label>
          <select id="service" name="service" required className={inputCls} defaultValue="">
            <option value="" disabled>Select service…</option>
            {serviceOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="urgency" className={labelCls}>Urgency</label>
          <select id="urgency" name="urgency" className={inputCls} defaultValue="Standard (5–7 working days)">
            <option>Standard (5–7 working days)</option>
            <option>Urgent (please confirm availability)</option>
            <option>No deadline</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="linkedin_url" className={labelCls}>LinkedIn profile URL</label>
        <input id="linkedin_url" name="linkedin_url" type="url" className={inputCls} placeholder="https://www.linkedin.com/in/…" />
      </div>

      <div>
        <label htmlFor="cv_file" className={labelCls}>Upload CV (PDF or Word) *</label>
        <input
          id="cv_file"
          name="upload"
          type="file"
          required
          accept=".pdf,.doc,.docx"
          className="block w-full cursor-pointer rounded border border-steel-300 text-sm text-steel-600 file:mr-4 file:rounded-l file:border-0 file:bg-navy-800 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-700"
        />
        <p className="mt-1.5 text-xs text-steel-500">
          Your CV is transferred over HTTPS, used only to deliver this service,
          never shared without your consent and deleted after the agreed
          retention period. See our privacy policy.
        </p>
      </div>

      <div>
        <label htmlFor="job_advert" className={labelCls}>Paste job advert (optional)</label>
        <textarea id="job_advert" name="job_advert" rows={5} className={inputCls} placeholder="Paste the job advert you are targeting so the review can check keyword and requirement alignment…" />
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>Message</label>
        <textarea id="message" name="message" rows={4} className={inputCls} placeholder="Anything else we should know — career goals, deadlines, concerns…" />
      </div>

      <label className="flex items-start gap-3 text-sm text-steel-700">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-amber-brand" />
        <span>{compliance.consentWording} *</span>
      </label>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded bg-amber-brand px-6 py-3.5 text-sm font-bold text-navy-950 transition hover:bg-amber-bright disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send My CV for Review"}
      </button>
      <p className="text-center text-xs text-steel-500">
        Advisory service only — we cannot guarantee interviews, offers or
        selection. Final hiring decisions remain with employers and recruiters.
      </p>
    </form>
  );
}
