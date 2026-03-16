import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { UserProfile } from "./types";

const PROFILES_COLLECTION = "user_profiles";

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
  const db = getFirebaseDb();
  if (!db) return null;

  const q = query(
    collection(db, PROFILES_COLLECTION),
    where("phoneNumber", "==", normalizePhone(phoneNumber))
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as UserProfile;
}

/**
 * Create or update a user profile after form submission.
 * Merges new common responses with existing ones.
 */
export async function upsertProfile(
  phoneNumber: string,
  answers: { questionTitle: string; answer: string }[]
): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const normalized = normalizePhone(phoneNumber);
  const existing = await getProfileByPhone(normalized);
  const extracted = extractCommonResponses(answers);

  if (existing) {
    // Merge — new values overwrite old ones
    const merged = { ...existing.commonResponses, ...extracted };
    const ref = doc(db, PROFILES_COLLECTION, existing.id);
    await updateDoc(ref, {
      commonResponses: merged,
      updatedAt: serverTimestamp(),
    });
    return { ...existing, commonResponses: merged };
  }

  // Create new profile
  const ref = doc(collection(db, PROFILES_COLLECTION));
  const profile: Omit<UserProfile, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp>; updatedAt: ReturnType<typeof serverTimestamp> } = {
    id: ref.id,
    phoneNumber: normalized,
    commonResponses: extracted,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };
  await setDoc(ref, profile);
  return { ...profile, createdAt: new Date() } as UserProfile;
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
