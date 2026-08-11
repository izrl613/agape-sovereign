import { auth } from '../firebase';
import { toast } from 'sonner';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

/**
 * Extracts a Firestore error code from an unknown error object.
 */
function getFirestoreCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code || '');
  }
  return '';
}

/**
 * Returns true for errors that are transient / race-condition related and
 * should be swallowed silently (console-only) rather than shown in a toast.
 *
 * Examples:
 *  - permission-denied right after sign-in: Firestore token propagation lag.
 *  - unavailable: Firestore offline — already handled by offline UI.
 *  - unauthenticated: fires briefly during logout / tab focus.
 */
function isSilentError(code: string, error: unknown): boolean {
  const silentCodes = [
    'permission-denied',   // token propagation lag on fresh sign-in
    'unauthenticated',     // brief gap during auth state change
    'unavailable',         // Firestore offline — not actionable by user
    'cancelled',           // listener cancelled on unmount
  ];
  if (silentCodes.includes(code)) return true;

  const msg = error instanceof Error ? error.message : String(error);
  // Suppress the "offline" probe error from firebase.ts boot
  if (msg.includes('the client is offline')) return true;
  return false;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  { silent = false }: { silent?: boolean } = {}
) {
  const code = getFirestoreCode(error);

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error('[Firestore Error]', { code, ...errInfo });

  // Silently log transient errors — never surface them as toast notifications
  if (silent || isSilentError(code, error)) {
    return;
  }

  // User-facing messages for persistent, actionable errors only
  const userMsg = code === 'not-found'
    ? 'Record not found.'
    : code === 'already-exists'
      ? 'Record already exists.'
      : errInfo.error;

  toast.error(`Database Error: ${userMsg}`, {
    description: `Operation: ${operationType}`,
    duration: 5000
  });
}
