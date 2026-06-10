"use client";

import { useState } from "react";
import type { Faq } from "@/lib/data";

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-steel-200 rounded-xl border border-steel-200 bg-white">
      {items.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={faq.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span className="font-semibold text-navy-900">{faq.q}</span>
              <span
                className={`text-xl font-bold text-amber-brand transition-transform ${
                  open ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            {open && (
              <p className="px-6 pb-5 text-sm leading-relaxed text-steel-600">{faq.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
