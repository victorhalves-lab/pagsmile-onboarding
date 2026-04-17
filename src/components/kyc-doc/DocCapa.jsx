import React from 'react';
import { Shield, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

export default function DocCapa() {
  return (
    <div className="kyc-doc-dark-bg bg-[#002443] rounded-2xl p-10 mb-8 text-white relative overflow-hidden print:rounded-none print:p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2bc196]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2bc196]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10">
        <img src={LOGO_DARK} alt="PagSmile" className="h-8 mb-8" />
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#2bc196]" />
          <span className="text-[#2bc196] kyc-doc-green-text text-sm font-bold tracking-wider uppercase">Documento Oficial de Compliance</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 print:text-2xl">Manual Completo de Processos KYC / KYB</h1>
        <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
          Descrição <strong>microscópica e exaustiva</strong> de absolutamente cada etapa, cada pergunta, cada dataset, 
          cada variável, cada threshold, cada fallback e cada decisão do processo de onboarding KYC/KYB da PagSmile — 
          cobrindo todos os fluxos de Cartão (10 segmentos), PIX (Merchant e Intermediário) e Subsellers (PJ e PF). 
          Inclui a lista completa de perguntas de cada questionário, todos os documentos solicitados por segmento, 
          e toda a lógica de risk scoring detalhada ponto a ponto.
        </p>
        <div className="flex items-center gap-4 mt-6 text-xs text-white/40">
          <span>Versão 4.0</span><span>•</span>
          <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span>•</span><span>Confidencial</span>
        </div>
        <div className="mt-6 no-print">
          <Button onClick={() => window.print()} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2">
            <Printer className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}