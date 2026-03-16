import { GoogleGenerativeAI } from "@google/generative-ai";

// Re-export the prompt builder for backward compatibility
export { createFormAgentPrompt } from "./prompts";

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY env var");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateResponse(systemPrompt: string, userInput: string) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userInput);
  return result.response.text();
}
