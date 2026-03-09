import { submitGoogleForm } from "@/lib/google-form-submit";
import {
  findNextActionableQuestionIndex,
  getFormSession,
  markSessionSubmitted,
  setSavedAnswer,
  updateFormSession,
} from "@/lib/form-sessions";
import type {
  FormSession,
  NormalizedQuestion,
  SavedAnswer,
  SessionOverview,
  ToolRequestPayload,
  ToolResult,
} from "@/lib/types";

const SKIP_TOKENS = new Set(["skip", "pass", "none", "no answer", "prefer not to say"]);

export async function handleToolRequest(
  sessionId: string,
  payload: ToolRequestPayload
): Promise<ToolResult> {
  const session = await getFormSession(sessionId);

  if (session.phase === "unsupported") {
    return {
      ok: false,
      phase: "unsupported",
      error: session.unsupportedReason || "This form is not supported.",
      speakHint: session.unsupportedReason || "This form is not supported.",
    };
  }

  switch (payload.name) {
    case "get_session_overview":
      return getSessionOverview(session);
    case "get_current_question":
      return getCurrentQuestion(session);
    case "save_answer":
      return saveAnswer(session, payload.args);
    case "review_answers":
      return reviewAnswers(session);
    case "change_answer":
      return changeAnswer(session, payload.args);
    case "submit_form":
      return submitForm(session);
    default:
      return {
        ok: false,
        phase: session.phase,
        error: `Unknown tool: ${payload.name}`,
      };
  }
}

function getSessionOverview(session: FormSession): ToolResult {
  const answeredQuestions = countAnsweredQuestions(session);
  const actionableQuestions = getActionableQuestions(session);
  const overview: SessionOverview = {
    title: session.form.title,
    description: session.form.description,
    totalQuestions: actionableQuestions.length,
    answeredQuestions,
    currentQuestionIndex: session.currentQuestionIndex,
    phase: session.phase,
  };

  return {
    ok: true,
    phase: session.phase,
    speakHint: `Briefly orient the user to ${session.form.title} and start naturally. There are ${overview.totalQuestions} questions to cover.`,
    data: {
      ...(overview as unknown as Record<string, unknown>),
      nextStep:
        actionableQuestions.length > answeredQuestions
          ? "Introduce the form briefly, then ask the next question."
          : "Move into a quick review and ask for submission confirmation.",
    },
  };
}

function getCurrentQuestion(session: FormSession): ToolResult {
  const current = getQuestionAtIndex(session, session.currentQuestionIndex);

  if (!current) {
    return {
      ok: true,
      phase: "review",
      speakHint:
        "All questions are complete. Give a short, calm recap and ask whether the user wants to submit or change anything.",
      data: {
        complete: true,
      },
    };
  }

  return {
    ok: true,
    phase: session.phase,
    speakHint: buildQuestionSpeakHint(current),
    data: {
      question: serializeQuestion(current, session),
    },
  };
}

async function saveAnswer(
  session: FormSession,
  args?: Record<string, unknown>
): Promise<ToolResult> {
  const current = getQuestionAtIndex(session, session.currentQuestionIndex);
  if (!current) {
    return {
      ok: false,
      phase: session.phase,
      error: "There is no current question to answer.",
    };
  }

  const rawAnswer = typeof args?.answer === "string" ? args.answer : "";
  const normalized = normalizeAnswer(current, rawAnswer);
  if ("error" in normalized) {
    return {
      ok: false,
      phase: session.phase,
      error: normalized.error,
      speakHint: normalized.error,
    };
  }

  const savedAnswer: SavedAnswer = {
    questionId: current.id,
    value: normalized.value,
    displayValue: normalized.displayValue,
    rawInput: rawAnswer,
    updatedAt: new Date().toISOString(),
  };

  const updatedSession = await setSavedAnswer(session.id, savedAnswer);
  const nextIndex = findNextActionableQuestionIndex(
    updatedSession.form,
    updatedSession.currentQuestionIndex + 1
  );
  const phase = nextIndex >= updatedSession.form.questions.length ? "review" : "intake";
  const reviewSummary = phase === "review" ? buildReviewSummary(updatedSession) : updatedSession.reviewSummary;

  const finalSession = await updateFormSession(updatedSession.id, {
    currentQuestionIndex: nextIndex,
    phase,
    reviewSummary,
  });

  const nextQuestion = getQuestionAtIndex(finalSession, nextIndex);

  return {
    ok: true,
    phase: finalSession.phase,
    speakHint:
      finalSession.phase === "review"
        ? "All answers are captured. Briefly recap the important answers and ask whether the user wants to submit or change anything."
        : `Acknowledge the answer naturally, then continue. ${nextQuestion ? buildQuestionSpeakHint(nextQuestion) : "Move to review."}`,
    data: {
      savedAnswer: {
        questionId: current.id,
        displayValue: savedAnswer.displayValue,
      },
      nextQuestion: nextQuestion
        ? serializeQuestion(nextQuestion, finalSession)
        : null,
      reviewSummary: finalSession.reviewSummary || undefined,
    },
  };
}

