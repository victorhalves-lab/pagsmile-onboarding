import React, { useState } from 'react';
import { 
  Shield, Users, Scale, Globe, Star, Landmark, Fingerprint,
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DIMENSIONS = [
  { key: 'identidade', label: 'Identidade', icon: Shield, color: 'blue' },
  { key: 'socios', label: 'Sócios/QSA', icon: Users, color: 'purple' },
  { key: 'compliance', label: 'Compliance', icon: Scale, color: 'red' },
  { key: 'digital', label: 'Pegada Digital', icon: Globe, color: 'cyan' },
  { key: 'reputacao', label: 'Reputação', icon: Star, color: 'amber' },
  { key: 'financeiro', label: 'Financeiro', icon: Landmark, color: 'green' },
  { key: 'biometria', label: 'Biometria/CAF', icon: Fingerprint, color: 'indigo' },
];

const VEREDICTO_CONFIG = {
  APROVADO: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  ATENCAO: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  REPROVADO: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  NAO_DISPONIVEL: { icon: HelpCircle, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', badge: 'bg-gray-100 text-gray-500' },
};

function ConfidenceBar({ value }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-bold text-[var(--pagsmile-blue)]/60">{value}%</span>
    </div>
  );
}

function DimensionCard({ dimension, data }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = dimension.icon;
  const veredicto = data?.veredicto || 'NAO_DISPONIVEL';
  const config = VEREDICTO_CONFIG[veredicto] || VEREDICTO_CONFIG.NAO_DISPONIVEL;
  const VIcon = config.icon;
  const confianca = data?.confianca ?? 0;
  const findings = data?.findings || [];

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden transition-all`}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <div className={`w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--pagsmile-blue)]">{dimension.label}</span>
            <Badge className={`text-[9px] ${config.badge}`}>
              <VIcon className="w-2.5 h-2.5 mr-0.5" />
              {veredicto === 'NAO_DISPONIVEL' ? 'N/D' : veredicto}
            </Badge>
          </div>
          <div className="mt-1 w-full max-w-[140px]">
            <ConfidenceBar value={confianca} />
          </div>
        </div>
        {findings.length > 0 && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[9px]">{findings.length}</Badge>
            {expanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
          </div>
        )}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {data?.resumo && (
            <p className="text-xs text-[var(--pagsmile-blue)]/70 leading-relaxed bg-white/60 rounded-lg p-2">{data.resumo}</p>
          )}
          {findings.length > 0 && (
            <div className="space-y-1">
              {findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--pagsmile-blue)]/60 bg-white/40 rounded p-1.5">
                  <span className="text-[9px] font-bold text-[var(--pagsmile-blue)]/30 mt-0.5">F{i+1}</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComplianceDecisionMatrix({ score }) {
  const dimensional = score?.analise_dimensional;
  if (!dimensional) return null;

  const dims = DIMENSIONS.map(d => ({
    ...d,
    data: dimensional[d.key] || null
  }));

  const approved = dims.filter(d => d.data?.veredicto === 'APROVADO').length;
  const attention = dims.filter(d => d.data?.veredicto === 'ATENCAO').length;
  const rejected = dims.filter(d => d.data?.veredicto === 'REPROVADO').length;
  const nd = dims.filter(d => !d.data || d.data?.veredicto === 'NAO_DISPONIVEL').length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--pagsmile-blue)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Matriz de Decisão por Dimensão
        </h3>
        <div className="flex gap-1.5">
          {approved > 0 && <Badge className="bg-green-100 text-green-700 text-[9px]">{approved} OK</Badge>}
          {attention > 0 && <Badge className="bg-amber-100 text-amber-700 text-[9px]">{attention} Atenção</Badge>}
          {rejected > 0 && <Badge className="bg-red-100 text-red-700 text-[9px]">{rejected} Reprovado</Badge>}
          {nd > 0 && <Badge className="bg-gray-100 text-gray-500 text-[9px]">{nd} N/D</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {dims.map(d => (
          <DimensionCard key={d.key} dimension={d} data={d.data} />
        ))}
      </div>
    </div>
  );
}