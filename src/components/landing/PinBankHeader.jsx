import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, CreditCard, TrendingUp } from 'lucide-react';

const PIN_BANK_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

const features = [
  { icon: Shield, label: 'Antifraude Integrado' },
  { icon: Zap, label: '3DS 2.0' },
  { icon: CreditCard, label: 'Split de Pagamentos' },
  { icon: TrendingUp, label: 'Antecipação Flexível' },
];

export default function PinBankHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="bg-[#0A0A0A] py-14 md:py-20 px-8 md:px-16 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1356E2] via-[#E84B1C] to-[#1356E2]" />
        <div className="absolute top-[-100px] right-[-50px] w-[350px] h-[350px] bg-[#1356E2]/10 rounded-full blur-[100px]" />

        <div className="relative z-10">
          {/* Logo centralizado — SOMENTE Pin Bank */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-10"
          >
            <img src={PIN_BANK_LOGO} alt="Pin Bank" className="h-8 sm:h-10 md:h-12 w-auto object-contain" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4" style={{ color: '#ffffff' }}>
              Soluções de Pagamento <span style={{ color: '#1356E2' }}>Pin Bank</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Taxas competitivas, tecnologia de ponta e suporte especializado para o seu negócio crescer.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {features.map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.08] rounded-full px-4 py-2"
              >
                <feat.icon className="w-4 h-4" style={{ color: '#1356E2' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{feat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}