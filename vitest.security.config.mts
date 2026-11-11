import { defineConfig } from 'vitest/config';

/**
 * Security-focused test config.
 *
 * Deliberately does NOT load the React plugin: the live-gate and receipt tests
 * are plain TypeScript and only need Node + WebCrypto, which keeps this suite
 * runnable without the full frontend toolchain.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
