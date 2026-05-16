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
    this.state = { hasError: false, error: null, healKey: 0 };
    this._recentTransients = [];
    this._loopGuardUntil = 0;
  }

  static _isTransient(error) {
    const msg = String(error?.message || error || '');
    const name = String(error?.name || '');
    const stack = String(error?.stack || '');

    // 1. DOM-mutation errors caused by browser extensions (Google Translate,
    //    Grammarly, LastPass, ad-blockers) that move/remove DOM nodes underneath
    //    React. The app state is intact — just remount.
    const isDomTransient =
      (name === 'NotFoundError' && /insertBefore|removeChild|appendChild/i.test(msg)) ||
      /Failed to execute 'insertBefore'/i.test(msg) ||
      /Failed to execute 'removeChild'/i.test(msg) ||
      /Failed to execute 'appendChild'/i.test(msg) ||
      /The node .* is not a child of this node/i.test(msg);
    if (isDomTransient) return true;

    // 2. Base44 SDK's async "instanceof is not callable" — fires from a
    //    MessagePort after a 401 on the User/me endpoint for anonymous users.
    //    The page state is fine; only the SDK's background fetch failed.
    //    Silent heal keeps public pages (onboarding, compliance) alive.
    const isSdkInstanceofCrash =
      msg.includes("Right-hand side of 'instanceof' is not callable") ||
      (name === 'TypeError' && /instanceof/i.test(msg)) ||
      (/MessagePort/i.test(stack) && /instanceof/i.test(stack));
    if (isSdkInstanceofCrash) return true;

    return false;
  }

  static getDerivedStateFromError(error) {
    // CRITICAL: Always mark `hasError: true` synchronously here. React calls
    // this BEFORE the next render, so returning `{ hasError: false }` for
    // "transients" causes React to immediately re-render the same broken
    // children, which throws again → infinite loop (see `inpage.js` freeze bug).
    // Transient recovery is now handled by `componentDidCatch` bumping healKey.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const isTransient = ErrorBoundary._isTransient(error);
    const now = Date.now();

    // ── CRITICAL ERROR CLASS DETECTOR ──
    // "Cannot access 'X' before initialization" = Temporal Dead Zone bug. Build-time
    // mistake (useMemo using a const declared later). NEVER transient. ALWAYS log.
    // We surface a special tag so the suporte team can filter these instantly.
    const msg = String(error?.message || error || '');
    const isTdz = /Cannot access ['"]?\w+['"]? before initialization/i.test(msg);
    const isHoistBug = /is not defined/i.test(msg) || /is not a function/i.test(msg);
    const errorClass = isTdz ? 'TDZ_BUG' : isHoistBug ? 'HOIST_BUG' : (error?.name || 'UnknownError');

    // ── DEBUG LOG ── Shows exactly which error hit this boundary and how often.
    this._totalErrors = (this._totalErrors || 0) + 1;
    console.warn(
      `[ErrorBoundary/global] error #${this._totalErrors}`,
      { name: error?.name, message: String(error?.message || error).slice(0, 200), isTransient },
      'componentStack head:',
      String(errorInfo?.componentStack || '').split('\n').slice(0, 6).join('\n')
    );

    // Hard loop guard: if we catch >5 errors in <500ms, stop trying to recover
    // and show the fallback. Prevents browser freeze from fetch spam.
    this._recentTransients = this._recentTransients.filter(t => now - t < 500);
    this._recentTransients.push(now);
    const isLooping = this._recentTransients.length > 5 || now < this._loopGuardUntil;

    if (isTransient && !isLooping) {
      // Transient: silently remount subtree via healKey bump. Do NOT log
      // (SDK fires this dozens of times; logging saturates rate limit).
      // Keep hasError=false so the fallback doesn't flash.
      this._loopGuardUntil = now + 100; // debounce back-to-back remounts
      this.setState(s => ({ hasError: false, error: null, healKey: s.healKey + 1 }));
      return;
    }

    if (isTransient && isLooping) {
      // Transient but looping — give up healing, show fallback.
      return;
    }

    // Log real errors to console for debugging.
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Stack:', errorInfo?.componentStack);

    // Report to backend so we can diagnose real client crashes without asking
    // the user to screenshot DevTools. Uses fetch directly (no SDK) to work
    // even when the app is in a broken state.
    try {
      const payload = {
        stage: isTdz ? 'error_boundary_TDZ_BUG' : 'error_boundary',
        errorMessage: String(error?.message || error || 'unknown'),
        extra: {
          errorName: String(error?.name || ''),
          errorClass,
          isTdz,
          stack: String(error?.stack || '').slice(0, 3000),
          componentStack: String(errorInfo?.componentStack || '').slice(0, 3000),
          url: typeof window !== 'undefined' ? window.location.href : '',
          search: typeof window !== 'undefined' ? window.location.search : '',
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };
      const urlParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search) : null;
      if (urlParams?.get('caseId')) payload.caseId = urlParams.get('caseId');
      fetch('/functions/logPublicClientError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {}); // fire-and-forget
    } catch {}
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

    // Key bump remounts the tree after a DOM transient, clearing stale refs.
    // NOTE: using a plain <div> wrapper (not React.Fragment) because Vite dev
    // injects `data-source-location` props into elements — Fragment rejects
    // any prop other than `key`/`children` and crashes with a cryptic
    // "instanceof is not callable" TypeError that breaks the boundary itself.
    return (
      <div key={this.state.healKey} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    );
  }
}