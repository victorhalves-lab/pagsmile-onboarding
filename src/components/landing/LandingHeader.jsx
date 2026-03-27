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
      {/* Main gradient background */}
      <div className="bg-gradient-to-br from-[#001a33] via-[#002443] to-[#003a5c] py-16 md:py-24 px-8 md:px-16 relative">
        
        {/* Animated decorative orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] bg-[#2bc196]/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] bg-[#5cf7cf]/8 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2bc196]/5 rounded-full blur-[120px]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative z-10">
          {/* Logos */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-6 md:gap-8 mb-10"
          >
            <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-9 md:h-12 w-auto" />
            {companyLogoUrl && (
              <>
                <div className="w-px h-12 bg-white/20 rounded-full" />
                <img src={companyLogoUrl} alt={companyName} className="h-12 md:h-14 w-auto max-w-[200px] object-contain" />
              </>
            )}
          </motion.div>

          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5" style={{ color: '#ffffff' }}>
              {companyName ? (
                <>
                  Soluções de Pagamento
                  <br />
                  <span className="bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] bg-clip-text" style={{ WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                    {companyName}
                  </span>
                </>
              ) : (
                <>
                  Soluções de Pagamento
                  <br />
                  <span className="bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] bg-clip-text" style={{ WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                    Pagsmile
                  </span>
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Taxas competitivas, tecnologia de ponta e suporte especializado para o seu negócio crescer.
            </p>
          </motion.div>

          {/* Feature badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4"
          >
            {features.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2.5 bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] rounded-full px-5 py-2.5"
              >
                <feat.icon className="w-4 h-4 flex-shrink-0" style={{ color: '#2bc196' }} />
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#ffffff' }}>{feat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}