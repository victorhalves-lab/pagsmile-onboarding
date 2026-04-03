import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Headphones, MessageSquare, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const STEPS = [
  { num: '1', title: 'Abertura do Chamado', desc: 'Cliente abre o chamado via portal de suporte, e-mail ou canal dedicado, informando o problema e a severidade.' },
  { num: '2', title: 'Triagem & Classificação', desc: 'Time de suporte classifica a severidade (Crítico, Alto, Médio, Baixo) e aciona o SLA correspondente.' },
  { num: '3', title: 'Diagnóstico & Resolução', desc: 'Equipe técnica analisa o problema, realiza diagnóstico e aplica a correção ou workaround dentro do SLA.' },
  { num: '4', title: 'Comunicação & Fechamento', desc: 'Cliente é informado da resolução, valida a correção e o chamado é encerrado com registro completo.' },
];

export default function SlideSupport({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Processo de Suporte</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Como funciona o atendimento ao cliente</p>

      <div className="flex-1 flex flex-col gap-4">
        {/* Flow */}
        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-xl px-3 py-2 flex-1">
                <div className="w-6 h-6 rounded-full bg-[#2bc196] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white">{step.num}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#002443]">{step.title}</p>
                  <p className="text-[8px] text-[#002443]/50 leading-tight">{step.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-[#002443]/20 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Channels & Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#002443]/[0.03] rounded-xl p-3">
            <Headphones className="w-5 h-5 text-[#2bc196] mb-2" />
            <h4 className="text-[10px] font-bold text-[#002443] mb-1">Canais de Suporte</h4>
            <p className="text-[9px] text-[#002443]/60 leading-relaxed">Portal dedicado, e-mail e canal Slack/Teams para comunicação direta com o time técnico.</p>
          </div>
          <div className="bg-[#002443]/[0.03] rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
            <h4 className="text-[10px] font-bold text-[#002443] mb-1">Escalonamento</h4>
            <p className="text-[9px] text-[#002443]/60 leading-relaxed">Incidentes críticos são escalonados automaticamente para o time de engenharia com acompanhamento em tempo real 24/7.</p>
          </div>
          <div className="bg-[#002443]/[0.03] rounded-xl p-3">
            <Clock className="w-5 h-5 text-blue-500 mb-2" />
            <h4 className="text-[10px] font-bold text-[#002443] mb-1">Horários</h4>
            <p className="text-[9px] text-[#002443]/60 leading-relaxed">Suporte crítico: 24/7. Demais severidades: horário comercial (09h-18h BRT, seg-sex).</p>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}