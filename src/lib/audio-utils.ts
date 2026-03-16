/**
 * Audio utilities for PCM encoding/decoding between browser and Gemini Live API.
 *
 * Gemini Live API:
 *   Input:  16kHz, 16-bit PCM, little-endian, mono
 *   Output: 24kHz, 16-bit PCM, little-endian, mono
 */

/** Convert Float32Array (range -1..1) to Int16Array (range -32768..32767) */
export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/** Convert Int16Array back to Float32Array */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/** Convert base64 string to ArrayBuffer */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Convert ArrayBuffer to base64 string */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Create an AudioBuffer from Int16 PCM data */
export function pcmToAudioBuffer(
  ctx: AudioContext,
  pcmData: Int16Array,
  sampleRate: number
): AudioBuffer {
  const float32 = int16ToFloat32(pcmData);
  const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}
