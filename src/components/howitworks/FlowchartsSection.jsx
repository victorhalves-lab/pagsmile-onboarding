import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import FlowLeadCaptacao from './flowcharts/FlowLeadCaptacao';
import FlowPropostaPersonalizada from './flowcharts/FlowPropostaPersonalizada';
import FlowPropostaPadrao from './flowcharts/FlowPropostaPadrao';
import FlowPropostaPix from './flowcharts/FlowPropostaPix';
import FlowComplianceOnboarding from './flowcharts/FlowComplianceOnboarding';
import FlowContrato from './flowcharts/FlowContrato';
import FlowIntroducer from './flowcharts/FlowIntroducer';
import FlowPipelineComercial from './flowcharts/FlowPipelineComercial';
import FlowRevalidacao from './flowcharts/FlowRevalidacao';
import FlowSubseller from './flowcharts/FlowSubseller';

const LEGEND = [
  { shape: 'rounded-full bg-[#1356E2]', label: 'Início / Fim (terminal)' },
  { shape: 'rounded-lg bg-white border-2 border-slate-300', label: 'Processo / Ação' },
  { shape: 'rounded-lg bg-white border-2 border-[#1356E2]', label: 'Processo Destacado' },
  { shape: 'bg-amber-50 border-2 border-amber-400', label: 'Decisão (losango)', extra: '◇' },
  { shape: 'rounded-lg bg-blue-50 border-2 border-blue-300', label: 'Dados / Entidade' },
  { shape: 'rounded-lg bg-purple-50 border-2 border-purple-300 ring-2 ring-purple-200', label: 'Sub-processo (IA / automação)' },
  { shape: 'rounded bg-slate-100', label: 'Micro-etapa (inline)' },
];

export default function FlowchartsSection() {
  return (
    <div className="space-y-6">
      {/* Introdução */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-2xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Diagramas de Fluxo — Visão Microscópica</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-4">
          Cada fluxo abaixo representa um processo completo da aplicação, desenhado etapa por etapa, 
          microetapa por microetapa, com identificação do responsável em cada passo, decisões condicionais, 
          dados gerados e sub-processos automatizados.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white border-0">10 Fluxos Completos</Badge>
          <Badge className="bg-green-500/20 text-green-300 border-0">Lead → Pipeline → Proposta → Contrato</Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-0">9 Variantes de Compliance</Badge>
          <Badge className="bg-violet-500/20 text-violet-300 border-0">Introducers & Subsellers</Badge>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-3">Legenda dos Símbolos</p>
        <div className="flex flex-wrap gap-4">
          {LEGEND.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-4 ${item.shape} flex items-center justify-center`}>
                {item.extra && <span className="text-[8px] text-amber-700">{item.extra}</span>}
              </div>
              <span className="text-[10px] text-[#0A0A0A]/60">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Badge className="text-[8px] bg-slate-100 text-slate-600 border-0">Actor</Badge>
            <span className="text-[10px] text-[#0A0A0A]/60">Responsável pela etapa</span>
          </div>
        </div>
      </div>

      {/* Fluxos organizados em abas */}
      <Tabs defaultValue="captacao" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1.5 rounded-xl">
          <TabsTrigger value="captacao" className="text-[10px] px-3 py-1.5 rounded-lg">1. Captação Lead</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-[10px] px-3 py-1.5 rounded-lg">2. Pipeline</TabsTrigger>
          <TabsTrigger value="proposta" className="text-[10px] px-3 py-1.5 rounded-lg">3. Proposta Personalizada</TabsTrigger>
          <TabsTrigger value="padrao" className="text-[10px] px-3 py-1.5 rounded-lg">4. Proposta Padrão</TabsTrigger>
          <TabsTrigger value="pix" className="text-[10px] px-3 py-1.5 rounded-lg">5. Proposta PIX</TabsTrigger>
          <TabsTrigger value="compliance" className="text-[10px] px-3 py-1.5 rounded-lg">6. Compliance</TabsTrigger>
          <TabsTrigger value="contrato" className="text-[10px] px-3 py-1.5 rounded-lg">7. Contrato</TabsTrigger>
          <TabsTrigger value="introducer" className="text-[10px] px-3 py-1.5 rounded-lg">8. Introducer</TabsTrigger>
          <TabsTrigger value="subseller" className="text-[10px] px-3 py-1.5 rounded-lg">9. Subseller</TabsTrigger>
          <TabsTrigger value="revalidacao" className="text-[10px] px-3 py-1.5 rounded-lg">10. Revalidação</TabsTrigger>
        </TabsList>

        <TabsContent value="captacao"><FlowLeadCaptacao /></TabsContent>
        <TabsContent value="pipeline"><FlowPipelineComercial /></TabsContent>
        <TabsContent value="proposta"><FlowPropostaPersonalizada /></TabsContent>
        <TabsContent value="padrao"><FlowPropostaPadrao /></TabsContent>
        <TabsContent value="pix"><FlowPropostaPix /></TabsContent>
        <TabsContent value="compliance"><FlowComplianceOnboarding /></TabsContent>
        <TabsContent value="contrato"><FlowContrato /></TabsContent>
        <TabsContent value="introducer"><FlowIntroducer /></TabsContent>
        <TabsContent value="subseller"><FlowSubseller /></TabsContent>
        <TabsContent value="revalidacao"><FlowRevalidacao /></TabsContent>
      </Tabs>

      {/* Mapa de Interconexão */}
      <div className="bg-white border-2 border-[#1356E2]/30 rounded-2xl p-5">
        <h4 className="font-bold text-[#0A0A0A] text-sm mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1356E2]" />
          Mapa de Interconexão dos Fluxos
        </h4>
        <div className="space-y-2">
          {[
            { from: 'Fluxo 1 (Captação)', to: 'Fluxo 2 (Pipeline)', trigger: 'Lead criado → aparece no Kanban', color: 'text-green-600' },
            { from: 'Fluxo 2 (Pipeline)', to: 'Fluxos 3/4/5 (Propostas)', trigger: 'Comercial cria proposta para o lead', color: 'text-blue-600' },
            { from: 'Fluxos 3/4/5 (Propostas)', to: 'Fluxo 6 (Compliance)', trigger: 'Proposta aceita → inicia compliance', color: 'text-purple-600' },
            { from: 'Fluxo 6 (Compliance)', to: 'Fluxo 7 (Contrato)', trigger: 'Compliance aprovado → contrato pré-gerado por IA', color: 'text-orange-600' },
            { from: 'Fluxo 7 (Contrato)', to: 'Fluxo 10 (Revalidação)', trigger: 'Contrato assinado → agenda revalidação periódica', color: 'text-amber-600' },
            { from: 'Fluxo 8 (Introducer)', to: 'Fluxo 1 (Captação)', trigger: 'Lead da landing page → entra no fluxo de captação com introducerId', color: 'text-violet-600' },
            { from: 'Fluxo 9 (Subseller)', to: 'Fluxo 6 (Compliance)', trigger: 'Subseller preenche questionário → entra no fluxo compliance', color: 'text-pink-600' },
          ].map((conn, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
              <span className="text-[10px] font-bold text-[#0A0A0A] min-w-[160px]">{conn.from}</span>
              <span className={`text-[10px] font-bold ${conn.color}`}>→</span>
              <span className="text-[10px] font-bold text-[#0A0A0A] min-w-[160px]">{conn.to}</span>
              <span className="text-[9px] text-[#0A0A0A]/50 flex-1">"{conn.trigger}"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}