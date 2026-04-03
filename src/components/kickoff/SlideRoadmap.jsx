import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { FileCheck, Code, TestTube, Rocket, HeartPulse, LineChart } from 'lucide-react';

const PHASES = [
  { icon: FileCheck, title: 'Assinatura do Contrato', time: 'Semana 1', desc: 'Finalização e assinatura digital. Definição dos pontos de contato e responsáveis.', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { icon: Code, title: 'Integração (Gargântua)', time: 'Semanas 2-4', desc: 'Integração técnica via API. Configuração de sandbox, credenciais e webhooks. Suporte dedicado incluso no setup.', gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
  { icon: TestTube, title: 'Testes & Homologação', time: 'Semana 5', desc: 'Testes end-to-end: cartão, PIX, boleto, antifraude e 3DS. Validação de conciliação e liquidação.', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { icon: Rocket, title: 'Go Live & Ramp-Up', time: 'Semana 6', desc: 'Ativação em produção com ramp-up gradual. Documento de Ramp-Up preenchido em conjunto para definir metas.', gradient: 'from-[#2bc196] to-emerald-600', bg: 'bg-emerald-50' },
  { icon: HeartPulse, title: 'Hypercare', time: '2-3 meses', desc: 'Acompanhamento intensivo pós Go-Live. Monitoramento de taxas de aprovação, chargebacks e performance.', gradient: 'from-rose-500 to-red-500', bg: 'bg-rose-50' },
  { icon: LineChart, title: 'Acompanhamento Contínuo', time: 'Ongoing', desc: 'Reuniões semanais/quinzenais. Análise trimestral de resultados com insights de melhoria.', gradient: 'from-[#002443] to-blue-800', bg: 'bg-slate-50' },
];

export default function SlideRoadmap({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#002443] tracking-tight mb-0.5">Roadmap de Implementação</h2>
      <p className="text-[10px] text-[#002443]/40 mb-3">Etapas do seu processo de ativação até o sucesso operacional</p>

      <div className="flex-1 grid grid-cols-6 gap-2">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`${phase.bg} rounded-2xl p-3 flex flex-col border border-[#002443]/[0.04] relative overflow-hidden group`}
            >
              {/* Step number */}
              <div className="absolute top-2 right-2 text-[40px] font-black text-[#002443]/[0.04] leading-none">{i + 1}</div>

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${phase.gradient} flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[10px] font-bold text-[#002443] mb-0.5 leading-tight">{phase.title}</h3>
              <span className="text-[8px] px-1.5 py-0.5 bg-white/60 rounded-full text-[#002443]/40 font-semibold w-fit mb-1.5">{phase.time}</span>
              <p className="text-[7.5px] text-[#002443]/50 leading-[1.5] mt-auto">{phase.desc}</p>
              
              {/* Connector arrow */}
              {i < PHASES.length - 1 && (
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#2bc196]/30 z-10 hidden xl:block" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-[#2bc196]/[0.05] rounded-xl border border-[#2bc196]/10">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2bc196]" />
        <span className="text-[8px] text-[#002443]/50">
          <strong className="text-[#002443]/70">Ramp-Up:</strong> Documento preenchido em conjunto para definir metas, volumes e etapas de evolução — personalizado para a sua operação.
        </span>
      </div>
    </SlideLayout>
  );
}