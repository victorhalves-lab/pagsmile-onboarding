import React from 'react';
import { Info, Camera, AlertTriangle, AlertOctagon, ShieldAlert, RefreshCw } from 'lucide-react';

const SOURCE_CONFIG = {
  V4_BLOCK: {
    label: 'Bloqueio V4',
    tone: 'bg-red-500/15 border-red-400/30 text-red-100',
    icon: AlertOctagon,
  },
  V4_SUBFAIXA_4: {
    label: 'Subfaixa 4 — revisão padrão',
    tone: 'bg-amber-500/15 border-amber-400/30 text-amber-100',
    icon: AlertTriangle,
  },
  CAF_FRAUD: {
    label: 'CAF: fraude confirmada',
    tone: 'bg-red-500/15 border-red-400/30 text-red-100',
    icon: ShieldAlert,
  },
  CAF_QUALITY: {
    label: 'CAF: qualidade de captura',
    tone: 'bg-sky-500/15 border-sky-400/30 text-sky-100',
    icon: Camera,
  },
  SAFETY_NET: {
    label: 'Rebaixamento automático',
    tone: 'bg-amber-500/15 border-amber-400/30 text-amber-100',
    icon: RefreshCw,
  },
};

/**
 * Displays the technical reason a case was escalated to Revisão Manual,
 * so the analyst doesn't have to investigate why. Renders inside the dark
 * RiskVerdictBanner (uses white text on dark bg).
 */
export default function EscalationReasonBanner({ onboardingCase }) {
  const source = onboardingCase?.escalationSource;
  const reason = onboardingCase?.escalationReason;
  const recaptureRequested = onboardingCase?.cafRecaptureRequested;
  const recaptureReason = onboardingCase?.cafRecaptureReason;
  const recaptureAttempts = onboardingCase?.cafRecaptureAttempts || 0;

  // Nothing to show
  if (!source && !reason && !recaptureRequested) return null;

  // Normal flow (V4 subfaixa 1A/1B/2A/2B/3A/3B) — nothing notable
  if (source === 'NONE' && !reason && !recaptureRequested) return null;

  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.V4_SUBFAIXA_4;
  const Icon = config.icon;

  return (
    <div className={`mt-3 rounded-xl border p-3.5 ${config.tone}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-80">
            Motivo técnico da escalação: {config.label}
          </p>
          {reason && (
            <p className="text-xs leading-relaxed opacity-90 mb-2">{reason}</p>
          )}
          {recaptureRequested && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Camera className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Recaptura CAF solicitada
                </span>
                {recaptureAttempts > 0 && (
                  <span className="text-[10px] opacity-60">
                    (tentativas: {recaptureAttempts})
                  </span>
                )}
              </div>
              {recaptureReason && (
                <p className="text-[11px] leading-relaxed opacity-75">{recaptureReason}</p>
              )}
              <p className="text-[10px] opacity-50 mt-1.5 flex items-center gap-1">
                <Info className="w-2.5 h-2.5" />
                O caso NÃO foi escalado — aguardando o cliente refazer a captura.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}