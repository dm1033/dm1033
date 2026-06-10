import Link from "next/link";
import type { ReactNode } from "react";
import FinalCta from "./FinalCta";
import { PageHero } from "./ui";

export default function ArticleLayout({
  title,
  intro,
  date,
  readMins,
  children,
}: {
  title: string;
  intro: string;
  date: string;
  readMins: number;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow="Resources" title={title} intro={intro} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-steel-500">
          By David Miller · {date} · {readMins} min read
        </p>
        <div className="prose-article mt-8 space-y-5 leading-relaxed text-steel-700 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-navy-900 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-navy-900 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
          {children}
        </div>
        <div className="mt-12 border-t border-steel-200 pt-8 text-sm text-steel-600">
          <p>
            More guides on the{" "}
            <Link href="/resources" className="font-semibold underline">
              resources page
            </Link>
            , or get a{" "}
            <Link href="/upload-cv" className="font-semibold underline">
              professional CV review
            </Link>
            .
          </p>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
