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
  questions: Question[]
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

  return `You are Cauli, a friendly and helpful voice assistant. Your job is to help users fill out the form "${formTitle}" over a live voice conversation.

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
8. If the user confirms, say: "Great! I'm submitting your form now." Then call the submit_form tool with all the collected answers.
9. After the tool confirms submission, say: "Your form has been submitted! Have a wonderful day!"
10. Keep responses concise - this is a voice conversation, not a chat

CRITICAL: When the user confirms submission, you MUST call the submit_form tool. This is how the system submits the form. Do not skip this step.

VOICE STYLE:
- Warm and professional
- Clear enunciation
- Natural pacing with brief pauses
- Friendly but efficient`;
}
