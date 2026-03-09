import { NextResponse } from "next/server";

import { extractFormId, isValidGoogleFormUrl } from "@/lib/form-parser";
import { getCurrentGoogleSession } from "@/lib/google-oauth";

export async function POST(request: Request) {
  const session = await getCurrentGoogleSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { formUrl } = (await request.json().catch(() => ({}))) as {
    formUrl?: string;
  };

  if (!formUrl || !isValidGoogleFormUrl(formUrl)) {
    return NextResponse.json(
      { error: "Enter a valid Google Form URL to test API access." },
      { status: 400 }
    );
  }

  const formId = extractFormId(formUrl);
  if (!formId) {
    return NextResponse.json({ error: "Could not extract form ID." }, { status: 400 });
  }

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: response.status,
        error: "Google Forms API test failed.",
        details: payload,
      },
      { status: response.status }
    );
  }

  const form = payload as {
    formId?: string;
    info?: {
      title?: string;
      description?: string;
    };
    responderUri?: string;
    items?: unknown[];
  };

  return NextResponse.json({
    ok: true,
    email: session.user.email,
    form: {
      id: form.formId,
      title: form.info?.title || "Untitled Form",
      description: form.info?.description || "",
      responderUri: form.responderUri || "",
      itemCount: Array.isArray(form.items) ? form.items.length : 0,
    },
  });
}
