// Seed script: creates one document in the "resume review" collection using Firebase Admin SDK
// Usage:
//  1) Ensure env vars are set (see below) or create .env in AI-Resume-Analyser directory
//  2) Run: npm run seed:resume-review
//
// Required env vars for service account:
//  - FIREBASE_PROJECT_ID
//  - FIREBASE_CLIENT_EMAIL
//  - FIREBASE_PRIVATE_KEY (with \n escaped as \n)

import 'dotenv/config';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function initAdmin() {
  const apps = getApps();
  if (!apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      // Fallback to ADC if service account is not provided
      initializeApp({ credential: applicationDefault() });
    }
  }
  return getFirestore();
}

async function main() {
  const db = initAdmin();

  const doc = {
    resumeId: 'res_seed_review_001',
    candidateName: 'Seed Candidate',
    userId: 'seed_user_001',
    resumeFileUrl: 'https://example.com/resumes/res_seed_review_001.pdf',
    parsedSections: {
      summary: 'Seeded resume review for collection creation test.',
      experience: [{ company: 'DemoCorp', role: 'Engineer', start: '2023-01', bullets: ['Did demo work'] }],
      education: [{ school: 'VIT', degree: 'B.Tech', year: 2022 }],
      skills: ['TypeScript', 'Firebase', 'Firestore'],
      projects: [{ name: 'ATS Analyzer', desc: 'Seed project' }],
    },
    extractedSkills: ['TypeScript', 'Firebase', 'Firestore'],
    matchedJobId: null,
    matchScore: 78,
    overallScore: 82,
    automatedFeedback: [{ type: 'keyword', message: 'Good alignment', confidence: 0.85 }],
    reviewerFeedback: [
      {
        reviewerId: 'rev_seed',
        comment: 'Auto-seeded review',
        rating: 5,
        timestamp: FieldValue.serverTimestamp(),
      },
    ],
    suggestions: ['Add metrics to achievements'],
    actionsTaken: ['seeded'],
    analysisTimestamp: FieldValue.serverTimestamp(),
    parserVersion: 'v1.0.0',
    source: 'auto',
    metadata: { toolVersion: 'seed-0.1.0' },
  };

  const ref = await db.collection('resume review').add(doc);
  console.log('Seeded resume review with id:', ref.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
