import React from 'react';
import SlideLayout from './SlideLayout';
import { FileCheck, Code, TestTube, Rocket, HeartPulse, LineChart } from 'lucide-react';

const PHASES = [
  {
    icon: FileCheck, title: 'Assinatura do Contrato', time: 'Semana 1',
    desc: 'Finalização e assinatura do contrato. Definição dos pontos de contato e responsáveis de ambos os lados.',
    color: 'bg-blue-500',
  },
  {
    icon: Code, title: 'Integração (Gargântua)', time: 'Semanas 2-4',
    desc: 'Integração técnica via API Gargântua. Configuração de ambiente sandbox, credenciais e webhooks. Suporte técnico dedicado incluso no setup.',
    color: 'bg-purple-500',
  },
  {
    icon: TestTube, title: 'Testes & Homologação', time: 'Semana 5',
    desc: 'Testes end-to-end de todos os fluxos: cartão, PIX, boleto, antifraude e 3DS. Validação de conciliação e liquidação.',
    color: 'bg-amber-500',
  },
  {
    icon: Rocket, title: 'Go Live & Ramp-Up', time: 'Semana 6',
    desc: 'Ativação em produção com ramp-up gradual. Documento de Ramp-Up preenchido em conjunto para definir metas e etapas de evolução do volume.',
    color: 'bg-[#2bc196]',
  },
  {
    icon: HeartPulse, title: 'Hypercare', time: '2-3 meses',
    desc: 'Acompanhamento intensivo pós Go-Live. Monitoramento de taxas de aprovação, chargebacks e performance. Ajustes finos em tempo real.',
    color: 'bg-red-400',
  },
  {
    icon: LineChart, title: 'Acompanhamento Contínuo', time: 'Ongoing',
    desc: 'Reuniões semanais ou quinzenais. Análise trimestral de resultados com insights de melhoria e otimização.',
    color: 'bg-[#002443]',
  },
];

export default function SlideRoadmap({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Roadmap de Implementação</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Etapas do seu processo de ativação</p>

      <div className="flex-1 relative">
        {/* Timeline line */}
        <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-[#2bc196] to-[#002443]" />

        <div className="space-y-3">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <div key={i} className="flex items-start gap-3 relative">
                <div className={`w-9 h-9 rounded-lg ${phase.color} flex items-center justify-center flex-shrink-0 z-10`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold text-[#002443]">{phase.title}</h3>
                    <span className="text-[9px] px-2 py-0.5 bg-[#002443]/5 rounded-full text-[#002443]/50 font-medium">{phase.time}</span>
                  </div>
                  <p className="text-[9px] text-[#002443]/60 leading-relaxed mt-0.5">{phase.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}