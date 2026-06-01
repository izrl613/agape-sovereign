import { logEvent as firebaseLogEvent, setUserId, setUserProperties } from "firebase/analytics";
import { analytics } from "../firebase";

export const logUserEvent = async (eventName: string, params?: Record<string, any>) => {
  const instance = await analytics;
  if (instance) {
    firebaseLogEvent(instance, eventName, params);
  }
};

export const setAnalyticsUser = async (userId: string, properties?: Record<string, any>) => {
  const instance = await analytics;
  if (instance) {
    setUserId(instance, userId);
    if (properties) {
      setUserProperties(instance, properties);
    }
  }
};

export const logScanStarted = (scanType: string) => {
  logUserEvent('scan_started', { scan_type: scanType });
};

export const logExposureNuked = (module: string, findingId: string) => {
  logUserEvent('exposure_nuked', { module, finding_id: findingId });
};

export const logAIChatMessage = (messageLength: number) => {
  logUserEvent('ai_chat_message', { message_length: messageLength });
};
