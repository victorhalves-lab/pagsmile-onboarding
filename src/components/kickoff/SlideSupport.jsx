import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Headphones, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const STEPS = [
  { num: '1', title: 'Abertura do Chamado', desc: 'Via portal, e-mail ou canal dedicado com severidade informada.', gradient: 'from-[#2bc196] to-emerald-600' },
  { num: '2', title: 'Triagem & Classificação', desc: 'Classificação de severidade e acionamento do SLA correspondente.', gradient: 'from-[#002443] to-blue-700' },
  { num: '3', title: 'Diagnóstico & Resolução', desc: 'Análise técnica, correção ou workaround dentro do prazo.', gradient: 'from-purple-500 to-purple-700' },
  { num: '4', title: 'Comunicação & Fechamento', desc: 'Notificação ao cliente, validação e registro completo.', gradient: 'from-amber-500 to-orange-600' },
];

export default function SlideSupport({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="dark">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Processo de Suporte</h2>
      <p className="text-[10px] text-white/35 mb-4">Como funciona o atendimento ao cliente</p>

      <div className="flex-1 flex flex-col gap-4">
        {/* Flow */}
        <div className="flex items-stretch gap-2">
          {STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-3"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-2 shadow-sm`}>
                  <span className="text-[11px] font-bold text-white">{step.num}</span>
                </div>
                <p className="text-[10px] font-bold text-white mb-1">{step.title}</p>
                <p className="text-[8px] text-white/40 leading-tight">{step.desc}</p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center">
                  <ArrowRight className="w-3.5 h-3.5 text-[#2bc196]/40" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Headphones, title: 'Canais de Suporte', desc: 'Portal dedicado, e-mail e canal Slack/Teams direto com o time técnico.', color: 'text-[#2bc196]', bg: 'bg-[#2bc196]/10' },
            { icon: AlertTriangle, title: 'Escalonamento', desc: 'Incidentes críticos escalonados automaticamente para engenharia 24/7.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Clock, title: 'Horários', desc: 'Crítico: 24/7. Demais: 09h-18h BRT, seg-sex.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3.5"
              >
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <h4 className="text-[10px] font-bold text-white mb-1">{item.title}</h4>
                <p className="text-[8.5px] text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}