import { NextResponse } from "next/server";

// Placeholder webhook route for Twilio integration (not active — using browser voice instead)
export async function POST() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This endpoint is not currently active. Please use the browser-based voice interface at /test.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
