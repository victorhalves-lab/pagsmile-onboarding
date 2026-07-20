import React, { useMemo } from 'react';
import { Landmark, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FAIXAS = [
  { min: 800, label: 'A', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', desc: 'Excelente — Risco mínimo de inadimplência' },
  { min: 600, label: 'B', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Bom — Baixa probabilidade de inadimplência' },
  { min: 400, label: 'C', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Regular — Risco moderado, monitoramento recomendado' },
  { min: 200, label: 'D', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Fraco — Risco elevado de inadimplência' },
  { min: 0, label: 'E', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', desc: 'Muito Fraco — Alto risco de inadimplência' },
];

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function BDCCreditPanel({ integrationLogs = [], validations = [] }) {
  const creditData = useMemo(() => {
    const records = [...validations.filter(v => v.provider === 'BigDataCorp'), ...integrationLogs.filter(l => l.provider === 'BigDataCorp')];
    const creditRecord = records.find(r => {
      const svc = (r.service_type || r.validationType || '');
      return svc.includes('credit') || svc.includes('basic_enrichment');
    });
    if (!creditRecord) return null;
    const data = creditRecord.resultData || creditRecord.response_payload || {};
    const score = data.creditScore || data.score || data.credit_score || creditRecord.score;
    if (score == null) return null;
    return {
      score: typeof score === 'number' ? score : parseInt(score, 10),
      inadimplencia: data.defaultProbability || data.probabilidade_inadimplencia || data.inadimplencia || null,
      limite: data.creditLimit || data.limite_credito || data.suggestedLimit || null,
      faturamento: data.estimatedRevenue || data.faturamento_estimado || null,
      funcionarios: data.employees || data.funcionarios || null,
    };
  }, [integrationLogs, validations]);

  if (!creditData) return null;

  const faixa = FAIXAS.find(f => creditData.score >= f.min) || FAIXAS[FAIXAS.length - 1];
  const pct = Math.min(creditData.score / 1000, 1) * 100;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100"><Landmark className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">Score de Crédito BDC</h3>
            <p className="text-[10px] text-[var(--pinbank-blue)]/40">Avaliação de crédito e capacidade financeira via Big Data Corp</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-6 mb-4">
          {/* Score visual */}
          <div className="text-center">
            <p className={`text-4xl font-black ${faixa.color}`}>{creditData.score}</p>
            <p className="text-xs font-bold text-[var(--pinbank-blue)]/40">/ 1000</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${faixa.bg} ${faixa.color} text-sm font-black border ${faixa.border}`}>Faixa {faixa.label}</Badge>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: faixa.color.includes('green') ? '#16a34a' : faixa.color.includes('blue') ? '#3b82f6' : faixa.color.includes('amber') ? '#d97706' : faixa.color.includes('orange') ? '#ea580c' : '#dc2626' }} />
            </div>
            <p className={`text-[11px] mt-1.5 ${faixa.color}/80`}>{faixa.desc}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {creditData.inadimplencia != null && (
            <MetricCard label="Probabilidade Inadimplência" value={`${(typeof creditData.inadimplencia === 'number' && creditData.inadimplencia <= 1 ? creditData.inadimplencia * 100 : creditData.inadimplencia).toFixed(1)}%`} warn={creditData.inadimplencia > 0.2} />
          )}
          {creditData.limite != null && (
            <MetricCard label="Limite Sugerido" value={formatCurrency(creditData.limite)} />
          )}
          {creditData.faturamento != null && (
            <MetricCard label="Faturamento Estimado" value={formatCurrency(creditData.faturamento)} />
          )}
          {creditData.funcionarios != null && (
            <MetricCard label="Funcionários" value={creditData.funcionarios} />
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, warn }) {
  return (
    <div className={`p-3 rounded-xl border text-center ${warn ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
      <p className="text-[10px] text-[var(--pinbank-blue)]/40 font-bold">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${warn ? 'text-red-700' : 'text-[var(--pinbank-blue)]'}`}>{value}</p>
    </div>
  );
}