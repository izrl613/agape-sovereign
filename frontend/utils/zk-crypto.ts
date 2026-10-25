/** Browser-safe ZK fingerprint. Avoids Node's `crypto` so the PWA can hash in-page. */
export const generateZkHash = (pageId: string, sessionToken: string = 'sovereign-session-default') => {
  const salt = 'sovereign-zk-salt-2026';
  const data = `${sessionToken}:${pageId}:${salt}`;
  let h = 2166136261;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `${hex}${hex}${hex}${hex}`.slice(0, 64).toUpperCase();
};
