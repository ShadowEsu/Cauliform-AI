import { GoogleGenAI, MediaResolution, Modality } from "@google/genai";
import { writeFile } from "node:fs/promises";

const responseQueue = [];
const audioChunks = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const prompt = args[0] ?? "Say hello and introduce yourself in one sentence.";
  const output = args[1] ?? "gemini-live-output.wav";
  return { prompt, output };
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = (mimeType || "").split(";").map((s) => s.trim());
  const [, format] = fileType.split("/");

  const options = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16,
  };

  if (format && format.startsWith("L")) {
    const bits = Number.parseInt(format.slice(1), 10);
    if (!Number.isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      const rate = Number.parseInt(value, 10);
      if (!Number.isNaN(rate)) {
        options.sampleRate = rate;
      }
    }
  }

  return options;
}

function createWavHeader(dataLength, { numChannels, sampleRate, bitsPerSample }) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function toWavBuffer(chunks, mimeType) {
  const options = parseMimeType(mimeType);
  const audioBuffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk, "base64")));
  const wavHeader = createWavHeader(audioBuffer.length, options);
  return Buffer.concat([wavHeader, audioBuffer]);
}

async function waitMessage() {
  while (true) {
    const message = responseQueue.shift();
    if (message) return message;
    await sleep(50);
  }
}

async function collectTurn() {
  const messages = [];

  while (true) {
    const message = await waitMessage();
    messages.push(message);

    const part = message.serverContent?.modelTurn?.parts?.[0];
    if (part?.text) {
      console.log(`Model: ${part.text}`);
    }
    if (part?.fileData?.fileUri) {
      console.log(`File URI: ${part.fileData.fileUri}`);
    }
    if (part?.inlineData?.data) {
      audioChunks.push(part.inlineData.data);
    }

    if (message.serverContent?.turnComplete) {
      return messages;
    }
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key. Set GEMINI_API_KEY (or GOOGLE_AI_API_KEY).");
  }

  const { prompt, output } = parseArgs();
  console.log(`Prompt: ${prompt}`);

  const ai = new GoogleGenAI({ apiKey });

  const session = await ai.live.connect({
    model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
    callbacks: {
      onopen: () => console.log("Live session opened."),
      onmessage: (message) => responseQueue.push(message),
      onerror: (event) => console.error("Live session error:", event.message),
      onclose: (event) => console.log("Live session closed:", event.reason),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Zephyr" },
        },
      },
      tools: [{ googleSearch: {} }],
    },
  });

  session.sendClientContent({
    turns: [prompt],
  });

  const turn = await collectTurn();

  const firstInlineMime = turn
    .map((m) => m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.mimeType)
    .find(Boolean);

  if (audioChunks.length && firstInlineMime) {
    const wav = toWavBuffer(audioChunks, firstInlineMime);
    await writeFile(output, wav);
    console.log(`Saved audio response to ${output}`);
  } else {
    console.log("No inline audio was returned for this turn.");
  }

  session.close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
