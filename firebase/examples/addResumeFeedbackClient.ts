// Example: Add a resume feedback document using Firebase v9 modular SDK (client-side)
// NOTE: Your Firestore rules restrict writes to users with roles (admin or atsService).
// This snippet will only succeed for authenticated users whose ID token contains those roles,
// or when used from a trusted environment. In general, prefer using the Admin SDK on the backend.

import { db } from "../client";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Exact collection name as required
export const RESUME_FEEDBACK_COLLECTION = "resume feedback" as const;

// Example document you can start from
export const exampleResumeFeedback = {
  resumeId: "res_12345",
  candidateName: "Aisha Kumar",
  userId: "user_987",
  resumeFileUrl: "https://firebasestorage.googleapis.com/v0/b/<bucket>/o/resumes%2Fres_12345.pdf?alt=media",
  parsedSections: {
    summary: "Software Engineer with 4+ years in full-stack development...",
    experience: [
      { company: "TechCorp", role: "SDE II", start: "2022-01", end: "2024-08", bullets: ["Built X", "Scaled Y"] },
    ],
    education: [
      { school: "VIT", degree: "B.Tech CSE", year: 2021 }
    ],
    skills: ["TypeScript", "React", "Node.js", "Firestore"],
    projects: [ { name: "ATS Analyzer", desc: "Resume parsing and scoring tool" } ],
  },
  extractedSkills: ["TypeScript", "React", "Node.js", "Firestore"],
  matchedJobId: "job_555",
  matchScore: 82,
  overallScore: 88,
  automatedFeedback: [
    { type: "keyword", message: "Strong alignment with React/TS stack", confidence: 0.92 },
    { type: "formatting", message: "Consider condensing education section" }
  ],
  reviewerFeedback: [
    // timestamp will be set server-side by rules/admin or we can set to serverTimestamp() placeholder
    { reviewerId: "rev_001", comment: "Looks good for frontend roles", rating: 4, timestamp: serverTimestamp() as unknown as Timestamp },
  ],
  suggestions: ["Add measurable impact to bullet points", "Highlight leadership experiences"],
  actionsTaken: ["sent to reviewer"],
  analysisTimestamp: serverTimestamp() as unknown as Timestamp,
  parserVersion: "v1.3.2",
  source: "auto",
  metadata: {
    ip: "203.0.113.10",
    userAgent: "Mozilla/5.0",
    toolVersion: "web-0.9.0",
    acl: { users: ["user_987"], roles: ["reviewer"] },
  },
};

export async function addResumeFeedbackClient(doc: typeof exampleResumeFeedback) {
  // Ensure scores are within 0-100 on the client (rules also enforce this)
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const payload = {
    ...doc,
    matchScore: clamp(doc.matchScore),
    overallScore: clamp(doc.overallScore),
    // Ensure server timestamps are used for time fields
    analysisTimestamp: serverTimestamp(),
    reviewerFeedback: (doc.reviewerFeedback ?? []).map((r) => ({
      ...r,
      timestamp: serverTimestamp(),
    })),
  };

  const colRef = collection(db, RESUME_FEEDBACK_COLLECTION);
  const ref = await addDoc(colRef, payload);
  return ref.id;
}

// Usage (ensure user is authenticated and has role):
// const id = await addResumeFeedbackClient(exampleResumeFeedback);
// console.log('Inserted resume feedback id:', id);
