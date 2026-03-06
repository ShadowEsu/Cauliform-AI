import { NextResponse } from "next/server";
import { createFormSession } from "@/lib/form-sessions";
import { isValidGoogleFormUrl } from "@/lib/form-parser";

export async function POST(request: Request) {
  try {
    const { formUrl } = await request.json();

    if (!formUrl || typeof formUrl !== "string") {
      return NextResponse.json({ error: "Form URL is required." }, { status: 400 });
    }

    if (!isValidGoogleFormUrl(formUrl)) {
      return NextResponse.json({ error: "Invalid Google Form URL." }, { status: 400 });
    }

    const session = await createFormSession(formUrl);

    if (!session.form.capabilities.supportsConversation) {
      return NextResponse.json(
        {
          error: session.form.unsupportedReason || "This form is not supported yet.",
          sessionId: session.id,
          form: summarizeForm(session.form),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      form: summarizeForm(session.form),
    });
  } catch (error) {
    console.error("Failed to create form session:", error);
    return NextResponse.json({ error: "Failed to create form session." }, { status: 500 });
  }
}

function summarizeForm(form: Awaited<ReturnType<typeof createFormSession>>["form"]) {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    questionCount: form.questions.filter((question) =>
      [
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "checkbox",
        "date",
        "time",
        "scale",
        "grid",
        "file_upload",
      ].includes(question.kind)
    ).length,
    capabilities: form.capabilities,
    unsupportedReason: form.unsupportedReason,
  };
}
