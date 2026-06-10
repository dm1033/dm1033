"use client";

import { useEffect, useState } from "react";

const STATUSES = [
  "New enquiry",
  "Paid",
  "Documents received",
  "In review",
  "Drafting",
  "Delivered",
  "Revision requested",
  "Complete",
] as const;

type Status = (typeof STATUSES)[number];

type Order = {
  id: string;
  client: string;
  email: string;
  service: string;
  deadline: string;
  status: Status;
  notes: string;
};

const STORAGE_KEY = "cce-admin-orders";

const sampleOrders: Order[] = [
  {
    id: "1",
    client: "Example Client",
    email: "client@example.com",
    service: "Full CV Rewrite",
    deadline: "2026-06-20",
    status: "Documents received",
    notes: "Targeting senior site engineer roles, rail sector.",
  },
];

const statusColor: Record<Status, string> = {
  "New enquiry": "bg-steel-100 text-steel-700",
  Paid: "bg-blue-100 text-blue-800",
  "Documents received": "bg-indigo-100 text-indigo-800",
  "In review": "bg-amber-100 text-amber-800",
  Drafting: "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  "Revision requested": "bg-red-100 text-red-800",
  Complete: "bg-emerald-100 text-emerald-800",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setOrders(raw ? (JSON.parse(raw) as Order[]) : sampleOrders);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders, loaded]);

  const update = (id: string, patch: Partial<Order>) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const addOrder = () =>
    setOrders((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        client: "",
        email: "",
        service: "",
        deadline: "",
        status: "New enquiry",
        notes: "",
      },
    ]);

  const remove = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  if (!loaded) return <p className="text-sm text-steel-500">Loading…</p>;

  const cellInput =
    "w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm focus:border-amber-brand focus:bg-white focus:outline-none";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[s]}`}>
            {s}: {orders.filter((o) => o.status === s).length}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-steel-200 bg-white">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-steel-200 bg-steel-50 text-xs font-bold uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Service</th>
              <th className="px-3 py-3">Deadline</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-1 py-1">
                  <input className={cellInput} value={o.client} placeholder="Client name" onChange={(e) => update(o.id, { client: e.target.value })} />
                </td>
                <td className="px-1 py-1">
                  <input className={cellInput} value={o.email} placeholder="email" onChange={(e) => update(o.id, { email: e.target.value })} />
                </td>
                <td className="px-1 py-1">
                  <input className={cellInput} value={o.service} placeholder="Service" onChange={(e) => update(o.id, { service: e.target.value })} />
                </td>
                <td className="px-1 py-1">
                  <input type="date" className={cellInput} value={o.deadline} onChange={(e) => update(o.id, { deadline: e.target.value })} />
                </td>
                <td className="px-1 py-1">
                  <select
                    className={`rounded px-2 py-1.5 text-xs font-semibold ${statusColor[o.status]}`}
                    value={o.status}
                    onChange={(e) => update(o.id, { status: e.target.value as Status })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1">
                  <input className={cellInput} value={o.notes} placeholder="Notes" onChange={(e) => update(o.id, { notes: e.target.value })} />
                </td>
                <td className="px-1 py-1 text-right">
                  <button
                    type="button"
                    onClick={() => remove(o.id)}
                    className="rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    aria-label={`Delete order for ${o.client || "unnamed client"}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addOrder}
        className="mt-4 rounded bg-navy-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-700"
      >
        + Add Order
      </button>
    </div>
  );
}
