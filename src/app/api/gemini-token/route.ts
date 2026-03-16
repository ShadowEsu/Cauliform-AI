import { NextResponse } from "next/server";

/**
 * Returns the Gemini API key at runtime so it's NOT baked into
 * the client-side JS bundle (which is what NEXT_PUBLIC_ does).
 */
export async function GET() {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  return NextResponse.json({ key });
}
