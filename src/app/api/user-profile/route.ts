import { NextRequest, NextResponse } from "next/server";
import { getProfileByPhone, upsertProfile } from "@/lib/profile-store";

/**
 * GET /api/user-profile?phone=+1234567890
 * Look up a user's saved profile by phone number.
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/user-profile
 * Save/update profile after form submission.
 * Body: { phoneNumber: string, answers: [{ questionTitle, answer }] }
 */
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, answers } = await req.json();
    if (!phoneNumber || !answers) {
      return NextResponse.json(
        { error: "phoneNumber and answers required" },
        { status: 400 }
      );
    }

    const profile = await upsertProfile(phoneNumber, answers);
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
