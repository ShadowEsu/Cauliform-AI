import { describe, it, expect } from "vitest";
import {
  float32ToInt16,
  int16ToFloat32,
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from "../audio-utils";

describe("float32ToInt16", () => {
  it("converts silence (zeros) correctly", () => {
    const input = new Float32Array([0, 0, 0]);
    const result = float32ToInt16(input);
    expect(result).toEqual(new Int16Array([0, 0, 0]));
  });

  it("converts max positive value", () => {
    const input = new Float32Array([1.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(32767);
  });

  it("converts max negative value", () => {
    const input = new Float32Array([-1.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(-32768);
  });

  it("clamps values beyond range", () => {
    const input = new Float32Array([2.0, -2.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(32767);
    expect(result[1]).toBe(-32768);
  });

  it("preserves array length", () => {
    const input = new Float32Array(100);
    const result = float32ToInt16(input);
    expect(result.length).toBe(100);
  });
});

describe("int16ToFloat32", () => {
  it("converts silence correctly", () => {
    const input = new Int16Array([0, 0, 0]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBeCloseTo(0);
  });

  it("converts max positive value", () => {
    const input = new Int16Array([32767]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBeCloseTo(1.0);
  });

  it("converts max negative value", () => {
    const input = new Int16Array([-32768]);
    const result = int16ToFloat32(input);
    expect(result[0]).toBeCloseTo(-1.0);
  });

  it("round-trips with float32ToInt16", () => {
    const original = new Float32Array([0.5, -0.5, 0, 0.25, -0.75]);
    const int16 = float32ToInt16(original);
    const result = int16ToFloat32(int16);
    for (let i = 0; i < original.length; i++) {
      expect(result[i]).toBeCloseTo(original[i], 2);
    }
  });
});

describe("base64 <-> ArrayBuffer", () => {
  it("round-trips correctly", () => {
    const original = new Uint8Array([0, 1, 2, 255, 128, 64]);
    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);
    expect(new Uint8Array(result)).toEqual(original);
  });

  it("handles empty buffer", () => {
    const original = new Uint8Array([]);
    const base64 = arrayBufferToBase64(original.buffer);
    const result = base64ToArrayBuffer(base64);
    expect(new Uint8Array(result).length).toBe(0);
  });

  it("produces valid base64 string", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const base64 = arrayBufferToBase64(data.buffer);
    expect(base64).toBe("SGVsbG8=");
  });
});
