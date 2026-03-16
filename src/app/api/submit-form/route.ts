import { NextResponse } from "next/server";

const TINYFISH_BASE_URL = "https://agent.tinyfish.ai/v1";

export async function POST(request: Request) {
  try {
    const { formUrl, responses } = await request.json();

    if (!formUrl || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "formUrl and responses[] are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TINYFISH_API_KEY not set" },
        { status: 500 }
      );
    }

    const cleanUrl = formUrl
      .replace(/[?&]usp=dialog/g, "")
      .replace(/[?&]usp=sf_link/g, "")
      .replace(/\?$/, "");

    const fieldInstructions = responses
      .map((r: { questionTitle: string; answer: string }) =>
        `- For the question "${r.questionTitle}", enter: "${r.answer}"`
      )
      .join("\n");

    const goal = `Fill out this Google Form and submit it.

Here are the answers to enter:
${fieldInstructions}

Steps:
1. If there is a sign-in dialog or modal, dismiss it or ignore it
2. Find each question field and enter the answer
3. For multiple choice questions, click the matching radio button
4. Click the Submit button
5. Wait for the confirmation page

Return a JSON object with { "submitted": true } if the form was submitted successfully, or { "submitted": false, "reason": "..." } if it failed.`;

    console.log("[submit-form] Starting AI browser agent...");
    console.log("[submit-form] URL:", cleanUrl);
    console.log("[submit-form] Responses:", JSON.stringify(responses));

    // Call TinyFish and stream SSE events back to the client
    const tfResponse = await fetch(`${TINYFISH_BASE_URL}/automation/run-sse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        url: cleanUrl,
        goal,
        browser_profile: "stealth",
      }),
    });

    if (!tfResponse.ok) {
      const text = await tfResponse.text();
      return NextResponse.json(
        { error: `AI agent error (${tfResponse.status}): ${text}` },
        { status: 500 }
      );
    }

    if (!tfResponse.body) {
      return NextResponse.json(
        { error: "No response from AI agent" },
        { status: 500 }
      );
    }

    // Stream SSE events through to the client so they get streamingUrl immediately
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = tfResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line === "" || line.startsWith(":")) continue;
              if (line.startsWith("data: ")) {
                // Forward the SSE event to the client
                controller.enqueue(encoder.encode(line + "\n\n"));
              }
            }
          }
        } catch (err) {
          console.error("[submit-form] Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form", details: error?.message },
      { status: 500 }
    );
  }
}
