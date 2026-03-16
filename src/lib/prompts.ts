import type { Question } from "./types";

/**
 * Tool declarations for the Gemini Live API session.
 * The agent calls submit_form when the user confirms their answers.
 */
export function getFormTools() {
  return [
    {
      functionDeclarations: [
        {
          name: "submit_form",
          description:
            "Submit the completed form with all collected answers. Call this after the user confirms their responses.",
          parameters: {
            type: "OBJECT",
            properties: {
              answers: {
                type: "ARRAY",
                description: "Array of question-answer pairs",
                items: {
                  type: "OBJECT",
                  properties: {
                    questionTitle: {
                      type: "STRING",
                      description: "The exact title of the question from the form",
                    },
                    answer: {
                      type: "STRING",
                      description: "The user's answer to the question",
                    },
                  },
                  required: ["questionTitle", "answer"],
                },
              },
            },
            required: ["answers"],
          },
        },
      ],
    },
  ];
}

/**
 * Build the system prompt for the Gemini Live voice agent.
 * Pure function — no SDK dependency, safe for browser import.
 */
export function createFormAgentPrompt(
  formTitle: string,
  questions: Question[],
  knownResponses?: Record<string, string>
): string {
  const questionList = questions
    .map((q, i) => {
      let text = `${i + 1}. ${q.title}`;
      if (
        (q.type === "multiple_choice" ||
          q.type === "checkbox" ||
          q.type === "dropdown") &&
        q.options?.length
      ) {
        text += `\n   Options: ${q.options.join(", ")}`;
      }
      if (q.required) {
        text += " (required)";
      }
      return text;
    })
    .join("\n");

  const profileSection = knownResponses && Object.keys(knownResponses).length > 0
    ? `\nUSER PROFILE (remembered from previous forms):\n${Object.entries(knownResponses).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nWhen a question matches a known field, say something like "I have your ${Object.keys(knownResponses)[0]} as ${Object.values(knownResponses)[0]} — is that still correct?" If they confirm, use the saved value. If they give a new answer, use that instead.\n`
    : "";

  return `You are Cauli, a friendly and helpful voice assistant. Your job is to help users fill out the form "${formTitle}" over a live voice conversation.
${profileSection}
FORM QUESTIONS:
${questionList}

INSTRUCTIONS:
1. Start with a warm greeting: "Hi! I'm Cauli, and I'll help you fill out ${formTitle}. Let's get started!"
2. Ask ONE question at a time, clearly and conversationally
3. For multiple choice questions, read ALL options clearly
4. After each answer, briefly confirm what you heard before moving on
5. If the user's response is unclear, politely ask them to repeat or clarify
6. Handle interruptions gracefully - if the user speaks while you're talking, stop and listen
7. After all questions, summarize ALL responses and ask: "Should I submit this form?"
8. If the user confirms, IMMEDIATELY call the submit_form tool with all collected answers. Do NOT just say you will call it — actually invoke the function right away.
9. After calling submit_form and getting the response, say: "Your form has been submitted! Have a wonderful day!"
10. Keep responses concise - this is a voice conversation, not a chat

CRITICAL RULES FOR TOOL CALLING:
- When the user says "yes", "submit", "go ahead", or confirms in any way, you MUST call submit_form immediately in the same turn.
- Do NOT output thinking text about calling the tool. Just call it.
- The submit_form function is the ONLY way to submit the form. If you don't call it, the form won't be submitted.
- Include ALL question-answer pairs with the EXACT question titles from the form.

VOICE STYLE:
- Warm and professional
- Clear enunciation
- Natural pacing with brief pauses
- Friendly but efficient`;
}
