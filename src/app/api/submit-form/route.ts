import { NextResponse } from "next/server";
import { submitGoogleForm } from "@/lib/form-submitter";

export async function POST(request: Request) {
  try {
    const { formUrl, responses } = await request.json();

    // responses: Array<{ questionTitle: string, answer: string }>
    if (!formUrl || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "formUrl and responses[] are required" },
        { status: 400 }
      );
    }

    const result = await submitGoogleForm(formUrl, responses);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        steps: result.steps,
      });
    } else {
      return NextResponse.json(
        { error: "Form submission failed", details: result.error, steps: result.steps },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form", details: error?.message },
      { status: 500 }
    );
  }
}
