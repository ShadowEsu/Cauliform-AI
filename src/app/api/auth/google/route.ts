import { NextResponse } from "next/server";

import { buildGoogleAuthorizationUrl } from "@/lib/google-oauth";

export async function GET() {
  try {
    const url = await buildGoogleAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Google sign-in.";

    return NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }
}
