import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFormAgentPrompt } from "../prompts";
import type { Question } from "../types";

/**
 * Tests for the Smart Profile Memory feature.
 *
 * The core idea: if a user previously filled out a form and provided their name,
 * email, etc., the next time they fill out ANY form that asks for the same info,
 * the AI agent should already know those answers and just confirm them.
 *
 * Flow:
 * 1. User fills Form A → answers include name "Chinat Yu" and email "chinat@example.com"
 * 2. extractCommonResponses() detects these fields and saves them to Firestore
 * 3. User fills Form B (different form) → profile is fetched by phone number
 * 4. Known responses are injected into the system prompt
 * 5. AI says "I have your name as Chinat Yu — is that still correct?"
 */

// --- Test: Field extraction from form answers ---

// Re-implement extractCommonResponses logic here for unit testing
// (the actual function is private in profile-store.ts)
const FIELD_PATTERNS: Record<string, RegExp> = {
  email: /\b(email|e-mail)\b/i,
  fullName: /\b(full\s*name|your\s*name|name)\b/i,
  company: /\b(company|organization|employer|workplace)\b/i,
  jobTitle: /\b(job\s*title|role|position|title)\b/i,
  phone: /\b(phone|mobile|cell|telephone)\b/i,
};

function extractCommonResponses(
  answers: { questionTitle: string; answer: string }[]
): Record<string, string> {
  const extracted: Record<string, string> = {};
  for (const { questionTitle, answer } of answers) {
    if (!answer || answer.trim() === "") continue;
    for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(questionTitle)) {
        extracted[field] = answer.trim();
        break;
      }
    }
  }
  return extracted;
}

