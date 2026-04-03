import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';

export default function SlideFollowUp({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Acompanhamento Pós Go-Live</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Compromisso contínuo com o sucesso da sua operação</p>

      <div className="flex-1 grid grid-cols-2 gap-4 content-start">
        <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-xl p-4">
          <Calendar className="w-6 h-6 text-[#2bc196] mb-2" />
          <h3 className="text-[11px] font-bold text-[#002443] mb-1">Reuniões Periódicas</h3>
          <p className="text-[9px] text-[#002443]/60 leading-relaxed">
            Reuniões <strong>semanais ou quinzenais</strong> (conforme preferência do cliente) para acompanhamento de indicadores, resolução de pendências e alinhamento estratégico.
          </p>
        </div>

        <div className="bg-[#002443]/[0.03] rounded-xl p-4">
          <BarChart3 className="w-6 h-6 text-[#002443]/70 mb-2" />
          <h3 className="text-[11px] font-bold text-[#002443] mb-1">Análise Trimestral de Resultados</h3>
          <p className="text-[9px] text-[#002443]/60 leading-relaxed">
            A cada trimestre, apresentamos um relatório completo com <strong>métricas de performance, benchmarks do setor e recomendações</strong> de melhoria para otimizar taxas de aprovação, reduzir chargebacks e aumentar conversão.
          </p>
        </div>

        <div className="bg-[#002443]/[0.03] rounded-xl p-4">
          <TrendingUp className="w-6 h-6 text-[#002443]/70 mb-2" />
          <h3 className="text-[11px] font-bold text-[#002443] mb-1">Insights de Melhoria</h3>
          <p className="text-[9px] text-[#002443]/60 leading-relaxed">
            Análise proativa de dados para identificar oportunidades: otimização de roteamento, ajuste de regras antifraude, sugestões de novos métodos de pagamento e estratégias para aumentar a taxa de conversão.
          </p>
        </div>

        <div className="bg-[#002443]/[0.03] rounded-xl p-4">
          <Users className="w-6 h-6 text-[#002443]/70 mb-2" />
          <h3 className="text-[11px] font-bold text-[#002443] mb-1">Customer Success Dedicado</h3>
          <p className="text-[9px] text-[#002443]/60 leading-relaxed">
            Um ponto de contato dedicado que conhece profundamente a sua operação e atua como parceiro estratégico para garantir que os resultados superem as expectativas.
          </p>
        </div>
      </div>
    </SlideLayout>
  );
}