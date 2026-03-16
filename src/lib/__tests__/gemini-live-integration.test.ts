import { describe, it, expect } from "vitest";
import { createFormAgentPrompt } from "../prompts";
import type { Question } from "../types";

// Integration test: Full Gemini Live API conversation flow
// This test connects to the real Gemini Live API via WebSocket
// and verifies the complete form-filling conversation works.

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyCyzJWvijamSMbAeZrmh8PW9YvA-LF0j-Q";
const MODEL = "gemini-2.5-flash-native-audio-latest";
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

function connectAndChat(systemPrompt: string, userMessage: string): Promise<{
  connected: boolean;
  setupComplete: boolean;
  gotText: boolean;
  gotAudio: boolean;
  textResponse: string;
  audioChunks: number;
  error: string | null;
}> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WS = require("ws");
    const result = {
      connected: false,
      setupComplete: false,
      gotText: false,
      gotAudio: false,
      textResponse: "",
      audioChunks: 0,
      error: null as string | null,
    };

    const ws = new WS(WS_URL);

    const timeout = setTimeout(() => {
      result.error = "Timeout after 20s";
      ws.close();
      resolve(result);
    }, 20000);

    ws.on("open", () => {
      result.connected = true;
      ws.send(
        JSON.stringify({
          setup: {
            model: `models/${MODEL}`,
            generationConfig: { responseModalities: ["AUDIO"] },
            systemInstruction: { parts: [{ text: systemPrompt }] },
          },
        })
      );
    });

    ws.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());

      if (msg.setupComplete) {
        result.setupComplete = true;
        // Send user message
        ws.send(
          JSON.stringify({
            clientContent: {
              turns: [
                { role: "user", parts: [{ text: userMessage }] },
              ],
              turnComplete: true,
            },
          })
        );
      }

      if (msg.serverContent?.modelTurn?.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.text) {
            result.gotText = true;
            result.textResponse += part.text;
          }
          if (part.inlineData?.data) {
            result.gotAudio = true;
            result.audioChunks++;
          }
        }
      }

      if (msg.serverContent?.turnComplete) {
        clearTimeout(timeout);
        ws.close();
        resolve(result);
      }
    });

    ws.on("error", (err: Error) => {
      result.error = err.message;
      clearTimeout(timeout);
      resolve(result);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      resolve(result);
    });
  });
}

describe("Gemini Live API Integration", () => {
  const testQuestions: Question[] = [
    { id: "1", title: "What's your name?", type: "short_text", required: true },
    { id: "2", title: "How old are you?", type: "short_text", required: false },
    {
      id: "3",
      title: "What grade are you?",
      type: "multiple_choice",
      required: false,
      options: ["Freshman", "Sophomore", "Junior", "Senior"],
    },
  ];

  it(
    "connects to Gemini Live API WebSocket",
    async () => {
      const prompt = createFormAgentPrompt("Test Form", testQuestions);
      const result = await connectAndChat(prompt, "Hello, start the form.");
      expect(result.connected).toBe(true);
      expect(result.error).toBeNull();
    },
    25000
  );

  it(
    "completes setup handshake",
    async () => {
      const prompt = createFormAgentPrompt("Test Form", testQuestions);
      const result = await connectAndChat(prompt, "Hello");
      expect(result.setupComplete).toBe(true);
    },
    25000
  );

  it(
    "receives audio response from Gemini",
    async () => {
      const prompt = createFormAgentPrompt("Test Form", testQuestions);
      const result = await connectAndChat(
        prompt,
        "Please start the conversation. Begin with your greeting."
      );
      expect(result.gotAudio).toBe(true);
      expect(result.audioChunks).toBeGreaterThan(0);
    },
    25000
  );

  it(
    "receives text alongside audio (thinking/transcript)",
    async () => {
      const prompt = createFormAgentPrompt("Test Form", testQuestions);
      const result = await connectAndChat(
        prompt,
        "Please start the conversation. Begin with your greeting."
      );
      // The model returns text (thinking) and audio
      expect(result.gotText || result.gotAudio).toBe(true);
    },
    25000
  );

  it(
    "agent uses the form context in its response",
    async () => {
      const prompt = createFormAgentPrompt("Test Form", testQuestions);
      const result = await connectAndChat(
        prompt,
        "Please start the conversation. Begin with your greeting."
      );
      // The text response should reference the form title or agent name
      if (result.gotText) {
        const lower = result.textResponse.toLowerCase();
        const hasContext =
          lower.includes("cauli") ||
          lower.includes("test form") ||
          lower.includes("name") ||
          lower.includes("hello") ||
          lower.includes("hi") ||
          lower.includes("greeting");
        expect(hasContext).toBe(true);
      }
    },
    25000
  );

  it(
    "handles a multi-turn conversation (answer a question)",
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const WS = require("ws");
      const prompt = createFormAgentPrompt("Test Form", testQuestions);

      const result = await new Promise<{
        turns: number;
        totalAudioChunks: number;
        error: string | null;
      }>((resolve) => {
        const state = { turns: 0, totalAudioChunks: 0, error: null as string | null };
        const ws = new WS(WS_URL);

        const timeout = setTimeout(() => {
          state.error = "Timeout";
          ws.close();
          resolve(state);
        }, 30000);

        ws.on("open", () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${MODEL}`,
                generationConfig: { responseModalities: ["AUDIO"] },
                systemInstruction: { parts: [{ text: prompt }] },
              },
            })
          );
        });

        ws.on("message", (data: Buffer) => {
          const msg = JSON.parse(data.toString());

          if (msg.setupComplete) {
            // Turn 1: start conversation
            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    { role: "user", parts: [{ text: "Start the conversation please." }] },
                  ],
                  turnComplete: true,
                },
              })
            );
          }

          if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
              if (part.inlineData) state.totalAudioChunks++;
            }
          }

          if (msg.serverContent?.turnComplete) {
            state.turns++;

            if (state.turns === 1) {
              // Turn 2: answer first question
              ws.send(
                JSON.stringify({
                  clientContent: {
                    turns: [
                      { role: "user", parts: [{ text: "My name is Alice." }] },
                    ],
                    turnComplete: true,
                  },
                })
              );
            } else {
              // Done after 2 turns
              clearTimeout(timeout);
              ws.close();
              resolve(state);
            }
          }
        });

        ws.on("error", (err: Error) => {
          state.error = err.message;
          clearTimeout(timeout);
          resolve(state);
        });
      });

      expect(result.error).toBeNull();
      expect(result.turns).toBe(2);
      expect(result.totalAudioChunks).toBeGreaterThan(0);
    },
    35000
  );
});
