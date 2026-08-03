export interface ScanStatusCounts {
  nuked: number;
  knoxed: number;
  monitored: number;
}

export function countScanStatuses<T extends { status: string }>(
  findings: readonly T[],
): ScanStatusCounts {
  return findings.reduce<ScanStatusCounts>(
    (counts, finding) => {
      if (finding.status === 'NUKED') counts.nuked += 1;
      if (finding.status === 'KNOXED') counts.knoxed += 1;
      if (finding.status === 'MONITORED') counts.monitored += 1;
      return counts;
    },
    { nuked: 0, knoxed: 0, monitored: 0 },
  );
}