async function reviewAnswers(session: FormSession): Promise<ToolResult> {
  const summary = buildReviewSummary(session);
  const updated = await updateFormSession(session.id, {
    phase: "review",
    reviewSummary: summary,
  });

  return {
    ok: true,
    phase: updated.phase,
    speakHint:
      "Read back the answers briefly in conversational language, not like a checklist, then ask whether the user wants to submit or change anything.",
    data: {
      reviewSummary: summary,
    },
  };
}

async function changeAnswer(
  session: FormSession,
  args?: Record<string, unknown>
): Promise<ToolResult> {
  const questionId = typeof args?.questionId === "string" ? args.questionId : "";
  const rawAnswer = typeof args?.answer === "string" ? args.answer : "";
  const question = session.form.questions.find((item) => item.id === questionId);

  if (!question) {
    return {
      ok: false,
      phase: session.phase,
      error: "Question not found.",
    };
  }

  const normalized = normalizeAnswer(question, rawAnswer);
  if ("error" in normalized) {
    return {
      ok: false,
      phase: session.phase,
      error: normalized.error,
      speakHint: normalized.error,
    };
  }

  const savedAnswer: SavedAnswer = {
    questionId: question.id,
    value: normalized.value,
    displayValue: normalized.displayValue,
    rawInput: rawAnswer,
    updatedAt: new Date().toISOString(),
  };

  await setSavedAnswer(session.id, savedAnswer);
  const refreshed = await getFormSession(session.id);
  const summary = buildReviewSummary(refreshed);
  const updated = await updateFormSession(session.id, {
    phase: "review",
    reviewSummary: summary,
  });

  return {
    ok: true,
    phase: updated.phase,
    speakHint:
      "Confirm the change naturally, continue the review, and ask if anything else should change before submission.",
    data: {
      updatedQuestionId: question.id,
      reviewSummary: summary,
    },
  };
}

async function submitForm(session: FormSession): Promise<ToolResult> {
  if (session.submissionState === "submitted" || session.phase === "submitted") {
    return {
      ok: true,
      phase: "submitted",
      speakHint: "The form has already been submitted.",
    };
  }

  if (!session.form.capabilities.supportsSubmission) {
    return {
      ok: false,
      phase: session.phase,
      error: "This form can be read through Google APIs, but submission is not wired for this form yet.",
      speakHint:
        "This form was read through Google APIs, but automatic submission is not available for it yet.",
    };
  }

  const missingRequired = getActionableQuestions(session).find((question) => {
    if (!question.required) {
      return false;
    }
    const answer = session.answersByQuestionId[question.id];
    return !answer || answer.value === null || answer.value === "";
  });

  if (missingRequired) {
    return {
      ok: false,
      phase: session.phase,
      error: `Missing required answer for "${missingRequired.title}".`,
      speakHint: `There is still a required question missing: ${missingRequired.title}.`,
    };
  }

  await updateFormSession(session.id, {
    phase: "submitting",
    submissionState: "submitting",
  });

  const refreshed = await getFormSession(session.id);

  try {
    await submitGoogleForm(refreshed);
    await markSessionSubmitted(session.id);

    return {
      ok: true,
      phase: "submitted",
      speakHint:
        "Tell the user the form has been submitted, thank them, and end the conversation warmly.",
      data: {
        submitted: true,
      },
    };
  } catch (error) {
    await updateFormSession(session.id, {
      phase: "review",
      submissionState: "failed",
    });

    return {
      ok: false,
      phase: "review",
      error: error instanceof Error ? error.message : "Failed to submit the form.",
      speakHint:
        "Apologize briefly, explain that submission did not go through yet, and ask whether the user wants to try again.",
    };
  }
}

function getActionableQuestions(session: FormSession) {
  return session.form.questions.filter((question) =>
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
}

function getQuestionAtIndex(session: FormSession, index: number) {
  while (index < session.form.questions.length) {
    const question = session.form.questions[index];
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
      return question;
    }
    index += 1;
  }

  return null;
}

function serializeQuestion(question: NormalizedQuestion, session: FormSession) {
  const actionableQuestions = getActionableQuestions(session);
  const position = actionableQuestions.findIndex((item) => item.id === question.id);

  return {
    id: question.id,
    title: question.title,
    helpText: question.helpText,
    kind: question.kind,
    required: question.required,
    options: question.options,
    progress: {
      current: position >= 0 ? position + 1 : undefined,
      total: actionableQuestions.length,
    },
  };
}

