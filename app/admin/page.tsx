import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getProfile } from "@/lib/supabase/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { BillingButtons } from "@/components/BillingButtons";
import { createScenario, deleteScenario, togglePublish } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
        <Card className="mt-6 p-8">
          <Badge tone="amber" className="mb-3">Demo mode</Badge>
          <p className="text-slate-600">
            Content editing writes to Supabase. Connect Supabase and sign in as an admin to manage
            scenarios, stages, decisions and scoring.
          </p>
        </Card>
      </div>
    );
  }

  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    return <p className="text-slate-600">You need an admin account to view this page.</p>;
  }

  const supabase = createServerSupabase();
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id, slug, title, sector, difficulty, is_published, stages(count)")
    .order("sort_order", { ascending: true });

  const rows = (scenarios ?? []) as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
        <p className="mt-1 text-slate-600">Manage scenarios, stages, decisions and scoring.</p>
      </div>

      {/* Scenarios list */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Stages</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                <td className="px-4 py-3">{r.sector}</td>
                <td className="px-4 py-3">{r.stages?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.is_published ? "green" : "slate"}>
                    {r.is_published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/scenarios/${r.id}`} className="text-brand-700 underline">
                      Edit
                    </Link>
                    <form action={togglePublish}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="is_published" value={(!r.is_published).toString()} />
                      <Button variant="ghost" size="sm" type="submit">
                        {r.is_published ? "Unpublish" : "Publish"}
                      </Button>
                    </form>
                    <form action={deleteScenario}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button variant="ghost" size="sm" type="submit" className="text-red-600">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create scenario */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">New scenario</h2>
        <form action={createScenario} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Slug</Label>
            <Input name="slug" placeholder="e.g. rail-depot" required />
          </div>
          <div>
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          <div>
            <Label>Sector</Label>
            <Input name="sector" placeholder="e.g. Rail" required />
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select name="difficulty" defaultValue="intermediate">
              <option value="foundation">Foundation</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Summary</Label>
            <Input name="summary" required />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea name="description" rows={3} required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create scenario (draft)</Button>
          </div>
        </form>
      </Card>

      {/* Billing */}
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Subscription & billing</h2>
        <p className="mb-4 text-sm text-slate-600">
          Manage your organisation's SiteSafe subscription via Stripe.
        </p>
        <BillingButtons />
      </Card>
    </div>
  );
}
