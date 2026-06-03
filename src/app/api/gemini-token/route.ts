import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Returns the Gemini API key at runtime (not baked into the client bundle).
 * Requires a signed-in user when Supabase auth is configured.
 */
export async function GET() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  return NextResponse.json({ key });
}
