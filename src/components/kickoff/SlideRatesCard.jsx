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
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Taxas Negociadas — Cartão</h2>
      <p className="text-[10px] text-[#002443]/50 mb-3">MDR por bandeira e faixa de parcelamento</p>

      {/* Credit */}
      <div className="mb-3">
        <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-2">Crédito</h3>
        <div className="rounded-xl border border-[#002443]/8 overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#002443]/[0.03]">
                <th className="text-left py-1.5 px-3 text-[#002443]/50 font-semibold">Bandeira</th>
                {FAIXAS.map(f => (
                  <th key={f} className="text-center py-1.5 px-2 text-[#002443]/50 font-semibold">{FAIXA_LABELS[f]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANDEIRAS.map((b, i) => (
                <tr key={b} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f4f4f4]/50'}>
                  <td className="py-1.5 px-3 font-semibold text-[#002443]">{BANDEIRA_LABELS[b]}</td>
                  {FAIXAS.map(f => (
                    <td key={f} className="text-center py-1.5 px-2 font-mono text-[#002443]">
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
      <div className="mb-3">
        <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-2">Débito</h3>
        <div className="grid grid-cols-4 gap-2">
          {['visa', 'mastercard', 'elo', 'outras'].map(b => (
            <div key={b} className="bg-[#f4f4f4] rounded-lg p-2 text-center">
              <span className="text-[9px] text-[#002443]/50 block">{BANDEIRA_LABELS[b]}</span>
              <span className="text-xs font-bold font-mono text-[#002443]">{fmt(debito[b])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Antecipação */}
      {rates.percentualAntecipacao && (
        <div className="flex items-center gap-2 mt-auto">
          <div className="px-3 py-1.5 bg-[#2bc196]/10 rounded-lg">
            <span className="text-[9px] text-[#002443]/50">Taxa de Antecipação</span>
            <span className="text-sm font-bold text-[#2bc196] ml-2">{fmt(rates.percentualAntecipacao)} a.m.</span>
          </div>
        </div>
      )}
    </SlideLayout>
  );
}