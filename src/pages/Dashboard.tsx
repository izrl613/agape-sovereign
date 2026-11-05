import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { SOVEREIGN_PALETTE } from '../theme/tokens';
import { SovereignCard, NeonButton, SovereignLabel } from '../components/UI';
import { DIFFEngine, SovereignState } from '../services/diffEngine';

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  background: ${SOVEREIGN_PALETTE.canvas};
  color: ${SOVEREIGN_PALETTE.iceWhite};
`;

const Sidebar = styled.nav`
  background: ${SOVEREIGN_PALETTE.surface};
  border-right: 1px solid ${SOVEREIGN_PALETTE.electricCyanOpacity};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MainContent = styled.main`
  padding: 40px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const StatusSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 50px;
`;

const GaugeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 250px;
  height: 250px;
`;

const GaugeCircle = styled.div<{ score: number }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 15px solid ${SOVEREIGN_PALETTE.surface};
  border-top-color: ${props => props.score > 70 ? SOVEREIGN_PALETTE.electricBlue : SOVEREIGN_PALETTE.burntOrange};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  transition: all 0.5s ease;
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
`;

const ModuleItem = styled.div<{ state: SovereignState }>`
  padding: 20px;
  border-radius: 12px;
  background: ${SOVEREIGN_PALETTE.surface};
  border: 2px solid ${props => props.state === SovereignState.KNOXED ? SOVEREIGN_PALETTE.electricBlue : SOVEREIGN_PALETTE.neonMagenta};
  box-shadow: ${props => props.state === SovereignState.KNOXED ? `0 0 10px ${SOVEREIGN_PALETTE.electricBlue}` : `0 0 10px ${SOVEREIGN_PALETTE.neonMagenta}`};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 0 20px ${props => props.state === SovereignState.KNOXED ? SOVEREIGN_PALETTE.electricBlue : SOVEREIGN_PALETTE.neonMagenta};
  }
`;

export const Dashboard: React.FC = () => {
  const [score, setScore] = useState(78);
  const [modules, setModules] = useState([
    { id: 'comm_email', name: 'Email Breach', state: SovereignState.KNOXED },
    { id: 'comm_phone', name: 'Phone Vector', state: SovereignState.NUKED },
    { id: 'comm_creds', name: 'Cred Vault', state: SovereignState.KNOXED },
    { id: 'comm_passkeys', name: 'Passkey Reg', state: SovereignState.KNOXED },
    { id: 'social_scanner', name: 'Social Scan', state: SovereignState.KNOXED },
    { id: 'social_brokers', name: 'Broker Rem', state: SovereignState.NUKED },
    { id: 'social_deepweb', name: 'Deep Web', state: SovereignState.KNOXED },
    { id: 'social_search', name: 'Search De-Idx', state: SovereignState.KNOXED },
    { id: 'hard_local', name: 'Local Files', state: SovereignState.KNOXED },
    { id: 'hard_mobile', name: 'Mobile Posture', state: SovereignState.KNOXED },
    { id: 'hard_cloud', name: 'Cloud Storage', state: SovereignState.KNOXED },
    { id: 'hard_network', name: 'Network Footprint', state: SovereignState.NUKED },
    { id: 'fin_identity', name: 'Financial ID', state: SovereignState.KNOXED },
    { id: 'fin_biometric', name: 'AI-Clone Def', state: SovereignState.KNOXED },
    { id: 'fin_oauth', name: 'OAuth Revoke', state: SovereignState.KNOXED },
    { id: 'fin_legal', name: 'Legal Ledger', state: SovereignState.KNOXED },
  ]);

  return (
    <PageContainer>
      <Sidebar>
        <h2 style={{ color: SOVEREIGN_PALETTE.electricBlue }}>AGAPE</h2>
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <NeonButton variant="blue">Home</NeonButton>
          <NeonButton variant="blue">Scan</NeonButton>
          <NeonButton variant="blue">Identity Map</NeonButton>
          <NeonButton variant="magenta">Findings (3)</NeonButton>
          <NeonButton variant="blue">Remediate</NeonButton>
          <NeonButton variant="blue">Report</NeonButton>
        </div>
      </Sidebar>

      <MainContent>
        <Header>
          <h1>Architect AI</h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: SOVEREIGN_PALETTE.electricBlue }}>Sovereign User</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Free • Sovereign Mode</div>
          </div>
        </Header>

        <StatusSection>
          <SovereignCard style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0 }}>SOVEREIGN STATUS</h3>
              <p style={{ color: SOVEREIGN_PALETTE.electricCyanOpacity }}>Your Digital Identity Health</p>
            </div>
            <GaugeContainer>
              <GaugeCircle score={score}>{score}</GaugeCircle>
            </GaugeContainer>
          </SovereignCard>

          <SovereignCard>
            <h3>QUICK ACTIONS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <NeonButton variant="blue">Full Scan</NeonButton>
              <NeonButton variant="magenta">Remediate All</NeonButton>
              <NeonButton variant="orange">Export PDF</NeonButton>
              <NeonButton variant="blue">Lock Vault</NeonButton>
            </div>
          </SovereignCard>
        </StatusSection>

        <h2 style={{ marginBottom: '20px' }}>16 UNIQUE IDENTITY MODULES</h2>
        <ModuleGrid>
          {modules.map(m => (
            <ModuleItem key={m.id} state={m.state}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{m.name}</div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: m.state === SovereignState.KNOXED ? SOVEREIGN_PALETTE.electricBlue : SOVEREIGN_PALETTE.neonMagenta 
              }}>
                {m.state === SovereignState.KNOXED ? '🛡️ KNOXED' : '🔥 NUKED'}
              </div>
            </ModuleItem>
          ))}
        </ModuleGrid>
      </MainContent>
    </PageContainer>
  );
};
