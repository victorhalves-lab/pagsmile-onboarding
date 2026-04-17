import React from 'react';
import { Shield, Printer } from 'lucide-react';

const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

export default function DocCapa() {
  return (
    <div className="bg-[#002443] px-10 py-16 md:py-20 mb-10 relative overflow-hidden">
      {/* Decorative - hidden on print by parent style */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#2bc196]/8 rounded-full -translate-y-1/2 translate-x-1/2 no-print" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#2bc196]/5 rounded-full translate-y-1/2 -translate-x-1/2 no-print" />

      <div className="relative z-10 max-w-3xl">
        <img src={LOGO_DARK} alt="PagSmile" className="h-8 mb-10 opacity-90" />

        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-7 h-7 text-[#2bc196]" />
          <span className="text-[#2bc196] text-xs font-bold tracking-[0.2em] uppercase">
            Documento Oficial de Compliance
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
          Manual Completo de Processos KYC / KYB
        </h1>

        <p className="text-white/55 text-sm leading-relaxed max-w-2xl">
          Descrição <strong className="text-white/80">microscópica e exaustiva</strong> de cada etapa, 
          cada pergunta, cada dataset, cada variável, cada threshold, cada fallback e cada decisão 
          do processo de onboarding KYC/KYB da PagSmile — cobrindo Cartão (10 segmentos), 
          PIX (Merchant e Intermediário) e Subsellers (PJ e PF).
        </p>

        <div className="flex items-center gap-3 mt-8 text-[11px] text-white/35 font-medium tracking-wide">
          <span>Versão 4.0</span>
          <span className="text-white/15">|</span>
          <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span className="text-white/15">|</span>
          <span>Confidencial</span>
        </div>

        <button
          onClick={() => window.print()}
          className="no-print mt-8 inline-flex items-center gap-2 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          <Printer className="w-4 h-4" /> Exportar PDF
        </button>
      </div>
    </div>
  );
}