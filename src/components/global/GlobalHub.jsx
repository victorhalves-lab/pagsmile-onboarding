import React, { useState } from 'react';
import { Globe2, LayoutDashboard, ClipboardList, FileText, Kanban, Calculator, Table2, Link as LinkIcon, ShieldCheck, Plus, BookOpen, Database } from 'lucide-react';
import GlobalDashboard from './pages/GlobalDashboard';
import GlobalLeadQuestionnaireDashboard from './pages/GlobalLeadQuestionnaireDashboard';
import GlobalQuestionnaireCenter from './pages/GlobalQuestionnaireCenter';
import GlobalProposalCreation from './pages/GlobalProposalCreation';
import GlobalProposalCenter from './pages/GlobalProposalCenter';
import GlobalPipelineKanban from './pages/GlobalPipelineKanban';
import GlobalRevenueSimulator from './pages/GlobalRevenueSimulator';
import GlobalInterchangeViewer from './pages/GlobalInterchangeViewer';
import GlobalCountriesChannels from './pages/GlobalCountriesChannels';
import GlobalComplianceDashboard from './pages/GlobalComplianceDashboard';
import GlobalComplianceReceived from './pages/GlobalComplianceReceived';
import GlobalHowItWorks from './pages/GlobalHowItWorks';

/**
 * Navegação interna do hub Global. Lista de sub-páginas controladas por estado local.
 * Padrão visual Pin Bank (azul/verde) e sem refletir nada do Brasil para evitar acoplamento.
 */
const TABS = [
  { id: 'dashboard',          label: 'Dashboard',         icon: LayoutDashboard, component: GlobalDashboard,                 group: 'Geral' },
  { id: 'lead_link',          label: 'Link Questionário', icon: LinkIcon,        component: GlobalLeadQuestionnaireDashboard, group: 'Captação' },
  { id: 'questionnaires',     label: 'Questionários',     icon: ClipboardList,   component: GlobalQuestionnaireCenter,       group: 'Captação' },
  { id: 'create_proposal',    label: 'Criar Proposta',    icon: Plus,            component: GlobalProposalCreation,          group: 'Propostas' },
  { id: 'proposals',          label: 'Propostas',         icon: FileText,        component: GlobalProposalCenter,            group: 'Propostas' },
  { id: 'pipeline',           label: 'Pipeline',          icon: Kanban,          component: GlobalPipelineKanban,            group: 'Propostas' },
  { id: 'simulator',          label: 'Simulador',         icon: Calculator,      component: GlobalRevenueSimulator,          group: 'Análise' },
  { id: 'interchange',        label: 'Interchange',       icon: Table2,          component: GlobalInterchangeViewer,         group: 'Análise' },
  { id: 'countries_channels', label: 'Canais por País',   icon: Database,        component: GlobalCountriesChannels,         group: 'Catálogo' },
  { id: 'compliance_link',    label: 'Link Compliance',   icon: LinkIcon,        component: GlobalComplianceDashboard,       group: 'Compliance' },
  { id: 'compliance_received',label: 'KYC Recebidos',     icon: ShieldCheck,     component: GlobalComplianceReceived,        group: 'Compliance' },
  { id: 'how_it_works',       label: 'Como Funciona',     icon: BookOpen,        component: GlobalHowItWorks,                group: 'Ajuda' },
];

export default function GlobalHub() {
  const [active, setActive] = useState('dashboard');
  const ActiveComp = (TABS.find(t => t.id === active) || TABS[0]).component;

  // Agrupa por categoria preservando ordem.
  const groups = TABS.reduce((acc, t) => {
    (acc[t.group] = acc[t.group] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-5 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#1356E2]/15 to-[#E84B1C]/15">
          <Globe2 className="w-6 h-6 text-[#1356E2]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">Propostas Global</h2>
          <p className="text-xs text-[#0A0A0A]/60">USD · Visa/Mastercard Interchange · Fluxo trilíngue EN/PT/ZH</p>
        </div>
      </div>

      {/* Sub-navegação agrupada */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-3">
        <div className="flex flex-wrap gap-4">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 px-2">{groupName}</span>
              <div className="flex flex-wrap gap-1">
                {items.map(tab => {
                  const Icon = tab.icon;
                  const isActive = active === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActive(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1356E2] text-white shadow-sm'
                          : 'text-[#0A0A0A]/70 hover:bg-[#1356E2]/8 hover:text-[#0A0A0A]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <ActiveComp />
    </div>
  );
}