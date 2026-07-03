import Link from "next/link";
import { HardHat } from "lucide-react";
import { getProfile } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge, Button } from "@/components/ui";

export async function Nav() {
  const configured = isSupabaseConfigured();
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
          <HardHat className="h-6 w-6" />
          <span>SiteSafe</span>
          {!configured && <Badge tone="amber" className="ml-1">Demo</Badge>}
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/scenarios" className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100">
            Scenarios
          </Link>
          {profile && (
            <Link href="/dashboard" className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100">
              Dashboard
            </Link>
          )}
          {profile && (profile.role === "trainer" || profile.role === "admin") && (
            <Link href="/trainer" className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100">
              Trainer
            </Link>
          )}
          {profile && profile.role === "admin" && (
            <Link href="/admin" className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100">
              Admin
            </Link>
          )}

          {profile ? (
            <div className="ml-2 flex items-center gap-2">
              <Badge tone="slate">{profile.role}</Badge>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          ) : configured ? (
            <div className="ml-2 flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          ) : (
            <Link href="/scenarios" className="ml-2">
              <Button size="sm">Try the demo</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
