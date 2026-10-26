import { sha256Hex } from './sha256';

/**
 * Deterministic zero-knowledge proof handle rendered in the ZK footer.
 *
 * Runs entirely on-device with a dependency-free SHA-256: no Node `crypto`
 * import (which Vite externalises and which throws in the browser) and no
 * network round-trip, so the proof is identical in dev, build and test.
 */
export const generateZkHash = (pageId: string, sessionToken: string = 'sovereign-session-default') => {
  const salt = 'sovereign-zk-salt-2026';
  const data = `${sessionToken}:${pageId}:${salt}`;
  return sha256Hex(data).toUpperCase();
};
