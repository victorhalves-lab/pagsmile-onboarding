import React from 'react';
import { CreditCard, Zap, ShieldCheck, ArrowDownRight, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const RISK_COLORS = {
  'BAIXO': 'bg-green-100 text-green-700',
  'BAIXO-MÉDIO': 'bg-blue-100 text-blue-700',
  'MÉDIO': 'bg-amber-100 text-amber-700',
  'MÉDIO-ALTO': 'bg-orange-100 text-orange-700',
  'MUITO ALTO': 'bg-red-100 text-red-700',
};

const CONCORRENTES = {
  'Asaas': { mdr1x: 3.32, mdr2a6x: 3.82, mdr7a12x: 4.32, ops: 0.49, antecipacao: 1.25 },
  'Appmax': { mdr1x: 3.49, mdr2a6x: 5.08, mdr7a12x: null, ops: 0, antecipacao: 1.49 },
  'Stripe': { mdr1x: 4.25, mdr2a6x: 4.25, mdr7a12x: 4.25, ops: 0.39, antecipacao: 1.35 },
};

export default function SegmentRatesTable({ segmentRates }) {
  if (!segmentRates) return null;

  const {
    segmentName, mcc, riskLevel,
    mdrAvista, mdr2a6x, mdr7a12x, mdr13a21x,
    percentualAntecipacao, feeTransacao, antifraude, taxa3ds,
    pixTaxaPercentual, pixTaxaFixa,
  } = segmentRates;

  const riskClass = RISK_COLORS[riskLevel] || 'bg-slate-100 text-slate-700';

  const mdrRows = [
    { label: 'Crédito à Vista (1x)', value: mdrAvista, asaas: CONCORRENTES.Asaas.mdr1x, appmax: CONCORRENTES.Appmax.mdr1x, stripe: CONCORRENTES.Stripe.mdr1x },
    { label: 'Parcelado 2-6x', value: mdr2a6x, asaas: CONCORRENTES.Asaas.mdr2a6x, appmax: CONCORRENTES.Appmax.mdr2a6x, stripe: CONCORRENTES.Stripe.mdr2a6x },
    { label: 'Parcelado 7-12x', value: mdr7a12x, asaas: CONCORRENTES.Asaas.mdr7a12x, appmax: CONCORRENTES.Appmax.mdr7a12x, stripe: CONCORRENTES.Stripe.mdr7a12x },
    { label: 'Parcelado 13-21x', value: mdr13a21x, asaas: null, appmax: null, stripe: null },
  ];

  const fmtPct = (v) => v != null ? `${v.toFixed(2)}%` : '—';
  const fmtBrl = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

  return (
    <div className="space-y-6">
      {/* Segment header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={`${riskClass} text-xs font-bold px-3 py-1`}>
          {riskLevel}
        </Badge>
        {mcc && <span className="text-xs text-[#002443]/40 font-mono">MCC {mcc}</span>}
      </div>

      {/* MDR Table */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-[#2bc196]" />
          <h3 className="text-sm font-bold text-[#002443]">Taxas MDR — Cartão de Crédito</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#2bc196]/20">
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#002443]/50">Faixa</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-[#2bc196]">Pagsmile</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#002443]/40">Asaas*</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#002443]/40">Appmax</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#002443]/40">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {mdrRows.map((row) => (
                <tr key={row.label} className="border-b border-[#002443]/5 hover:bg-[#2bc196]/5 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-xs text-[#002443]">{row.label}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[#2bc196] text-sm">{fmtPct(row.value)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs text-[#002443]/40">{fmtPct(row.asaas)}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-[#002443]/40">{fmtPct(row.appmax)}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-[#002443]/40">{fmtPct(row.stripe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#002443]/30 mt-2">
          *Asaas efetivo = 2,99%+R$0,49/tx sobre R$150 ≈ 3,32%. Appmax 1x = 3,49%, parcelado = 3,49%+1,59%/parcela.
        </p>
      </div>

      {/* Operational fees */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#2bc196]" />
          <h3 className="text-sm font-bold text-[#002443]">Taxas Operacionais</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Processamento', value: feeTransacao, icon: Zap },
            { label: 'Antifraude', value: antifraude, icon: ShieldCheck },
            { label: '3DS (opcional)', value: taxa3ds, icon: ShieldCheck },
            { label: 'Antecipação', value: percentualAntecipacao, icon: ArrowDownRight, isPct: true },
          ].map((item) => (
            <div key={item.label} className="bg-[#f4f4f4] rounded-xl p-3 text-center">
              <item.icon className="w-4 h-4 text-[#2bc196] mx-auto mb-1.5" />
              <p className="text-xs text-[#002443]/50 mb-0.5">{item.label}</p>
              <p className="text-sm font-bold text-[#002443]">
                {item.isPct ? `${item.value.toFixed(2)}% a.m.` : `R$ ${item.value.toFixed(2).replace('.', ',')}/tx`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PIX */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-[#2bc196]" />
          <h3 className="text-sm font-bold text-[#002443]">PIX</h3>
        </div>
        <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-[#002443]/50">Taxa Percentual</p>
              <p className="text-lg font-bold text-[#2bc196]">{fmtPct(pixTaxaPercentual)}</p>
            </div>
            <span className="text-[#002443]/20 text-sm">ou</span>
            <div className="text-center">
              <p className="text-xs text-[#002443]/50">Taxa Fixa</p>
              <p className="text-lg font-bold text-[#2bc196]">{fmtBrl(pixTaxaFixa)}</p>
            </div>
          </div>
          <p className="text-xs text-[#002443]/50 italic">
            Cobra-se <span className="font-bold text-[#002443]">o que for maior</span>
          </p>
        </div>
      </div>
    </div>
  );
}