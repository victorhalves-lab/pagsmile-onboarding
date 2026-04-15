import React, { useState } from 'react';
import { Flag, ChevronDown, ChevronUp, Database, Brain, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function getSourceInfo(flag) {
  if (flag.startsWith('V4:')) return { source: 'BDC (V4)', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Database, label: 'Dado Objetivo BDC' };
  if (flag.startsWith('CAF:')) return { source: 'CAF', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Shield, label: 'Dado Objetivo CAF' };
  if (flag.startsWith('SENTINEL:')) return { source: 'SENTINEL', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Brain, label: 'Análise Qualitativa IA' };
  return { source: 'Geral', color: 'bg-slate-50 border-slate-200 text-slate-700', icon: Flag, label: 'Alerta' };
}

function cleanFlag(flag) {
  return flag.replace(/^(V4|CAF|SENTINEL):\s*/i, '').trim();
}

export default function RiskRedFlagsPanel({ onboardingCase, complianceScore }) {
  const [expanded, setExpanded] = useState(true);
  const allFlags = onboardingCase?.redFlags || complianceScore?.red_flags || [];
  
  if (allFlags.length === 0) return null;

  const v4Flags = allFlags.filter(f => f.startsWith('V4:'));
  const cafFlags = allFlags.filter(f => f.startsWith('CAF:'));
  const sentinelFlags = allFlags.filter(f => f.startsWith('SENTINEL:'));
  const otherFlags = allFlags.filter(f => !f.startsWith('V4:') && !f.startsWith('CAF:') && !f.startsWith('SENTINEL:'));

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
            Alertas são informativos para o analista. Apenas bloqueios V4 e fraude CAF são decisórios.
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
        <div className="border-t border-red-100 p-5 space-y-2">
          {allFlags.map((flag, i) => {
            const info = getSourceInfo(flag);
            const SourceIcon = info.icon;
            return (
              <div key={i} className={`rounded-xl p-3.5 border ${info.color}`}>
                <div className="flex items-start gap-3">
                  <SourceIcon className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[9px] ${info.color} border`}>{info.label}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{cleanFlag(flag)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}