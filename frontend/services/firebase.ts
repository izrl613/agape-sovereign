import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase/config.json';
import { DiffVector, UserProfile, TelemetryLog, AdminTelemetryState } from '../types';

// Memoized Firebase initialization
export const app = initializeApp(firebaseConfig.webAppConfig);
export const db = getFirestore(app, firebaseConfig.databaseId);
export const auth = getAuth(app);

// Authentication helper guaranteeing an authenticated session
export const initAuthSession = (onUserReady: (user: User) => void): (() => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onUserReady(user);
    } else {
      signInAnonymously(auth).catch((err) => {
        console.error('Anonymous auth error:', err);
      });
    }
  });
};

// Real-time listener for the user's sovereign profile & 16 DIFF vectors
export const subscribeToUserEnclave = (
  userId: string,
  onData: (data: { profile?: UserProfile; vectors?: DiffVector[] }) => void,
  onError?: (error: Error) => void
) => {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        onData({
          profile: raw.profile as UserProfile,
          vectors: raw.vectors as DiffVector[],
        });
      } else {
        onData({});
      }
    },
    (err) => {
      console.warn('Firestore snapshot subscription warning:', err);
      onError?.(err);
    }
  );
};

// Persist live user enclave data to Firestore
export const saveUserEnclaveData = async (
  userId: string,
  profile: UserProfile,
  vectors: DiffVector[]
) => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(
    userDocRef,
    {
      profile: {
        ...profile,
        lastUpdated: new Date().toISOString(),
      },
      vectors,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

// Record live operational telemetry event
export const logLiveTelemetry = async (
  serviceName: string,
  operation: string,
  status: 'OPTIMAL' | 'SECURED' | 'ALERT',
  latencyMs: number,
  shaFingerprint: string
) => {
  try {
    const colRef = collection(db, 'admin_telemetry');
    await addDoc(colRef, {
      serviceName,
      operation,
      status,
      latencyMs,
      shaFingerprint,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });
  } catch (err) {
    console.debug('Telemetry write skipped or local:', err);
  }
};

// Real-time listener for operational admin telemetry
export const subscribeToTelemetryLogs = (
  onLogs: (logs: TelemetryLog[]) => void
) => {
  const colRef = collection(db, 'admin_telemetry');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(25));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: TelemetryLog[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          timestamp: data.timestamp || new Date().toISOString(),
          serviceName: data.serviceName || 'EnclaveNode',
          status: data.status || 'OPTIMAL',
          latencyMs: data.latencyMs || 1.2,
          operation: data.operation || 'Sync',
          shaFingerprint: data.shaFingerprint || 'hash',
        };
      });
      onLogs(records);
    },
    (err) => {
      console.debug('Telemetry subscription notice:', err);
    }
  );
};
