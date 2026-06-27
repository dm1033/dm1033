import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the current user's profile, or null (also null in demo mode). */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, organisation_id")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}
