import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Activity, ShieldCheck, CreditCard, QrCode } from 'lucide-react';

export default function SlideSLA({ slideNumber, totalSlides }) {
  const slaItems = [
    { level: 'Crítico', sla: 'Até 1h', color: 'bg-red-500', text: 'text-red-400' },
    { level: 'Alto', sla: 'Até 6h', color: 'bg-orange-500', text: 'text-orange-400' },
    { level: 'Médio', sla: 'Até 1 dia útil', color: 'bg-amber-500', text: 'text-amber-400' },
    { level: 'Baixo', sla: 'Até 5 dias úteis', color: 'bg-[#2bc196]', text: 'text-[#2bc196]' },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#002443] mb-0.5">SLAs & Reservas de Segurança</h2>
      <p className="text-[10px] text-[#002443]/60 mb-4">Padrões de nível de serviço e gestão de risco</p>

      <div className="flex-1 grid grid-cols-2 gap-4 content-start">
        {/* SLA Platform */}
        <motion.div initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-[#002443] to-[#003a6b] rounded-2xl p-4 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#2bc196] rounded-full blur-[50px] opacity-10" />
          <Activity className="w-6 h-6 text-[#2bc196] mb-3" />
          <h3 className="text-[11px] font-bold text-[#2bc196] uppercase tracking-wider mb-3">SLA da Plataforma</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/50">Uptime Garantido</span>
              <span className="text-sm font-bold text-[#2bc196]">99.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/50">Tempo Resposta API</span>
              <span className="text-sm font-bold text-white">{'< 600ms'}</span>
            </div>
          </div>
        </motion.div>

        {/* Suporte */}
        <motion.div initial={{ opacity: 0, x: 15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-[#002443]/[0.05] to-[#2bc196]/[0.04] border border-[#002443]/[0.08] rounded-2xl p-4"
        >
          <ShieldCheck className="w-6 h-6 text-[#002443] mb-3" />
          <h3 className="text-[11px] font-bold text-[#002443] uppercase tracking-wider mb-3">Suporte Técnico</h3>
          <div className="space-y-2">
            {slaItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[10px] text-[#002443]/70 flex-1 font-medium">{item.level}</span>
                <span className="text-[10px] font-bold text-[#002443]">{item.sla}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reservas - valores padrão fixos */}
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.4 }}
          className="col-span-2 bg-gradient-to-r from-[#002443]/[0.04] to-[#2bc196]/[0.04] border border-[#002443]/[0.06] rounded-2xl p-4"
        >
          <h3 className="text-[11px] font-bold text-[#002443] uppercase tracking-wider mb-4">Reservas de Segurança (Rolling Reserve) — Padrão</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* PIX Reserve */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-5 h-5 text-[#2bc196]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-[#2bc196] block mb-2">PIX</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-[#002443]/50 block">Percentual</span>
                    <span className="text-sm font-bold text-[#002443]">5%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#002443]/50 block">Retenção</span>
                    <span className="text-sm font-bold text-[#002443]">90 dias</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Reserve */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002443]/[0.08] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#002443]/70" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-[#002443] block mb-2">Cartão</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-[#002443]/50 block">Percentual</span>
                    <span className="text-sm font-bold text-[#002443]">5%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#002443]/50 block">Retenção</span>
                    <span className="text-sm font-bold text-[#002443]">180 dias</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#002443]/50 block">Liberação Parcial</span>
                    <span className="text-sm font-bold text-[#002443]">90 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}