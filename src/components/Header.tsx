"use client";

import Link from "next/link";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-800 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded bg-amber-brand font-black text-navy-950">
            CE
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            {site.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-steel-200 transition hover:text-amber-bright"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/upload-cv"
            className="rounded bg-amber-brand px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-amber-bright"
          >
            Get a CV Review
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded p-2 text-white lg:hidden"
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-navy-800 bg-navy-900 px-4 pb-4 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-b border-navy-800 py-3 text-sm font-medium text-steel-200"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/upload-cv"
            className="mt-4 block rounded bg-amber-brand px-4 py-3 text-center text-sm font-bold text-navy-950"
            onClick={() => setOpen(false)}
          >
            Get a CV Review
          </Link>
        </nav>
      )}
    </header>
  );
}
