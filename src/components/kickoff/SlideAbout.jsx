import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Shield, CreditCard, Landmark, Zap, Globe, Lock } from 'lucide-react';

const CAPABILITIES = [
  { icon: Landmark, title: 'Instituição de Pagamento', desc: 'Licenciada pelo Banco Central do Brasil como IP e IF regulada', gradient: 'from-blue-500 to-blue-600' },
  { icon: Shield, title: 'Subadquirente Licenciada', desc: 'Credenciada Visa, Mastercard, Elo e Amex para processamento de cartões', gradient: 'from-[#2bc196] to-emerald-600' },
  { icon: CreditCard, title: 'Gateway & Orquestrador', desc: 'Roteamento inteligente entre múltiplos adquirentes com otimização de aprovação', gradient: 'from-purple-500 to-purple-600' },
  { icon: Zap, title: 'PIX Instantâneo', desc: 'API PIX completa: QR Code estático/dinâmico, cobrança, transferência e conciliação', gradient: 'from-[#2bc196] to-teal-500' },
  { icon: Lock, title: 'Antifraude & 3DS 2.0', desc: 'Motor de risco com IA, regras customizáveis e autenticação 3D Secure integrada', gradient: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Cross-Border Payments', desc: 'Processamento internacional para LATAM, Europa e Ásia com liquidação local', gradient: 'from-[#002443] to-blue-800' },
];

const BADGES = [
  '🔒 PCI-DSS Level 1', '📋 LGPD Compliant', '🌎 +20 Países', '⚡ 99.5% Uptime', '🏛️ BACEN Regulada',
];

export default function SlideAbout({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#002443] tracking-tight">Quem é a Pagsmile</h2>
          <p className="text-[10px] text-[#002443]/40 mt-0.5">Infraestrutura completa de pagamentos para o seu negócio</p>
        </div>
        <div className="flex gap-1 mt-1">
          {BADGES.map((b, i) => (
            <span key={i} className="text-[7px] px-2 py-1 bg-[#002443]/[0.03] rounded-full text-[#002443]/40 font-medium whitespace-nowrap">{b}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 flex-1">
        {CAPABILITIES.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl p-3.5 border border-[#002443]/[0.04] hover:shadow-lg transition-shadow group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-[#002443] mb-1 tracking-tight">{cap.title}</h3>
              <p className="text-[8.5px] text-[#002443]/50 leading-[1.5]">{cap.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}