import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, XCircle, CheckCircle2, Info, Scale, FileText, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RISK_EXPLANATIONS, FIELD_EXPLANATIONS, SECTION_EXPLANATIONS, BLOCK_EXPLANATIONS } from '@/components/analise-completa/BdcExplanations';

const RISK_COLORS = {
  CRITICO: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: XCircle },
  ALTO: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  MEDIO: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  BAIXO: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: Info },
  OK: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  INFO: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600', icon: Info },
};

function getRiskConfig(risk) {
  return RISK_COLORS[risk] || RISK_COLORS.INFO;
}

export default function BdcSectionInterpreter({ sectionKey, sectionData }) {
  const sectionInfo = SECTION_EXPLANATIONS[sectionKey] || { title: sectionKey, desc: '', importance: '' };
  const items = sectionData?.items || [];
  const score = sectionData?.score || 0;

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {/* Section header with explanation */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 rounded-xl border border-blue-100">
        <h4 className="text-sm font-bold text-[var(--pinbank-blue)] mb-1">{sectionInfo.title}</h4>
        <p className="text-xs text-[var(--pinbank-blue)]/60 leading-relaxed">{sectionInfo.desc}</p>
        {sectionInfo.importance && (
          <p className="text-[10px] text-indigo-600/70 mt-1 font-medium">⚖️ {sectionInfo.importance}</p>
        )}
        {score > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Badge className="bg-[var(--pinbank-blue)] text-white text-[10px]">Contribuição ao Score: +{score} pts</Badge>
          </div>
        )}
      </div>

      {/* Items with deep explanations */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <ItemInterpreter key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function ItemInterpreter({ item }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showLawsuits, setShowLawsuits] = useState(false);
  const cfg = getRiskConfig(item.risk);
  const Icon = cfg.icon;
  const fieldExplain = FIELD_EXPLANATIONS[item.label];
  const hasLawsuits = item.lawsuits && item.lawsuits.length > 0;

  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      <div className={`p-3.5 ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-4 h-4 ${cfg.text} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-[var(--pinbank-blue)]">{item.label}</span>
              <Badge className={`${cfg.badge} text-[10px] border-0`}>{item.risk}</Badge>
              {item.points !== 0 && (
                <span className={`text-[10px] font-bold ${item.points > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {item.points > 0 ? '+' : ''}{item.points} pts
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--pinbank-blue)]/80 leading-relaxed">{item.value}</p>

            {/* Inline details */}
            {item.details && typeof item.details === 'object' && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {Object.entries(item.details).map(([k, v]) => (
                  <div key={k} className="text-[10px] p-2 bg-white/60 rounded-lg">
                    <span className="text-[var(--pinbank-blue)]/40 font-semibold">{k}: </span>
                    <span className="text-[var(--pinbank-blue)]/80">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-2">
              {fieldExplain && (
                <button onClick={() => setShowExplanation(!showExplanation)} className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                  <HelpCircle className="w-3 h-3" />
                  {showExplanation ? 'Ocultar explicação' : 'Por que isso importa?'}
                </button>
              )}
              {hasLawsuits && (
                <button onClick={() => setShowLawsuits(!showLawsuits)} className="text-[10px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
                  <Scale className="w-3 h-3" />
                  {showLawsuits ? 'Ocultar processos' : `Ver ${item.lawsuits.length} processo(s) detalhado(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deep explanation panel */}
      {showExplanation && fieldExplain && (
        <div className="p-4 bg-indigo-50/30 border-t border-indigo-100 space-y-2">
          <div className="text-[11px] space-y-2">
            <div>
              <span className="font-bold text-indigo-700">📋 O que é: </span>
              <span className="text-indigo-900/80">{fieldExplain.what}</span>
            </div>
            <div>
              <span className="font-bold text-indigo-700">⚠️ Por que importa: </span>
              <span className="text-indigo-900/80">{fieldExplain.why}</span>
            </div>
            {fieldExplain.regulation && (
              <div>
                <span className="font-bold text-indigo-700">⚖️ Base regulatória: </span>
                <span className="text-indigo-900/80">{fieldExplain.regulation}</span>
              </div>
            )}
            {fieldExplain.thresholds && (
              <div>
                <span className="font-bold text-indigo-700">📊 Faixas de risco: </span>
                <span className="text-indigo-900/80">{fieldExplain.thresholds}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lawsuits drill-down */}
      {showLawsuits && hasLawsuits && (
        <div className="border-t border-slate-200 max-h-[500px] overflow-y-auto">
          {item.lawsuits.map((lw, i) => (
            <LawsuitDetail key={i} lawsuit={lw} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function LawsuitDetail({ lawsuit, index }) {
  const [expanded, setExpanded] = useState(false);
  const isCriminal = /criminal|penal|crime/i.test(lawsuit.type || '') || /criminal|penal|crime/i.test(lawsuit.courtType || '');

  return (
    <div className={`p-3 ${isCriminal ? 'bg-red-50/50' : 'bg-white'} ${index > 0 ? 'border-t border-slate-100' : ''}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-start gap-2">
          <Scale className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isCriminal ? 'text-red-600' : 'text-slate-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[var(--pinbank-blue)] font-mono">{lawsuit.number || 'N/I'}</span>
              {isCriminal && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">CRIMINAL</Badge>}
              {lawsuit.status && <Badge variant="outline" className="text-[9px]">{lawsuit.status}</Badge>}
            </div>
            <p className="text-[10px] text-[var(--pinbank-blue)]/60 mt-0.5">
              {lawsuit.court || lawsuit.courtType || 'Tribunal N/I'}
              {lawsuit.subject ? ` • ${lawsuit.subject}` : ''}
              {lawsuit.value != null ? ` • R$ ${Number(lawsuit.value).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : ''}
            </p>
          </div>
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 ml-6 space-y-2 text-[10px]">
          <div className="grid grid-cols-2 gap-2">
            {lawsuit.court && <Field label="Tribunal" value={lawsuit.court} />}
            {lawsuit.courtType && <Field label="Tipo" value={lawsuit.courtType} />}
            {lawsuit.courtLevel && <Field label="Nível" value={lawsuit.courtLevel} />}
            {lawsuit.judgingBody && <Field label="Órgão Julgador" value={lawsuit.judgingBody} />}
            {lawsuit.state && <Field label="UF" value={lawsuit.state} />}
            {lawsuit.startDate && <Field label="Data Início" value={formatDate(lawsuit.startDate)} />}
            {lawsuit.lastUpdate && <Field label="Última Movimentação" value={formatDate(lawsuit.lastUpdate)} />}
            {lawsuit.area && <Field label="Área" value={lawsuit.area} />}
            {lawsuit.inferredSubject && <Field label="Assunto CNJ" value={lawsuit.inferredSubject} />}
            {lawsuit.ownerName && <Field label="Sócio Vinculado" value={lawsuit.ownerName} />}
          </div>

          {/* Parties */}
          {lawsuit.parties && lawsuit.parties.length > 0 && (
            <div>
              <p className="font-bold text-[var(--pinbank-blue)]/60 mb-1">Partes ({lawsuit.parties.length})</p>
              <div className="space-y-1">
                {lawsuit.parties.slice(0, 10).map((p, pi) => (
                  <div key={pi} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded">
                    <Badge variant="outline" className="text-[8px]">{p.polarity || p.type || 'N/I'}</Badge>
                    <span className="text-[var(--pinbank-blue)]/80 truncate">{p.name || 'N/I'}</span>
                    {p.doc && <span className="text-[var(--pinbank-blue)]/40 font-mono">{p.doc}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent movements */}
          {lawsuit.recentUpdates && lawsuit.recentUpdates.length > 0 && (
            <div>
              <p className="font-bold text-[var(--pinbank-blue)]/60 mb-1">Movimentações Recentes</p>
              <div className="space-y-1">
                {lawsuit.recentUpdates.slice(0, 5).map((u, ui) => (
                  <div key={ui} className="p-2 bg-blue-50/50 rounded text-[10px]">
                    <span className="text-blue-600/60 font-mono">{formatDate(u.date)}: </span>
                    <span className="text-[var(--pinbank-blue)]/70">{u.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lawsuit.lastMovement && !lawsuit.recentUpdates?.length && (
            <Field label="Última Movimentação" value={lawsuit.lastMovement} />
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="p-1.5 bg-slate-50 rounded">
      <span className="text-[var(--pinbank-blue)]/40 font-semibold">{label}: </span>
      <span className="text-[var(--pinbank-blue)]/80">{value}</span>
    </div>
  );
}

function formatDate(d) {
  if (!d) return 'N/D';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return String(d); }
}

export function BlockInterpreter({ block }) {
  const [showDetail, setShowDetail] = useState(false);
  const blockInfo = BLOCK_EXPLANATIONS[block.code] || {};

  return (
    <div className="p-4 bg-red-50 rounded-xl border-2 border-red-300">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className="bg-red-600 text-white text-[10px] font-bold">{block.code}</Badge>
            <span className="text-sm font-bold text-red-700">{block.label}</span>
            <Badge className="bg-red-100 text-red-700 text-[10px] border-0">{block.severity}</Badge>
          </div>
          <p className="text-xs text-red-700/80 leading-relaxed">{block.detail}</p>

          <button onClick={() => setShowDetail(!showDetail)} className="mt-2 text-[10px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {showDetail ? 'Ocultar explicação' : 'Entender este bloqueio'}
          </button>

          {showDetail && blockInfo.desc && (
            <div className="mt-2 p-3 bg-red-100/50 rounded-lg text-[11px] space-y-1">
              <div><span className="font-bold text-red-700">📋 O que é: </span><span className="text-red-900/80">{blockInfo.desc}</span></div>
              <div><span className="font-bold text-red-700">🚫 Consequência: </span><span className="text-red-900/80">{blockInfo.consequence}</span></div>
              <div><span className="font-bold text-red-700">⚖️ Base legal: </span><span className="text-red-900/80">{blockInfo.regulation}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}