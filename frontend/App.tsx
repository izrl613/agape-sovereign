import React from 'react';
import { DavidianCortex } from './BrainApp';

export type AppView = 'DASHBOARD' | 'MODULE' | 'ARCHITECT' | 'REPORT';

export default function App() {
  return <DavidianCortex />;
}
