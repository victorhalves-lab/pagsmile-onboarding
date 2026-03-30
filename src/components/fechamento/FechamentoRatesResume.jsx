import React from 'react';
import { CreditCard, Smartphone, Repeat } from 'lucide-react';

const fmtPct = (v) => v != null ? `${v.toFixed(2)}%` : '—';
const fmtBrl = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

export default function FechamentoRatesResume({ segmentRates, segmentName, partnerName }) {
  if (!segmentRates) return null;

  const { mdrAvista, mdr2a6x, mdr7a12x, mdr13a21x, percentualAntecipacao, pixTaxaPercentual, pixTaxaFixa, feeTransacao, antifraude } = segmentRates;

  return (
    <div className="bg-[#002443] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#2bc196]/8 rounded-full blur-[60px]" />
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {partnerName ? `Parceiro ${partnerName} •` : ''} Segmento
        </p>
        <h3 className="text-xl font-extrabold mb-5" style={{ color: '#2bc196' }}>{segmentName}</h3>

        {/* MDR */}
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4" style={{ color: '#2bc196' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Cartão de Crédito</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '1x', value: mdrAvista },
            { label: '2-6x', value: mdr2a6x },
            { label: '7-12x', value: mdr7a12x },
            { label: '13-21x', value: mdr13a21x },
          ].filter(r => r.value != null).map(r => (
            <div key={r.label} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-center min-w-[70px]">
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</p>
              <p className="text-base font-extrabold" style={{ color: '#2bc196' }}>{fmtPct(r.value)}</p>
            </div>
          ))}
        </div>

        {/* Antecipação */}
        {percentualAntecipacao != null && (
          <div className="flex items-center gap-2 bg-[#2bc196]/10 border border-[#2bc196]/20 rounded-lg px-3 py-2 mb-4">
            <Repeat className="w-4 h-4" style={{ color: '#2bc196' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Antecipação</span>
            <span className="ml-auto text-base font-extrabold" style={{ color: '#2bc196' }}>{fmtPct(percentualAntecipacao)} a.m.</span>
          </div>
        )}

        {/* PIX */}
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4" style={{ color: '#2bc196' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>PIX</span>
        </div>
        <div className="flex gap-4 mb-3">
          {pixTaxaPercentual != null && (
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Percentual</p>
              <p className="text-base font-extrabold" style={{ color: '#2bc196' }}>{fmtPct(pixTaxaPercentual)}</p>
            </div>
          )}
          {pixTaxaFixa != null && (
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Fixo</p>
              <p className="text-base font-extrabold" style={{ color: '#2bc196' }}>{fmtBrl(pixTaxaFixa)}</p>
            </div>
          )}
        </div>

        {/* Fees */}
        <div className="flex gap-3 text-center">
          {feeTransacao != null && (
            <div className="bg-white/[0.04] rounded-lg px-3 py-1.5 flex-1">
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Fee/transação</p>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtBrl(feeTransacao)}</p>
            </div>
          )}
          {antifraude != null && (
            <div className="bg-white/[0.04] rounded-lg px-3 py-1.5 flex-1">
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Antifraude</p>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtBrl(antifraude)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}