import React from 'react';
import { motion } from 'framer-motion';
import { Globe, CreditCard, MapPin, ArrowRight, Clock } from 'lucide-react';

const REGIONS = [
  { name: 'Estados Unidos', flag: '🇺🇸' },
  { name: 'América Latina', flag: '🌎' },
  { name: 'Europa', flag: '🇪🇺' },
  { name: 'Ásia', flag: '🌏' },
];

export default function InternationalPaymentsBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border-2 border-[#002443]/10"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#002443] via-[#003366] to-[#004080]" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#5cf7cf]/8 rounded-full blur-[80px]" />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 bg-[#2bc196]/20 border border-[#2bc196]/30 rounded-full px-4 py-1.5">
            <Globe className="w-4 h-4 text-[#2bc196]" />
            <span className="text-xs font-bold text-[#2bc196] uppercase tracking-wider">Internacional</span>
          </div>
          <span className="text-xs font-semibold text-white/30 uppercase tracking-wide">Novo</span>
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-extrabold mb-2" style={{ color: '#ffffff' }}>
          Vendas Internacionais com{' '}
          <span style={{ color: '#2bc196' }}>Pagsmile</span>
        </h3>
        <p className="text-sm md:text-base mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Processamento de pagamentos via cartão de crédito e débito para clientes no exterior.
        </p>

        {/* Rate highlight */}
        <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2bc196]/15 rounded-xl">
              <CreditCard className="w-6 h-6 text-[#2bc196]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Crédito & Débito Internacional
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Taxa única para todas as bandeiras
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-1 md:ml-auto">
            <span className="text-3xl md:text-4xl font-extrabold" style={{ color: '#2bc196' }}>6,99</span>
            <span className="text-lg font-bold" style={{ color: 'rgba(43,193,150,0.6)' }}>%</span>
            <span className="text-lg font-bold mx-2" style={{ color: 'rgba(255,255,255,0.25)' }}>+</span>
            <span className="text-lg font-bold" style={{ color: 'rgba(43,193,150,0.6)' }}>USD</span>
            <span className="text-3xl md:text-4xl font-extrabold" style={{ color: '#2bc196' }}>0,50</span>
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>/transação</span>
          </div>
        </div>

        {/* Prazo de Recebimento */}
        <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="p-2.5 bg-[#2bc196]/15 rounded-xl">
            <Clock className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Prazo de Recebimento
            </p>
            <p className="text-xl font-extrabold" style={{ color: '#2bc196' }}>D + 7</p>
          </div>
        </div>

        {/* Regions */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#2bc196]/60" />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Regiões atendidas
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {REGIONS.map((region) => (
            <div
              key={region.name}
              className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2"
            >
              <span className="text-lg">{region.flag}</span>
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {region.name}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Proposta Internacional */}
        <div className="text-center">
          <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Quer receber uma proposta personalizada para pagamentos internacionais?
          </p>
          <a
            href="https://pagsmile-international-card-proposals.base44.app/QuestionnaireForm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-[#2bc196]/20 hover:scale-[1.02] transition-all"
          >
            Quero uma proposta personalizada
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}