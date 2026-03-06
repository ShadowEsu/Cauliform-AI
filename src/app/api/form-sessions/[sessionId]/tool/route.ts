import { NextResponse } from "next/server";
import { handleToolRequest } from "@/lib/form-tools";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const payload = await request.json();

    const result = await handleToolRequest(sessionId, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tool request failed:", error);
    return NextResponse.json(
      {
        ok: false,
        phase: "intake",
        error: error instanceof Error ? error.message : "Tool request failed.",
      },
      { status: 500 }
    );
  }
}
