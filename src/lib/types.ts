// Core types for Cauliform

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  description?: string;
}

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "date"
  | "time"
  | "file_upload";

export interface FormData {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface CallSession {
  id: string;
  formId: string;
  phoneNumber: string;
  status: CallStatus;
  responses: FormResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export type CallStatus =
  | "pending"
  | "calling"
  | "in_progress"
  | "confirming"
  | "submitted"
  | "failed"
  | "cancelled";

export interface FormResponse {
  questionId: string;
  answer: string;
  confirmedAt?: Date;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  commonResponses: Record<string, string>;
  createdAt: Date;
}
