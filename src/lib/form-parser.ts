import type { FormData, Question, QuestionType } from "./types";

/**
 * Extract form ID from Google Forms URL
 */
export function extractFormId(url: string): string | null {
  const patterns = [
    /forms\.google\.com\/forms\/d\/e\/([a-zA-Z0-9_-]+)/,
    /forms\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/forms\/d\/e\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate Google Forms URL
 */
export function isValidGoogleFormUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "forms.google.com" ||
        parsed.hostname === "docs.google.com") &&
      parsed.pathname.includes("/forms/")
    );
  } catch {
    return false;
  }
}

/**
 * Map internal question type codes to our types
 */
function mapQuestionType(typeCode: number): QuestionType {
  const typeMap: Record<number, QuestionType> = {
    0: "short_text",
    1: "long_text",
    2: "multiple_choice",
    3: "dropdown",
    4: "checkbox",
    5: "short_text", // Linear scale
    7: "short_text", // Grid
    9: "date",
    10: "time",
    13: "file_upload",
  };

  return typeMap[typeCode] || "short_text";
}

/**
 * Parse Google Form by scraping the public form page
 * This works for any public form without needing API access
 */
export async function parseGoogleForm(url: string): Promise<FormData> {
  const formId = extractFormId(url);

  if (!formId) {
    throw new Error("Invalid Google Form URL");
  }

  // Fetch the form page
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch form");
  }

  const html = await response.text();

  // Extract form title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(" - Google Forms", "") : "Untitled Form";

  // Parse form data from the page
  // Google Forms embeds form structure in a script tag
  const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);

  if (!dataMatch) {
    throw new Error("Could not parse form structure");
  }

  try {
    const formData = JSON.parse(dataMatch[1]);
    const questions = parseFormDataStructure(formData);

    return {
      id: formId,
      title,
      questions,
    };
  } catch (error) {
    throw new Error("Failed to parse form data");
  }
}

/**
 * Parse the internal form data structure
 */
function parseFormDataStructure(data: unknown[]): Question[] {
  const questions: Question[] = [];

  // The form questions are nested in the data structure
  // This varies by form but generally follows this pattern
  const questionData = data[1]?.[1] as unknown[][] | undefined;

  if (!Array.isArray(questionData)) {
    return questions;
  }

  for (const item of questionData) {
    if (!Array.isArray(item) || item.length < 2) continue;

    const questionInfo = item[1] as unknown[];
    if (!Array.isArray(questionInfo)) continue;

    const question: Question = {
      id: String(item[0] || Math.random()),
      title: String(questionInfo[0] || ""),
      type: mapQuestionType(Number(questionInfo[3]) || 0),
      required: Boolean(questionInfo[2]),
      options: [],
    };

    // Extract options for multiple choice questions
    const optionsData = questionInfo[4]?.[0]?.[1] as unknown[][] | undefined;
    if (Array.isArray(optionsData)) {
      question.options = optionsData
        .filter(Array.isArray)
        .map((opt) => String(opt[0] || ""));
    }

    if (question.title) {
      questions.push(question);
    }
  }

  return questions;
}
