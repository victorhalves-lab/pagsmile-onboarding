import React from 'react';
import { motion } from 'framer-motion';
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
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.3 }} className={`rounded-2xl p-3.5 flex flex-col justify-center group hover:shadow-md transition-shadow ${
            item.highlight ? 'bg-[#2bc196]/5 border border-[#2bc196]/20' : 'bg-[#f4f4f4] border border-transparent'
          }`}>
            <span className="text-[9px] text-[#002443]/50 mb-1">{item.label}</span>
            <span className={`text-base font-bold font-mono ${item.highlight ? 'text-[#2bc196]' : 'text-[#002443]'}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}