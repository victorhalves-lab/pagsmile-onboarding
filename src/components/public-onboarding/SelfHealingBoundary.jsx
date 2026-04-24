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
    // We don't freeze the UI here — componentDidCatch decides whether to remount
    // or escalate to fatal.
    return {};
  }

  componentDidCatch(err, info) {
    const msg = String(err?.message || err || '');
    const stack = String(err?.stack || info?.componentStack || '');

    // ── KNOWN BENIGN ERROR: SDK's MessagePort `instanceof` crash ──
    // Check FIRST, before any logging — the SDK fires this dozens of times
    // per session and was saturating logPublicClientError rate limit,
    // blocking the main thread and freezing the page.
    const isBenignSdkInstanceofErrorEarly =
      msg.includes("Right-hand side of 'instanceof' is not callable") ||
      /is not a function.*evaluating.*instanceof/i.test(msg) ||
      (/MessagePort/i.test(stack) && /instanceof/i.test(stack));
    if (isBenignSdkInstanceofErrorEarly) {
      return;
    }

    // Log real errors only (fire-and-forget, never throws).
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

    // ── Benign error check kept for safety (already returned above) ──
    // This error fires from a background async listener (MessagePort.k) and
    // does NOT break rendering — the page actually works fine. Previous
    // behavior counted it as a real crash and after 3 occurrences forced
    // the "Ops, algo não carregou" screen even though the UI was fine.
    //
    // We now fully ignore it here: no remount, no counter bump. The
    // ErrorBoundary contract allows returning without setState — React
    // keeps the last committed tree visible.
    const isBenignSdkInstanceofError =
      msg.includes("Right-hand side of 'instanceof' is not callable") ||
      /is not a function.*evaluating.*instanceof/i.test(msg) ||
      (/MessagePort/i.test(stack) && /instanceof/i.test(stack));
    if (isBenignSdkInstanceofError) {
      return;
    }

    // Track repeat errors in a rolling 2s window.
    // CRITICAL FIX (2026-04-24): the previous "3 errors in 10s → fatal" window
    // was too permissive. A tight render loop can fire 50+ errors in <1s,
    // during which each componentDidCatch schedules a setTimeout remount
    // AND a fetch to logPublicClientError. The browser tab froze because
    // the fetch backlog + render loop saturated the main thread. We now
    // escalate to fatal on the SECOND error within 2s — fast enough to stop
    // the freeze, lenient enough to still auto-heal truly transient issues.
    const now = Date.now();
    this._recentErrors = this._recentErrors.filter(t => now - t < 2000);
    this._recentErrors.push(now);

    if (this._recentErrors.length >= 2) {
      // Second crash inside 2s → definitely not transient. Stop the loop now.
      this.setState({ fatal: true });
      return;
    }

    // First error only: give the subtree one chance to recover by remounting.
    setTimeout(() => {
      this.setState(s => ({ attemptKey: s.attemptKey + 1 }));
    }, 50);
  }

  render() {
    if (this.state.fatal) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f4]">
          <div className="max-w-md text-center bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            <h2 className="text-lg font-bold text-[#002443] mb-2">Tivemos um problema ao exibir esta página</h2>
            <p className="text-sm text-[#002443]/60 mb-5">
              Parece que alguma extensão do seu navegador está interferindo no carregamento
              (tradutor automático, Grammarly, leitor de tela, etc). Tente recarregar —
              se o problema persistir, abra o link em uma <b>janela anônima</b> ou
              desative o tradutor automático nesta página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 h-10 rounded-lg bg-[#2bc196] text-white text-sm font-semibold hover:opacity-90"
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