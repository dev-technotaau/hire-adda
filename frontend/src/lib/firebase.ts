import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let database: Database | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    try {
      messaging = getMessaging(getFirebaseApp());
    } catch {
      console.warn('[Firebase] Messaging not supported');
      return null;
    }
  }
  return messaging;
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    const msg = getFirebaseMessaging();
    if (!msg) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
    const token = await getToken(msg, { vapidKey });
    return token;
  } catch (error) {
    console.warn('[Firebase] Failed to get FCM token:', error);
    return null;
  }
}

export function onFCMMessage(
  callback: (payload: { title?: string; body?: string }) => void,
): (() => void) | null {
  const msg = getFirebaseMessaging();
  if (!msg) return null;

  return onMessage(msg, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
}

export function getFirebaseDatabase(): Database | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.databaseURL) return null;
  if (!database) {
    try {
      database = getDatabase(getFirebaseApp());
    } catch {
      console.warn('[Firebase] Realtime Database not supported');
      return null;
    }
  }
  return database;
}

export function getFirebaseFirestore(): Firestore | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.projectId) return null;
  if (!firestoreInstance) {
    try {
      firestoreInstance = getFirestore(getFirebaseApp());
    } catch {
      console.warn('[Firebase] Firestore not supported');
      return null;
    }
  }
  return firestoreInstance;
}
