import { v4 as uuidv4 } from "uuid";
import { parseGoogleForm } from "@/lib/form-parser";
import type { FormSession, NormalizedForm, SavedAnswer } from "@/lib/types";

const sessions = new Map<string, FormSession>();

export async function createFormSession(
  formUrl: string,
  options?: { accessToken?: string }
): Promise<FormSession> {
  const form = await parseGoogleForm(formUrl, options);
  const sessionId = uuidv4();
  const now = new Date().toISOString();

  const session: FormSession = {
    id: sessionId,
    formUrl,
    form,
    phase: form.capabilities.supportsConversation ? "intake" : "unsupported",
    currentQuestionIndex: findFirstActionableQuestionIndex(form),
    answersByQuestionId: {},
    reviewSummary: "",
    submissionState: "idle",
    unsupportedReason: form.unsupportedReason,
    createdAt: now,
    updatedAt: now,
  };

  sessions.set(sessionId, session);
  return session;
}

export async function getFormSession(sessionId: string): Promise<FormSession> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Form session not found");
  }

  return session;
}

export async function updateFormSession(
  sessionId: string,
  patch: Partial<FormSession>
): Promise<FormSession> {
  const session = await getFormSession(sessionId);
  const nextSession: FormSession = {
    ...session,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  sessions.set(sessionId, nextSession);
  return nextSession;
}

export async function setSavedAnswer(
  sessionId: string,
  answer: SavedAnswer
): Promise<FormSession> {
  const session = await getFormSession(sessionId);
  const nextSession: FormSession = {
    ...session,
    answersByQuestionId: {
      ...session.answersByQuestionId,
      [answer.questionId]: answer,
    },
    updatedAt: new Date().toISOString(),
  };

  sessions.set(sessionId, nextSession);
  return nextSession;
}

export async function markSessionSubmitted(sessionId: string): Promise<void> {
  const session = await getFormSession(sessionId);
  sessions.set(sessionId, {
    ...session,
    submissionState: "submitted",
    phase: "submitted",
    updatedAt: new Date().toISOString(),
  });
}

export function findFirstActionableQuestionIndex(form: NormalizedForm): number {
  const index = form.questions.findIndex((question) =>
    [
      "short_text",
      "long_text",
      "multiple_choice",
      "dropdown",
      "checkbox",
      "date",
      "time",
      "scale",
      "grid",
      "file_upload",
    ].includes(question.kind)
  );

  return index >= 0 ? index : 0;
}

export function findNextActionableQuestionIndex(
  form: NormalizedForm,
  startIndex: number
): number {
  for (let index = startIndex; index < form.questions.length; index += 1) {
    const question = form.questions[index];
    if (
      [
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "checkbox",
        "date",
        "time",
        "scale",
        "grid",
        "file_upload",
      ].includes(question.kind)
    ) {
      return index;
    }
  }

  return form.questions.length;
}
