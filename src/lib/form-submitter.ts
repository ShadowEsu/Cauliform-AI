/**
 * Submit Google Forms using TinyFish AI browser agent.
 * TinyFish handles anti-bot bypass and works in serverless environments
 * (unlike Playwright which needs a browser binary).
 */

const TINYFISH_BASE_URL = "https://agent.tinyfish.ai/v1";

interface SubmissionResponse {
  questionTitle: string;
  answer: string;
}

interface SSEEvent {
  type: string;
  status?: string;
  message?: string;
  purpose?: string;
  resultJson?: Record<string, unknown>;
  error?: string;
  runId?: string;
  streamingUrl?: string;
}

export async function submitGoogleForm(
  formUrl: string,
  responses: SubmissionResponse[]
): Promise<{ success: boolean; data?: unknown; error?: string; steps?: number }> {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    return { success: false, error: "TINYFISH_API_KEY not set" };
  }

  // Build natural language goal for the agent
  const fieldInstructions = responses
    .map((r) => `- For the question "${r.questionTitle}", enter: "${r.answer}"`)
    .join("\n");

  // Strip dialog/auth params that trigger sign-in modals
  const cleanUrl = formUrl
    .replace(/[?&]usp=dialog/g, "")
    .replace(/[?&]usp=sf_link/g, "")
    .replace(/\?$/, "");

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3 * 60 * 1000); // 3 min

  try {
    const response = await fetch(`${TINYFISH_BASE_URL}/automation/run-sse`, {
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `TinyFish API error (${response.status}): ${text}` };
    }

    if (!response.body) {
      return { success: false, error: "No response body from TinyFish" };
    }

    return await processSSEStream(response.body);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, error: "TinyFish request timed out (3 min)" };
    }
    return { success: false, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function processSSEStream(
  body: ReadableStream<Uint8Array>
): Promise<{ success: boolean; data?: unknown; error?: string; steps: number }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let steps = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line === "" || line.startsWith(":")) continue;

      if (line.startsWith("data: ")) {
        let event: SSEEvent;
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        steps++;

        if (event.purpose || event.message) {
          console.log(`  [tinyfish step ${steps}] ${event.purpose ?? event.message}`);
        }

        if (event.type === "COMPLETE" || event.status === "COMPLETED") {
          let extractedData: unknown = null;
          if (event.resultJson) {
            const rj = event.resultJson;
            if ("parsed" in rj && rj.parsed != null) {
              extractedData = rj.parsed;
            } else if ("input" in rj && rj.input != null) {
              if (typeof rj.input === "string") {
                try {
                  extractedData = JSON.parse(rj.input);
                } catch {
                  extractedData = rj.input;
                }
              } else {
                extractedData = rj.input;
              }
            } else {
              extractedData = rj;
            }
          }
          return { success: true, data: extractedData, steps };
        }

        if (event.type === "ERROR" || event.error) {
          return {
            success: false,
            error: event.error ?? event.message ?? "Unknown TinyFish error",
            steps,
          };
        }
      }
    }
  }

  return { success: false, error: "Stream ended without completion", steps };
}
