import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserDataFromDb, saveSessionToDb } from "@/lib/user-data-store";
import { computeStats } from "@/lib/cauli-data";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      history: [],
      stats: computeStats([]),
      savedFields: [],
      source: "none",
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchUserDataFromDb(user.id);
  if (!data) {
    return NextResponse.json({
      history: [],
      stats: computeStats([]),
      savedFields: [],
      source: "supabase-empty",
    });
  }

  return NextResponse.json({ ...data, source: "supabase" });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, source: "none" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { formUrl, formTitle, answers, status, durationSeconds, questionCount, note, commonResponses } = body;

  if (!formUrl || !formTitle || !answers || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sessionId = await saveSessionToDb(
    user.id,
    {
      formUrl,
      formTitle,
      answers,
      status,
      durationSeconds,
      questionCount,
      note,
    },
    commonResponses
  );

  return NextResponse.json({ ok: true, sessionId, source: "supabase" });
}
