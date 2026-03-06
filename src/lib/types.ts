export type QuestionKind =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "checkbox"
  | "date"
  | "time"
  | "scale"
  | "grid"
  | "file_upload"
  | "section"
  | "static_text"
  | "image"
  | "video";

export type SessionPhase =
  | "intake"
  | "review"
  | "submitting"
  | "submitted"
  | "unsupported";

export interface QuestionValidation {
  type: string;
  hint?: string;
}

export interface QuestionGrid {
  kind: "multiple_choice" | "checkbox";
  rows: string[];
  columns: string[];
  limitOnePerColumn?: boolean;
}

export interface ScaleConfig {
  values: string[];
  minLabel?: string;
  maxLabel?: string;
}

export interface NormalizedQuestion {
  id: string;
  entryId?: string;
  kind: QuestionKind;
  title: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  sectionId?: string;
  validation?: QuestionValidation;
  grid?: QuestionGrid;
  scale?: ScaleConfig;
  originalTypeCode: number;
  branching?: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
}

export interface FormSubmissionMetadata {
  action: string;
  fvv: string;
  partialResponse: string;
  pageHistory: string;
  fbzx: string;
  submissionTimestamp: string;
}

export interface FormCapabilities {
  supportsConversation: boolean;
  supportsSubmission: boolean;
  unsupportedReasons: string[];
}

export interface RawFormDebug {
  questionItems: unknown[];
}

export interface NormalizedForm {
  id: string;
  title: string;
  description?: string;
  questions: NormalizedQuestion[];
  sections: FormSection[];
  submission: FormSubmissionMetadata;
  capabilities: FormCapabilities;
  unsupportedReason?: string;
  debug?: RawFormDebug;
}

export interface SavedAnswer {
  questionId: string;
  value: string | string[] | null;
  displayValue: string;
  rawInput: string;
  updatedAt: string;
}

export interface FormSession {
  id: string;
  formUrl: string;
  form: NormalizedForm;
  phase: SessionPhase;
  currentQuestionIndex: number;
  answersByQuestionId: Record<string, SavedAnswer>;
  reviewSummary: string;
  submissionState: "idle" | "submitting" | "submitted" | "failed";
  unsupportedReason?: string;
  liveResumptionHandle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolResult {
  ok: boolean;
  phase: SessionPhase;
  speakHint?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ToolRequestPayload {
  name: string;
  args?: Record<string, unknown>;
  toolCallId?: string;
}

export interface SessionOverview {
  title: string;
  description?: string;
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestionIndex: number;
  phase: SessionPhase;
}
