import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, CreditCard, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { calculateTransactionCost, calculatePixCost } from '@/lib/rateCalculator';

const PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const PRAZOS = [
  { value: 'D+1', label: 'D+1' },
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'Fluxo' },
];

const fmtBrl = (v) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;
const fmtPct = (v) => `${(Number(v) || 0).toFixed(2)}%`;

export default function RateCalculator({ segmentRates }) {
  const [amount, setAmount] = useState(150);
  const [installments, setInstallments] = useState(1);
  const [prazo, setPrazo] = useState('D+1');
  const [showDetails, setShowDetails] = useState(false);

  const card = useMemo(
    () => calculateTransactionCost(amount, installments, prazo, segmentRates),
    [amount, installments, prazo, segmentRates]
  );
  const pix = useMemo(
    () => calculatePixCost(amount, segmentRates?.pixTaxaPercentual, segmentRates?.pixTaxaFixa),
    [amount, segmentRates]
  );

  if (!segmentRates) return null;

  const cardLiquidPct = amount > 0 ? (card.valorLiquido / amount) * 100 : 0;
  const pixLiquidPct = amount > 0 ? (pix.valorLiquido / amount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-[#0A0A0A] rounded-xl">
          <Calculator className="w-5 h-5" style={{ color: '#1356E2' }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#0A0A0A]">Simulador de Custos</h3>
          <p className="text-sm text-[#0A0A0A]/50">Calcule o valor líquido que você recebe por transação</p>
        </div>
      </div>

      <div className="bg-white border border-[#0A0A0A]/[0.06] rounded-2xl overflow-hidden">
        {/* Input controls */}
        <div className="p-6 md:p-8 border-b border-[#0A0A0A]/[0.06]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Amount */}
            <div>
              <label className="text-sm font-bold text-[#0A0A0A] mb-2 block">Valor da Venda (R$)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="h-12 text-lg font-bold border-[#0A0A0A]/10 focus:border-[#1356E2] rounded-xl text-[#0A0A0A]"
                placeholder="150.00"
              />
            </div>

            {/* Installments */}
            <div>
              <label className="text-sm font-bold text-[#0A0A0A] mb-2 block">Parcelas</label>
              <div className="grid grid-cols-6 gap-1">
                {PARCELAS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInstallments(p)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all
                      ${installments === p
                        ? 'bg-[#1356E2] shadow-md'
                        : 'bg-[#f4f4f4] hover:bg-[#0A0A0A]/[0.06]'
                      }`}
                    style={{ color: installments === p ? '#ffffff' : '#0A0A0A' }}
                  >
                    {p}x
                  </button>
                ))}
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-sm font-bold text-[#0A0A0A] mb-2 block">Recebimento</label>
              <div className="grid grid-cols-3 gap-1">
                {PRAZOS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPrazo(opt.value)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all
                      ${prazo === opt.value
                        ? 'bg-[#1356E2] shadow-md'
                        : 'bg-[#f4f4f4] hover:bg-[#0A0A0A]/[0.06]'
                      }`}
                    style={{ color: prazo === opt.value ? '#ffffff' : '#0A0A0A' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ── Cartão ── */}
          <div className="p-6 md:p-8 md:border-r border-b md:border-b-0 border-[#0A0A0A]/[0.06]">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-[#1356E2]" />
              <span className="text-sm font-bold text-[#0A0A0A]">Cartão de Crédito</span>
              <span className="ml-auto text-xs font-bold text-[#0A0A0A]/50 bg-[#f4f4f4] px-2 py-0.5 rounded">{installments}x · {prazo}</span>
            </div>

            {/* Big value */}
            <div className="text-center py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1356E2] mb-1">Você recebe</p>
              <motion.p
                key={card.valorLiquido}
                initial={{ scale: 0.97 }}
                animate={{ scale: 1 }}
                className="text-3xl md:text-4xl font-extrabold text-[#0A0A0A]"
              >
                {fmtBrl(card.valorLiquido)}
              </motion.p>
            </div>

            {/* Progress bar */}
            <div className="my-4">
              <div className="h-2 bg-[#f4f4f4] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, cardLiquidPct))}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#1356E2] to-[#E84B1C] rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs font-bold text-[#1356E2]">{cardLiquidPct.toFixed(1)}% líquido</span>
                <span className="text-xs font-bold text-[#0A0A0A]/50">{fmtPct(card.taxaEfetiva)} custo</span>
              </div>
            </div>

            {/* Expandable breakdown */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors rounded-lg hover:bg-[#f4f4f4]"
            >
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDetails ? 'Ocultar detalhes' : 'Ver detalhamento'}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 border-t border-[#0A0A0A]/[0.06] mt-2">
                    {[
                      { label: `MDR ${fmtPct(card.taxaMDR)}`, value: card.valorMDR },
                      { label: 'Processamento', value: card.detalhes?.feeTransacao || 0 },
                      { label: 'Antifraude', value: card.detalhes?.antifraude || 0 },
                      { label: '3DS', value: card.detalhes?.taxa3ds || 0 },
                      { label: `Antecipação ${fmtPct(card.taxaAntecipacaoMedia)}`, value: card.valorAntecipacao, accent: card.valorAntecipacao > 0 },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className={`text-xs font-medium ${item.accent ? 'text-[#1356E2]' : 'text-[#0A0A0A]/50'}`}>{item.label}</span>
                        <span className={`text-xs font-bold font-mono ${item.accent ? 'text-[#1356E2]' : 'text-[#0A0A0A]'}`}>- {fmtBrl(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-[#0A0A0A]/[0.06]">
                      <span className="text-xs font-bold text-[#0A0A0A]">Custo total</span>
                      <span className="text-sm font-bold font-mono text-[#0A0A0A]">{fmtBrl(card.custoTotal)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── PIX ── */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Smartphone className="w-4 h-4 text-[#1356E2]" />
              <span className="text-sm font-bold text-[#0A0A0A]">PIX</span>
              <span className="ml-auto text-xs font-bold text-[#1356E2] bg-[#1356E2]/10 px-2 py-0.5 rounded">Instantâneo</span>
            </div>

            {/* Big value */}
            <div className="text-center py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1356E2] mb-1">Você recebe</p>
              <motion.p
                key={pix.valorLiquido}
                initial={{ scale: 0.97 }}
                animate={{ scale: 1 }}
                className="text-3xl md:text-4xl font-extrabold text-[#0A0A0A]"
              >
                {fmtBrl(pix.valorLiquido)}
              </motion.p>
            </div>

            {/* Progress bar */}
            <div className="my-4">
              <div className="h-2 bg-[#f4f4f4] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, pixLiquidPct))}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#1356E2] to-[#E84B1C] rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs font-bold text-[#1356E2]">{pixLiquidPct.toFixed(1)}% líquido</span>
                <span className="text-xs font-bold text-[#0A0A0A]/50">{fmtPct(pix.taxaEfetiva)} custo</span>
              </div>
            </div>

            {/* PIX cost detail */}
            <div className="bg-[#f4f4f4] rounded-xl p-4 mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-[#0A0A0A]/50">
                  Taxa ({pix.tipoAplicado === 'percentual' ? fmtPct(segmentRates.pixTaxaPercentual || 0) : fmtBrl(segmentRates.pixTaxaFixa || 0)})
                </span>
                <span className="text-xs font-bold font-mono text-[#0A0A0A]">- {fmtBrl(pix.custoPix)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-[#0A0A0A]/50">Recebimento</span>
                <span className="text-xs font-bold text-[#1356E2]">D+0 Instantâneo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}