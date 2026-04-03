import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { QrCode, FileText, Shield, Zap, Lock, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toFixed(2)}` : '—';
const fmtPct = (v) => v != null ? `${Number(v).toFixed(2)}%` : '—';

export default function SlideRatesOther({ rates = {}, setupFee, slideNumber, totalSlides }) {
  const pix = rates.pix || {};
  const rav = rates.rav || {};

  const items = [
    { icon: QrCode, label: 'PIX', value: pix.tipo === 'fixo' ? fmtBRL(pix.valor) : fmtPct(pix.valor), accent: true },
    { icon: FileText, label: 'Boleto', value: fmtBRL(rates.boleto) },
    { icon: Shield, label: 'Antifraude', value: fmtBRL(rates.antifraude) },
    { icon: Zap, label: 'Fee p/ Transação', value: fmtBRL(rates.feeTransacao) },
    { icon: Lock, label: '3DS', value: fmtBRL(rates.taxa3ds) },
    { icon: AlertTriangle, label: 'Alerta Pré-CB', value: fmtBRL(rates.alertaPreChargeback) },
    { icon: TrendingUp, label: 'RAV (% TPV)', value: fmtPct(rav.taxa) },
    { icon: DollarSign, label: 'Taxa de Setup', value: fmtBRL(setupFee ?? 6000), accent: true },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#002443] mb-0.5">Taxas Negociadas — PIX, Boleto & Outros</h2>
      <p className="text-[10px] text-[#002443]/60 mb-4">Custos operacionais por tipo de serviço</p>

      <div className="grid grid-cols-4 gap-3 flex-1 content-start">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center border group hover:shadow-md transition-all ${
                item.accent
                  ? 'bg-gradient-to-br from-[#2bc196]/10 to-[#2bc196]/5 border-[#2bc196]/20'
                  : 'bg-gradient-to-br from-[#002443]/[0.04] to-[#002443]/[0.02] border-[#002443]/[0.06]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.accent ? 'bg-[#2bc196]/15' : 'bg-[#002443]/[0.06]'}`}>
                <Icon className={`w-4 h-4 ${item.accent ? 'text-[#2bc196]' : 'text-[#002443]/60'}`} />
              </div>
              <span className="text-[9px] text-[#002443]/55 mb-1">{item.label}</span>
              <span className={`text-base font-bold font-mono ${item.accent ? 'text-[#2bc196]' : 'text-[#002443]'}`}>
                {item.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}