import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, ReceiptText, Repeat } from 'lucide-react';

export default function SegmentRatesTable({ segmentRates }) {
  if (!segmentRates) return null;

  const {
    mdrAvista, mdr2a6x, mdr7a12x, mdr13a21x,
    percentualAntecipacao, feeTransacao, antifraude, taxa3ds,
    pixTaxaPercentual, pixTaxaFixa,
  } = segmentRates;

  const fmtPct = (v) => v != null ? `${v.toFixed(2)}%` : '—';
  const fmtBrl = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

  return (
    <div className="space-y-10">

      {/* ══════════════ BLOCO 1: MDR + Antecipação (destaque principal) ══════════════ */}
      <div className="bg-[#002443] rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-[#2bc196]/8 rounded-full blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5" style={{ color: '#2bc196' }} />
            <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>Cartão de Crédito</h3>
          </div>

          {/* MDR rates as horizontal strip */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: 'À Vista (1x)', value: mdrAvista },
              { label: '2–6x', value: mdr2a6x },
              { label: '7–12x', value: mdr7a12x },
              { label: '13–21x', value: mdr13a21x },
            ].filter(r => r.value != null).map((row) => (
              <motion.div
                key={row.label}
                whileHover={{ scale: 1.03 }}
                className="flex-1 min-w-[120px] bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-4 text-center"
              >
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</p>
                <p className="text-2xl font-extrabold" style={{ color: '#2bc196' }}>
                  {row.value.toFixed(2)}<span className="text-sm font-bold" style={{ color: 'rgba(43,193,150,0.6)' }}>%</span>
                </p>
              </motion.div>
            ))}
          </div>

          {/* Antecipação — inline destaque */}
          <div className="bg-[#2bc196]/10 border border-[#2bc196]/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5" style={{ color: '#2bc196' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#ffffff' }}>Antecipação de Recebíveis</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Taxa mensal para antecipação automática</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold" style={{ color: '#2bc196' }}>
                {percentualAntecipacao?.toFixed(2) || '0.00'}<span className="text-sm font-bold" style={{ color: 'rgba(43,193,150,0.6)' }}>% a.m.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ BLOCO 2: PIX ══════════════ */}
      <div className="bg-white border-2 border-[#2bc196]/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-[#2bc196]/10 rounded-xl">
            <Smartphone className="w-5 h-5 text-[#2bc196]" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">PIX</h3>
          <span className="ml-auto text-xs font-bold text-[#2bc196] bg-[#2bc196]/10 px-3 py-1 rounded-full">Recebimento D+0</span>
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-16 py-4">
          {pixTaxaPercentual != null && (
            <div className="text-center">
              <p className="text-sm font-semibold text-[#002443]/60 mb-1">Taxa Percentual</p>
              <p className="text-3xl font-extrabold text-[#2bc196]">
                {pixTaxaPercentual.toFixed(2)}<span className="text-lg font-bold text-[#2bc196]/60">%</span>
              </p>
            </div>
          )}
          {pixTaxaPercentual != null && pixTaxaFixa != null && (
            <span className="text-lg font-bold text-[#002443]/20">ou</span>
          )}
          {pixTaxaFixa != null && (
            <div className="text-center">
              <p className="text-sm font-semibold text-[#002443]/60 mb-1">Taxa Fixa</p>
              <p className="text-3xl font-extrabold text-[#2bc196]">
                <span className="text-lg font-bold text-[#2bc196]/60">R$ </span>{pixTaxaFixa.toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}
        </div>
        <p className="text-center text-sm text-[#002443]/50 mt-2">
          Aplica-se <span className="font-bold text-[#002443]">o maior valor</span> entre as taxas
        </p>
      </div>

      {/* ══════════════ BLOCO 3: Taxas Adicionais (compacto, secundário) ══════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <ReceiptText className="w-5 h-5 text-[#002443]/50" />
          <h3 className="text-base font-bold text-[#002443]">Taxas Adicionais</h3>
        </div>

        <div className="grid grid-cols-3 gap-px bg-[#002443]/[0.06] rounded-xl overflow-hidden">
          {[
            { label: 'Fee por transação', value: fmtBrl(feeTransacao) },
            { label: 'Antifraude', value: fmtBrl(antifraude) },
            { label: '3DS (opcional)', value: fmtBrl(taxa3ds) },
          ].map((item) => (
            <div key={item.label} className="bg-white p-5 text-center">
              <p className="text-xs font-semibold text-[#002443]/50 mb-2">{item.label}</p>
              <p className="text-lg font-bold text-[#002443]">{item.value}</p>
              <p className="text-[10px] font-semibold text-[#002443]/40 mt-1">por transação</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}