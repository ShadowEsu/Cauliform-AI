import { NextResponse } from "next/server";

import { clearGoogleSession } from "@/lib/google-oauth";

export async function POST() {
  await clearGoogleSession();
  return NextResponse.json({ ok: true });
}
