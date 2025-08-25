import { db } from "./admin";
import { FieldValue } from "firebase-admin/firestore";

// Types for resume feedback document
export type ReviewerFeedback = {
  reviewerId: string;
  comment: string;
  rating?: number; // 1-5 optional
  timestamp?: FirebaseFirestore.FieldValue; // serverTimestamp to be applied when stored
};

export type AutomatedFeedback = {
  type: string; // e.g., "keyword", "formatting", "consistency"
  message: string;
  confidence?: number; // 0-1
};

export type ParsedSections = {
  summary?: string;
  experience?: Array<Record<string, any>>;
  education?: Array<Record<string, any>>;
  skills?: Array<string>;
  projects?: Array<Record<string, any>>;
  [key: string]: any;
};

export type ResumeFeedbackInput = {
  resumeId: string;
  candidateName: string;
  userId: string;
  resumeFileUrl: string;
  parsedSections: ParsedSections;
  extractedSkills: string[];
  matchedJobId?: string | null;
  matchScore: number; // 0-100
  overallScore: number; // 0-100
  automatedFeedback: AutomatedFeedback[];
  reviewerFeedback?: ReviewerFeedback[]; // when present, timestamps will be set to serverTimestamp()
  suggestions: string[];
  actionsTaken: string[]; // e.g., ["sent to reviewer", "reparse requested"]
  parserVersion: string;
  source: "auto" | "human";
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    toolVersion?: string;
    // Optional ACL for reads: allowlisted user ids or roles
    acl?: {
      users?: string[]; // userIds allowed to read
      roles?: string[]; // roles allowed to read
    };
    [key: string]: any;
  };
};

// Canonical collection names (exact names as required)
export const RESUME_FEEDBACK_COLLECTION = "resume feedback";
export const RESUME_REVIEW_COLLECTION = "resume review";

/**
 * Adds a new resume feedback document to Firestore using Admin SDK.
 * The document id is auto-generated. analysisTimestamp and reviewerFeedback timestamps
 * are set to server timestamps on write.
 */
export async function addResumeFeedback(doc: ResumeFeedbackInput): Promise<string> {
  // Basic validation and clamping of scores to [0, 100]
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  const payload: FirebaseFirestore.DocumentData = {
    resumeId: String(doc.resumeId),
    candidateName: String(doc.candidateName),
    userId: String(doc.userId),
    resumeFileUrl: String(doc.resumeFileUrl),
    parsedSections: doc.parsedSections ?? {},
    extractedSkills: Array.isArray(doc.extractedSkills) ? doc.extractedSkills : [],
    matchedJobId: doc.matchedJobId ?? null,
    matchScore: clamp(Number(doc.matchScore)),
    overallScore: clamp(Number(doc.overallScore)),
    automatedFeedback: Array.isArray(doc.automatedFeedback) ? doc.automatedFeedback : [],
    reviewerFeedback: (doc.reviewerFeedback ?? []).map((r) => ({
      reviewerId: String(r.reviewerId),
      comment: String(r.comment),
      rating: typeof r.rating === "number" ? r.rating : undefined,
      timestamp: FieldValue.serverTimestamp(),
    })),
    suggestions: Array.isArray(doc.suggestions) ? doc.suggestions : [],
    actionsTaken: Array.isArray(doc.actionsTaken) ? doc.actionsTaken : [],
    analysisTimestamp: FieldValue.serverTimestamp(),
    parserVersion: String(doc.parserVersion),
    source: doc.source === "human" ? "human" : "auto",
    metadata: doc.metadata ?? {},
  };

  const ref = await db.collection(RESUME_FEEDBACK_COLLECTION).add(payload);
  return ref.id;
}

/**
 * Convenience query helpers (optional) for efficient lookups
 */
export function getUserResumeFeedbackQuery(userId: string) {
  return db
    .collection(RESUME_FEEDBACK_COLLECTION)
    .where("userId", "==", userId)
    .orderBy("analysisTimestamp", "desc");
}

export function getTopMatchesQuery(minScore: number = 70) {
  return db
    .collection(RESUME_FEEDBACK_COLLECTION)
    .where("matchScore", ">=", minScore)
    .orderBy("matchScore", "desc")
    .orderBy("analysisTimestamp", "desc");
}


/**
 * Adds a new resume review document to Firestore using Admin SDK.
 * Uses the collection name "resume review" as required.
 */
export async function addResumeReview(doc: ResumeFeedbackInput): Promise<string> {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  const payload: FirebaseFirestore.DocumentData = {
    resumeId: String(doc.resumeId),
    candidateName: String(doc.candidateName),
    userId: String(doc.userId),
    resumeFileUrl: String(doc.resumeFileUrl),
    parsedSections: doc.parsedSections ?? {},
    extractedSkills: Array.isArray(doc.extractedSkills) ? doc.extractedSkills : [],
    matchedJobId: doc.matchedJobId ?? null,
    matchScore: clamp(Number(doc.matchScore)),
    overallScore: clamp(Number(doc.overallScore)),
    automatedFeedback: Array.isArray(doc.automatedFeedback) ? doc.automatedFeedback : [],
    reviewerFeedback: (doc.reviewerFeedback ?? []).map((r) => ({
      reviewerId: String(r.reviewerId),
      comment: String(r.comment),
      rating: typeof r.rating === "number" ? r.rating : undefined,
      timestamp: FieldValue.serverTimestamp(),
    })),
    suggestions: Array.isArray(doc.suggestions) ? doc.suggestions : [],
    actionsTaken: Array.isArray(doc.actionsTaken) ? doc.actionsTaken : [],
    analysisTimestamp: FieldValue.serverTimestamp(),
    parserVersion: String(doc.parserVersion),
    source: doc.source === "human" ? "human" : "auto",
    metadata: doc.metadata ?? {},
  };

  const ref = await db.collection(RESUME_REVIEW_COLLECTION).add(payload);
  return ref.id;
}
