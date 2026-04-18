import React, { useState, useMemo } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RedFlagCard from '../risk-analysis/RedFlagCard';
import { enrichRedFlag } from '../risk-analysis/redFlagEnricher';
import { getItemExplanation } from './BDCItemExplanations';

/**
 * BDCSmartAlerts v2 — consolidates the TOP critical/high risk findings across
 * ALL BDC sections into rich, clickable cards using the same RedFlagCard
 * component as the main red flags panel. Every alert now has: why it matters,
 * evidence hints, suggested action, source.
 */

const CNAE_RISK_MAP = {
  '6311': { level: 'HIGH', desc: 'Portais, provedores de conteúdo e outros serviços de informação na internet — frequentemente usado por fintechs, apostas e intermediários financeiros.' },
  '6619': { level: 'HIGH', desc: 'Atividades auxiliares dos serviços financeiros — pode incluir correspondentes bancários e intermediadores de pagamento sem regulação.' },
  '6499': { level: 'HIGH', desc: 'Outros serviços financeiros não classificados — categoria genérica que pode encobrir atividades reguladas.' },
  '9200': { level: 'CRITICAL', desc: 'Atividades de exploração de jogos de azar e apostas — setor altamente regulado com exigência de licença.' },
  '6492': { level: 'HIGH', desc: 'Crédito, financiamento e investimento — atividade regulada pelo Banco Central.' },
  '4712': { level: 'MEDIUM', desc: 'Comércio varejista de mercadorias em geral — risco moderado, comum em e-commerce.' },
  '4789': { level: 'MEDIUM', desc: 'Comércio varejista de outros produtos novos não especificados — pode indicar dropshipping.' },
  '8299': { level: 'MEDIUM', desc: 'Outras atividades de serviços prestados — categoria genérica, requer investigação do que realmente faz.' },
};

const SEVERITY_V1_TO_V2 = {
  BLOQUEIO: 'BLOQUEANTE',
  CRITICO: 'CRITICAL',
  ALTO: 'HIGH',
  MEDIO: 'MEDIUM',
  BAIXO: 'LOW',
  INFO: 'INFO',
};

function getCnaeAlert(cnae) {
  if (!cnae) return null;
  const code = String(cnae).replace(/[^0-9]/g, '').substring(0, 4);
  return CNAE_RISK_MAP[code] || null;
}

function itemToEnrichedFlag(item, sectionKey) {
  // Try the catalogue enricher first (handles "shell", "dívida", etc.)
  const enriched = enrichRedFlag(`V4: ${item.label}${item.value ? ' — ' + item.value : ''}`);
  // Override severity & dimension with BDC's own assessment (more accurate than text matching)
  return {
    ...enriched,
    severity: SEVERITY_V1_TO_V2[item.risk] || enriched.severity || 'MEDIUM',
    dimension: enriched.dimension || sectionKey,
    title: item.label,
    whyItMatters: getItemExplanation(item.label) || enriched.whyItMatters,
    evidenceHints: item.value ? [`Valor retornado pela BDC: ${item.value}`, ...(enriched.evidenceHints || [])] : enriched.evidenceHints,
    suggestedAction: enriched.suggestedAction,
    source: `BDC dataset da seção "${sectionKey}"`,
    sourceBadge: 'BDC',
    sourceTone: 'blue',
    matched: true,
  };
}

function blockToEnrichedFlag(block) {
  const enriched = enrichRedFlag(`V4: ${block.code} ${block.label}`);
  return {
    ...enriched,
    severity: 'BLOQUEANTE',
    title: `${block.code}: ${block.label}`,
    whyItMatters: enriched.whyItMatters,
    evidenceHints: block.detail ? [block.detail, ...(enriched.evidenceHints || [])] : enriched.evidenceHints,
    suggestedAction: enriched.suggestedAction,
    source: 'Framework V4 — Bloqueio automático por dados objetivos',
    sourceBadge: 'BDC',
    sourceTone: 'blue',
    matched: true,
  };
}

