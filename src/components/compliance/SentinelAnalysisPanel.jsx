import React, { useState, useMemo } from 'react';
import { Brain, ChevronDown, ChevronUp, FileText, ClipboardCheck, MessageSquare, Shield, BookOpen, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SentinelTextFormatter from './SentinelTextFormatter';

/**
 * Renders the SENTINEL AI analysis in a beautifully structured, section-by-section layout.
 * Replaces the old raw text dump with well-formatted, expandable cards.
 */

export default function SentinelAnalysisPanel({ score, latestCase }) {
  const [openSections, setOpenSections] = useState(['summary']);
  
  const hasSummary = score?.sumario_executivo || latestCase?.iaExplanation;
  const hasFullAnalysis = score?.analise_completa_ia;
  const hasFinalVerdict = score?.parecer_final;
  const hasConditions = score?.condicoes_aprovacao;
  const hasEscalation = score?.escalation_justification;
  
  if (!hasSummary && !hasFullAnalysis && !hasFinalVerdict) return null;

  const toggle = (id) => setOpenSections(prev => 
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  
  const decisionColor = {
    'Aprovado': 'bg-green-100 text-green-700 border-green-200',
    'Aprovado com Condições Leves': 'bg-blue-100 text-blue-700 border-blue-200',
    'Aprovado com Condições': 'bg-amber-100 text-amber-700 border-amber-200',
    'Revisão Manual': 'bg-orange-100 text-orange-700 border-orange-200',
    'Recusado': 'bg-red-100 text-red-700 border-red-200',
  };

  const recommendation = score?.sentinel_recommendation || score?.recomendacao_final || latestCase?.iaDecision;
  const confidence = score?.nivel_confianca_ia;
  const version = score?.versao_agente || '';
  const escalated = score?.decisao_escalada_sentinel;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-blue-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--pagsmile-blue)]">Análise SENTINEL — Inteligência Artificial</h3>
              <p className="text-xs text-[var(--pagsmile-blue)]/40">Análise qualitativa com explicações detalhadas por seção</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {recommendation && (
              <Badge className={`text-xs font-bold border ${decisionColor[recommendation] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {recommendation}
              </Badge>
            )}
            {confidence != null && (
              <Badge variant="outline" className="text-[10px]">
                Confiança: {confidence}%
              </Badge>
            )}
            {escalated && (
              <Badge className="bg-orange-100 text-orange-700 text-[10px] border border-orange-200">
                Escalado pelo SENTINEL
              </Badge>
            )}
            {version && (
              <Badge variant="outline" className="text-[9px] text-[var(--pagsmile-blue)]/30">{version}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {/* 1. Sumário Executivo */}
        {hasSummary && (
          <SentinelSection
            id="summary"
            icon={Shield}
            title="Sumário Executivo"
            subtitle="Visão geral da análise em linguagem de negócio"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            isOpen={openSections.includes('summary')}
            onToggle={() => toggle('summary')}
            accentColor="blue"
          >
            <SentinelTextFormatter text={score?.sumario_executivo || latestCase?.iaExplanation} />
          </SentinelSection>
        )}

        {/* 2. Condições de Aprovação */}
        {hasConditions && (
          <SentinelSection
            id="conditions"
            icon={Target}
            title="Condições para Aprovação"
            subtitle="Requisitos específicos que devem ser cumpridos"
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            isOpen={openSections.includes('conditions')}
            onToggle={() => toggle('conditions')}
            accentColor="amber"
          >
            <SentinelTextFormatter text={hasConditions} />
          </SentinelSection>
        )}

        {/* 3. Justificativa de Escalação */}
        {hasEscalation && (
          <SentinelSection
            id="escalation"
            icon={MessageSquare}
            title="Justificativa de Escalação"
            subtitle="Por que o SENTINEL ajustou a decisão do V4"
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            isOpen={openSections.includes('escalation')}
            onToggle={() => toggle('escalation')}
            accentColor="orange"
          >
            <SentinelTextFormatter text={hasEscalation} />
          </SentinelSection>
        )}

        {/* 4. Parecer Final */}
        {hasFinalVerdict && (
          <SentinelSection
            id="verdict"
            icon={ClipboardCheck}
            title="Parecer Final do SENTINEL"
            subtitle="Documento conclusivo para dossiê de compliance"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            isOpen={openSections.includes('verdict')}
            onToggle={() => toggle('verdict')}
            accentColor="emerald"
          >
            <SentinelTextFormatter text={hasFinalVerdict} />
          </SentinelSection>
        )}

        {/* 5. Análise Completa — with smart segmentation */}
        {hasFullAnalysis && (
          <SentinelSection
            id="full"
            icon={BookOpen}
            title="Análise Completa — Detalhamento Microscópico"
            subtitle="Todas as dimensões analisadas com evidências e fontes"
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            isOpen={openSections.includes('full')}
            onToggle={() => toggle('full')}
            accentColor="indigo"
          >
            <SegmentedAnalysis text={hasFullAnalysis} />
          </SentinelSection>
        )}
      </div>
    </div>
  );
}

/**
 * For very long analysis texts, splits into sub-sections by detecting headers/dimensions.
 * Shows first 3 sections initially with a "show more" toggle.
 */
function SegmentedAnalysis({ text }) {
  const [showAll, setShowAll] = useState(false);
  
  const segments = useMemo(() => {
    if (!text) return [];
    // Split by double-star headers, "Dimensão" patterns, or markdown ## headers
    const lines = text.split('\n');
    const segs = [];
    let current = { title: '', content: '' };
    
    for (const line of lines) {
      const headerMatch = line.match(/^(?:\*\*)?(?:Dimensão|DIMENSÃO|Análise|ANÁLISE|Seção|SEÇÃO)\s+(\d+|[A-Z])[.:]?\s*(.*?)(?:\*\*)?$/i) ||
                          line.match(/^##\s+(.+)$/);
      if (headerMatch) {
        if (current.content.trim()) segs.push({ ...current });
        current = { title: line.replace(/[*#]+/g, '').trim(), content: '' };
      } else {
        current.content += line + '\n';
      }
    }
    if (current.content.trim()) segs.push({ ...current });
    
    return segs;
  }, [text]);

  // If text doesn't segment well (≤2 segments), just render it normally
  if (segments.length <= 2) {
    return <SentinelTextFormatter text={text} />;
  }

  const visibleSegments = showAll ? segments : segments.slice(0, 3);
  const hiddenCount = segments.length - 3;

  return (
    <div className="space-y-4">
      {visibleSegments.map((seg, i) => (
        <div key={i}>
          {seg.title && (
            <h4 className="text-xs font-bold text-[var(--pagsmile-blue)] uppercase tracking-wide mb-2 pb-1 border-b border-slate-200">
              {seg.title}
            </h4>
          )}
          <SentinelTextFormatter text={seg.content} variant="compact" />
        </div>
      ))}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 text-center text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50/50 transition-colors"
        >
          Mostrar mais {hiddenCount} seções da análise
        </button>
      )}
    </div>
  );
}

function SentinelSection({ id, icon: Icon, title, subtitle, iconColor, iconBg, isOpen, onToggle, accentColor, children }) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left">
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--pagsmile-blue)]">{title}</h4>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{subtitle}</p>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className={`px-6 pb-5 pt-0`}>
          <div className={`p-5 rounded-xl bg-${accentColor}-50/30 border border-${accentColor}-100`}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}