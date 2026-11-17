import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Agape Sovereign UI] Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#060c1a',
          color: '#e8f4ff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Rajdhani', Inter, sans-serif",
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            background: 'rgba(6, 12, 26, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)',
            borderRadius: 16,
            padding: '36px 28px',
          }}>
            <div style={{
              width: 50,
              height: 50,
              margin: '0 auto 16px',
              borderRadius: 10,
              border: '1px solid #FF2E9F',
              background: 'rgba(255, 46, 159, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#FF2E9F',
            }}>
              ⚠
            </div>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 20,
              color: '#00D4FF',
              margin: '0 0 10px',
              letterSpacing: '1px',
            }}>
              ENCLAVE RESTORATION
            </h2>
            <p style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              An interface error occurred during render. You can return to the home page or reload the security enclave.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '12px',
                fontSize: 11,
                color: '#FF7A18',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 24,
                fontFamily: "'Share Tech Mono', monospace",
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                style={{
                  background: 'rgba(0, 212, 255, 0.12)',
                  border: '1px solid #00D4FF',
                  color: '#00D4FF',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                RETURN HOME
              </button>
              <button
                type="button"
                onClick={() => { this.setState({ hasError: false, error: null }); }}
                style={{
                  background: 'rgba(255, 46, 159, 0.12)',
                  border: '1px solid #FF2E9F',
                  color: '#FF2E9F',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
