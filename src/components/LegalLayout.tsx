import type { ReactNode } from "react";
import { PageHero } from "./ui";

export default function LegalLayout({
  title,
  updated = "[Insert date before launch]",
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-steel-500">Last updated: {updated}</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-steel-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-navy-900 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-navy-900 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
          {children}
        </div>
        <p className="mt-10 rounded border border-steel-200 bg-steel-50 p-4 text-xs text-steel-500">
          Template document for review. Have all legal pages checked by a
          qualified adviser and complete the bracketed placeholders before
          launch.
        </p>
      </article>
    </>
  );
}
