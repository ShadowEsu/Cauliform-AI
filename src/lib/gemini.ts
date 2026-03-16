import { GoogleGenAI } from "@google/genai";
import type { Question } from "./types";

// Re-export the prompt builder for backward compatibility
export { createFormAgentPrompt } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function generateResponse(systemPrompt: string, userInput: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: userInput,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 300,
    },
  });

  return response.text || "";
}
