import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
const BANDEIRA_LABELS = { visa: 'Visa', mastercard: 'Mastercard', elo: 'Elo', amex: 'Amex', outras: 'Outras' };
const FAIXAS = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];
const FAIXA_LABELS = { avista: 'À Vista (1x)', de2a6x: '2-6x', de7a12x: '7-12x', de13a21x: '13-21x' };
const fmt = (v) => v != null ? `${Number(v).toFixed(2)}%` : '—';

export default function SlideRatesCard({ rates = {}, slideNumber, totalSlides }) {
  const cartao = rates.cartao || {};
  const debito = rates.debito || {};

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="dark">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Taxas Negociadas — Cartão</h2>
      <p className="text-[10px] text-white/40 mb-3">MDR por bandeira e faixa de parcelamento</p>

      {/* Credit */}
      <div className="mb-3">
        <h3 className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider mb-2">Crédito</h3>
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="text-left py-2 px-3 text-white/40 font-semibold">Bandeira</th>
                {FAIXAS.map(f => (
                  <th key={f} className="text-center py-2 px-2 text-white/40 font-semibold">{FAIXA_LABELS[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANDEIRAS.map((b, i) => (
                <tr key={b} className={i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}>
                  <td className="py-2 px-3 font-semibold text-white/80">{BANDEIRA_LABELS[b]}</td>
                  {FAIXAS.map(f => (
                    <td key={f} className="text-center py-2 px-2 font-mono text-[#2bc196] font-semibold">
                      {fmt(cartao[b]?.[f])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debit */}
      <div className="mb-2">
        <h3 className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider mb-2">Débito</h3>
        <div className="grid grid-cols-4 gap-2">
          {['visa', 'mastercard', 'elo', 'outras'].map(b => (
            <div key={b} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 text-center">
              <span className="text-[9px] text-white/40 block">{BANDEIRA_LABELS[b]}</span>
              <span className="text-xs font-bold font-mono text-[#2bc196]">{fmt(debito[b])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Antecipação */}
      {rates.percentualAntecipacao && (
        <div className="flex items-center gap-2 mt-auto">
          <div className="px-4 py-2 bg-[#2bc196]/10 border border-[#2bc196]/20 rounded-xl">
            <span className="text-[9px] text-white/50">Taxa de Antecipação</span>
            <span className="text-sm font-bold text-[#2bc196] ml-2">{fmt(rates.percentualAntecipacao)} a.m.</span>
          </div>
        </div>
      )}
    </SlideLayout>
  );
}