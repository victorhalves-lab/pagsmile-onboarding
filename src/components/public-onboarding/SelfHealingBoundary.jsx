import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * Self-healing error boundary for the public onboarding.
 *
 * Strategy:
 * - Catch any render/commit error (most commonly `NotFoundError: insertBefore`
 *   caused by Chrome Translate / Grammarly / A11y extensions mutating the DOM).
 * - Log it once to the server for observability.
 * - Auto-remount the child tree by bumping a key — user barely notices a flicker,
 *   instead of seeing a dead-end red screen.
 * - If the same error repeats 3+ times in <10s, fall back to a friendly recovery
 *   UI with a Reload button (prevents infinite crash loops).
 *
 * Why a custom boundary here (and not the global one):
 *  - The global ErrorBoundary is designed for authenticated pages and shows a
 *    "Clean cache" screen which is scary for end clients doing onboarding.
 *  - This one recovers silently when safe, and degrades gracefully when not.
 */
export default class SelfHealingBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { attemptKey: 0, fatal: false };
    this._recentErrors = [];
  }

  static getDerivedStateFromError() {
    // Mark fatal synchronously. If the error turns out to be benign/transient,
    // componentDidCatch will clear the flag and bump attemptKey to remount.
    // NEVER return `{}` here: that lets React re-render the broken children
    // immediately, which re-throws → infinite loop freezing the browser.
    return { fatal: true };
  }

  componentDidCatch(err, info) {
    const msg = String(err?.message || err || '');
    const stack = String(err?.stack || info?.componentStack || '');
    const now = Date.now();

    // ── DEBUG LOG ── Shows exactly which error hit this boundary and how often.
    this._totalErrors = (this._totalErrors || 0) + 1;
    console.warn(
      `[SelfHealingBoundary] error #${this._totalErrors}`,
      { name: err?.name, message: msg.slice(0, 200) },
      'componentStack head:',
      String(info?.componentStack || '').split('\n').slice(0, 6).join('\n')
    );

    // ── KNOWN BENIGN ERROR: SDK's MessagePort `instanceof` crash ──
    // Fires from a background async listener and doesn't break rendering.
    // We recover silently by remounting — but NEVER log and NEVER loop.
    const isBenignSdkInstanceofError =
      msg.includes("Right-hand side of 'instanceof' is not callable") ||
      /is not a function.*evaluating.*instanceof/i.test(msg) ||
      (/MessagePort/i.test(stack) && /instanceof/i.test(stack));

    // Hard loop guard: if we've caught >3 errors in <500ms, stop trying to heal
    // and leave fatal=true (show recovery screen). Prevents browser freeze.
    this._recentErrors = this._recentErrors.filter(t => now - t < 500);
    this._recentErrors.push(now);
    const isLooping = this._recentErrors.length > 3;

    if (isBenignSdkInstanceofError && !isLooping) {
      // Silent heal — clear fatal flag and bump key to remount children.
      this.setState(s => ({ fatal: false, attemptKey: s.attemptKey + 1 }));
      return;
    }

    if (isLooping) {
      // Too many errors too fast — stop everything, show recovery UI.
      // Do NOT log (would spam the rate limit and freeze the page).
      return;
    }

    // Real, non-benign error — log once for observability, then show fallback.
    try {
      fetch('/functions/logPublicClientError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'onboarding_v2_boundary',
          errorMessage: msg,
          componentStack: String(info?.componentStack || '').slice(0, 2000),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          attemptKey: this.state.attemptKey,
        }),
      }).catch(() => {});
    } catch (_) {}

    // One-shot recovery attempt: if it was truly a one-off, bump key and hope.
    setTimeout(() => {
      this.setState(s => ({ fatal: false, attemptKey: s.attemptKey + 1 }));
    }, 50);
  }

  render() {
    if (this.state.fatal) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f4]">
          <div className="max-w-md text-center bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            <h2 className="text-lg font-bold text-[#0A0A0A] mb-2">Tivemos um problema ao exibir esta página</h2>
            <p className="text-sm text-[#0A0A0A]/60 mb-5">
              Parece que alguma extensão do seu navegador está interferindo no carregamento
              (tradutor automático, Grammarly, leitor de tela, etc). Tente recarregar —
              se o problema persistir, abra o link em uma <b>janela anônima</b> ou
              desative o tradutor automático nesta página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 h-10 rounded-lg bg-[#1356E2] text-white text-sm font-semibold hover:opacity-90"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    // Key bump re-mounts the whole subtree, clearing any stale DOM references.
    // NOTE: using a plain <div> wrapper (not React.Fragment) because Vite dev
    // injects `data-source-location` props into elements — Fragment rejects
    // any prop other than `key`/`children` and crashes with a cryptic
    // "instanceof is not callable" TypeError that breaks the boundary itself.
    // (Same fix was already applied in components/ErrorBoundary.jsx.)
    return (
      <div key={this.state.attemptKey} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    );
  }
}