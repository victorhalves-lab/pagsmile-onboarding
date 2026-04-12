import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * BDCSmartAlerts — Consolidates the TOP critical/high risk findings across ALL sections
 * into prominent alert cards at the top of the analysis, before any section.
 */

const CNAE_RISK_MAP = {
  '6311': { level: 'ALTO', desc: 'Portais, provedores de conteúdo e outros serviços de informação na internet — frequentemente usado por fintechs, apostas e intermediários financeiros.' },
  '6619': { level: 'ALTO', desc: 'Atividades auxiliares dos serviços financeiros — pode incluir correspondentes bancários e intermediadores de pagamento sem regulação.' },
  '6499': { level: 'ALTO', desc: 'Outros serviços financeiros não classificados — categoria genérica que pode encobrir atividades reguladas.' },
  '9200': { level: 'CRITICO', desc: 'Atividades de exploração de jogos de azar e apostas — setor altamente regulado com exigência de licença.' },
  '6492': { level: 'ALTO', desc: 'Crédito, financiamento e investimento — atividade regulada pelo Banco Central.' },
  '4712': { level: 'MEDIO', desc: 'Comércio varejista de mercadorias em geral — risco moderado, comum em e-commerce.' },
  '4789': { level: 'MEDIO', desc: 'Comércio varejista de outros produtos novos não especificados — pode indicar dropshipping.' },
  '8299': { level: 'MEDIO', desc: 'Outras atividades de serviços prestados — categoria genérica, requer investigação do que realmente faz.' },
};

function getCnaeAlert(cnae) {
  if (!cnae) return null;
  const code = cnae.replace(/[^0-9]/g, '').substring(0, 4);
  return CNAE_RISK_MAP[code] || null;
}

export default function BDCSmartAlerts({ analysis, merchant }) {
  const [expanded, setExpanded] = useState(true);
  if (!analysis) return null;

  const alerts = [];

  // 1. Collect all critical/high items from sections
  const sections = analysis.sections || {};
  const allSections = ['identity', 'owners', 'digital', 'compliance', 'reputation', 'financial'];
  
  for (const sectionKey of allSections) {
    const section = sections[sectionKey];
    if (!section?.items) continue;
    for (const item of section.items) {
      if (item.risk === 'CRITICO' || item.risk === 'ALTO') {
        alerts.push({
          severity: item.risk,
          section: sectionKey,
          title: item.label,
          detail: item.value,
          points: item.points,
        });
      }
    }
  }

  // 2. Check blocks
  for (const block of (analysis.blocks || [])) {
    alerts.push({
      severity: 'BLOQUEIO',
      section: 'bloqueio',
      title: `${block.code}: ${block.label}`,
      detail: block.detail,
      points: block.score || 850,
    });
  }

  // 3. CNAE alert
  const identityItems = sections.identity?.items || [];
  const cnaeItem = identityItems.find(i => i.label?.toLowerCase().includes('cnae'));
  if (cnaeItem) {
    const cnaeAlert = getCnaeAlert(cnaeItem.value);
    if (cnaeAlert) {
      alerts.push({
        severity: cnaeAlert.level,
        section: 'cnae',
        title: `CNAE de Risco: ${cnaeItem.value}`,
        detail: cnaeAlert.desc,
        points: 0,
        isCnae: true,
      });
    }
  }

  if (alerts.length === 0) return null;

  // Sort: BLOQUEIO > CRITICO > ALTO
  const severityOrder = { 'BLOQUEIO': 0, 'CRITICO': 1, 'ALTO': 2, 'MEDIO': 3 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  const top = alerts.slice(0, 8);
  const bloqueioCount = alerts.filter(a => a.severity === 'BLOQUEIO').length;
  const criticoCount = alerts.filter(a => a.severity === 'CRITICO').length;
  const altoCount = alerts.filter(a => a.severity === 'ALTO').length;

  return (
    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-red-50/30 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-red-50">
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-red-800">
            ⚡ Alertas Inteligentes — {alerts.length} achado(s) grave(s)
          </h4>
          <p className="text-[10px] text-red-600/50">
            Consolidação dos achados mais graves de todas as seções BDC
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
          {top.map((alert, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${
                alert.severity === 'BLOQUEIO' ? 'bg-red-50 border-red-300' :
                alert.severity === 'CRITICO' ? 'bg-red-50/60 border-red-200' :
                'bg-orange-50/60 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'BLOQUEIO' || alert.severity === 'CRITICO' 
                  ? <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold ${alert.severity === 'ALTO' ? 'text-orange-800' : 'text-red-800'}`}>
                      {alert.title}
                    </span>
                    <Badge className={`text-[9px] ${
                      alert.severity === 'BLOQUEIO' ? 'bg-red-700 text-white' :
                      alert.severity === 'CRITICO' ? 'bg-red-100 text-red-700 border-red-200 border' :
                      'bg-orange-100 text-orange-700 border-orange-200 border'
                    }`}>
                      {alert.severity === 'BLOQUEIO' ? 'BLOQUEANTE' : alert.severity}
                    </Badge>
                    {alert.points > 0 && (
                      <span className="text-[10px] font-mono text-red-600">↑ {alert.points} pts</span>
                    )}
                  </div>
                  <p className={`text-[12px] leading-relaxed ${alert.severity === 'ALTO' ? 'text-orange-700/80' : 'text-red-700/80'}`}>
                    {alert.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {alerts.length > 8 && (
            <p className="text-[10px] text-red-400 text-center">
              ... e mais {alerts.length - 8} achados nas seções detalhadas abaixo
            </p>
          )}
        </div>
      )}
    </div>
  );
}