import crypto from 'crypto';

export const generateZkHash = (pageId: string, sessionToken: string = 'sovereign-session-default') => {
  const salt = 'sovereign-zk-salt-2026';
  const data = `${sessionToken}:${pageId}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
};
