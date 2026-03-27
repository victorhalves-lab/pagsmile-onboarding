import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Zap, ShieldCheck, ArrowDownRight, Smartphone } from 'lucide-react';

export default function SegmentRatesTable({ segmentRates }) {
  if (!segmentRates) return null;

  const {
    mdrAvista, mdr2a6x, mdr7a12x, mdr13a21x,
    percentualAntecipacao, feeTransacao, antifraude, taxa3ds,
    pixTaxaPercentual, pixTaxaFixa,
  } = segmentRates;

  const mdrRows = [
    { label: 'Crédito à Vista', sub: '1x', value: mdrAvista },
    { label: 'Parcelado', sub: '2-6x', value: mdr2a6x },
    { label: 'Parcelado', sub: '7-12x', value: mdr7a12x },
    { label: 'Parcelado', sub: '13-21x', value: mdr13a21x },
  ].filter(row => row.value != null);

  const fmtPct = (v) => v != null ? `${v.toFixed(2)}%` : '—';
  const fmtBrl = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="space-y-10">
      {/* MDR — Cartão de Crédito */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#2bc196]/20 to-[#2bc196]/5 rounded-2xl">
            <CreditCard className="w-6 h-6 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-[#002443]">Taxas MDR — Cartão de Crédito</h3>
            <p className="text-sm text-[#002443]/40">Válidas para todas as bandeiras</p>
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mdrRows.map((row) => (
            <motion.div
              key={row.label + row.sub}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative bg-white rounded-2xl border border-[#002443]/[0.06] p-6 text-center group hover:shadow-xl hover:shadow-[#2bc196]/10 hover:border-[#2bc196]/20 transition-all duration-300 cursor-default"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-b-full group-hover:w-16 transition-all duration-300" />
              
              <p className="text-sm font-medium text-[#002443]/50 mb-1">{row.label}</p>
              <p className="text-xs font-semibold text-[#2bc196]/70 mb-4 uppercase tracking-wider">{row.sub}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl md:text-5xl font-extrabold text-[#2bc196]">{row.value.toFixed(2)}</span>
                <span className="text-xl font-bold text-[#2bc196]/60 ml-1">%</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Taxas Operacionais */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#002443]/[0.06] rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-[#002443]/60" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[#002443]">Taxas Operacionais</h3>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Processamento', value: feeTransacao, icon: Zap, format: 'brl' },
            { label: 'Antifraude', value: antifraude, icon: ShieldCheck, format: 'brl' },
            { label: '3DS (opcional)', value: taxa3ds, icon: ShieldCheck, format: 'brl' },
            { label: 'Antecipação', value: percentualAntecipacao, icon: ArrowDownRight, format: 'pct' },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="bg-[#f8f9fb] rounded-2xl border border-[#002443]/[0.04] p-6 text-center hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="inline-flex p-2.5 bg-white rounded-xl shadow-sm mb-3">
                <item.icon className="w-5 h-5 text-[#2bc196]" />
              </div>
              <p className="text-sm text-[#002443]/50 mb-2">{item.label}</p>
              <p className="text-2xl font-bold text-[#002443]">
                {item.format === 'pct'
                  ? `${item.value?.toFixed(2) || '0.00'}%`
                  : `R$ ${(item.value || 0).toFixed(2).replace('.', ',')}`}
              </p>
              <p className="text-xs text-[#002443]/30 mt-1">
                {item.format === 'pct' ? 'ao mês' : 'por transação'}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* PIX */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#2bc196]/20 to-[#2bc196]/5 rounded-2xl">
            <Smartphone className="w-6 h-6 text-[#2bc196]" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[#002443]">PIX</h3>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#2bc196]/[0.06] to-[#5cf7cf]/[0.03] border border-[#2bc196]/15 rounded-2xl p-8 md:p-10"
        >
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {pixTaxaPercentual != null && (
              <div className="text-center">
                <p className="text-sm text-[#002443]/40 mb-2 font-medium">Taxa Percentual</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl md:text-6xl font-extrabold text-[#2bc196]">{fmtPct(pixTaxaPercentual).replace('%', '')}</span>
                  <span className="text-2xl font-bold text-[#2bc196]/60 ml-1">%</span>
                </div>
              </div>
            )}
            {pixTaxaPercentual != null && pixTaxaFixa != null && (
              <div className="text-[#002443]/15 text-2xl font-light">ou</div>
            )}
            {pixTaxaFixa != null && (
              <div className="text-center">
                <p className="text-sm text-[#002443]/40 mb-2 font-medium">Taxa Fixa</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-bold text-[#2bc196]/60 mr-1">R$</span>
                  <span className="text-5xl md:text-6xl font-extrabold text-[#2bc196]">{pixTaxaFixa.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-center text-sm text-[#002443]/40 mt-5">
            Aplica-se <span className="font-bold text-[#002443]/60">o maior valor</span> entre as taxas
          </p>
        </motion.div>
      </div>
    </div>
  );
}