import React from 'react';
import { NEON } from '../theme';

interface State {
  error: Error | null;
}

/**
 * Last line of defence for the authenticated shell.
 *
 * Without this, a single bad prop anywhere in the dashboard tree unmounts the
 * whole app and the user gets a blank screen — which is indistinguishable from
 * "login didn't work". This shows the failure, keeps the session, and offers a
 * path back.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep the console breadcrumb — no PII, matching the Privacy Policy's
    // "application error reports (no personal data included)".
    console.error('[Sovereign] shell error:', error.message, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#060C1A',
          color: '#E8F4FF',
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            padding: '26px 24px',
            borderRadius: 14,
            border: `1px solid ${NEON.orange}55`,
            background: 'rgba(255,122,24,0.05)',
          }}
        >
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.24em',
              color: NEON.orange,
              marginBottom: 12,
            }}
          >
            SHELL FAULT · RECOVERABLE
          </div>
          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              margin: '0 0 10px',
            }}
          >
            This view failed to render
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(232,244,255,0.7)', margin: '0 0 14px' }}>
            Your session is intact. Reload the dashboard, or return to the login portal if the fault
            repeats.
          </p>
          <pre
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              lineHeight: 1.6,
              color: 'rgba(255,178,122,0.9)',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,122,24,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              overflowX: 'auto',
              margin: '0 0 16px',
            }}
          >
            {error.message}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.reset}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.14em',
                padding: '9px 16px',
                borderRadius: 7,
                border: `1px solid ${NEON.blue}66`,
                background: 'rgba(0,212,255,0.08)',
                color: NEON.blue,
                cursor: 'pointer',
              }}
            >
              RETRY VIEW
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.14em',
                padding: '9px 16px',
                borderRadius: 7,
                border: '1px solid rgba(255,122,24,0.5)',
                background: 'rgba(255,122,24,0.08)',
                color: NEON.orange,
                cursor: 'pointer',
              }}
            >
              RELOAD /dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
