import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "";

    // Twilio status callbacks are also form-encoded; parse best-effort.
    const formData = await request.formData().catch(() => null);
    const callStatus = formData?.get("CallStatus")?.toString() || "";
    const callSid = formData?.get("CallSid")?.toString() || "";
    const callDuration = formData?.get("CallDuration")?.toString() || "";

    console.log(
      `[Status] Session: ${sessionId}, SID: ${callSid}, Status: ${callStatus}, Duration: ${callDuration}s`
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Twilio status callback error:", err);
    return NextResponse.json({ received: false }, { status: 200 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  console.log(`[Status GET] Session: ${sessionId}`);
  return NextResponse.json({ received: true });
}
