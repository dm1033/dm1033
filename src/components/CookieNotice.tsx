"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cce-cookie-consent";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const decide = (value: "accepted" | "essential") => {
    localStorage.setItem(STORAGE_KEY, value);
    // Let the Analytics component react without a page reload.
    window.dispatchEvent(new CustomEvent("cce-consent", { detail: value }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-amber-brand bg-navy-900 p-4 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-steel-200">
          We use essential cookies to run this site. With your consent we may
          also use analytics cookies to understand how the site is used. See
          our{" "}
          <Link href="/cookie-policy" className="underline hover:text-amber-bright">
            cookie policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline hover:text-amber-bright">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="rounded border border-steel-400 px-4 py-2 text-sm font-medium text-steel-200 hover:border-white hover:text-white"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded bg-amber-brand px-4 py-2 text-sm font-bold text-navy-950 hover:bg-amber-bright"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
