import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Server Supabase client bound to the request cookies (RSC / route handlers). */
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookies are read-only here; the
          // middleware handles session refresh, so this is safe to ignore.
        }
      },
    },
  });
}

/** Service-role client for trusted server tasks (e.g. Stripe webhook). */
export function createServiceSupabase() {
  return createServerClient(env.supabaseUrl, env.supabaseServiceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
