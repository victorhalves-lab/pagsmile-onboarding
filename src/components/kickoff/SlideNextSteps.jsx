import React from 'react';
import { CheckCircle2, ArrowRight, Mail, Phone } from 'lucide-react';

export default function SlideNextSteps({ clientName, responsavelNome, slideNumber, totalSlides }) {
  const steps = [
    'Assinatura digital do contrato',
    'Envio das credenciais de sandbox (API Gargântua)',
    'Agendamento do kick-off técnico de integração',
    'Preenchimento conjunto do Documento de Ramp-Up',
    'Definição do cronograma de testes',
    'Planejamento do Go Live',
  ];

  return (
    <div className="relative w-full aspect-[16/9] bg-[#002443] rounded-2xl overflow-hidden shadow-lg"
         style={{ pageBreakAfter: 'always' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#5cf7cf] rounded-full blur-[80px]" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2bc196] via-[#5cf7cf] to-[#2bc196]" />

      <div className="relative h-full flex flex-col px-12 pt-8 pb-10">
        <h2 className="text-xl font-bold text-white mb-1">Próximos Passos</h2>
        <p className="text-[10px] text-white/40 mb-6">Ações imediatas para iniciarmos a implementação</p>

        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 content-start">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2bc196]/20 border border-[#2bc196]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2bc196]" />
              </div>
              <span className="text-[11px] text-white/80 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-[#2bc196] mb-1">Estamos prontos para começar!</p>
              <p className="text-[10px] text-white/40">
                {clientName ? `Apresentação preparada para ${clientName}` : 'Pagsmile — Seu parceiro de pagamentos'}
              </p>
            </div>
            <div className="text-right">
              {responsavelNome && (
                <p className="text-[10px] text-white/60">Responsável: <strong className="text-white/80">{responsavelNome}</strong></p>
              )}
              <p className="text-[10px] text-white/40 mt-1">comercial@pagsmile.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-10 bg-white/5">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png"
            alt="Pagsmile" className="h-3.5 opacity-40"
          />
          <span className="text-[9px] text-white/30 font-medium">{slideNumber} / {totalSlides}</span>
        </div>
      </div>
    </div>
  );
}