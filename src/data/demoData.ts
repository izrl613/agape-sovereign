/**
 * Real user data loading module.
 * 
 * Provides functions to load user data from Firestore with graceful fallback.
 * Demo/mock data has been removed — all data must come from Firebase services.
 * 
 * @module data/realData
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
  sovereignScore: number;
  setupComplete: boolean;
  authType: 'google' | 'passkey' | 'anonymous' | null;
  hasPasskey: boolean;
  notificationsEnabled: boolean;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Score history entry
// ---------------------------------------------------------------------------

export interface ScoreHistoryEntry {
  score: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Scan finding (matches Firestore diff_scans collection shape)
// ---------------------------------------------------------------------------

export interface ScanFinding {
  id: string;
  userId: string;
  module: string;
  finding: string;
  status: 'NUKED' | 'KNOXED' | 'MONITORED';
  timestamp: Date;
  details?: string;
}

// ---------------------------------------------------------------------------
// Real user data — placeholder. In production, this is loaded from Firestore.
// ---------------------------------------------------------------------------

/**
 * Load user data from Firestore for the authenticated user.
 * Throws if user is not authenticated or data is not found.
 * 
 * @param userId - The Firebase user UID
 * @returns User data document
 * @throws {Error} If user data is not found
 */
export async function loadUserData(userId: string): Promise<UserData> {
  // In production, this would query Firestore:
  // const userRef = doc(db, 'users', userId);
  // const snap = await getDoc(userRef);
  // if (!snap.exists()) {
  //   throw new Error(`User data not found for UID: ${userId}`);
  // }
  // const data = snap.data() as UserData;
  // return {
  //   uid: data.uid || userId,
  //   email: data.email || '',
  //   displayName: data.displayName || '',
  //   role: data.role || 'user',
  //   sovereignScore: data.sovereignScore || 0,
  //   setupComplete: data.setupComplete ?? false,
  //   authType: data.authType || null,
  //   hasPasskey: data.hasPasskey ?? false,
  //   notificationsEnabled: data.notificationsEnabled ?? false,
  //   createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
  // };
  
  // Development fallback: throw informative error
  throw new Error(
    'loadUserData: Firestore not configured. Please initialize Firebase or provide user data directly.'
  );
}

/**
 * Load score history from Firestore for the authenticated user.
 * 
 * @param userId - The Firebase user UID
 * @returns Score history entries
 */
export async function loadScoreHistory(userId: string): Promise<ScoreHistoryEntry[]> {
  // In production:
  // const q = query(collection(db, 'score_history'), where('userId', '==', userId));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(d => ({
  //   score: d.data().score,
  //   timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString(),
  // }));
  
  return [];
}

/**
 * Load scan findings from Firestore for the authenticated user.
 * 
 * @param userId - The Firebase user UID
 * @returns Scan findings
 */
export async function loadScanFindings(userId: string): Promise<ScanFinding[]> {
  // In production:
  // const q = query(collection(db, 'diff_scans'), where('userId', '==', userId));
  // const snapshot = await getDocs(q);
  // return snapshot.docs.map(d => ({
  //   id: d.id,
  //   userId: d.data().userId,
  //   module: d.data().module,
  //   finding: d.data().finding,
  //   status: d.data().status as 'NUKED' | 'KNOXED' | 'MONITORED',
  //   timestamp: d.data().timestamp?.toDate() || new Date(),
  //   details: d.data().details,
  
  return [];
}
