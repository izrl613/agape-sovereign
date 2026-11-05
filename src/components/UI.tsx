import React from 'react';
import styled from 'styled-components';
import { SOVEREIGN_PALETTE, NEON } from '../theme/tokens';

export const SovereignCard = styled.div`
  background: ${SOVEREIGN_PALETTE.surface};
  border-radius: 12px;
  padding: 20px;
  color: ${SOVEREIGN_PALETTE.ice};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const NeonButton = styled.button<{ variant?: 'magenta' | 'blue' | 'orange' }>`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: ${SOVEREIGN_PALETTE.ice};
  transition: all 0.3s ease;

  background: ${props => {
    switch(props.variant) {
      case 'magenta': return SOVEREIGN_PALETTE.magenta;
      case 'orange': return SOVEREIGN_PALETTE.orange;
      default: return SOVEREIGN_PALETTE.cyan;
    }
  }};

  &:hover {
    filter: brightness(1.2);
    box-shadow: 0 0 15px ${props => {
      switch(props.variant) {
        case 'magenta': return SOVEREIGN_PALETTE.magenta;
        case 'orange': return SOVEREIGN_PALETTE.orange;
        default: return SOVEREIGN_PALETTE.cyan;
      }
    }};
  }
`;

export const SovereignLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: ${NEON.textMuted};
  font-weight: 500;
`;

export const NeonInput = styled.input`
  width: 100%;
  padding: 10px;
  background: ${SOVEREIGN_PALETTE.surface};
  border: 1px solid ${NEON.textMuted};
  border-radius: 6px;
  color: ${SOVEREIGN_PALETTE.ice};
  outline: none;

  &:focus {
    border-color: ${SOVEREIGN_PALETTE.cyan};
    box-shadow: 0 0 8px ${SOVEREIGN_PALETTE.cyan};
  }
`;
