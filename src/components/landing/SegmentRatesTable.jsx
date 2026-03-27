import React from 'react';
import { CreditCard, Zap, ShieldCheck, ArrowDownRight, Smartphone, TrendingDown } from 'lucide-react';

export default function SegmentRatesTable({ segmentRates }) {
  if (!segmentRates) return null;

  const {
    segmentName,
    mdrAvista, mdr2a6x, mdr7a12x, mdr13a21x,
    percentualAntecipacao, feeTransacao, antifraude, taxa3ds,
    pixTaxaPercentual, pixTaxaFixa,
  } = segmentRates;

  const mdrRows = [
    { label: 'Crédito à Vista (1x)', value: mdrAvista },
    { label: 'Parcelado 2-6x', value: mdr2a6x },
    { label: 'Parcelado 7-12x', value: mdr7a12x },
    { label: 'Parcelado 13-21x', value: mdr13a21x },
  ].filter(row => row.value != null);

  const fmtPct = (v) => v != null ? `${v.toFixed(2)}%` : '—';
  const fmtBrl = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

  return (
    <div className="space-y-8">
      {/* MDR — Cartão de Crédito */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-[#2bc196]/10 rounded-xl">
            <CreditCard className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#002443]">Taxas MDR — Cartão de Crédito</h3>
            <p className="text-[11px] text-[#002443]/40">Válidas para todas as bandeiras (Visa, Mastercard, Elo, Amex)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mdrRows.map((row) => (
            <div key={row.label} className="relative bg-gradient-to-b from-white to-[#f4f4f4] rounded-2xl border border-[#002443]/5 p-5 text-center group hover:border-[#2bc196]/30 hover:shadow-lg hover:shadow-[#2bc196]/5 transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#2bc196] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[11px] font-medium text-[#002443]/50 mb-3">{row.label}</p>
              <p className="text-3xl font-bold text-[#2bc196] mb-1">{row.value.toFixed(2)}<span className="text-lg">%</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Taxas Operacionais */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-[#002443]/5 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#002443]/60" />
          </div>
          <h3 className="text-base font-bold text-[#002443]">Taxas Operacionais</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Processamento', value: feeTransacao, icon: Zap, format: 'brl' },
            { label: 'Antifraude', value: antifraude, icon: ShieldCheck, format: 'brl' },
            { label: '3DS (opcional)', value: taxa3ds, icon: ShieldCheck, format: 'brl' },
            { label: 'Antecipação', value: percentualAntecipacao, icon: ArrowDownRight, format: 'pct' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-[#002443]/5 p-4 text-center hover:border-[#002443]/10 transition-colors">
              <item.icon className="w-5 h-5 text-[#2bc196] mx-auto mb-2" />
              <p className="text-[11px] text-[#002443]/50 mb-1.5">{item.label}</p>
              <p className="text-lg font-bold text-[#002443]">
                {item.format === 'pct'
                  ? `${item.value?.toFixed(2) || '0.00'}% a.m.`
                  : `R$ ${(item.value || 0).toFixed(2).replace('.', ',')}`}
              </p>
              {item.format === 'brl' && <p className="text-[9px] text-[#002443]/30 mt-0.5">por transação</p>}
            </div>
          ))}
        </div>
      </div>

      {/* PIX */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-[#2bc196]/10 rounded-xl">
            <Smartphone className="w-5 h-5 text-[#2bc196]" />
          </div>
          <h3 className="text-base font-bold text-[#002443]">PIX</h3>
        </div>

        <div className="bg-gradient-to-r from-[#2bc196]/5 to-[#5cf7cf]/5 border border-[#2bc196]/15 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {pixTaxaPercentual != null && (
              <div className="text-center">
                <p className="text-[11px] text-[#002443]/40 mb-1">Taxa Percentual</p>
                <p className="text-3xl font-bold text-[#2bc196]">{fmtPct(pixTaxaPercentual)}</p>
              </div>
            )}
            {pixTaxaPercentual != null && pixTaxaFixa != null && (
              <div className="text-[#002443]/15 text-lg font-light">ou</div>
            )}
            {pixTaxaFixa != null && (
              <div className="text-center">
                <p className="text-[11px] text-[#002443]/40 mb-1">Taxa Fixa</p>
                <p className="text-3xl font-bold text-[#2bc196]">{fmtBrl(pixTaxaFixa)}</p>
              </div>
            )}
          </div>
          <p className="text-center text-[11px] text-[#002443]/40 mt-3">
            Aplica-se <span className="font-semibold text-[#002443]/60">o maior valor</span> entre as taxas
          </p>
        </div>
      </div>
    </div>
  );
}