import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, AlertOctagon, HelpCircle } from 'lucide-react';
import BDCLawsuitsViewer from './BDCLawsuitsViewer';
import { getItemExplanation } from './BDCItemExplanations';

const RISK_CONFIG = {
  'CRITICO': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertOctagon, badgeBg: 'bg-red-100' },
  'ALTO': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertTriangle, badgeBg: 'bg-orange-100' },
  'MEDIO': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle, badgeBg: 'bg-amber-100' },
  'BAIXO': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Info, badgeBg: 'bg-blue-100' },
  'OK': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, badgeBg: 'bg-emerald-100' },
  'INFO': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Info, badgeBg: 'bg-slate-100' },
};

// FIX B05: Human-readable risk labels instead of technical codes
const RISK_LABELS = {
  'CRITICO': 'Risco Crítico',
  'ALTO': 'Risco Alto',
  'MEDIO': 'Atenção',
  'BAIXO': 'Risco Baixo',
  'OK': 'Normal',
  'INFO': 'Informação',
};

function RiskIndicator({ risk }) {
  const c = RISK_CONFIG[risk] || RISK_CONFIG.INFO;
  const Icon = c.icon;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.border} border`}>
      <Icon className={`w-3 h-3 ${c.text}`} />
      <span className={`text-[10px] font-semibold ${c.text}`}>{RISK_LABELS[risk] || risk}</span>
    </div>
  );
}

function AnalysisItem({ item }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const c = RISK_CONFIG[item.risk] || RISK_CONFIG.INFO;
  const hasDetails = item.details && Object.keys(item.details).length > 0;
  const hasOwners = item.owners && item.owners.length > 0;
  const hasLawsuits = item.lawsuits && item.lawsuits.length > 0;
  const hasExpandable = hasDetails || hasOwners || hasLawsuits;
  const explanation = getItemExplanation(item.label);

  // Auto-expand lawsuits/owners/details for critical/high risk items
  const [autoExpanded] = useState(() => 
    (item.risk === 'CRITICO' || item.risk === 'ALTO') && (hasLawsuits || hasOwners)
  );
  const isDetailsOpen = showDetails || autoExpanded;

  return (
    <div className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${item.risk === 'CRITICO' ? 'bg-red-50/30' : item.risk === 'ALTO' ? 'bg-orange-50/20' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#002443]">{item.label}</span>
            {explanation && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowExplanation(!showExplanation); }}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                title="O que isso significa?"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <RiskIndicator risk={item.risk} />
            {item.points !== 0 && (
              <span 
                className={`text-[10px] font-mono ${item.points > 0 ? 'text-red-600' : 'text-emerald-600'} cursor-help`}
                title={item.points > 0 ? `Adiciona ${item.points} pontos ao score de risco (quanto mais alto, mais arriscado)` : `Reduz ${Math.abs(item.points)} pontos do score de risco (fator positivo)`}
              >
                {item.points > 0 ? '↑' : '↓'} {Math.abs(item.points)} pts
              </span>
            )}
          </div>
          <p className={`text-[12px] mt-0.5 ${c.text} leading-relaxed`}>{item.value}</p>
          
          {/* Contextual explanation */}
          {showExplanation && explanation && (
            <div className="mt-2 p-3 bg-blue-50/80 rounded-lg border border-blue-100">
              <p className="text-[11px] text-blue-800 leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>
        {hasExpandable && (
          <button onClick={() => setShowDetails(!isDetailsOpen)} className="text-[#002443]/30 hover:text-[#002443]/60 p-1">
            {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Lawsuits summary when no detailed data */}
      {!hasLawsuits && item.lawsuitCount > 0 && (
        <div className="mt-2 ml-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>⚠️ Atenção:</strong> A Big Data Corp reportou <strong>{item.lawsuitCount} processo(s)</strong> mas os detalhes individuais (número, tribunal, tipo, partes) não estão disponíveis nesta consulta. 
            Isso pode ocorrer porque o dataset de detalhamento completo não foi incluído ou porque os dados estão sob sigilo judicial.
            <br/>Recomendação: Consultar diretamente nos tribunais ou solicitar o dataset <code className="bg-amber-100 px-1 rounded text-[10px]">processes</code> com parâmetros expandidos.
          </p>
        </div>
      )}

      {isDetailsOpen && hasDetails && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-200 space-y-1.5">
          {Object.entries(item.details).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-[#002443]/40 min-w-[90px] shrink-0">{key}:</span>
              <div className="text-[11px] text-[#002443]/70 leading-relaxed">
                {Array.isArray(val) ? (
                  <div className="space-y-0.5">
                    {val.map((v, vi) => (
                      <div key={vi} className="flex items-start gap-1">
                        <span className="text-[#002443]/25 mt-0.5">•</span>
                        <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : typeof val === 'object' ? (
                  <pre className="text-[10px] bg-slate-50 p-1.5 rounded whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>
                ) : (
                  <span>{String(val)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {isDetailsOpen && hasOwners && (
        <div className="mt-2 ml-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Nome</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Documento</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Qualificação</th>
                <th className="text-left py-1 px-2 text-[#002443]/50 font-semibold">Part. (%)</th>
              </tr>
            </thead>
            <tbody>
              {item.owners.map((o, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1 px-2 text-[#002443]">{o.name}</td>
                  <td className="py-1 px-2 text-[#002443]/60 font-mono">{o.doc || '—'}</td>
                  <td className="py-1 px-2 text-[#002443]/60">{o.role || '—'}</td>
                  <td className="py-1 px-2 text-[#002443]/60">{o.participation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isDetailsOpen && hasLawsuits && (
        <div className="mt-2 ml-4">
          <BDCLawsuitsViewer lawsuits={item.lawsuits} />
        </div>
      )}
    </div>
  );
}

export default function BDCAnalysisSection({ title, icon: Icon, items, score, accentColor = 'indigo', defaultOpen = false }) {
  const criticalCount = items?.filter(i => i.risk === 'CRITICO').length || 0;
  const highCount = items?.filter(i => i.risk === 'ALTO').length || 0;
  // FIX B04: Auto-open sections that have critical or high-risk items
  const shouldAutoOpen = defaultOpen || criticalCount > 0 || highCount > 0;
  const [open, setOpen] = useState(shouldAutoOpen);
  if (!items || items.length === 0) return null;

  const okCount = items.filter(i => i.risk === 'OK').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg bg-${accentColor}-50`}>
          <Icon className={`w-4.5 h-4.5 text-${accentColor}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#002443]">{title}</h4>
          <p className="text-[10px] text-[#002443]/40">{items.length} item(ns) analisados</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 border text-[10px]">{criticalCount} crítico</Badge>
          )}
          {highCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-[10px]">{highCount} alto</Badge>
          )}
          {okCount > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-[10px]">{okCount} ok</Badge>
          )}
          {score !== undefined && (
            <span className={`text-xs font-bold ${score > 0 ? 'text-red-600' : score < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {score > 0 ? '+' : ''}{score} pts
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {items.map((item, i) => (
            <AnalysisItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}