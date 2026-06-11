"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

export default function RestorePremium() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ plan: string; expires: string | null } | null>(null);

  async function restore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/premium/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) setDone({ plan: data.plan, expires: data.expires });
      else setError(data.error ?? "Restore failed.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-steel-200 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden>✅</p>
        <h2 className="mt-3 text-xl font-bold text-navy-900">Access restored</h2>
        <p className="mt-2 text-sm text-steel-600">
          {done.plan}
          {done.expires && <> · access until {done.expires}</>}
        </p>
        <Link
          href="/services/ats-cv-review"
          className="mt-6 inline-block rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
        >
          Run an AI Review
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={restore} className="rounded-xl border border-steel-200 bg-white p-6 shadow-sm sm:p-8">
      <label htmlFor="access-code" className="mb-1.5 block text-sm font-semibold text-navy-900">
        Access code
      </label>
      <textarea
        id="access-code"
        rows={4}
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your full access code here…"
        className="w-full rounded border border-steel-300 p-3 font-mono text-xs text-steel-800 focus:border-amber-brand focus:outline-none"
      />
      <p className="mt-2 text-xs text-steel-500">
        Your code was shown when you activated Premium. On a device that
        already has access, you can copy it from the activation page link in
        your confirmation, or contact us. Keep the code private — anyone with
        it can use your access.
      </p>
      {error && (
        <p className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="mt-5 w-full rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 transition hover:bg-amber-bright disabled:opacity-50"
      >
        {busy ? "Restoring…" : "Restore Access"}
      </button>
      <p className="mt-4 text-center text-xs text-steel-500">
        Lost your code? Email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>{" "}
        with your Stripe receipt and we&apos;ll restore access for you.
      </p>
    </form>
  );
}