describe("Profile Memory — Field Extraction", () => {
  it("extracts name from 'What's your name?' question", () => {
    const answers = [
      { questionTitle: "What's your name?", answer: "Chinat Yu" },
      { questionTitle: "How old are you?", answer: "25" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.fullName).toBe("Chinat Yu");
    expect(result).not.toHaveProperty("email");
  });

  it("extracts email from 'Email address' question", () => {
    const answers = [
      { questionTitle: "Email address", answer: "chinat@example.com" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.email).toBe("chinat@example.com");
  });

  it("extracts company from 'What company do you work for?' question", () => {
    const answers = [
      { questionTitle: "What company do you work for?", answer: "Edumame" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.company).toBe("Edumame");
  });

  it("extracts job title from 'What is your role?' question", () => {
    const answers = [
      { questionTitle: "What is your role?", answer: "Software Engineer" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.jobTitle).toBe("Software Engineer");
  });

  it("extracts multiple fields from a single form submission", () => {
    const answers = [
      { questionTitle: "Full Name", answer: "Chinat Yu" },
      { questionTitle: "Your Email", answer: "chinat@example.com" },
      { questionTitle: "Company/Organization", answer: "Edumame" },
      { questionTitle: "Job Title", answer: "Co-Founder" },
      { questionTitle: "What is your favorite color?", answer: "Blue" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.fullName).toBe("Chinat Yu");
    expect(result.email).toBe("chinat@example.com");
    expect(result.company).toBe("Edumame");
    expect(result.jobTitle).toBe("Co-Founder");
    // "favorite color" should NOT be extracted — it's not a common field
    expect(Object.keys(result)).toHaveLength(4);
  });

  it("skips empty answers", () => {
    const answers = [
      { questionTitle: "What's your name?", answer: "" },
      { questionTitle: "Email", answer: "   " },
    ];
    const result = extractCommonResponses(answers);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("handles case-insensitive matching", () => {
    const answers = [
      { questionTitle: "YOUR EMAIL ADDRESS", answer: "test@test.com" },
      { questionTitle: "your name", answer: "Test User" },
    ];
    const result = extractCommonResponses(answers);
    expect(result.email).toBe("test@test.com");
    expect(result.fullName).toBe("Test User");
  });
});

describe("Profile Memory — System Prompt Injection", () => {
  const questions: Question[] = [
    { id: "1", title: "What's your name?", type: "short_text", required: true },
    { id: "2", title: "Email address", type: "short_text", required: true },
    { id: "3", title: "What company do you work for?", type: "short_text", required: false },
    { id: "4", title: "Rate your experience", type: "multiple_choice", required: false, options: ["1", "2", "3", "4", "5"] },
  ];

  it("includes known responses in the prompt when profile exists", () => {
    const knownResponses = {
      fullName: "Chinat Yu",
      email: "chinat@example.com",
      company: "Edumame",
    };
    const prompt = createFormAgentPrompt("Feedback Survey", questions, knownResponses);

    expect(prompt).toContain("USER PROFILE");
    expect(prompt).toContain("fullName: Chinat Yu");
    expect(prompt).toContain("email: chinat@example.com");
    expect(prompt).toContain("company: Edumame");
  });

  it("instructs the AI to confirm known values instead of re-asking", () => {
    const knownResponses = {
      fullName: "Chinat Yu",
    };
    const prompt = createFormAgentPrompt("Test Form", questions, knownResponses);

    expect(prompt).toContain("is that still correct?");
  });

  it("does NOT include profile section when no known responses", () => {
    const prompt = createFormAgentPrompt("Test Form", questions, {});
    expect(prompt).not.toContain("USER PROFILE");
  });

  it("does NOT include profile section when knownResponses is undefined", () => {
    const prompt = createFormAgentPrompt("Test Form", questions);
    expect(prompt).not.toContain("USER PROFILE");
  });

  it("still includes all form questions even with known responses", () => {
    const knownResponses = { fullName: "Chinat Yu" };
    const prompt = createFormAgentPrompt("Test Form", questions, knownResponses);

    // All questions should still be listed
    expect(prompt).toContain("What's your name?");
    expect(prompt).toContain("Email address");
    expect(prompt).toContain("What company do you work for?");
    expect(prompt).toContain("Rate your experience");
  });
});

describe("Profile Memory — Cross-Form Intelligence", () => {
  /**
   * Scenario: User fills out Form A (event registration), then later fills
   * out Form B (feedback survey). Both ask for name and email.
   *
   * Expected: After Form A, the profile stores name + email.
   * When Form B starts, the AI should already know these fields.
   */

  it("simulates cross-form memory: Form A answers feed into Form B prompt", () => {
    // Step 1: User fills Form A (event registration)
    const formAAnswers = [
      { questionTitle: "Your Name", answer: "Chinat Yu" },
      { questionTitle: "Email", answer: "chinat@example.com" },
      { questionTitle: "Which event are you attending?", answer: "AI Hackathon" },
    ];

    // Step 2: Extract common responses (what would be saved to Firestore)
    const savedProfile = extractCommonResponses(formAAnswers);
    expect(savedProfile.fullName).toBe("Chinat Yu");
    expect(savedProfile.email).toBe("chinat@example.com");
    // "Which event" is NOT a common field, so it's not saved
    expect(savedProfile).not.toHaveProperty("event");

    // Step 3: User starts Form B (feedback survey) — different form entirely
    const formBQuestions: Question[] = [
      { id: "1", title: "Name", type: "short_text", required: true },
      { id: "2", title: "Email", type: "short_text", required: true },
      { id: "3", title: "How was the event?", type: "long_text", required: true },
    ];

    // Step 4: Generate prompt with saved profile
    const prompt = createFormAgentPrompt("Event Feedback", formBQuestions, savedProfile);

    // Step 5: Verify the AI knows the user's info
    expect(prompt).toContain("fullName: Chinat Yu");
    expect(prompt).toContain("email: chinat@example.com");
    expect(prompt).toContain("is that still correct?");

    // The AI should still list all Form B questions
    expect(prompt).toContain("Name");
    expect(prompt).toContain("Email");
    expect(prompt).toContain("How was the event?");
  });

  it("profile merges new fields from subsequent forms", () => {
    // Form A only captured name and email
    const profileAfterFormA: Record<string, string> = {
      fullName: "Chinat Yu",
      email: "chinat@example.com",
    };

    // Form B also asks for company
    const formBAnswers = [
      { questionTitle: "Name", answer: "Chinat Yu" },
      { questionTitle: "Email", answer: "chinat@example.com" },
      { questionTitle: "Your Organization", answer: "Edumame" },
    ];

    // Extract from Form B and merge with existing profile
    const newFields = extractCommonResponses(formBAnswers);
    const mergedProfile = { ...profileAfterFormA, ...newFields };

    // Now profile should have all 3 fields
    expect(mergedProfile.fullName).toBe("Chinat Yu");
    expect(mergedProfile.email).toBe("chinat@example.com");
    expect(mergedProfile.company).toBe("Edumame");
  });

  it("profile updates when user provides new value for existing field", () => {
    // Old profile has old email
    const existingProfile = {
      fullName: "Chinat Yu",
      email: "old@example.com",
    };

    // User provides new email in Form B
    const formBAnswers = [
      { questionTitle: "Email address", answer: "new@example.com" },
    ];

    const newFields = extractCommonResponses(formBAnswers);
    const mergedProfile = { ...existingProfile, ...newFields };

    // Email should be updated to new value
    expect(mergedProfile.email).toBe("new@example.com");
    // Name should be unchanged
    expect(mergedProfile.fullName).toBe("Chinat Yu");
  });
});
