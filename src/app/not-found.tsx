import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-amber-brand">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-navy-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 text-steel-600">
        That page doesn&apos;t exist — like a setting-out point with no
        coordinates. Try one of these instead:
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded bg-amber-brand px-6 py-3 text-sm font-bold text-navy-950 hover:bg-amber-bright">
          Home
        </Link>
        <Link href="/services" className="rounded border border-navy-600 px-6 py-3 text-sm font-bold text-navy-800">
          Services
        </Link>
        <Link href="/resources" className="rounded border border-navy-600 px-6 py-3 text-sm font-bold text-navy-800">
          Resources
        </Link>
      </div>
    </section>
  );
}
