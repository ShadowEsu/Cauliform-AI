import type {
  FormCapabilities,
  FormSection,
  FormSubmissionMetadata,
  NormalizedForm,
  NormalizedQuestion,
  QuestionGrid,
  QuestionKind,
} from "./types";

const SUPPORTED_SUBMISSION_KINDS = new Set<QuestionKind>([
  "short_text",
  "long_text",
  "multiple_choice",
  "dropdown",
  "checkbox",
  "date",
  "time",
]);

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

export function isValidGoogleFormUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "forms.google.com" || parsed.hostname === "docs.google.com") &&
      parsed.pathname.includes("/forms/")
    );
  } catch {
    return false;
  }
}

export async function parseGoogleForm(url: string): Promise<NormalizedForm> {
  const formId = extractFormId(url);
  if (!formId) {
    throw new Error("Invalid Google Form URL");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch form");
  }

  const html = await response.text();
  const submission = extractSubmissionMetadata(html);
  const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/);

  if (!dataMatch) {
    throw new Error("Could not parse form structure");
  }

  try {
    const data = JSON.parse(dataMatch[1]) as unknown[];
    const title = extractTitle(html, data);
    const description = extractDescription(data);
    const items = extractQuestionItems(data);
    const parsed = normalizeQuestionItems(items);
    const unsupportedReasons = collectUnsupportedReasons({
      html,
      questions: parsed.questions,
      submission,
    });

    const capabilities: FormCapabilities = {
      supportsConversation: unsupportedReasons.length === 0,
      supportsSubmission: unsupportedReasons.length === 0,
      unsupportedReasons,
    };

    return {
      id: formId,
      title,
      description,
      questions: parsed.questions,
      sections: parsed.sections,
      submission,
      capabilities,
      unsupportedReason: unsupportedReasons[0],
      debug: {
        questionItems: items,
      },
    };
  } catch (error) {
    console.error("Failed to normalize Google Form:", error);
    throw new Error("Failed to parse form data");
  }
}

function extractTitle(html: string, data: unknown[]): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch?.[1]?.trim()) {
    return decodeHtmlEntities(titleMatch[1].trim().replace(" - Google Forms", ""));
  }

  const value = typeof data[8] === "string" ? data[8] : "";
  return value.trim() || "Untitled Form";
}

function extractDescription(data: unknown[]): string | undefined {
  const root = Array.isArray(data[1]) ? (data[1] as unknown[]) : undefined;
  const value = typeof root?.[0] === "string" ? root[0] : "";
  return value.trim() ? decodeHtmlEntities(value) : undefined;
}

function extractQuestionItems(data: unknown[]): unknown[] {
  const root = Array.isArray(data[1]) ? (data[1] as unknown[]) : undefined;
  const items = Array.isArray(root?.[1]) ? (root[1] as unknown[]) : [];
  return items;
}

function normalizeQuestionItems(items: unknown[]) {
  const questions: NormalizedQuestion[] = [];
  const sections: FormSection[] = [];
  let currentSectionId = "section-root";

  sections.push({ id: currentSectionId, title: "Start" });

  for (const item of items) {
    if (!Array.isArray(item)) {
      continue;
    }

    const questionId = String(item[0] ?? "");
    const title = cleanText(item[1]);
    const helpText = cleanText(item[2]);
    const typeCode = toNumber(item[3]) ?? -1;

    if (!questionId || !title) {
      continue;
    }

    if (typeCode === 8) {
      currentSectionId = `section-${questionId}`;
      sections.push({
        id: currentSectionId,
        title,
        description: helpText || undefined,
      });
      continue;
    }

    if (typeCode === 6) {
      questions.push({
        id: questionId,
        kind: "static_text",
        title,
        helpText: helpText || undefined,
        required: false,
        sectionId: currentSectionId,
        originalTypeCode: typeCode,
      });
      continue;
    }

    if (typeCode === 11) {
      questions.push({
        id: questionId,
        kind: "image",
        title,
        helpText: helpText || undefined,
        required: false,
        sectionId: currentSectionId,
        originalTypeCode: typeCode,
      });
      continue;
    }

    if (typeCode === 12) {
      questions.push({
        id: questionId,
        kind: "video",
        title,
        helpText: helpText || undefined,
        required: false,
        sectionId: currentSectionId,
        originalTypeCode: typeCode,
      });
      continue;
    }

    const groups = Array.isArray(item[4]) ? (item[4] as unknown[]) : [];
    const entryId = groups.length > 0 && Array.isArray(groups[0]) ? String(groups[0][0] ?? "") : undefined;
    const required = Boolean(Array.isArray(groups[0]) ? groups[0][2] : false);
    const kind = mapQuestionKind(typeCode);
    const options = extractOptions(typeCode, groups);
    const branching = hasBranching(groups);
    const scale = extractScale(groups);
    const grid = extractGrid(typeCode, groups);

    questions.push({
      id: questionId,
      entryId: entryId || undefined,
      kind,
      title,
      helpText: helpText || undefined,
      required,
      options: options.length > 0 ? options : undefined,
      sectionId: currentSectionId,
      validation: extractValidation(typeCode, groups),
      grid: grid || undefined,
      scale: scale || undefined,
      originalTypeCode: typeCode,
      branching,
    });
  }

  return { questions, sections };
}

