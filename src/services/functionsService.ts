import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export const checkBackendHealth = async () => {
  const healthCheck = httpsCallable(functions, 'healthCheck');
  try {
    const result = await healthCheck();
    return result.data as string;
  } catch (error) {
    console.error("Functions health check failed:", error);
    return null;
  }
};

export const triggerModuleScan = async (module: string) => {
  // Example of calling a function that might be implemented later
  const runScan = httpsCallable(functions, 'runModuleScan');
  try {
    const result = await runScan({ module });
    return result.data;
  } catch (error) {
    console.error(`Functions scan trigger failed for ${module}:`, error);
    throw error;
  }
};
