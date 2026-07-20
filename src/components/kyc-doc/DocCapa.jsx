import React from 'react';
import { Shield, Printer } from 'lucide-react';

const LOGO_LIGHT = "https://media.base44.com/images/public/6983b65f017b96d5f695f9bb/2ff9f262a_Logo-modo-claro.jpg";

export default function DocCapa() {
  return (
    <div className="bg-white px-8 pt-12 pb-10 mb-8">
      <img src={LOGO_LIGHT} alt="Pin Bank" className="h-8 mb-10" />

      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-6 h-6 text-[#1356E2]" />
        <span className="text-[#1356E2] text-xs font-bold tracking-[0.2em] uppercase">
          Documento Oficial de Compliance
        </span>
      </div>

      <h1 className="text-3xl font-black text-[#0A0A0A] mb-4 leading-tight">
        Manual Completo de Processos KYC / KYB
      </h1>

      <p className="text-sm text-[#1a1a1a]/70 leading-relaxed max-w-2xl mb-6">
        Descrição <strong className="text-[#1a1a1a]">microscópica e exaustiva</strong> de cada etapa, 
        cada pergunta, cada dataset, cada variável, cada threshold, cada fallback e cada decisão 
        do processo de onboarding KYC/KYB da Pin Bank — cobrindo: <strong>funis de captação</strong>{' '}
        (Lead Pin Bank V5 com 12 etapas, Lead PIX V4 com 7 etapas, Fechamento Landing acoplado a 
        proposta padrão), <strong>Compliance V4</strong> em Cartão (11 segmentos), PIX (Merchants, 
        Intermediários e API Enterprise) e Subsellers (PJ e PF), pipeline automatizado, scoring V4 
        determinístico, SENTINEL relator, e extração de Pré-KYC para parceiros bancários. 
        20 seções técnicas, incluindo glossário e funis de captação.
      </p>

      <div className="w-16 h-[2px] bg-[#1356E2] mb-4" />

      <div className="flex items-center gap-3 text-[11px] text-[#1a1a1a]/40 font-medium tracking-wide flex-wrap">
        <span>Versão 4.0</span>
        <span>|</span>
        <span>Última revisão: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <span>|</span>
        <span>Gerado dinamicamente a partir do sistema</span>
        <span>|</span>
        <span>Confidencial</span>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print mt-8 inline-flex items-center gap-2 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
      >
        <Printer className="w-4 h-4" /> Exportar PDF
      </button>
    </div>
  );
}