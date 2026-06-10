"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { site } from "@/lib/site";

type State =
  | { phase: "working" }
  | { phase: "done"; plan: string; expires: string | null }
  | { phase: "error"; message: string };

export default function ActivatePremium() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState<State>({ phase: "working" });

  useEffect(() => {
    if (!sessionId) {
      setState({ phase: "error", message: "Missing checkout reference." });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/stripe/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (res.ok) {
          setState({ phase: "done", plan: data.plan, expires: data.expires });
        } else {
          setState({ phase: "error", message: data.error ?? "Activation failed." });
        }
      } catch {
        setState({ phase: "error", message: "Network error during activation." });
      }
    })();
  }, [sessionId]);

  if (state.phase === "working") {
    return (
      <>
        <p className="text-5xl" aria-hidden>⏳</p>
        <h1 className="mt-6 text-3xl font-extrabold text-navy-900">
          Verifying your payment…
        </h1>
        <p className="mt-3 text-steel-600">This usually takes a few seconds.</p>
      </>
    );
  }

  if (state.phase === "error") {
    return (
      <>
        <p className="text-5xl" aria-hidden>⚠️</p>
        <h1 className="mt-6 text-3xl font-extrabold text-navy-900">
          Activation Problem
        </h1>
        <p className="mt-3 text-steel-600">{state.message}</p>
        <p className="mt-3 text-sm text-steel-500">
          If you were charged, your access is safe — email{" "}
          <a href={`mailto:${site.email}`} className="underline">{site.email}</a>{" "}
          with your Stripe receipt and we&apos;ll activate it manually.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-5xl" aria-hidden>🎉</p>
      <h1 className="mt-6 text-3xl font-extrabold text-navy-900">
        Premium Access Activated
      </h1>
      <p className="mt-3 text-steel-600">
        Plan: <strong>{state.plan}</strong>
        {state.expires && <> · access until {state.expires}</>}
      </p>
      <p className="mt-3 text-sm text-steel-500">
        Access is active in this browser. Using another device later? Email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a>{" "}
        and we&apos;ll transfer it — no extra charge.
      </p>
      <div className="mt-8">
        <Link
          href="/services/ats-cv-review"
          className="inline-block rounded bg-amber-brand px-8 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright"
        >
          Start Your First AI Review
        </Link>
      </div>
    </>
  );
}
