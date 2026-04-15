import React, { useState } from 'react';
import { Flag, ChevronDown, ChevronUp, Database, Brain, Shield, AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function getSourceInfo(flag) {
  if (flag.startsWith('V4:')) return { source: 'BDC (V4)', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Database, label: 'Dado Objetivo BDC', explanation: 'Este alerta vem de dados OBJETIVOS da Big Data Corp (Receita Federal, Processos, Sanções, etc.). São fatos verificáveis, não opinião.' };
  if (flag.startsWith('CAF:')) return { source: 'CAF', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Shield, label: 'Dado Objetivo CAF', explanation: 'Este alerta vem da CAF (Combate à Fraude) — verificação biométrica e documental. São dados OBJETIVOS de identidade.' };
  if (flag.startsWith('SENTINEL:')) return { source: 'SENTINEL', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Brain, label: 'Análise Qualitativa IA', explanation: 'Este alerta foi gerado pela IA SENTINEL com base na análise do questionário e cruzamento de dados. É uma análise QUALITATIVA (opinião fundamentada da IA), não um fato objetivo. O SENTINEL NÃO pode recusar um caso — apenas sugerir condições ou revisão manual.' };
  return { source: 'Geral', color: 'bg-slate-50 border-slate-200 text-slate-700', icon: Flag, label: 'Alerta', explanation: 'Alerta geral do sistema.' };
}

function cleanFlag(flag) {
  return flag.replace(/^(V4|CAF|SENTINEL):\s*/i, '').trim();
}

function FlagCard({ flag }) {
  const [showHelp, setShowHelp] = useState(false);
  const info = getSourceInfo(flag);
  const SourceIcon = info.icon;
  const cleanText = cleanFlag(flag);

  // Try to extract source reference from SENTINEL flags [FONTE: ...]
  let sourceRef = null;
  const fonteMatch = cleanText.match(/\[FONTE:\s*([^\]]+)\]/);
  if (fonteMatch) sourceRef = fonteMatch[1].trim();
  const displayText = cleanText.replace(/\[FONTE:\s*[^\]]+\]\s*/g, '').trim();

  return (
    <div className={`rounded-xl border ${info.color} overflow-hidden`}>
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <SourceIcon className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`text-[9px] ${info.color} border`}>{info.label}</Badge>
              {sourceRef && (
                <span className="text-[9px] text-[#002443]/40 italic">Fonte: {sourceRef}</span>
              )}
              <button onClick={() => setShowHelp(!showHelp)} className="opacity-40 hover:opacity-100 transition-opacity ml-auto">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm leading-relaxed">{displayText || cleanText}</p>
          </div>
        </div>
      </div>
      {showHelp && (
        <div className="px-3.5 pb-3 pt-0">
          <div className="bg-white/80 rounded-lg p-2.5 border border-[#002443]/5 ml-7">
            <div className="flex items-start gap-1.5">
              <Info className="w-3 h-3 text-[#002443]/30 mt-0.5 shrink-0" />
              <p className="text-[10px] text-[#002443]/50 leading-relaxed">{info.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiskRedFlagsPanel({ onboardingCase, complianceScore }) {
  const [expanded, setExpanded] = useState(true);
  const allFlags = onboardingCase?.redFlags || complianceScore?.red_flags || [];
  
  if (allFlags.length === 0) return null;

  const v4Flags = allFlags.filter(f => f.startsWith('V4:'));
  const cafFlags = allFlags.filter(f => f.startsWith('CAF:'));
  const sentinelFlags = allFlags.filter(f => f.startsWith('SENTINEL:'));

  return (
    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-5 hover:bg-red-50/30 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-red-50">
          <Flag className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#002443]">
            {allFlags.length} Alerta(s) Identificado(s)
          </h4>
          <p className="text-[10px] text-[#002443]/40">
            Alertas BDC/CAF são dados objetivos. Alertas SENTINEL são análise qualitativa da IA. Clique no "?" para entender cada fonte.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {v4Flags.length > 0 && <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[10px]">{v4Flags.length} BDC</Badge>}
          {cafFlags.length > 0 && <Badge className="bg-purple-50 text-purple-700 border-purple-200 border text-[10px]">{cafFlags.length} CAF</Badge>}
          {sentinelFlags.length > 0 && <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px]">{sentinelFlags.length} SENTINEL</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-red-100 p-5 space-y-4">
          {/* Guide */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] text-[#002443]/50 leading-relaxed">
              <strong className="text-[#002443]/70">Como ler os alertas:</strong> Alertas <strong className="text-blue-600">BDC (azul)</strong> e <strong className="text-purple-600">CAF (roxo)</strong> são dados objetivos e verificáveis — eles TÊM peso na decisão automática. 
              Alertas <strong className="text-amber-600">SENTINEL (amarelo)</strong> são análises qualitativas da IA baseadas no questionário — eles podem escalar a decisão para Revisão Manual, mas NÃO podem recusar automaticamente.
            </p>
          </div>

          {/* BDC Flags first (objective, most important) */}
          {v4Flags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Dados Objetivos — Big Data Corp ({v4Flags.length})
              </p>
              <div className="space-y-2">
                {v4Flags.map((flag, i) => <FlagCard key={`v4-${i}`} flag={flag} />)}
              </div>
            </div>
          )}

          {/* CAF Flags */}
          {cafFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Dados Objetivos — CAF Verificação de Identidade ({cafFlags.length})
              </p>
              <div className="space-y-2">
                {cafFlags.map((flag, i) => <FlagCard key={`caf-${i}`} flag={flag} />)}
              </div>
            </div>
          )}

          {/* SENTINEL Flags */}
          {sentinelFlags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Brain className="w-3 h-3" /> Análise Qualitativa — SENTINEL IA ({sentinelFlags.length})
              </p>
              <div className="space-y-2">
                {sentinelFlags.map((flag, i) => <FlagCard key={`sentinel-${i}`} flag={flag} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}