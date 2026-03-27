import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, CreditCard, Smartphone, ArrowRight, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { calculateTransactionCost, calculatePixCost } from '@/lib/rateCalculator';

const PARCELAS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const PRAZO_OPTIONS = [
  { value: 'D+1', label: 'D+1' },
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'Fluxo' },
];

const fmtBrl = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const fmtPct = (v) => `${v.toFixed(2)}%`;

export default function RateCalculator({ segmentRates }) {
  const [amount, setAmount] = useState(150);
  const [installments, setInstallments] = useState(1);
  const [prazo, setPrazo] = useState('D+1');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const cardResult = useMemo(
    () => calculateTransactionCost(amount, installments, prazo, segmentRates),
    [amount, installments, prazo, segmentRates]
  );

  const pixResult = useMemo(
    () => calculatePixCost(amount, segmentRates?.pixTaxaPercentual, segmentRates?.pixTaxaFixa),
    [amount, segmentRates]
  );

  if (!segmentRates) return null;

  const liquidPercent = amount > 0 ? ((cardResult.valorLiquido / amount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden"
    >
      {/* Header bar */}
      <div className="bg-gradient-to-r from-[#002443] to-[#003a5c] px-8 py-6 flex items-center gap-4">
        <div className="p-3 bg-[#2bc196]/20 rounded-2xl">
          <Calculator className="w-6 h-6" style={{ color: '#2bc196' }} />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold" style={{ color: '#ffffff' }}>Calculadora de Custos</h3>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Simule o custo efetivo da sua transação em tempo real</p>
        </div>
      </div>

      {/* Main calculator area */}
      <div className="bg-gradient-to-br from-[#001a33] via-[#002443] to-[#003a5c] relative">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2bc196]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5cf7cf]/5 rounded-full blur-[80px]" />

        <div className="relative z-10 p-6 md:p-10">
          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Ticket Médio */}
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Ticket Médio (R$)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="bg-white/[0.08] border-white/10 text-xl font-bold h-14 rounded-xl focus:border-[#2bc196]/50 focus:ring-[#2bc196]/20"
                style={{ color: '#ffffff' }}
                placeholder="150.00"
              />
            </div>

            {/* Parcelamento */}
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Parcelamento
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {PARCELAS_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInstallments(p)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                      ${installments === p
                        ? 'bg-[#2bc196] shadow-lg shadow-[#2bc196]/25 scale-105'
                        : 'bg-white/[0.06] hover:bg-white/[0.12]'
                      }`}
                    style={{ color: installments === p ? '#002443' : 'rgba(255,255,255,0.5)' }}
                  >
                    {p}x
                  </button>
                ))}
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-sm font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Prazo de Recebimento
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRAZO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrazo(opt.value)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                      ${prazo === opt.value
                        ? 'bg-[#2bc196] shadow-lg shadow-[#2bc196]/25 scale-105'
                        : 'bg-white/[0.06] hover:bg-white/[0.12]'
                      }`}
                    style={{ color: prazo === opt.value ? '#002443' : 'rgba(255,255,255,0.5)' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results — Big Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card — Cartão de Crédito */}
            <motion.div
              layout
              className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                <CreditCard className="w-5 h-5" style={{ color: '#5cf7cf' }} />
                <span className="text-base font-bold" style={{ color: '#ffffff' }}>Cartão de Crédito</span>
                <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-white/[0.06]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {installments}x
                </span>
              </div>
              
              {/* Big Liquid Value */}
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(43,193,150,0.6)' }}>
                  Você Recebe
                </p>
                <motion.p
                  key={cardResult.valorLiquido}
                  initial={{ scale: 0.95, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-extrabold mb-2"
                  style={{ color: '#2bc196' }}
                >
                  {fmtBrl(cardResult.valorLiquido)}
                </motion.p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  de uma venda de <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{fmtBrl(amount)}</span>
                </p>

                {/* Visual progress bar */}
                <div className="mt-5 mx-auto max-w-xs">
                  <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, liquidPercent))}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-semibold" style={{ color: '#2bc196' }}>{liquidPercent.toFixed(1)}% líquido</span>
                    <span className="text-xs" style={{ color: '#f87171' }}>{fmtPct(cardResult.taxaEfetiva)} custo</span>
                  </div>
                </div>
              </div>

              {/* Expandable Breakdown */}
              <div className="border-t border-white/[0.06]">
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium hover:bg-white/[0.03] transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showBreakdown ? 'Ocultar detalhes' : 'Ver detalhamento'}
                </button>
                
                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 space-y-2.5">
                        {[
                          { label: `MDR (${fmtPct(cardResult.taxaMDR)})`, value: cardResult.valorMDR },
                          { label: 'Processamento', value: cardResult.detalhes?.feeTransacao || 0 },
                          { label: 'Antifraude', value: cardResult.detalhes?.antifraude || 0 },
                          { label: '3DS', value: cardResult.detalhes?.taxa3ds || 0 },
                          { label: `Antecipação (${fmtPct(cardResult.taxaAntecipacaoMedia)} média)`, value: cardResult.valorAntecipacao, highlight: cardResult.valorAntecipacao > 0 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: item.highlight ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}>{item.label}</span>
                            <span className="text-sm font-mono font-semibold" style={{ color: item.highlight ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>
                              - {fmtBrl(item.value)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: '#f87171' }}>Custo Total</span>
                          <span className="text-base font-bold font-mono" style={{ color: '#f87171' }}>{fmtBrl(cardResult.custoTotal)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Card — PIX */}
            <motion.div
              layout
              className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                <Smartphone className="w-5 h-5" style={{ color: '#5cf7cf' }} />
                <span className="text-base font-bold" style={{ color: '#ffffff' }}>PIX</span>
                <span className="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-[#2bc196]/15" style={{ color: '#2bc196' }}>
                  Instantâneo
                </span>
              </div>
              
              {/* Big Liquid Value */}
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(43,193,150,0.6)' }}>
                  Você Recebe
                </p>
                <motion.p
                  key={pixResult.valorLiquido}
                  initial={{ scale: 0.95, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-extrabold mb-2"
                  style={{ color: '#2bc196' }}
                >
                  {fmtBrl(pixResult.valorLiquido)}
                </motion.p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  de uma venda de <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{fmtBrl(amount)}</span>
                </p>
                
                {/* PIX visual bar */}
                <div className="mt-5 mx-auto max-w-xs">
                  <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${amount > 0 ? Math.max(0, Math.min(100, (pixResult.valorLiquido / amount) * 100)) : 0}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-semibold" style={{ color: '#2bc196' }}>
                      {amount > 0 ? ((pixResult.valorLiquido / amount) * 100).toFixed(1) : '0.0'}% líquido
                    </span>
                    <span className="text-xs" style={{ color: '#f87171' }}>
                      {amount > 0 ? fmtPct(pixResult.taxaEfetiva) : '0.00%'} custo
                    </span>
                  </div>
                </div>
              </div>

              {/* PIX details */}
              <div className="border-t border-white/[0.06] px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Custo PIX ({pixResult.tipoAplicado === 'percentual' ? fmtPct(segmentRates.pixTaxaPercentual) : fmtBrl(segmentRates.pixTaxaFixa)})
                  </span>
                  <span className="text-sm font-mono font-semibold" style={{ color: '#f87171' }}>- {fmtBrl(pixResult.custoPix)}</span>
                </div>
                <div className="bg-[#2bc196]/10 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(43,193,150,0.5)' }}>Recebimento</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#2bc196' }}>Instantâneo — D+0</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}