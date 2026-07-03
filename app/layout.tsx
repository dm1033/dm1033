import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "SiteSafe — Construction Safety Training Game",
  description:
    "Interactive UK construction safety training. Set up sites safely across realistic scenarios, aligned to CDM 2015 and SMSTS learning outcomes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          SiteSafe · For training purposes only — not a substitute for professional safety advice.
        </footer>
      </body>
    </html>
  );
}
