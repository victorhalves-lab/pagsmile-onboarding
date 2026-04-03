import React from 'react';
import SlideLayout from './SlideLayout';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toFixed(2)}` : '—';
const fmtPct = (v) => v != null ? `${Number(v).toFixed(2)}%` : '—';

export default function SlideRatesOther({ rates = {}, setupFee, slideNumber, totalSlides }) {
  const pix = rates.pix || {};
  const rav = rates.rav || {};

  const items = [
    { label: 'PIX', value: pix.tipo === 'fixo' ? fmtBRL(pix.valor) : fmtPct(pix.valor), highlight: true },
    { label: 'Boleto', value: fmtBRL(rates.boleto) },
    { label: 'Antifraude', value: fmtBRL(rates.antifraude) },
    { label: 'Fee p/ Transação', value: fmtBRL(rates.feeTransacao) },
    { label: '3DS', value: fmtBRL(rates.taxa3ds) },
    { label: 'Alerta Pré-Chargeback', value: fmtBRL(rates.alertaPreChargeback) },
    { label: 'RAV (% TPV)', value: fmtPct(rav.taxa) },
    { label: 'Taxa de Setup', value: fmtBRL(setupFee ?? 6000), highlight: true },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Taxas Negociadas — PIX, Boleto & Outros</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Custos operacionais por tipo de serviço</p>

      <div className="grid grid-cols-4 gap-3 flex-1 content-start">
        {items.map((item, i) => (
          <div key={i} className={`rounded-xl p-3 flex flex-col justify-center ${
            item.highlight ? 'bg-[#2bc196]/5 border border-[#2bc196]/20' : 'bg-[#f4f4f4] border border-transparent'
          }`}>
            <span className="text-[9px] text-[#002443]/50 mb-1">{item.label}</span>
            <span className={`text-base font-bold font-mono ${item.highlight ? 'text-[#2bc196]' : 'text-[#002443]'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}