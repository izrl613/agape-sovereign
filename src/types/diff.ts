export interface DiffModule {
  id: string;
  icon: string;
  label: string;
  vector: string;
  nuked: number;
  knoxed: number;
  monitored: number;
  severity: number;
  findings?: DiffFinding[];
}

export interface DiffFinding {
  type: "NUKED" | "KNOXED" | "MONITORED";
  label: string;
  detail: string;
  action: string;
}

export interface DiffModuleState {
  [moduleId: string]: DiffModule;
}