function buildQuestionSpeakHint(question: NormalizedQuestion) {
  const requirement = question.required ? "required" : "optional";
  const optionHint =
    question.options && question.options.length > 0
      ? ` Offer these choices exactly if needed: ${question.options.join(", ")}.`
      : "";
  const helpHint = question.helpText ? ` Use this context if it helps: ${question.helpText}.` : "";
  const scaleHint =
    question.kind === "scale" && question.scale
      ? ` Ask for one number from ${question.scale.values[0]} to ${question.scale.values[question.scale.values.length - 1]}.${
          question.scale.minLabel || question.scale.maxLabel
            ? ` The ends are labeled ${question.scale.minLabel || question.scale.values[0]} and ${
                question.scale.maxLabel ||
                question.scale.values[question.scale.values.length - 1]
              }.`
            : ""
        }`
      : "";

  return `Ask the next question naturally: ${question.title}. This is ${requirement}.${helpHint}${optionHint}${scaleHint}`;
}

function countAnsweredQuestions(session: FormSession) {
  return Object.values(session.answersByQuestionId).filter(
    (answer) => answer.value !== null && answer.value !== ""
  ).length;
}

function buildReviewSummary(session: FormSession) {
  return getActionableQuestions(session)
    .map((question) => {
      const answer = session.answersByQuestionId[question.id];
      const displayValue = answer?.displayValue || (question.required ? "Missing" : "Skipped");
      return `${question.title}: ${displayValue}`;
    })
    .join("\n");
}

function normalizeAnswer(question: NormalizedQuestion, rawAnswer: string) {
  const trimmed = rawAnswer.trim();
  const skipped = SKIP_TOKENS.has(trimmed.toLowerCase()) || trimmed === "";

  if (skipped) {
    if (question.required) {
      return { error: `${question.title} is required.` };
    }
    return { value: null, displayValue: "Skipped" };
  }

  switch (question.kind) {
    case "short_text":
    case "long_text":
      return {
        value: trimmed,
        displayValue: trimmed,
      };
    case "multiple_choice":
    case "dropdown":
      return matchSingleOption(question, trimmed);
    case "checkbox":
      return matchMultipleOptions(question, trimmed);
    case "scale":
      return normalizeScaleAnswer(question, trimmed);
    case "date":
      return normalizeDateAnswer(trimmed);
    case "time":
      return normalizeTimeAnswer(trimmed);
    default:
      return {
        error: `${question.title} uses a question type that is not supported yet.`,
      };
  }
}

function matchSingleOption(question: NormalizedQuestion, answer: string) {
  const options = question.options || [];
  const normalized = options.find((option) => option.toLowerCase() === answer.toLowerCase());

  if (!normalized) {
    return {
      error: `That answer is not one of the allowed options for "${question.title}".`,
    };
  }

  return {
    value: normalized,
    displayValue: normalized,
  };
}

function matchMultipleOptions(question: NormalizedQuestion, answer: string) {
  const options = question.options || [];
  const requested = answer
    .split(/,| and /i)
    .map((value) => value.trim())
    .filter(Boolean);

  if (requested.length === 0) {
    if (question.required) {
      return {
        error: `${question.title} is required.`,
      };
    }
    return {
      value: [],
      displayValue: "Skipped",
    };
  }

  const resolved = requested.map((value) =>
    options.find((option) => option.toLowerCase() === value.toLowerCase())
  );

  if (resolved.some((value) => !value)) {
    return {
      error: `One or more selections are not allowed for "${question.title}".`,
    };
  }

  const values = [...new Set(resolved as string[])];
  return {
    value: values,
    displayValue: values.join(", "),
  };
}

function normalizeDateAnswer(answer: string) {
  const isoMatch = answer.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      value: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      displayValue: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
    };
  }

  const parsed = new Date(answer);
  if (Number.isNaN(parsed.getTime())) {
    return {
      error: "Use a specific date such as 2026-03-06.",
    };
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const value = `${year}-${month}-${day}`;

  return {
    value,
    displayValue: value,
  };
}

function normalizeTimeAnswer(answer: string) {
  const match = answer.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return {
      error: "Use a specific time such as 09:30 or 9:30 AM.",
    };
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const meridiem = match[3]?.toLowerCase();

  if (minute > 59 || hour > 23) {
    return {
      error: "Use a valid clock time.",
    };
  }

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  } else if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return {
    value,
    displayValue: value,
  };
}

function normalizeScaleAnswer(question: NormalizedQuestion, answer: string) {
  const scaleValues = question.scale?.values ?? [];
  if (scaleValues.length === 0) {
    return {
      error: `The scale for "${question.title}" could not be read clearly.`,
    };
  }

  const numberMatch = answer.match(/\d+/);
  const normalized = numberMatch?.[0] ?? answer.trim();

  if (!scaleValues.includes(normalized)) {
    return {
      error: `Use one number from ${scaleValues[0]} to ${scaleValues[scaleValues.length - 1]} for "${question.title}".`,
    };
  }

  return {
    value: normalized,
    displayValue: normalized,
  };
}