function cnaeToEnrichedFlag(cnaeCode, cnaeInfo) {
  return {
    raw: `V4: CNAE de risco ${cnaeCode}`,
    text: `CNAE de risco ${cnaeCode}`,
    title: `CNAE de risco: ${cnaeCode}`,
    severity: cnaeInfo.level,
    dimension: 'identity',
    whyItMatters: cnaeInfo.desc,
    evidenceHints: [`CNAE primário registrado: ${cnaeCode}`],
    suggestedAction:
      cnaeInfo.level === 'CRITICAL'
        ? 'Exigir licença regulatória específica do setor (BCB, CVM, etc.) antes de aprovar. Sem a licença, recusa.'
        : 'Validar no questionário e documentos se a atividade real corresponde ao CNAE declarado e se há conformidade regulatória.',
    source: 'Classificação Receita Federal + Tabela interna de CNAEs de risco',
    sourceBadge: 'BDC',
    sourceTone: 'blue',
    matched: true,
  };
}

function normaliseForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);
}

export default function BDCSmartAlerts({ analysis, merchant, existingRedFlags = [] }) {
  const [expanded, setExpanded] = useState(true);

  const redFlagKeys = useMemo(() => {
    return new Set((existingRedFlags || []).map(f => normaliseForMatch(f)));
  }, [existingRedFlags]);

  const alerts = useMemo(() => {
    if (!analysis) return [];
    const out = [];
    const sections = analysis.sections || {};
    const allSections = ['identity', 'owners', 'digital', 'compliance', 'reputation', 'financial', 'evolution', 'esg', 'contacts', 'employeesKyc', 'sectorial', 'assets'];

    for (const sectionKey of allSections) {
      const section = sections[sectionKey];
      if (!section?.items) continue;
      for (const item of section.items) {
        if (item.risk === 'CRITICO' || item.risk === 'ALTO') {
          out.push(itemToEnrichedFlag(item, sectionKey));
        }
      }
    }

    for (const block of (analysis.blocks || [])) {
      out.push(blockToEnrichedFlag(block));
    }

    const identityItems = sections.identity?.items || [];
    const cnaeItem = identityItems.find(i => i.label?.toLowerCase().includes('cnae'));
    if (cnaeItem) {
      const cnaeInfo = getCnaeAlert(cnaeItem.value);
      if (cnaeInfo) {
        out.push(cnaeToEnrichedFlag(cnaeItem.value, cnaeInfo));
      }
    }

    const severityOrder = { BLOQUEANTE: 0, CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, INFO: 5 };
    out.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
    return out;
  }, [analysis]);

  if (!analysis || alerts.length === 0) return null;

  const top = alerts.slice(0, 10);
  const bloqueioCount = alerts.filter(a => a.severity === 'BLOQUEANTE').length;
  const criticoCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const altoCount = alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-red-50/30 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-red-50">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-red-800">
            ⚡ Alertas Inteligentes — {alerts.length} achado(s) grave(s) BDC
          </h4>
          <p className="text-[10px] text-red-600/50 mt-0.5">
            Achados críticos/altos consolidados de todas as seções BDC. Clique em cada card para ver por que é crítico, evidências e ação recomendada.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {bloqueioCount > 0 && <Badge className="bg-red-700 text-white text-[10px]">{bloqueioCount} bloqueio</Badge>}
          {criticoCount > 0 && <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px]">{criticoCount} crítico</Badge>}
          {altoCount > 0 && <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px]">{altoCount} alto</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4 text-red-300" /> : <ChevronDown className="w-4 h-4 text-red-300" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-red-100 p-4 space-y-2.5">
          {top.map((flag, i) => {
            const alreadyShown = redFlagKeys.has(normaliseForMatch(flag.title));
            if (alreadyShown) {
              return (
                <div
                  key={`sa-dup-${i}`}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/60 border border-dashed border-slate-200 text-[11px] text-[#002443]/60"
                >
                  <ExternalLink className="w-3 h-3 text-[#002443]/30" />
                  <span className="flex-1">
                    <strong className="text-[#002443]/80">Já visto no bloco "Alertas Identificados":</strong>{' '}
                    {flag.title}
                  </span>
                  <a
                    href="#risk-red-flags"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.querySelector('[data-red-flags-panel]');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-[10px] font-semibold text-[#2bc196] hover:underline"
                  >
                    ↑ ver lá
                  </a>
                </div>
              );
            }
            return <RedFlagCard key={`sa-${i}`} flag={flag} defaultOpen={i === 0} />;
          })}
          {alerts.length > 10 && (
            <p className="text-[10px] text-red-400/70 text-center italic pt-2">
              + {alerts.length - 10} achados adicionais disponíveis na Análise Dimensional (bloco abaixo).
            </p>
          )}
        </div>
      )}
    </div>
  );
}