import React from 'react';
import styled from 'styled-components';
import { SOVEREIGN_PALETTE } from '../../theme/tokens';

const AdminContainer = styled.div`
  padding: 40px;
  background: ${SOVEREIGN_PALETTE.canvas};
  min-height: 100vh;
  color: ${SOVEREIGN_PALETTE.iceWhite};
`;

const TelemetryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const TelemetryCard = styled.div`
  background: ${SOVEREIGN_PALETTE.surface};
  border: 1px solid ${SOVEREIGN_PALETTE.electricBlue};
  border-radius: 16px;
  padding: 24px;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${SOVEREIGN_PALETTE.electricBlue};
  margin: 10px 0;
`;

export const AdminPortal: React.FC = () => {
  return (
    <AdminContainer>
      <h1>Sovereign Admin Portal</h1>
      <p style={{ color: SOVEREIGN_PALETTE.electricCyanOpacity }}>
        Infrastructure Monitoring & Operational Intelligence
      </p>

      <TelemetryGrid>
        <TelemetryCard>
          <h3>AI Quota (RPM)</h3>
          <MetricValue>12 / 15</MetricValue>
          <span>Requests Per Minute</span>
        </TelemetryCard>
        <TelemetryCard>
          <h3>Firestore Reads</h3>
          <MetricValue>42k / 50k</MetricValue>
          <span>Daily Reads Limit</span>
        </TelemetryCard>
        <TelemetryCard>
          <h3>Firestore Writes</h3>
          <MetricValue>12k / 20k</MetricValue>
          <span>Daily Writes Limit</span>
        </TelemetryCard>
        <TelemetryCard>
          <h3>App Check Pass Rate l</h3>
          <MetricValue>99.8%</MetricValue>
          <span>JWT Attestation Rate</span>
        </TelemetryCard>
      </TelemetryGrid>
    </AdminContainer>
  );
};
