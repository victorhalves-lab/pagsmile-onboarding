import React, { useState, useMemo } from 'react';
import { Scale, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TIPO_LABELS = {
  civel: { label: 'Cível', color: 'bg-blue-100 text-blue-700' },
  trabalhista: { label: 'Trabalhista', color: 'bg-amber-100 text-amber-700' },
  criminal: { label: 'Criminal', color: 'bg-red-100 text-red-700' },
  tributario: { label: 'Tributário', color: 'bg-orange-100 text-orange-700' },
  administrativo: { label: 'Administrativo', color: 'bg-purple-100 text-purple-700' },
  outros: { label: 'Outros', color: 'bg-slate-100 text-slate-700' },
};

function classifyType(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('cível') || t.includes('civel') || t.includes('civil')) return 'civel';
  if (t.includes('trabalhist')) return 'trabalhista';
  if (t.includes('criminal') || t.includes('penal')) return 'criminal';
  if (t.includes('tribut') || t.includes('fiscal')) return 'tributario';
  if (t.includes('administrat')) return 'administrativo';
  return 'outros';
}

function formatCurrency(val) {
  if (val == null || isNaN(val)) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function BDCProcessosPanel({ integrationLogs = [], validations = [] }) {
  const [expanded, setExpanded] = useState(false);

  const processos = useMemo(() => {
    const records = [...validations.filter(v => v.provider === 'BigDataCorp'), ...integrationLogs.filter(l => l.provider === 'BigDataCorp')];
    const kycRecord = records.find(r => {
      const svc = (r.service_type || r.validationType || '');
      return svc.includes('kyc_real') || svc.includes('empresas_kyc');
    });
    if (!kycRecord) return [];
    const data = kycRecord.resultData || kycRecord.response_payload || {};
    const procs = data.processos || data.lawsuits || data.lawsuitsData || [];
    if (!Array.isArray(procs)) return [];
    return procs.map(p => ({
      ...p,
      tipo: classifyType(p.tipo || p.type || p.area || ''),
      valor: p.valor || p.value || p.amount || null,
      numero: p.numero || p.number || p.processNumber || '',
      tribunal: p.tribunal || p.court || '',
      assunto: p.assunto || p.subject || p.description || '',
    }));
  }, [integrationLogs, validations]);

  if (!processos.length) return null;

  const byType = {};
  processos.forEach(p => { byType[p.tipo] = (byType[p.tipo] || 0) + 1; });
  const totalValor = processos.reduce((sum, p) => sum + (p.valor || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100"><Scale className="w-5 h-5 text-rose-600" /></div>
          <div>
            <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">Processos Judiciais — {processos.length} encontrado(s)</h3>
            <p className="text-[10px] text-[var(--pinbank-blue)]/40">Dados de Tribunais de Justiça via Big Data Corp</p>
          </div>
          {totalValor > 0 && <Badge className="bg-red-100 text-red-700 text-xs ml-auto border-0">Total: {formatCurrency(totalValor)}</Badge>}
        </div>
      </div>

      <div className="p-5">
        {/* By type summary */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(byType).map(([tipo, count]) => {
            const cfg = TIPO_LABELS[tipo] || TIPO_LABELS.outros;
            return (
              <div key={tipo} className={`px-3 py-2 rounded-lg border text-center ${cfg.color}`}>
                <p className="text-lg font-black">{count}</p>
                <p className="text-[10px] font-bold">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {processos.length > 3 && !expanded ? (
          <>
            {processos.slice(0, 3).map((p, i) => <ProcessoRow key={i} processo={p} />)}
            <button onClick={() => setExpanded(true)} className="w-full mt-2 py-2.5 text-center text-xs font-medium text-rose-600 border border-dashed border-rose-200 rounded-lg hover:bg-rose-50/50">
              Ver todos ({processos.length - 3} restantes)
            </button>
          </>
        ) : (
          processos.map((p, i) => <ProcessoRow key={i} processo={p} />)
        )}
      </div>
    </div>
  );
}

function ProcessoRow({ processo }) {
  const cfg = TIPO_LABELS[processo.tipo] || TIPO_LABELS.outros;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-2 text-xs">
      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge className={`text-[9px] ${cfg.color} border-0`}>{cfg.label}</Badge>
          {processo.numero && <span className="text-[var(--pinbank-blue)]/40 font-mono text-[10px]">{processo.numero}</span>}
          {processo.valor > 0 && <span className="font-bold text-red-600">{formatCurrency(processo.valor)}</span>}
        </div>
        {processo.assunto && <p className="text-[var(--pinbank-blue)]/60 leading-relaxed">{processo.assunto}</p>}
        {processo.tribunal && <p className="text-[10px] text-[var(--pinbank-blue)]/30 mt-0.5">{processo.tribunal}</p>}
      </div>
    </div>
  );
}