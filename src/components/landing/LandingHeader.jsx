import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, CreditCard, TrendingUp } from 'lucide-react';

const PAGSMILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

const features = [
  { icon: Shield, label: 'Antifraude Integrado' },
  { icon: Zap, label: '3DS 2.0' },
  { icon: CreditCard, label: 'Split de Pagamentos' },
  { icon: TrendingUp, label: 'Antecipação Flexível' },
];

export default function LandingHeader({ companyName, companyLogoUrl }) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="bg-[#002443] py-14 md:py-20 px-8 md:px-16 relative">
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2bc196] via-[#5cf7cf] to-[#2bc196]" />
        
        {/* Glow */}
        <div className="absolute top-[-100px] right-[-50px] w-[350px] h-[350px] bg-[#2bc196]/10 rounded-full blur-[100px]" />

        <div className="relative z-10">
          {/* Logos */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-6 mb-10"
          >
            <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-8 md:h-10 w-auto" />
            {companyLogoUrl && (
              <>
                <div className="w-px h-10 bg-white/20" />
                <img src={companyLogoUrl} alt={companyName} className="h-10 md:h-12 w-auto max-w-[180px] object-contain" />
              </>
            )}
          </motion.div>

          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4" style={{ color: '#ffffff' }}>
              {companyName ? (
                <>Soluções de Pagamento<br /><span style={{ color: '#2bc196' }}>{companyName}</span></>
              ) : (
                <>Soluções de Pagamento <span style={{ color: '#2bc196' }}>Pagsmile</span></>
              )}
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
                <feat.icon className="w-4 h-4" style={{ color: '#2bc196' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{feat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}