import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId") || "";

  const formData = await request.formData();
  const callStatus = formData.get("CallStatus") as string;
  const callSid = formData.get("CallSid") as string;
  const callDuration = formData.get("CallDuration") as string;

  console.log(`[Status] Session: ${sessionId}, SID: ${callSid}, Status: ${callStatus}, Duration: ${callDuration}s`);

  // In production, update Firestore session record here
  // e.g., mark session as completed/failed based on callStatus

  return NextResponse.json({ received: true });
}
