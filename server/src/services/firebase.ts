import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Identity } from '../models/profile.js';

export async function verifyFirebaseToken(token: string): Promise<Identity> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase project ID is not configured');
  const app = getApps()[0] ?? initializeApp({ projectId });
  return getAuth(app).verifyIdToken(token);
}
