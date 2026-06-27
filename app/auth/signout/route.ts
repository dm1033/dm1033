import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
