import { 
  fetchAndActivate, 
  getValue, 
  getString, 
  getBoolean, 
  getNumber 
} from "firebase/remote-config";
import { remoteConfig } from "../firebase";

// Default values for development
const DEFAULT_CONFIG = {
  enable_dark_web_scan: true,
  max_scan_frequency_hours: 24,
  maintenance_mode: false,
  ai_model_version: "gemini-3.1-pro-preview"
};

export const initializeRemoteConfig = async () => {
  remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
  remoteConfig.defaultConfig = DEFAULT_CONFIG;
  
  try {
    await fetchAndActivate(remoteConfig);
    console.log("Remote Config activated");
  } catch (err) {
    console.error("Remote Config failed to fetch", err);
  }
};

export const getFeatureFlag = (key: string): boolean => {
  return getBoolean(remoteConfig, key);
};

export const getConfigString = (key: string): string => {
  return getString(remoteConfig, key);
};

export const getConfigNumber = (key: string): number => {
  return getNumber(remoteConfig, key);
};
