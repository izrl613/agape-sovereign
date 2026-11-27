import React from 'react';
import { LiveMetricsDashboard } from './LiveMetricsDashboard';

/**
 * Live Operations View — backed exclusively by live Cloud Firestore telemetry.
 * Zero mock, simulated, or hardcoded operational data.
 */
export const LiveOpsView: React.FC = () => {
  return <LiveMetricsDashboard />;
};
