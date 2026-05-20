import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, FileText, ListChecks } from 'lucide-react';
import SmartSummaryCards from '@/components/cadastro/v5_2/SmartSummaryCards';

/**
 * [V5.2 Fase 6.4-B] Aba 1 — Resumo & Decisão (padrão DOC6 §2.6.3).
 * Smart Summary já no topo + Mini-Parecer SENTINEL + Próximas Ações.
 */

const SEVERITY_BG = {
  CRITICAL: 'bg-red-50 border-red-200',
  HIGH:     'bg-orange-50 border-orange-200',
  MEDIUM:   'bg-amber-50 border-amber-200',
  LOW:      'bg-blue-50 border-blue-200',
  INFO:     'bg-slate-50 border-slate-200',
};

function AlertasPriorizados({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Alertas Priorizados ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {alerts.map((a, idx) => (
          <div key={a.red_flag_id || idx} className={`rounded-lg border p-3 ${SEVERITY_BG[a.severity] || SEVERITY_BG.INFO}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-bold text-[#002443]">{a.title || a.red_flag_id}</h4>
              {a.severity && (
                <Badge variant="outline" className="text-[10px] font-mono">{a.severity}</Badge>
              )}
            </div>
            {a.why_it_matters && (
              <p className="text-xs text-[#002443]/75 mb-2">{a.why_it_matters}</p>
            )}
            <div className="flex items-center gap-3 text-[10px] text-[#002443]/55">
              {a.suggested_action && <span>👉 {a.suggested_action}</span>}
              {a.source && <span className="font-mono">fonte: {a.source}</span>}
              {a.impact_score != null && <span className="font-mono ml-auto">impact: {a.impact_score}</span>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PontosPositivos({ positivos }) {
  if (!positivos?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Pontos Positivos ({positivos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {positivos.map((p, idx) => (
          <div key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <h4 className="text-sm font-semibold text-emerald-800">{p.title || `Positivo ${idx + 1}`}</h4>
            {p.description && (
              <p className="text-xs text-[#002443]/70 mt-0.5">{p.description}</p>
            )}
            {p.source && (
              <span className="text-[9px] text-[#002443]/40 font-mono mt-1 inline-block">fonte: {p.source}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniParecerSentinel({ sumario, parecer }) {
  const text = sumario || parecer;
  if (!text) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2bc196]" />
          Mini-Parecer SENTINEL (executivo)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#002443]/85 leading-relaxed whitespace-pre-wrap line-clamp-[12]">
          {text}
        </p>
        <p className="text-[10px] text-[#002443]/40 mt-3 italic">
          ↗ Versão completa em "Aba 4 — SENTINEL & Auditoria"
        </p>
      </CardContent>
    </Card>
  );
}

function AcoesSugeridas({ recomendacoes, condicoes }) {
  const items = [];
  if (recomendacoes) {
    String(recomendacoes).split(/\n|•|·/).map((s) => s.trim()).filter(Boolean).forEach((s) => items.push({ label: s, type: 'rec' }));
  }
  if (Array.isArray(condicoes)) {
    condicoes.forEach((c) => items.push({ label: c, type: 'cond' }));
  } else if (typeof condicoes === 'string' && condicoes.trim()) {
    items.push({ label: condicoes, type: 'cond' });
  }
  if (!items.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-blue-500" />
          Ações Sugeridas ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.slice(0, 10).map((it, idx) => (
            <li key={idx} className="text-xs flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${it.type === 'cond' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <span className="text-[#002443]/85">{it.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Tab1ResumoDecisao({ latestCase, latestScore }) {
  return (
    <div className="space-y-4">
      {/* Smart Summary reaproveitado */}
      <SmartSummaryCards latestScore={latestScore} />

      {/* Alertas + Positivos lado a lado em md */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlertasPriorizados alerts={latestScore?.impact_score_top_alerts || []} />
        <PontosPositivos positivos={latestScore?.top_positivos || []} />
      </div>

      <MiniParecerSentinel
        sumario={latestScore?.sumario_executivo}
        parecer={latestScore?.parecer_final}
      />

      <AcoesSugeridas
        recomendacoes={latestScore?.recomendacoes_revisao_manual}
        condicoes={latestScore?.condicoes_automaticas || latestCase?.condicoesAutomaticas}
      />
    </div>
  );
}