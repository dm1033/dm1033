"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/** Browser Supabase client (cookie-based session). */
export function createBrowserSupabase() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
