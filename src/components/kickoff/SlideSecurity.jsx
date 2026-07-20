import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Shield, Lock, Eye, AlertTriangle, Fingerprint, Server } from 'lucide-react';

const SECURITY_ITEMS = [
  { icon: Shield, title: 'PCI-DSS Level 1', desc: 'Certificação máxima de segurança para processamento de dados de cartão.', gradient: 'from-[#1356E2] to-emerald-600' },
  { icon: Lock, title: '3D Secure 2.0', desc: 'Autenticação forte do portador com experiência fluida e redução de chargebacks.', gradient: 'from-[#0A0A0A] to-blue-700' },
  { icon: Eye, title: 'Motor Antifraude com IA', desc: 'Análise em tempo real de cada transação com regras customizáveis e machine learning.', gradient: 'from-purple-500 to-purple-700' },
  { icon: Fingerprint, title: 'KYC & KYB Integrado', desc: 'Verificação de identidade completa para merchants e subsellers com validações automatizadas.', gradient: 'from-amber-500 to-orange-600' },
  { icon: Server, title: 'Infraestrutura Redundante', desc: 'Data centers em múltiplas zonas com failover automático e 99.5% de uptime garantido.', gradient: 'from-rose-500 to-red-500' },
  { icon: AlertTriangle, title: 'Monitoramento 24/7', desc: 'Alertas proativos de anomalias, picos de chargeback e comportamento suspeito em tempo real.', gradient: 'from-[#0A0A0A] to-[#003a6b]' },
];

export default function SlideSecurity({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#0A0A0A] mb-0.5">Segurança & Prevenção à Fraude</h2>
      <p className="text-[10px] text-[#0A0A0A]/60 mb-3">Camadas de proteção que garantem a segurança da sua operação</p>

      <div className="flex-1 grid grid-cols-3 gap-2.5 content-start">
        {SECURITY_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-2xl p-3.5 border border-[#0A0A0A]/[0.04] hover:shadow-lg transition-shadow group"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-[#0A0A0A] mb-1 tracking-tight">{item.title}</h3>
              <p className="text-[8.5px] text-[#0A0A0A]/50 leading-[1.5]">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom badges */}
      <div className="mt-2 flex items-center justify-center gap-2">
        {['🔒 PCI-DSS Level 1', '📋 LGPD Compliant', '🏛️ BACEN Regulada', '🛡️ Tokenização de Dados'].map((badge, i) => (
          <span key={i} className="text-[8px] px-2.5 py-1 bg-[#0A0A0A]/[0.04] rounded-full text-[#0A0A0A]/50 font-medium">{badge}</span>
        ))}
      </div>
    </SlideLayout>
  );
}