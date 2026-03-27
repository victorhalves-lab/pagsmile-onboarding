import React, { useState, useMemo } from 'react';
import { Calculator, CreditCard, Smartphone, ArrowRight } from 'lucide-react';
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

  const cardResult = useMemo(
    () => calculateTransactionCost(amount, installments, prazo, segmentRates),
    [amount, installments, prazo, segmentRates]
  );

  const pixResult = useMemo(
    () => calculatePixCost(amount, segmentRates?.pixTaxaPercentual, segmentRates?.pixTaxaFixa),
    [amount, segmentRates]
  );

  if (!segmentRates) return null;

  return (
    <div className="bg-gradient-to-br from-[#002443] to-[#003366] rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#2bc196]/20 rounded-xl">
          <Calculator className="w-5 h-5 text-[#2bc196]" />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>Calculadora de Custos</h3>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Simule o custo efetivo da sua transação</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-5 mb-6">
        {/* Ticket Médio */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ticket Médio (R$)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="bg-white/10 border-white/10 text-lg font-bold h-12 rounded-xl"
            style={{ color: '#ffffff' }}
            placeholder="150.00"
          />
        </div>

        {/* Parcelamento */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Parcelamento
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {PARCELAS_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setInstallments(p)}
                className={`py-2 rounded-lg text-xs font-bold transition-all
                  ${installments === p
                    ? 'bg-[#2bc196] shadow-lg shadow-[#2bc196]/20'
                    : 'bg-white/5 hover:bg-white/10'
                  }`}
                style={{ color: installments === p ? '#002443' : 'rgba(255,255,255,0.5)' }}
              >
                {p}x
              </button>
            ))}
          </div>
        </div>

        {/* Prazo de Recebimento */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Prazo de Recebimento
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
            {PRAZO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPrazo(opt.value)}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all
                  ${prazo === opt.value
                    ? 'bg-[#2bc196] shadow-lg shadow-[#2bc196]/20'
                    : 'bg-white/5 hover:bg-white/10'
                  }`}
                style={{ color: prazo === opt.value ? '#002443' : 'rgba(255,255,255,0.5)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results - Cartão */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-[#5cf7cf]" />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Resultado — Cartão de Crédito</span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          {/* Breakdown */}
          <div className="space-y-2">
            {[
              { label: `MDR (${fmtPct(cardResult.taxaMDR)})`, value: cardResult.valorMDR },
              { label: 'Processamento', value: cardResult.detalhes?.feeTransacao || 0 },
              { label: 'Antifraude', value: cardResult.detalhes?.antifraude || 0 },
              { label: '3DS', value: cardResult.detalhes?.taxa3ds || 0 },
              { label: `Antecipação (${fmtPct(cardResult.taxaAntecipacaoMedia)} média)`, value: cardResult.valorAntecipacao, highlight: cardResult.valorAntecipacao > 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: item.highlight ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                <span className="text-xs font-mono" style={{ color: item.highlight ? '#fbbf24' : 'rgba(255,255,255,0.6)', fontWeight: item.highlight ? 700 : 400 }}>
                  {fmtBrl(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Totals */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: '#f87171' }}>Custo Total</span>
            <span className="text-sm font-bold font-mono" style={{ color: '#f87171' }}>{fmtBrl(cardResult.custoTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Taxa Efetiva</span>
            <span className="text-sm font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmtPct(cardResult.taxaEfetiva)}</span>
          </div>

          {/* Big result */}
          <div className="bg-[#2bc196]/15 rounded-xl p-4 text-center mt-2">
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(43,193,150,0.6)' }}>Valor Líquido a Receber</p>
            <p className="text-2xl font-bold" style={{ color: '#2bc196' }}>{fmtBrl(cardResult.valorLiquido)}</p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>de um total de {fmtBrl(amount)}</p>
          </div>
        </div>

        {/* Results - PIX */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-[#5cf7cf]" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Resultado — PIX</span>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Custo PIX ({pixResult.tipoAplicado === 'percentual' ? fmtPct(segmentRates.pixTaxaPercentual) : fmtBrl(segmentRates.pixTaxaFixa)})
              </span>
              <span className="text-xs font-mono" style={{ color: '#f87171' }}>{fmtBrl(pixResult.custoPix)}</span>
            </div>
            <div className="bg-[#2bc196]/15 rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(43,193,150,0.6)' }}>Líquido PIX</p>
              <p className="text-xl font-bold" style={{ color: '#2bc196' }}>{fmtBrl(pixResult.valorLiquido)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}