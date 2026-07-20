import React, { useState, useMemo } from 'react';
import { Brain, ChevronDown, ChevronUp, Shield, Target, MessageSquare, ClipboardCheck, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SentinelTextFormatter from '@/components/compliance/SentinelTextFormatter';

const DECISION_COLORS = {
  'Aprovado': 'bg-green-100 text-green-700 border-green-200',
  'Aprovado com Condições Leves': 'bg-blue-100 text-blue-700 border-blue-200',
  'Aprovado com Condições': 'bg-amber-100 text-amber-700 border-amber-200',
  'Revisão Manual': 'bg-orange-100 text-orange-700 border-orange-200',
  'Recusado': 'bg-red-100 text-red-700 border-red-200',
};

function Section({ id, icon: Icon, title, subtitle, iconColor, iconBg, accentBg, accentBorder, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left">
        <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--pinbank-blue)]">{title}</h4>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{subtitle}</p>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <div className={`p-5 rounded-xl ${accentBg} border ${accentBorder}`}>{children}</div>
        </div>
      )}
    </div>
  );
}

function SegmentedText({ text }) {
  const [showAll, setShowAll] = useState(false);
  const segs = useMemo(() => {
    if (!text) return [];
    const lines = text.split('\n');
    const result = [];
    let cur = { title: '', content: '' };
    for (const line of lines) {
      const hm = line.match(/^(?:\*\*)?(?:Dimensão|DIMENSÃO|Análise|ANÁLISE|Seção|SEÇÃO)\s+(\d+|[A-Z])[.:]?\s*(.*?)(?:\*\*)?$/i) || line.match(/^##\s+(.+)$/);
      if (hm) { if (cur.content.trim()) result.push({ ...cur }); cur = { title: line.replace(/[*#]+/g, '').trim(), content: '' }; }
      else cur.content += line + '\n';
    }
    if (cur.content.trim()) result.push({ ...cur });
    return result;
  }, [text]);

  if (segs.length <= 2) return <SentinelTextFormatter text={text} />;

  const visible = showAll ? segs : segs.slice(0, 3);
  return (
    <div className="space-y-4">
      {visible.map((s, i) => (
        <div key={i}>
          {s.title && <h4 className="text-xs font-bold text-[var(--pinbank-blue)] uppercase tracking-wide mb-2 pb-1 border-b border-slate-200">{s.title}</h4>}
          <SentinelTextFormatter text={s.content} variant="compact" />
        </div>
      ))}
      {!showAll && segs.length > 3 && (
        <button onClick={() => setShowAll(true)} className="w-full py-2.5 text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50/50 transition-colors">
          Mostrar mais {segs.length - 3} seções
        </button>
      )}
    </div>
  );
}

export default function SentinelReportV2({ score, latestCase }) {
  const [open, setOpen] = useState(['summary']);
  const toggle = id => setOpen(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const hasSummary = score?.sumario_executivo || latestCase?.iaExplanation;
  const hasFull = score?.analise_completa_ia;
  const hasVerdict = score?.parecer_final;
  const hasConditions = score?.condicoes_aprovacao;
  const hasEscalation = score?.escalation_justification;
  if (!hasSummary && !hasFull && !hasVerdict) return null;

  const recommendation = score?.sentinel_recommendation || score?.recomendacao_final || latestCase?.iaDecision;
  const confidence = score?.nivel_confianca_ia;
  const version = score?.versao_agente || '';

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-blue-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100"><Brain className="w-5 h-5 text-violet-600" /></div>
            <div>
              <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Relatório SENTINEL — Dossiê de Compliance</h3>
              <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Relatório qualitativo para dossiê — decisão é determinística (V4 + CAF)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {recommendation && <Badge className={`text-xs font-bold border ${DECISION_COLORS[recommendation] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{recommendation}</Badge>}
            {confidence != null && <Badge variant="outline" className="text-[10px]">Confiança: {confidence}%</Badge>}
            {version && <Badge variant="outline" className="text-[9px] text-[var(--pinbank-blue)]/30">{version}</Badge>}
          </div>
        </div>
      </div>

      <div>
        {hasSummary && (
          <Section id="summary" icon={Shield} title="Sumário Executivo" subtitle="Visão geral em linguagem de negócio"
            iconColor="text-blue-600" iconBg="bg-blue-50" accentBg="bg-blue-50/30" accentBorder="border-blue-100"
            isOpen={open.includes('summary')} onToggle={() => toggle('summary')}>
            <SentinelTextFormatter text={score?.sumario_executivo || latestCase?.iaExplanation} />
          </Section>
        )}
        {hasConditions && (
          <Section id="conditions" icon={Target} title="Condições Sugeridas" subtitle="Requisitos específicos que devem ser cumpridos"
            iconColor="text-amber-600" iconBg="bg-amber-50" accentBg="bg-amber-50/30" accentBorder="border-amber-100"
            isOpen={open.includes('conditions')} onToggle={() => toggle('conditions')}>
            <SentinelTextFormatter text={hasConditions} />
          </Section>
        )}
        {hasEscalation && (
          <Section id="escalation" icon={MessageSquare} title="Justificativa de Escalação" subtitle="Por que o SENTINEL ajustou a decisão"
            iconColor="text-orange-600" iconBg="bg-orange-50" accentBg="bg-orange-50/30" accentBorder="border-orange-100"
            isOpen={open.includes('escalation')} onToggle={() => toggle('escalation')}>
            <SentinelTextFormatter text={hasEscalation} />
          </Section>
        )}
        {hasVerdict && (
          <Section id="verdict" icon={ClipboardCheck} title="Parecer Final" subtitle="Documento conclusivo para dossiê de compliance"
            iconColor="text-emerald-600" iconBg="bg-emerald-50" accentBg="bg-emerald-50/30" accentBorder="border-emerald-100"
            isOpen={open.includes('verdict')} onToggle={() => toggle('verdict')}>
            <SentinelTextFormatter text={hasVerdict} />
          </Section>
        )}
        {hasFull && (
          <Section id="full" icon={BookOpen} title="Análise Completa — Texto Integral" subtitle="Todas as dimensões com evidências e fontes"
            iconColor="text-indigo-600" iconBg="bg-indigo-50" accentBg="bg-indigo-50/30" accentBorder="border-indigo-100"
            isOpen={open.includes('full')} onToggle={() => toggle('full')}>
            <SegmentedText text={hasFull} />
          </Section>
        )}
      </div>
    </div>
  );
}