function extractSubmissionMetadata(html: string): FormSubmissionMetadata {
  const action = extractAttr(html, /<form[^>]+action="([^"]+formResponse[^"]*)"/);
  const fvv = extractAttr(html, /name="fvv" value="([^"]*)"/);
  const partialResponse = decodeHtmlEntities(
    extractAttr(html, /name="partialResponse" value="([^"]*)"/)
  );
  const pageHistory = extractAttr(html, /name="pageHistory" value="([^"]*)"/);
  const fbzx = extractAttr(html, /name="fbzx" value="([^"]*)"/);
  const submissionTimestamp = extractAttr(
    html,
    /name="submissionTimestamp" value="([^"]*)"/
  );

  if (!action || !fvv || !partialResponse || !pageHistory || !fbzx || !submissionTimestamp) {
    throw new Error("Missing submission metadata");
  }

  return {
    action,
    fvv,
    partialResponse,
    pageHistory,
    fbzx,
    submissionTimestamp,
  };
}

function extractAttr(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function collectUnsupportedReasons({
  html,
  questions,
  submission,
}: {
  html: string;
  questions: NormalizedQuestion[];
  submission: FormSubmissionMetadata;
}): string[] {
  const reasons = new Set<string>();

  if (!submission.action) {
    reasons.add("Missing form submission metadata.");
  }

  if (/no longer accepting responses/i.test(html)) {
    reasons.add("This form is no longer accepting responses.");
  }

  if (/You need permission|This form can only be viewed by users in/i.test(html)) {
    reasons.add("This form requires Google account access.");
  }

  for (const question of questions) {
    if (question.kind === "file_upload") {
      reasons.add("File upload questions are not supported.");
    }
    if (question.kind === "grid") {
      reasons.add("Grid questions are not supported in this voice flow.");
    }
    if (question.kind === "scale") {
      reasons.add("Linear scale questions are not supported in this voice flow.");
    }
    if (question.branching) {
      reasons.add("Section branching is not supported.");
    }
    if (
      ![
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "checkbox",
        "date",
        "time",
        "section",
        "static_text",
        "image",
        "video",
      ].includes(question.kind)
    ) {
      reasons.add(`Unsupported question type: ${question.kind}.`);
    }
    if (question.entryId && !SUPPORTED_SUBMISSION_KINDS.has(question.kind)) {
      reasons.add(`Submission is not supported for "${question.title}".`);
    }
  }

  return [...reasons];
}

function mapQuestionKind(typeCode: number): QuestionKind {
  switch (typeCode) {
    case 0:
      return "short_text";
    case 1:
      return "long_text";
    case 2:
      return "multiple_choice";
    case 3:
      return "dropdown";
    case 4:
      return "checkbox";
    case 5:
      return "scale";
    case 7:
      return "grid";
    case 9:
      return "date";
    case 10:
      return "time";
    case 13:
      return "file_upload";
    default:
      return "static_text";
  }
}

function extractOptions(typeCode: number, groups: unknown[]): string[] {
  if (!Array.isArray(groups[0])) {
    return [];
  }

  if (typeCode === 7) {
    const rows: string[] = [];
    const first = groups[0] as unknown[];
    for (const row of groups) {
      if (!Array.isArray(row)) {
        continue;
      }
      const rowLabel = cleanText(row[3]);
      if (rowLabel) {
        rows.push(rowLabel);
      }
    }
    const columns = Array.isArray(first[1]) ? (first[1] as unknown[]).map((value) => cleanText(Array.isArray(value) ? value[0] : value)).filter(Boolean) : [];
    return [...new Set([...rows, ...columns])];
  }

  const rawOptions = Array.isArray((groups[0] as unknown[])[1]) ? ((groups[0] as unknown[])[1] as unknown[]) : [];
  return rawOptions
    .map((value) => cleanText(Array.isArray(value) ? value[0] : value))
    .filter(Boolean);
}

function extractScale(groups: unknown[]) {
  if (!Array.isArray(groups[0])) {
    return null;
  }

  const first = groups[0] as unknown[];
  const values = Array.isArray(first[1])
    ? (first[1] as unknown[]).map((value) => cleanText(Array.isArray(value) ? value[0] : value)).filter(Boolean)
    : [];
  const labels = Array.isArray(first[3]) ? (first[3] as unknown[]).map(cleanText).filter(Boolean) : [];

  if (values.length === 0) {
    return null;
  }

  return {
    values,
    minLabel: labels[0] || undefined,
    maxLabel: labels[1] || undefined,
  };
}

function extractGrid(typeCode: number, groups: unknown[]): QuestionGrid | null {
  if (typeCode !== 7) {
    return null;
  }

  const first = Array.isArray(groups[0]) ? (groups[0] as unknown[]) : undefined;
  if (!first) {
    return null;
  }

  const columns = Array.isArray(first[1])
    ? (first[1] as unknown[]).map((value) => cleanText(Array.isArray(value) ? value[0] : value)).filter(Boolean)
    : [];
  const rows = groups
    .map((group) => cleanText(Array.isArray(group) ? group[3] : undefined))
    .filter(Boolean);
  const limitOnePerColumn = Array.isArray(first[11]) ? Boolean((first[11] as unknown[])[0]) : false;
  const kind = Array.isArray(first[11]) && (first[11] as unknown[])[0] === 1 ? "checkbox" : "multiple_choice";

  if (rows.length === 0 || columns.length === 0) {
    return null;
  }

  return {
    kind,
    rows,
    columns,
    limitOnePerColumn,
  };
}

function extractValidation(typeCode: number, groups: unknown[]) {
  if (!Array.isArray(groups[0])) {
    return undefined;
  }

  if (typeCode === 9) {
    const first = groups[0] as unknown[];
    const flags = Array.isArray(first[7]) ? (first[7] as unknown[]) : [];
    const includesYear = flags[1] === 1;
    return {
      type: "date",
      hint: includesYear ? "Expect a full calendar date with year." : "Expect a calendar date.",
    };
  }

  if (typeCode === 10) {
    const first = groups[0] as unknown[];
    const flags = Array.isArray(first[6]) ? (first[6] as unknown[]) : [];
    const isDuration = flags[0] === 1;
    return {
      type: "time",
      hint: isDuration ? "Expect a duration." : "Expect a clock time.",
    };
  }

  return undefined;
}

function hasBranching(groups: unknown[]): boolean {
  for (const group of groups) {
    if (!Array.isArray(group)) {
      continue;
    }
    const rawOptions = Array.isArray(group[1]) ? (group[1] as unknown[]) : [];
    for (const option of rawOptions) {
      if (!Array.isArray(option)) {
        continue;
      }
      const hasNavigationTarget = option.slice(1).some((value, index) => {
        if (index === 3) {
          return false;
        }
        return value !== null && value !== undefined && value !== "";
      });
      if (hasNavigationTarget) {
        return true;
      }
    }
  }
  return false;
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)));
}
