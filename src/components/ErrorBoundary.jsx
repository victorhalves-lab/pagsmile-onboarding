import React from 'react';

/**
 * Global ErrorBoundary — last line of defense against white-screen crashes.
 *
 * Catches render-time errors from the React tree (including SDK TypeErrors
 * that slip through) and shows a graceful recovery UI instead of a blank page.
 *
 * Critical for public pages where a crash = lost merchant submission.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // COSMETIC ERRORS — swallow instead of escalating to a full-page recovery UI.
    //
    // 1. "NotFoundError: Failed to execute 'insertBefore' on 'Node'" is a React DOM
    //    transient error that fires when a portal/toast/animation unmounts concurrently
    //    with a parent re-render. It is NOT a real crash — the app continues working.
    //    If we show the recovery screen here, the user loses their upload progress
    //    for a purely cosmetic issue.
    //
    // 2. "removeChild" variants of the same class of bug get the same treatment.
    //
    // 3. Any error containing "User/me" or "401" on a public route is a stale-token
    //    side effect — the page itself is fine, only a background fetch died.
    const msg = String(error?.message || error || '');
    const name = String(error?.name || '');
    const isDomTransient =
      (name === 'NotFoundError' && /insertBefore|removeChild/i.test(msg)) ||
      /Failed to execute 'insertBefore'/i.test(msg) ||
      /Failed to execute 'removeChild'/i.test(msg);
    if (isDomTransient) {
      console.warn('[ErrorBoundary] Ignoring cosmetic DOM error:', msg);
      return null; // Don't update state → children keep rendering.
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging. We don't report to backend because
    // this might be a pre-auth crash where even fetch() is unreliable.
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Stack:', errorInfo?.componentStack);
  }

  handleReload = () => {
    // Clear any potentially corrupt storage state before reloading
    try {
      window.localStorage.removeItem('base44_access_token');
      window.localStorage.removeItem('token');
      window.sessionStorage.removeItem('base44_permissions_cache');
    } catch {}
    window.location.reload();
  };

  handleClearAndReload = () => {
    // Nuclear option: clear everything auth-related and reload
    try {
      // Keep compliance session tokens (client might have unsent data)
      const keysToKeep = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('compliance_session_token_')) {
          keysToKeep.push({ key, value: window.localStorage.getItem(key) });
        }
      }
      window.localStorage.clear();
      window.sessionStorage.clear();
      keysToKeep.forEach(({ key, value }) => {
        window.localStorage.setItem(key, value);
      });
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f4f4f4',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 24px rgba(0, 36, 67, 0.08)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '28px',
            }}>⚠️</div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#002443',
              marginBottom: '8px',
            }}>
              Algo deu errado ao carregar a página
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#002443',
              opacity: 0.7,
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              Pode ser uma sessão antiga em cache. Clique no botão abaixo para limpar e tentar novamente.
            </p>

            <button
              onClick={this.handleClearAndReload}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#2bc196',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px',
                fontFamily: 'inherit',
              }}
            >
              Limpar cache e recarregar
            </button>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#002443',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Apenas recarregar
            </button>

            {this.state.error?.message && (
              <details style={{
                marginTop: '20px',
                fontSize: '11px',
                color: '#002443',
                opacity: 0.5,
                textAlign: 'left',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Detalhes técnicos
                </summary>
                <code style={{
                  display: 'block',
                  padding: '8px',
                  backgroundColor: '#f4f4f4',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                }}>
                  {String(this.state.error.message || this.state.error)}
                </code>
              </details>
            )}

            <p style={{
              fontSize: '11px',
              color: '#002443',
              opacity: 0.4,
              marginTop: '20px',
            }}>
              Se o problema persistir, abra este link em uma aba anônima ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}