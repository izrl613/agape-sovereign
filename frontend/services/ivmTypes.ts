export interface IVMModule {
  id: string;
  label: string;
  vector: string;
  icon: string;
  severity: number;
  nuked: number;
  knoxed: number;
  monitored: number;
  pillar: string;
  capability: string;
  techniques: string[];
}

export interface IVMData {
  [moduleId: string]: Record<string, any>;
}

export interface SovereignIdentityBlueprint {
  version: string;
  userId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  ivmData: Record<string, Record<string, any>>;
  sovereignScore: number;
  tier: string;
  sha256Seal: string;
  exportVersion: number;
}