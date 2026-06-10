import Link from "next/link";
import type { ReactNode } from "react";

/* ---------- Buttons ---------- */

export function ButtonPrimary({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const cls =
    "inline-block rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 shadow transition hover:bg-amber-bright";
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function ButtonSecondary({
  href,
  children,
  light,
}: {
  href: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-block rounded border px-6 py-3 text-sm font-bold transition ${
        light
          ? "border-steel-300 text-white hover:border-amber-bright hover:text-amber-bright"
          : "border-navy-600 text-navy-800 hover:border-amber-brand hover:text-navy-950"
      }`}
    >
      {children}
    </Link>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  eyebrow,
  title,
  intro,
  light,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-widest text-amber-brand">
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-navy-900"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-lg ${light ? "text-steel-200" : "text-steel-600"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

/* ---------- Page hero (inner pages) ---------- */

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-blueprint">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-sm font-bold uppercase tracking-widest text-amber-bright">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          {intro && <p className="mt-5 text-lg leading-relaxed text-steel-200">{intro}</p>}
          {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

/* ---------- Compliance / warning box ---------- */

export function DisclaimerBox({ children, title = "Honest service, honest limits" }: { children: ReactNode; title?: string }) {
  return (
    <div className="rounded-lg border-l-4 border-amber-brand bg-amber-brand/10 p-5">
      <p className="flex items-center gap-2 font-bold text-navy-900">
        <span aria-hidden>⚠️</span> {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-steel-700">{children}</div>
    </div>
  );
}

/* ---------- Checklist item ---------- */

export function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg
        className="mt-1 h-4 w-4 shrink-0 text-amber-brand"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}

/* ---------- Image placeholder (replace with real photography) ---------- */

export function ImagePlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`Image placeholder: ${label}`}
      className={`flex items-center justify-center rounded-lg border-2 border-dashed border-steel-300 bg-blueprint-light ${className}`}
    >
      <span className="px-6 py-12 text-center text-sm font-medium text-steel-500">
        📷 {label}
      </span>
    </div>
  );
}
