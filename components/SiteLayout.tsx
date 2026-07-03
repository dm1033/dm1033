import * as React from "react";
import { cn } from "@/lib/utils";

// Catalogue of site-plan elements that decisions can add.
const ELEMENTS: Record<string, { label: string; icon: string; group: "boundary" | "feature" }> = {
  hoarding: { label: "Solid hoarding", icon: "🧱", group: "boundary" },
  heras_fencing: { label: "Heras fencing", icon: "🚧", group: "boundary" },
  security_gate: { label: "Security gate", icon: "🚪", group: "boundary" },
  cctv: { label: "CCTV", icon: "📹", group: "boundary" },
  welfare_unit: { label: "Welfare units", icon: "🚻", group: "feature" },
  site_office: { label: "Site office", icon: "🏢", group: "feature" },
  material_storage: { label: "Material storage", icon: "📦", group: "feature" },
  lay_down_area: { label: "Laydown area", icon: "🟫", group: "feature" },
  vehicle_route: { label: "Vehicle route", icon: "🚚", group: "feature" },
  pedestrian_route: { label: "Pedestrian route", icon: "🚶", group: "feature" },
  one_way_system: { label: "One-way system", icon: "🔄", group: "feature" },
  banksman: { label: "Banksman", icon: "🦺", group: "feature" },
  wheel_wash: { label: "Wheel wash", icon: "💧", group: "feature" },
  excavation_support: { label: "Excavation support", icon: "⛏️", group: "feature" },
  trench_box: { label: "Trench box", icon: "🟦", group: "feature" },
  dewatering: { label: "Dewatering", icon: "🌊", group: "feature" },
  scaffold: { label: "Scaffold", icon: "🏗️", group: "feature" },
  mewp: { label: "MEWP", icon: "🛗", group: "feature" },
  edge_protection: { label: "Edge protection", icon: "🟨", group: "feature" },
  tower_crane: { label: "Tower crane", icon: "🗼", group: "feature" },
  mobile_crane: { label: "Mobile crane", icon: "🏗️", group: "feature" },
  exclusion_zone: { label: "Exclusion zone", icon: "⛔", group: "feature" },
  fire_point: { label: "Fire point", icon: "🧯", group: "feature" },
  first_aid: { label: "First aid", icon: "➕", group: "feature" },
  signage: { label: "Safety signage", icon: "⚠️", group: "feature" },
};

export function SiteLayout({ layout, className }: { layout: string[]; className?: string }) {
  const present = layout.filter((k) => ELEMENTS[k]);
  const hasBoundary = present.some((k) => k === "hoarding" || k === "heras_fencing");
  const boundaryStrong = present.includes("hoarding");

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-slate-50 p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Site layout</h3>
        <span className="text-xs text-slate-500">{present.length} elements placed</span>
      </div>

      {/* Schematic plan */}
      <div
        className={cn(
          "relative h-44 w-full overflow-hidden rounded-lg bg-emerald-50/60",
          hasBoundary
            ? boundaryStrong
              ? "border-4 border-slate-700"
              : "border-4 border-dashed border-amber-500"
            : "border-2 border-dotted border-red-400",
        )}
      >
        {/* Road strip */}
        <div className="absolute inset-x-0 bottom-0 h-6 bg-slate-300">
          <div className="mx-auto mt-[10px] h-[2px] w-3/4 border-t-2 border-dashed border-white" />
        </div>
        {/* Elements grid */}
        <div className="absolute inset-0 grid grid-cols-4 content-start gap-1 p-2 pb-8">
          {present.length === 0 ? (
            <p className="col-span-4 mt-8 text-center text-xs text-red-500">
              No site set-up yet — the boundary is open.
            </p>
          ) : (
            present.map((k) => (
              <div
                key={k}
                title={ELEMENTS[k].label}
                className="flex flex-col items-center justify-center rounded bg-white/80 p-1 text-center shadow-sm"
              >
                <span className="text-lg leading-none">{ELEMENTS[k].icon}</span>
                <span className="mt-0.5 line-clamp-1 text-[9px] leading-tight text-slate-600">
                  {ELEMENTS[k].label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {!hasBoundary && (
        <p className="mt-2 text-xs text-red-600">⚠ Site boundary not secured.</p>
      )}
    </div>
  );
}
