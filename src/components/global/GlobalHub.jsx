import React, { useState } from 'react';
import {
  LayoutDashboard, ClipboardList, FileText, Columns3, Table2,
  Calculator, ShieldCheck, Globe
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import GlobalDashboard from './pages/GlobalDashboard';
import GlobalLeadQuestionnaireDashboard from './pages/GlobalLeadQuestionnaireDashboard';
import GlobalQuestionnaireCenter from './pages/GlobalQuestionnaireCenter';
import GlobalProposalCreation from './pages/GlobalProposalCreation';
import GlobalProposalCenter from './pages/GlobalProposalCenter';
import GlobalPipelineKanban from './pages/GlobalPipelineKanban';
import GlobalRevenueSimulator from './pages/GlobalRevenueSimulator';
import GlobalInterchangeViewer from './pages/GlobalInterchangeViewer';
import GlobalComplianceDashboard from './pages/GlobalComplianceDashboard';
import GlobalComplianceReceived from './pages/GlobalComplianceReceived';

/**
 * Hub interno do módulo Propostas Global.
 * Sub-navegação por tabs para navegar entre as 10 telas do app importado
 * (Dashboard, Questionários, Propostas, Pipeline, Interchange, Simulador, Compliance).
 */
export default function GlobalHub() {
  const { t } = useTranslation();

  const [section, setSection] = useState(() => {
    try { return sessionStorage.getItem('hub_propostas_global_section') || 'dashboard'; } catch { return 'dashboard'; }
  });

  const changeSection = (s) => {
    setSection(s);
    try { sessionStorage.setItem('hub_propostas_global_section', s); } catch {}
  };

  const SECTIONS = [
    { id: 'dashboard', label: t('global.nav.dashboard') || 'Dashboard', icon: LayoutDashboard },
    { id: 'lead_link', label: t('global.nav.lead_link') || 'Link Questionário', icon: ClipboardList },
    { id: 'questionnaires', label: t('global.nav.questionnaires') || 'Questionários', icon: ClipboardList, highlight: true },
    { id: 'create_proposal', label: t('global.nav.create_proposal') || 'Criar Proposta', icon: FileText },
    { id: 'proposals', label: t('global.nav.proposals') || 'Propostas', icon: FileText },
    { id: 'pipeline', label: t('global.nav.pipeline') || 'Pipeline', icon: Columns3 },
    { id: 'simulator', label: t('global.nav.simulator') || 'Simulador', icon: Calculator },
    { id: 'interchange', label: t('global.nav.interchange') || 'Interchange', icon: Table2 },
    { id: 'compliance_link', label: t('global.nav.compliance_link') || 'Link Compliance', icon: ShieldCheck },
    { id: 'compliance_received', label: t('global.nav.compliance_received') || 'KYC Recebidos', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Hero do módulo Global */}
      <div className="bg-gradient-to-r from-[#002443] via-[#1e3a5f] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <Globe className="w-6 h-6 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('global.hub.title') || 'Propostas Global'}</h1>
            <p className="text-white/60 text-sm mt-1">
              {t('global.hub.subtitle') || 'Propostas em USD, Interchange Visa/Mastercard, fluxo trilíngue (EN/PT/ZH)'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navegação horizontal scrollável */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => changeSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'bg-[#2bc196]/10 text-[#002443] font-semibold'
                    : 'text-[#002443]/60 hover:text-[#002443] hover:bg-[#f4f4f4]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2bc196]' : ''}`} />
                <span>{s.label}</span>
                {s.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2bc196] animate-pulse" />
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2bc196] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da seção ativa */}
      <div>
        {section === 'dashboard' && <GlobalDashboard onNavigate={changeSection} />}
        {section === 'lead_link' && <GlobalLeadQuestionnaireDashboard />}
        {section === 'questionnaires' && <GlobalQuestionnaireCenter onNavigate={changeSection} />}
        {section === 'create_proposal' && <GlobalProposalCreation onNavigate={changeSection} />}
        {section === 'proposals' && <GlobalProposalCenter onNavigate={changeSection} />}
        {section === 'pipeline' && <GlobalPipelineKanban />}
        {section === 'simulator' && <GlobalRevenueSimulator />}
        {section === 'interchange' && <GlobalInterchangeViewer />}
        {section === 'compliance_link' && <GlobalComplianceDashboard />}
        {section === 'compliance_received' && <GlobalComplianceReceived />}
      </div>
    </div>
  );
}