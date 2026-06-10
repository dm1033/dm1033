import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard (Local Demo)",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-navy-900">Order Tracker</h1>
      <p className="mt-2 max-w-2xl text-sm text-steel-600">
        <strong>Local demo dashboard.</strong> This static site has no backend,
        so data here is stored only in this browser (localStorage) — use it as
        a personal order tracker on your own machine. When you move to
        Supabase/Firebase, this page becomes the real dashboard (see
        docs/SETUP-GUIDE.md). Do not link to this page publicly.
      </p>
      <div className="mt-8">
        <AdminDashboard />
      </div>
    </section>
  );
}
