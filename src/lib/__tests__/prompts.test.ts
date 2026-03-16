import { describe, it, expect } from "vitest";
import { createFormAgentPrompt } from "../prompts";
import type { Question } from "../types";

describe("createFormAgentPrompt", () => {
  const questions: Question[] = [
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

  it("includes the form title", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("Test Form");
  });

  it("includes all question titles", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("What's your name?");
    expect(prompt).toContain("How old are you?");
    expect(prompt).toContain("What grade are you?");
  });

  it("marks required questions", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("1. What's your name? (required)");
  });

  it("includes multiple choice options", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("Freshman, Sophomore, Junior, Senior");
  });

  it("includes voice assistant identity", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("Cauli");
  });

  it("includes conversation flow instructions", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).toContain("Ask ONE question at a time");
    expect(prompt).toContain("Should I submit this form?");
  });
});
