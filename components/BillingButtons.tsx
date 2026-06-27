"use client";

import * as React from "react";
import { Button } from "@/components/ui";

export function BillingButtons() {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function go(path: string, key: string) {
    setLoading(key);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Billing is not configured yet.");
      }
    } catch {
      setError("Could not reach billing.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        <Button onClick={() => go("/api/stripe/checkout", "checkout")} disabled={!!loading}>
          {loading === "checkout" ? "Redirecting…" : "Subscribe / upgrade"}
        </Button>
        <Button variant="secondary" onClick={() => go("/api/stripe/portal", "portal")} disabled={!!loading}>
          {loading === "portal" ? "Redirecting…" : "Manage billing"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
    </div>
  );
}
