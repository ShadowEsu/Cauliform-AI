import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let initialized = false;

export function getAdminDb() {
  if (!initialized && getApps().length === 0) {
    // In Cloud Run, uses the service account automatically
    // Locally, uses Application Default Credentials (gcloud auth application-default login)
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cauliform-ai-d836f",
    });
    initialized = true;
  }
  return getFirestore();
}
