import type { FormSession, NormalizedQuestion, SavedAnswer } from "@/lib/types";

export async function submitGoogleForm(session: FormSession): Promise<void> {
  const params = new URLSearchParams();
  const { submission } = session.form;

  params.set("fvv", submission.fvv);
  params.set("partialResponse", submission.partialResponse);
  params.set("pageHistory", submission.pageHistory);
  params.set("fbzx", submission.fbzx);
  params.set("submissionTimestamp", submission.submissionTimestamp);

  for (const question of session.form.questions) {
    const answer = session.answersByQuestionId[question.id];
    if (!answer || answer.value === null || answer.value === "") {
      continue;
    }

    appendAnswer(params, question, answer);
  }

  const response = await fetch(submission.action, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Origin: "https://docs.google.com",
      Referer: session.formUrl,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: params.toString(),
    redirect: "follow",
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Google Forms rejected the submission (${response.status}).`);
  }

  if (!/Your response has been recorded|response has been recorded|Thanks for filling out this form/i.test(body)) {
    throw new Error("Google Forms did not return a submission confirmation page.");
  }
}

function appendAnswer(
  params: URLSearchParams,
  question: NormalizedQuestion,
  answer: SavedAnswer
) {
  if (!question.entryId) {
    return;
  }

  if (question.kind === "checkbox") {
    const values = Array.isArray(answer.value) ? answer.value : [String(answer.value)];
    for (const value of values) {
      params.append(`entry.${question.entryId}`, value);
    }
    return;
  }

  if (question.kind === "date") {
    const parsed = parseDateAnswer(String(answer.value));
    params.set(`entry.${question.entryId}_month`, parsed.month);
    params.set(`entry.${question.entryId}_day`, parsed.day);
    params.set(`entry.${question.entryId}_year`, parsed.year);
    return;
  }

  if (question.kind === "time") {
    const parsed = parseTimeAnswer(String(answer.value));
    params.set(`entry.${question.entryId}_hour`, parsed.hour);
    params.set(`entry.${question.entryId}_minute`, parsed.minute);
    return;
  }

  params.set(`entry.${question.entryId}`, Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value));
}

function parseDateAnswer(value: string) {
  const normalized = value.trim();
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: String(Number.parseInt(isoMatch[2], 10)),
      day: String(Number.parseInt(isoMatch[3], 10)),
    };
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date answer.");
  }

  return {
    year: String(parsed.getUTCFullYear()),
    month: String(parsed.getUTCMonth() + 1),
    day: String(parsed.getUTCDate()),
  };
}

function parseTimeAnswer(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    throw new Error("Invalid time answer.");
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);

  if (match[3]) {
    const meridiem = match[3].toLowerCase();
    if (meridiem === "pm" && hour < 12) {
      hour += 12;
    }
    if (meridiem === "am" && hour === 12) {
      hour = 0;
    }
  }

  return {
    hour: String(hour),
    minute: String(minute),
  };
}
