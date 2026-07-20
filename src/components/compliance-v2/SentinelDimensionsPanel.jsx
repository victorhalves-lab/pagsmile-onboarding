import React, { useState } from 'react';
import { Shield, Users, Scale, Globe, Star, Landmark, Fingerprint, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DIMENSIONS = [
  { key: 'identidade', label: '1. Identidade & Estrutura Societária', icon: Shield, desc: 'Confirma existência legal, dados cadastrais, situação na Receita e coerência da estrutura.' },
  { key: 'financeiro', label: '2. Saúde Financeira & Crédito', icon: Landmark, desc: 'Score de crédito, protestos, dívidas, capacidade financeira e histórico.' },
  { key: 'compliance', label: '3. Atividade & Modelo de Negócio', icon: Scale, desc: 'CNAE, MCC, modelo operacional, coerência entre atividade declarada e confirmada.' },
  { key: 'socios', label: '4. Compliance & Regulatório', icon: Users, desc: 'PEP, sanções, listas restritivas, PLD/FT, KYC dos sócios e UBOs.' },
  { key: 'reputacao', label: '5. Reputação & Mídia', icon: Star, desc: 'Mídia adversa, Reclame Aqui, processos judiciais, protestos públicos.' },
  { key: 'digital', label: '6. Operacional & Tecnologia', icon: Globe, desc: 'Presença digital, website, domínios, e-mails corporativos, infraestrutura.' },
  { key: 'biometria', label: '7. Relacionamentos & Vínculos', icon: Fingerprint, desc: 'Grupo econômico, empresas relacionadas, vínculos societários cruzados.' },
];

const VEREDICTO = {
  APROVADO: { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  ATENCAO: { icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  REPROVADO: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
  NAO_DISPONIVEL: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-500', bar: 'bg-gray-300' },
};

function DimensionCard({ dim, data }) {
  const [open, setOpen] = useState(false);
  const veredicto = data?.veredicto || 'NAO_DISPONIVEL';
  const cfg = VEREDICTO[veredicto] || VEREDICTO.NAO_DISPONIVEL;
  const Icon = dim.icon;
  const VIcon = cfg.icon;
  const confianca = data?.confianca ?? 0;
  const findings = data?.findings || [];
  const resumo = data?.resumo || '';

  return (
    <div className={`rounded-xl border-2 ${cfg.border} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-4 p-4 text-left hover:bg-white/50 transition-colors ${cfg.bg}`}>
        <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--pinbank-blue)]">{dim.label}</span>
            <Badge className={`text-[9px] ${cfg.badge} border-0`}>
              <VIcon className="w-3 h-3 mr-0.5" />
              {veredicto === 'NAO_DISPONIVEL' ? 'Sem dados' : veredicto}
            </Badge>
            {findings.length > 0 && <Badge variant="outline" className="text-[9px]">{findings.length} achados</Badge>}
          </div>
          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden max-w-[200px]">
              <div className={`h-full ${cfg.bar} rounded-full transition-all`} style={{ width: `${confianca}%` }} />
            </div>
            <span className="text-[10px] font-bold text-[var(--pinbank-blue)]/40">{confianca}%</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">O Que Esta Dimensão Avalia</p>
            <p className="text-xs text-indigo-700/80 leading-relaxed">{dim.desc}</p>
          </div>

          {resumo && (
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase tracking-wider mb-1">Resumo da Análise</p>
              <p className="text-xs text-[var(--pinbank-blue)]/70 leading-relaxed">{resumo}</p>
            </div>
          )}

          {findings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase tracking-wider mb-2">Pontos-Chave</p>
              <ul className="space-y-1.5">
                {findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg text-xs text-[var(--pinbank-blue)]/70 leading-relaxed border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--pinbank-blue)]/20 flex-shrink-0 mt-1.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SentinelDimensionsPanel({ score }) {
  const dimensional = score?.analise_dimensional;
  if (!dimensional) return null;

  const dims = DIMENSIONS.map(d => ({ ...d, data: dimensional[d.key] || null }));
  const approved = dims.filter(d => d.data?.veredicto === 'APROVADO').length;
  const attention = dims.filter(d => d.data?.veredicto === 'ATENCAO').length;
  const rejected = dims.filter(d => d.data?.veredicto === 'REPROVADO').length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-100"><Shield className="w-5 h-5 text-violet-600" /></div>
          <div>
            <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Análise por Dimensão — 7 Dimensões SENTINEL</h3>
            <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Cada dimensão com veredicto, confiança, resumo e pontos-chave</p>
          </div>
          <div className="ml-auto flex gap-2">
            {approved > 0 && <Badge className="bg-green-100 text-green-700 text-[10px]">{approved} OK</Badge>}
            {attention > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px]">{attention} Atenção</Badge>}
            {rejected > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{rejected} Reprovado</Badge>}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {dims.map(d => <DimensionCard key={d.key} dim={d} data={d.data} />)}
      </div>
    </div>
  );
}