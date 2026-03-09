import { NextRequest, NextResponse } from "next/server";

import { exchangeCodeForSession } from "@/lib/google-oauth";

function appBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent(oauthError)}`, appBaseUrl(request))
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?authError=Missing%20Google%20OAuth%20callback%20parameters", appBaseUrl(request))
    );
  }

  try {
    await exchangeCodeForSession(code, state);
    return NextResponse.redirect(new URL("/?auth=success", appBaseUrl(request)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sign-in failed.";
    return NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent(message)}`, appBaseUrl(request))
    );
  }
}
