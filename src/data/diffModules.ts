import { DiffModule } from "../types/diff";

export const BASE_MODULES: DiffModule[] = [
  { id: "email", icon: "✉", label: "Email Breach Scanner", vector: "V-01", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "social", icon: "◈", label: "Social Media Footprint", vector: "V-02", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "device", icon: "⬡", label: "Device File Scan", vector: "V-03", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "mobile", icon: "◻", label: "Mobile Security Layer", vector: "V-04", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "deepweb", icon: "◉", label: "Deep Web Exposure", vector: "V-05", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "broker", icon: "⧫", label: "Data Broker Removal", vector: "V-06", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "password", icon: "⬟", label: "Password Vault Analysis", vector: "V-07", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "location", icon: "◎", label: "Location Data Footprint", vector: "V-08", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "browser", icon: "◯", label: "Browser & Cookie Tracker", vector: "V-09", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "financial", icon: "⬡", label: "Financial Identity Exposure", vector: "V-10", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "medical", icon: "⊕", label: "Medical Data Footprint", vector: "V-11", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "biometric", icon: "⊛", label: "Voice & Biometric Data", vector: "V-12", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "iot", icon: "⊡", label: "IoT & Smart Device Scan", vector: "V-13", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "cloud", icon: "⊞", label: "Cloud Storage Exposure", vector: "V-14", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "darkweb", icon: "◈", label: "Dark Web Monitoring", vector: "V-15", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
  { id: "behavioral", icon: "⊟", label: "Behavioral Profile Analysis", vector: "V-16", nuked: 0, knoxed: 0, monitored: 0, severity: 100, findings: [] },
];

export const DEFAULT_MODULE_DATA = BASE_MODULES.map(m => ({ ...m }));

export const ADMIN_EMAILS = ["idin@agape.nyc", "agape@sovereign.nyc"];