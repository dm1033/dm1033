"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Consent-gated Google Analytics 4.
 *
 * Loads ONLY when both are true:
 *  1. NEXT_PUBLIC_GA_ID is set (e.g. G-XXXXXXXXXX) — leave unset to disable
 *  2. The visitor clicked "Accept" on the cookie banner
 *
 * "Essential only" visitors are never tracked. IP anonymisation is on.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const STORAGE_KEY = "cce-cookie-consent";

export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "accepted") setConsented(true);
    const onConsent = (e: Event) => {
      if ((e as CustomEvent).detail === "accepted") setConsented(true);
    };
    window.addEventListener("cce-consent", onConsent);
    return () => window.removeEventListener("cce-consent", onConsent);
  }, []);

  if (!GA_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
