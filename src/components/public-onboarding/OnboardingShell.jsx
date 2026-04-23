import React from 'react';
import { ShieldCheck, Loader2, ShieldAlert } from 'lucide-react';

/**
 * Layout shell for the public onboarding.
 * - Centered card with Pagsmile header.
 * - Renders step indicator (pills) from a stable steps array (keys are safe).
 * - Self-contained error boundary that prevents React reconciliation issues from
 *   ever bubbling up and showing a white screen to the client.
 */
/**
 * Returns true for known transient errors that should NOT immediately show a
 * crash screen to the client — they self-heal on remount:
 *  1. Base44 SDK's "X is not a function. (evaluating 'Y instanceof X')" —
 *     happens on Safari iOS when the SDK worker tries to validate an anonymous
 *     token and hits a minified identifier that's been tree-shaken.
 *  2. DOM mutation errors from browser extensions (Translate, Grammarly).
 */
function isTransientBoundaryError(err) {
  const msg = String(err?.message || err || '');
  const name = String(err?.name || '');
  const stack = String(err?.stack || '');
  // SDK instanceof crash (both Chrome wording AND Safari wording)
  if (msg.includes("Right-hand side of 'instanceof' is not callable")) return true;
  if (/is not a function.*evaluating.*instanceof/i.test(msg)) return true;
  if (name === 'TypeError' && /instanceof/i.test(msg)) return true;
  if (/MessagePort/i.test(stack) && /instanceof/i.test(stack)) return true;
  // DOM-mutation errors from extensions
  if (name === 'NotFoundError' && /insertBefore|removeChild|appendChild/i.test(msg)) return true;
  if (/Failed to execute '(insertBefore|removeChild|appendChild)'/i.test(msg)) return true;
  return false;
}

class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null, healKey: 0 };
    this._transientCount = 0;
  }
  static getDerivedStateFromError(err) {
    if (isTransientBoundaryError(err)) return {}; // let componentDidCatch decide
    return { err };
  }
  componentDidCatch(err, info) {
    try {
      fetch('/functions/logPublicClientError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'onboarding_v2_render_error',
          errorMessage: String(err?.message || err),
          componentStack: String(info?.componentStack || ''),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      }).catch(() => {});
    } catch (_) {}

    // Self-heal transient errors — bump key to remount. Only escalate to the
    // crash screen after 3 repeats in a row, which means it's NOT transient.
    if (isTransientBoundaryError(err)) {
      this._transientCount += 1;
      if (this._transientCount < 3) {
        setTimeout(() => {
          this.setState(s => ({ healKey: s.healKey + 1 }));
        }, 50);
        return;
      }
      // Repeated → not transient anymore, show fallback.
      this.setState({ err });
    }
  }
  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            <h2 className="text-lg font-bold text-[#002443] mb-2">Ops, algo não carregou</h2>
            <p className="text-sm text-[#002443]/60 mb-4">
              Recarregue a página para tentar novamente. Se o problema continuar, nosso time já foi avisado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 h-10 rounded-lg bg-[#2bc196] text-white text-sm font-semibold hover:opacity-90"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    // healKey forces a full remount of children after a transient error,
    // clearing stale DOM refs and letting the SDK recover silently.
    return (
      <div key={this.state.healKey} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    );
  }
}

export function StepPill({ label, active, done, number }) {
  const base = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors';
  const cls = active
    ? 'bg-[#2bc196] text-white'
    : done
    ? 'bg-[#2bc196]/15 text-[#2bc196]'
    : 'bg-slate-100 text-slate-500';
  return (
    <span className={`${base} ${cls}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-white/20' : done ? 'bg-white/60 text-[#2bc196]' : 'bg-white text-slate-500'}`}>
        {number}
      </span>
      {label}
    </span>
  );
}

function StepSep() { return <span className="w-6 h-px bg-slate-200 hidden md:inline-block" />; }

export default function OnboardingShell({
  title, subtitle, merchant, templateName,
  steps, currentStepKey,
  children,
}) {
  return (
    <LocalErrorBoundary>
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png"
            alt="Pagsmile" className="h-7 mx-auto mb-4"
          />

          {steps && steps.length > 0 && (
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-5 flex-wrap">
              {steps.map((s, i) => {
                const idx = steps.findIndex(x => x.key === currentStepKey);
                const active = s.key === currentStepKey;
                const done = idx > -1 && i < idx;
                return (
                  <React.Fragment key={s.key}>
                    {i > 0 && <StepSep />}
                    <StepPill number={i + 1} label={s.label} active={active} done={done} />
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-[#002443] mb-1.5">{title}</h1>
          {subtitle && <p className="text-[#002443]/60 max-w-lg mx-auto text-sm md:text-base">{subtitle}</p>}

          {(merchant || templateName) && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {templateName && (
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {templateName}
                </div>
              )}
              {merchant && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {merchant.companyName || merchant.fullName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-[#002443]/40 flex items-center justify-center gap-1 mt-6">
          <ShieldCheck className="w-3 h-3" />
          Seus dados são criptografados e tratados com confidencialidade.
        </p>
      </div>
    </LocalErrorBoundary>
  );
}

export function FullPageLoader({ label = 'Carregando...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      <span className="ml-3 text-[#002443]/70">{label}</span>
    </div>
  );
}

export function InvalidLinkScreen({ reason }) {
  const messages = {
    token_mismatch: 'Este link não confere com nosso sistema. Pode ter sido renovado ou expirado.',
    case_not_found: 'Não encontramos o cadastro associado a este link.',
    template_not_found: 'O questionário desse cadastro não está mais disponível.',
    invalid_mode: 'Tipo de link não reconhecido.',
    missing_params: 'Link incompleto. Verifique se você copiou a URL inteira.',
    network: 'Não conseguimos contatar o servidor. Verifique sua conexão e tente recarregar.',
    server_error: 'Houve um erro temporário no servidor. Tente recarregar em alguns segundos.',
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <ShieldAlert className="w-14 h-14 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Link inválido ou expirado</h2>
        <p className="text-sm text-[#002443]/60 mb-4">
          {messages[reason] || 'Não foi possível abrir este link. Entre em contato com seu consultor comercial para receber um novo.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 h-10 rounded-lg bg-[#2bc196] text-white text-sm font-semibold hover:opacity-90"
        >
          Recarregar
        </button>
        {reason && (
          <p className="text-[10px] text-[#002443]/30 mt-4 font-mono">código: {reason}</p>
        )}
      </div>
    </div>
  );
}