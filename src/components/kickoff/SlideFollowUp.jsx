import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';

const CARDS = [
  { icon: Calendar, title: 'Reuniões Periódicas', desc: 'Reuniões semanais ou quinzenais para acompanhamento de indicadores, resolução de pendências e alinhamento estratégico.', gradient: 'from-[#1356E2] to-emerald-600' },
  { icon: BarChart3, title: 'Análise Trimestral', desc: 'Relatório completo com métricas de performance, benchmarks do setor e recomendações para otimizar aprovação e conversão.', gradient: 'from-[#0A0A0A] to-blue-700' },
  { icon: TrendingUp, title: 'Insights de Melhoria', desc: 'Análise proativa: otimização de roteamento, ajuste de regras antifraude, novos métodos de pagamento e estratégias de conversão.', gradient: 'from-purple-500 to-purple-700' },
  { icon: Users, title: 'Customer Success', desc: 'Ponto de contato dedicado que conhece sua operação e atua como parceiro estratégico para resultados acima da expectativa.', gradient: 'from-amber-500 to-orange-600' },
];

export default function SlideFollowUp({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#0A0A0A] mb-0.5">Acompanhamento Pós Go-Live</h2>
      <p className="text-[10px] text-[#0A0A0A]/60 mb-4">Compromisso contínuo com o sucesso da sua operação</p>

      <div className="flex-1 grid grid-cols-2 gap-3.5 content-start">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-gradient-to-br from-[#0A0A0A]/[0.04] to-[#1356E2]/[0.04] border border-[#0A0A0A]/[0.06] rounded-2xl p-4 group hover:shadow-lg transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-[#0A0A0A] mb-1">{card.title}</h3>
              <p className="text-[8.5px] text-[#0A0A0A]/55 leading-[1.6]">{card.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}