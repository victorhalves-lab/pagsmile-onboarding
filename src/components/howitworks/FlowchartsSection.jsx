import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import FlowLeadCaptacao from './flowcharts/FlowLeadCaptacao';
import FlowPropostaComercial from './flowcharts/FlowPropostaComercial';
import FlowComplianceOnboarding from './flowcharts/FlowComplianceOnboarding';
import FlowContrato from './flowcharts/FlowContrato';
import FlowIntroducerLanding from './flowcharts/FlowIntroducerLanding';
import FlowAnaliseManual from './flowcharts/FlowAnaliseManual';
import FlowPipelineKanban from './flowcharts/FlowPipelineKanban';
import FlowSubseller from './flowcharts/FlowSubseller';
import FlowRevalidacao from './flowcharts/FlowRevalidacao';

const FLOWS = [
  { id: 'lead', label: 'Fluxo 1: Captação e Qualificação de Lead', badge: '4 origens → 3 IAs', color: 'bg-emerald-500', component: FlowLeadCaptacao },
  { id: 'proposta', label: 'Fluxo 2: Criação de Propostas Comerciais', badge: '3 modalidades', color: 'bg-blue-500', component: FlowPropostaComercial },
  { id: 'compliance', label: 'Fluxo 3: Compliance & Onboarding KYC/KYB', badge: '9 variantes + SENTINEL', color: 'bg-purple-500', component: FlowComplianceOnboarding },
  { id: 'contrato', label: 'Fluxo 4: Geração e Assinatura de Contrato', badge: 'IA + 7 abas', color: 'bg-amber-500', component: FlowContrato },
  { id: 'introducer', label: 'Fluxo 5: Introducer & Landing Page', badge: 'Co-branded', color: 'bg-violet-500', component: FlowIntroducerLanding },
  { id: 'analise', label: 'Fluxo 6: Análise Manual de Compliance', badge: '7 abas do analista', color: 'bg-slate-700', component: FlowAnaliseManual },
  { id: 'pipeline', label: 'Fluxo 7: Pipeline Kanban Completo', badge: '7 colunas', color: 'bg-indigo-500', component: FlowPipelineKanban },
  { id: 'subseller', label: 'Fluxo 8: Onboarding de Subsellers', badge: 'Marketplace', color: 'bg-cyan-600', component: FlowSubseller },
  { id: 'revalidacao', label: 'Fluxo 9: Revalidação Periódica', badge: '4 triggers', color: 'bg-red-500', component: FlowRevalidacao },
];

export default function FlowchartsSection() {
  const [openFlows, setOpenFlows] = useState({});

  const toggleFlow = (id) => {
    setOpenFlows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h4 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-3">Legenda dos Diagramas de Fluxo</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#2bc196] text-white text-[9px] px-3 py-1 rounded-full font-bold">INÍCIO / FIM</div>
            <span className="text-[10px] text-[#002443]/50">Nó terminal (oval)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border-2 border-[#002443]/15 text-[9px] px-3 py-1 rounded-xl font-bold text-[#002443]">Processo</div>
            <span className="text-[10px] text-[#002443]/50">Ação/etapa (retângulo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-50 border-2 border-amber-300 text-[9px] px-3 py-1 font-bold text-amber-800" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }}>Decisão</div>
            <span className="text-[10px] text-[#002443]/50">Ponto de decisão (losango)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 border-2 border-blue-200 text-[9px] px-3 py-1 rounded-lg font-bold text-blue-800 skew-x-[-6deg]"><span className="skew-x-[6deg] block">Dados</span></div>
            <span className="text-[10px] text-[#002443]/50">Entidade/dado (paralelogramo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-[9px] px-3 py-1 rounded-2xl font-bold text-purple-800">🤖 IA</div>
            <span className="text-[10px] text-[#002443]/50">Processamento IA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 border-2 border-slate-300 border-double text-[9px] px-3 py-1 rounded-lg font-bold text-slate-700">Subprocesso</div>
            <span className="text-[10px] text-[#002443]/50">Etapas detalhadas</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200">
          <span className="text-[10px] text-[#002443]/40 font-bold">RESPONSÁVEIS:</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-[#2bc196] text-white text-[8px] px-2 py-0.5 rounded-full font-bold">EXTERNO</span>
            <span className="bg-[#002443] text-white text-[8px] px-2 py-0.5 rounded-full font-bold">ADMIN/ANALISTA</span>
            <span className="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">TIME COMERCIAL</span>
            <span className="bg-purple-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">IA</span>
            <span className="bg-amber-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">AUTOMAÇÃO</span>
          </div>
        </div>
      </div>

      {/* Flow Accordion */}
      <div className="space-y-3">
        {FLOWS.map(flow => {
          const isOpen = openFlows[flow.id];
          const Component = flow.component;
          return (
            <div key={flow.id} className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFlow(flow.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${flow.color} shrink-0`} />
                <span className="text-sm font-bold text-[#002443] flex-1">{flow.label}</span>
                <Badge className="bg-slate-100 text-[#002443]/60 border-0 text-[10px] font-medium">{flow.badge}</Badge>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-[#002443]/30 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-[#002443]/30 shrink-0" />
                }
              </button>
              {isOpen && (
                <div className="px-5 pb-5 border-t border-[#002443]/5">
                  <div className="pt-4">
                    <Component />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-[#002443]/5 rounded-xl border border-[#002443]/10 p-4">
        <h4 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-3">Resumo dos Fluxos</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Fluxos Mapeados', value: '9', desc: 'Todos os processos da aplicação' },
            { label: 'Responsáveis', value: '5', desc: 'Externo, Admin, Comercial, IA, Automação' },
            { label: 'Pontos de Decisão', value: '25+', desc: 'Bifurcações com lógica de negócio' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-2xl font-extrabold text-[#002443]">{stat.value}</p>
              <p className="text-[10px] font-bold text-[#2bc196] uppercase">{stat.label}</p>
              <p className="text-[9px] text-[#002443]/40">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}