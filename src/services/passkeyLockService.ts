/**
 * passkeyLockService.ts — Sovereign Passkey Lock State Machine
 * ============================================================
 * Manages biometric lock gates for Vault and Identity zones.
 *
 * Web-native replacement for Android CredentialManager/CredentialHelper:
 *   - Uses navigator.credentials.get() via WebAuthn API
 *   - Simulation mode for headless/CI environments
 *   - Persists toggle state to localStorage
 *   - Lock state resets on page refresh (zones start locked if enabled)
 */

import { isPlatformAuthenticatorAvailable, isWebAuthnSupported } from '../lib/webauthn';
import { startAuthentication } from '@simplewebauthn/browser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PasskeyLockState {
  vaultLocked: boolean;
  identityLocked: boolean;
  vaultEnabled: boolean;
  identityEnabled: boolean;
  simulationMode: boolean;
}

export type LockZone = 'vault' | 'identity';

type Listener = (state: PasskeyLockState) => void;

// ─── Storage Key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agape_passkey_locks';

// ─── Default State ────────────────────────────────────────────────────────────

function loadPersistedToggles(): { vaultEnabled: boolean; identityEnabled: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        vaultEnabled: Boolean(parsed.vaultEnabled),
        identityEnabled: Boolean(parsed.identityEnabled),
      };
    }
  } catch {
    // Corrupted storage — start fresh
  }
  return { vaultEnabled: false, identityEnabled: false };
}

function persistToggles(vaultEnabled: boolean, identityEnabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ vaultEnabled, identityEnabled }));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

// ─── Singleton Lock Service ───────────────────────────────────────────────────

class PasskeyLockServiceImpl {
  private state: PasskeyLockState;
  private listeners: Set<Listener> = new Set();
  private simulationDetected: boolean | null = null;

  constructor() {
    const toggles = loadPersistedToggles();
    this.state = {
      // Zones start locked if enabled (security-first default)
      vaultLocked: toggles.vaultEnabled,
      identityLocked: toggles.identityEnabled,
      vaultEnabled: toggles.vaultEnabled,
      identityEnabled: toggles.identityEnabled,
      simulationMode: false,
    };

    // Async detection of simulation mode
    this.detectSimulationMode();
  }

  // ─── Simulation Detection ─────────────────────────────────────────────────

  private async detectSimulationMode(): Promise<void> {
    if (!isWebAuthnSupported()) {
      this.simulationDetected = true;
      this.updateState({ simulationMode: true });
      console.info('[PASSKEY-LOCK] Simulation mode: WebAuthn not supported');
      return;
    }

    try {
      const available = await isPlatformAuthenticatorAvailable();
      this.simulationDetected = !available;
      this.updateState({ simulationMode: !available });
      if (!available) {
        console.info('[PASSKEY-LOCK] Simulation mode: No platform authenticator detected');
      }
    } catch {
      this.simulationDetected = true;
      this.updateState({ simulationMode: true });
    }
  }

  // ─── State Management ─────────────────────────────────────────────────────

  getState(): PasskeyLockState {
    return { ...this.state };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<PasskeyLockState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => fn(this.getState()));
  }

  // ─── Toggle Controls ──────────────────────────────────────────────────────

  setZoneEnabled(zone: LockZone, enabled: boolean): void {
    if (zone === 'vault') {
      this.updateState({
        vaultEnabled: enabled,
        // When enabling, immediately lock. When disabling, unlock.
        vaultLocked: enabled,
      });
    } else {
      this.updateState({
        identityEnabled: enabled,
        identityLocked: enabled,
      });
    }
    persistToggles(this.state.vaultEnabled, this.state.identityEnabled);
  }

  // ─── Lock / Unlock ────────────────────────────────────────────────────────

  lockZone(zone: LockZone): void {
    if (zone === 'vault' && this.state.vaultEnabled) {
      this.updateState({ vaultLocked: true });
    } else if (zone === 'identity' && this.state.identityEnabled) {
      this.updateState({ identityLocked: true });
    }
  }

  /**
   * Request passkey unlock via WebAuthn assertion.
   * In simulation mode, bypasses the biometric gate.
   */
  async requestPasskeyUnlock(zone: LockZone): Promise<{ success: boolean; simulated: boolean }> {
    // Simulation mode bypass
    if (this.state.simulationMode) {
      console.info(`[PASSKEY-SIM] Simulated unlock for zone: ${zone}`);
      if (zone === 'vault') {
        this.updateState({ vaultLocked: false });
      } else {
        this.updateState({ identityLocked: false });
      }
      return { success: true, simulated: true };
    }

    try {
      // Use WebAuthn assertion for biometric verification.
      // We call the server to get a fresh challenge, then assert with the browser.
      const optionsRes = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reauth: true }),
      });

      if (!optionsRes.ok) {
        // If server is unavailable, fall back to simulation
        console.warn('[PASSKEY-LOCK] Server unavailable for challenge — falling back to simulation');
        if (zone === 'vault') this.updateState({ vaultLocked: false });
        else this.updateState({ identityLocked: false });
        return { success: true, simulated: true };
      }

      const options = await optionsRes.json();
      // Start browser-native biometric prompt (Touch ID / Face ID / Windows Hello)
      await startAuthentication({ optionsJSON: options });

      // If we get here, biometric passed
      if (zone === 'vault') {
        this.updateState({ vaultLocked: false });
      } else {
        this.updateState({ identityLocked: false });
      }
      return { success: true, simulated: false };
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        console.info('[PASSKEY-LOCK] User cancelled biometric prompt');
      } else {
        console.error('[PASSKEY-LOCK] Unlock failed:', error);
      }
      return { success: false, simulated: false };
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const passkeyLockService = new PasskeyLockServiceImpl();
