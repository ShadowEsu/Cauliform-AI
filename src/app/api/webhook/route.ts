import twilio from "twilio";

function twimlResponse(xml: string, status = 200) {
  return new Response(xml, {
    status,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeErrorTwiml() {
  const vr = new twilio.twiml.VoiceResponse();
  vr.say(
    { voice: "alice" },
    "Sorry, something went wrong on our side. Please try again in a moment. Goodbye."
  );
  vr.hangup();
  return vr.toString();
}

export async function POST(request: Request) {
  try {
    // Twilio sends application/x-www-form-urlencoded by default for Voice webhooks.
    // Next.js Request supports parsing it via formData().
    await request.formData().catch(() => null);

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "unknown";

    const vr = new twilio.twiml.VoiceResponse();

    vr.say(
      { voice: "alice" },
      "Hi, this is Cauliform. Let's complete your form by voice."
    );

    // Minimal safe flow: confirm connection + end.
    // (Real question loop can be added later; this prevents Twilio 'application error'.)
    vr.say(
      { voice: "alice" },
      `Your session is ${sessionId}. We'll continue shortly. Goodbye.`
    );
    vr.hangup();

    return twimlResponse(vr.toString());
  } catch (err) {
    console.error("Twilio voice webhook error:", err);
    return twimlResponse(safeErrorTwiml(), 200);
  }
}

// Some Twilio configs use GET for Voice webhook. Support it too.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "unknown";
    const vr = new twilio.twiml.VoiceResponse();
    vr.say(
      { voice: "alice" },
      `Hi, this is Cauliform. Session ${sessionId} is ready. Goodbye.`
    );
    vr.hangup();
    return twimlResponse(vr.toString());
  } catch (err) {
    console.error("Twilio voice webhook GET error:", err);
    return twimlResponse(safeErrorTwiml(), 200);
  }
}

