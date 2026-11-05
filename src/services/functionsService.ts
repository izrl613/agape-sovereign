import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { RequestBatcher } from "./requestBatcher";

const batcher = new RequestBatcher();

export const checkBackendHealth = async () => {
  return batcher.enqueueRequest(async () => {
    const healthCheck = httpsCallable(functions, 'healthCheck');
    try {
      const result = await healthCheck();
      return result.data as string;
    } catch (error) {
      console.error("Functions health check failed:", error);
      return null;
    }
  });
};

export const triggerModuleScan = async (module: string) => {
  return batcher.enqueueRequest(async () => {
    const runScan = httpsCallable(functions, 'runModuleScan');
    try {
      const result = await runScan({ module });
      return result.data;
    } catch (error) {
      console.error(`Functions scan trigger failed for ${module}:`, error);
      throw error;
    }
  });
};
