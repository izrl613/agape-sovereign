import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";

export enum AuditLogType {
  USER_LOGIN = "USER_LOGIN",
  SCAN_INITIATED = "SCAN_INITIATED",
  SCAN_COMPLETED = "SCAN_COMPLETED",
  ADMIN_ACTION = "ADMIN_ACTION",
  USER_REGISTERED = "USER_REGISTERED",
  USER_UPDATED = "USER_UPDATED",
  SECURITY_EVENT = "SECURITY_EVENT"
}

export interface AuditLogEntry {
  type: AuditLogType;
  userId?: string;
  userEmail?: string;
  action: string;
  timestamp: unknown;
  metadata?: Record<string, unknown>;
}

export const logEvent = async (
  type: AuditLogType, 
  action: string, 
  sessionHash: string, 
  metadata?: Record<string, unknown>
) => {
  try {
    const logData: Record<string, unknown> = {
      type,
      action,
      sessionHash,
      timestamp: serverTimestamp(),
      metadata: metadata || {}
    };
    
    await addDoc(collection(db, "audit_logs"), logData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "audit_logs");
  }
};
