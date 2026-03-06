import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Question } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export function createFormAgentPrompt(formTitle: string, questions: Question[]) {
  const questionList = questions
    .map((q, i) => {
      let questionText = `${i + 1}. ${q.title}`;
      if (q.type === "multiple_choice" || q.type === "checkbox") {
        questionText += `\n   Options: ${q.options?.join(", ")}`;
      }
      if (q.required) {
        questionText += " (required)";
      }
      return questionText;
    })
    .join("\n");

  return `You are Cauli, a friendly and helpful voice assistant. Your job is to help users fill out the form "${formTitle}" over a phone call.

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
8. If confirmed, say: "Great! Your form has been submitted. Have a wonderful day!"
9. Keep responses concise - this is a phone call, not a chat

VOICE STYLE:
- Warm and professional
- Clear enunciation
- Natural pacing with brief pauses
- Friendly but efficient`;
}

export async function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });
}

export async function generateResponse(prompt: string, userInput: string) {
  const model = await getGeminiModel();

  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 200,
    },
  });

  const result = await chat.sendMessage(userInput);
  return result.response.text();
}
