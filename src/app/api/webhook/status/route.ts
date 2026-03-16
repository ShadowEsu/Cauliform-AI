import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "unknown";

    // Twilio status callbacks are also form-encoded; parse best-effort.
    const form = await request.formData().catch(() => null);
    const callSid = form?.get("CallSid")?.toString();
    const callStatus = form?.get("CallStatus")?.toString();

    console.log("Twilio status callback:", { sessionId, callSid, callStatus });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Twilio status callback error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "unknown";
  console.log("Twilio status callback GET:", { sessionId });
  return NextResponse.json({ ok: true });
}

