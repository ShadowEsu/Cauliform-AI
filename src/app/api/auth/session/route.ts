import { NextResponse } from "next/server";

import { getPublicGoogleSession } from "@/lib/google-oauth";

export async function GET() {
  const session = await getPublicGoogleSession();

  return NextResponse.json({
    authenticated: !!session,
    session,
  });
}
