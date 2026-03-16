import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { UserProfile } from "./types";

const PROFILES_COLLECTION = "user_profiles";
const SESSIONS_COLLECTION = "call_sessions";

// Common field patterns to auto-detect and save
const FIELD_PATTERNS: Record<string, RegExp> = {
  email: /\b(email|e-mail)\b/i,
  fullName: /\b(full\s*name|your\s*name|name)\b/i,
  company: /\b(company|organization|employer|workplace)\b/i,
  jobTitle: /\b(job\s*title|role|position|title)\b/i,
  phone: /\b(phone|mobile|cell|telephone)\b/i,
};

/**
 * Look up a user profile by phone number.
 */
export async function getProfileByPhone(
  phoneNumber: string
): Promise<UserProfile | null> {
  const db = getAdminDb();
  const normalized = normalizePhone(phoneNumber);

  const snap = await db
    .collection(PROFILES_COLLECTION)
    .where("phoneNumber", "==", normalized)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    phoneNumber: data.phoneNumber,
    commonResponses: data.commonResponses || {},
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || undefined,
  } as UserProfile;
}

/**
 * Create or update a user profile after form submission.
 * Merges new common responses with existing ones.
 */
export async function upsertProfile(
  phoneNumber: string,
  answers: { questionTitle: string; answer: string }[]
): Promise<UserProfile> {
  const db = getAdminDb();
  const normalized = normalizePhone(phoneNumber);
  const existing = await getProfileByPhone(normalized);
  const extracted = extractCommonResponses(answers);

  if (existing) {
    // Merge — new values overwrite old ones
    const merged = { ...existing.commonResponses, ...extracted };
    await db.collection(PROFILES_COLLECTION).doc(existing.id).update({
      commonResponses: merged,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...existing, commonResponses: merged };
  }

  // Create new profile
  const ref = db.collection(PROFILES_COLLECTION).doc();
  await ref.set({
    id: ref.id,
    phoneNumber: normalized,
    commonResponses: extracted,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return {
    id: ref.id,
    phoneNumber: normalized,
    commonResponses: extracted,
    createdAt: new Date(),
  } as UserProfile;
}

/**
 * Save a call session record to Firestore.
 * Captures every form interaction for history.
 */
export async function saveCallSession(data: {
  phoneNumber: string;
  formUrl: string;
  formTitle: string;
  answers: { questionTitle: string; answer: string }[];
  status: "submitted" | "failed";
}) {
  const db = getAdminDb();
  const ref = db.collection(SESSIONS_COLLECTION).doc();
  await ref.set({
    id: ref.id,
    phoneNumber: normalizePhone(data.phoneNumber),
    formUrl: data.formUrl,
    formTitle: data.formTitle,
    answers: data.answers,
    status: data.status,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Get call history for a phone number.
 */
export async function getCallHistory(phoneNumber: string, limit = 20) {
  const db = getAdminDb();
  const snap = await db
    .collection(SESSIONS_COLLECTION)
    .where("phoneNumber", "==", normalizePhone(phoneNumber))
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  });
}

/**
 * Extract common response fields from form answers.
 */
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

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}
