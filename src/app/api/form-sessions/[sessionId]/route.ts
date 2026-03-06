import { NextResponse } from "next/server";
import { updateFormSession } from "@/lib/form-sessions";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const { liveResumptionHandle } = await request.json();

    if (typeof liveResumptionHandle !== "string" || !liveResumptionHandle.trim()) {
      return NextResponse.json({ error: "liveResumptionHandle is required." }, { status: 400 });
    }

    const session = await updateFormSession(sessionId, {
      liveResumptionHandle: liveResumptionHandle.trim(),
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Failed to update form session:", error);
    return NextResponse.json({ error: "Failed to update form session." }, { status: 500 });
  }
}
