import { NextRequest, NextResponse } from "next/server";
import { getProfileByPhone, upsertProfile, saveCallSession, getCallHistory } from "@/lib/profile-store";

/**
 * GET /api/user-profile?phone=+1234567890
 * Look up a user's saved profile and call history by phone number.
 */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
  }

  try {
    const profile = await getProfileByPhone(phone);
    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Profile lookup error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/user-profile
 * Save/update profile + save call session after form submission.
 * Body: { phoneNumber, answers, formUrl?, formTitle?, status? }
 */
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, answers, formUrl, formTitle, status } = await req.json();
    if (!phoneNumber || !answers) {
      return NextResponse.json(
        { error: "phoneNumber and answers required" },
        { status: 400 }
      );
    }

    // Update user profile with common responses
    const profile = await upsertProfile(phoneNumber, answers);

    // Save call session for history
    let sessionId: string | undefined;
    if (formUrl) {
      sessionId = await saveCallSession({
        phoneNumber,
        formUrl,
        formTitle: formTitle || "Unknown Form",
        answers,
        status: status || "submitted",
      });
    }

    return NextResponse.json({ profile, sessionId });
  } catch (err: any) {
    console.error("Profile save error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
