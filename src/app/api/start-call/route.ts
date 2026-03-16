import { NextResponse } from "next/server";
import twilio from "twilio";
import { parseGoogleForm, isValidGoogleFormUrl } from "@/lib/form-parser";
import { v4 as uuidv4 } from "uuid";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { formUrl, phoneNumber } = await request.json();

    // Validate inputs
    if (!formUrl || !phoneNumber) {
      return NextResponse.json(
        { error: "Form URL and phone number are required" },
        { status: 400 }
      );
    }

    if (!isValidGoogleFormUrl(formUrl)) {
      return NextResponse.json(
        { error: "Invalid Google Form URL" },
        { status: 400 }
      );
    }

    // Parse the form to validate it exists
    const formData = await parseGoogleForm(formUrl);

    // Generate session ID
    const sessionId = uuidv4();

    // Store session data (in production, use Firestore)
    // For now, we'll pass essential data via query params

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

    // Initiate the call
    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `${baseUrl}/api/webhook?sessionId=${sessionId}&formUrl=${encodeURIComponent(formUrl)}`,
      statusCallback: `${baseUrl}/api/webhook/status?sessionId=${sessionId}`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    return NextResponse.json({
      success: true,
      sessionId,
      callSid: call.sid,
      formTitle: formData.title,
      questionCount: formData.questions.length,
    });
  } catch (error) {
    console.error("Error starting call:", error);
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as any)?.code;
    const status = (error as any)?.status;
    return NextResponse.json(
      { error: "Failed to start call", details: message, code, twilioStatus: status },
      { status: 500 }
    );
  }
}
