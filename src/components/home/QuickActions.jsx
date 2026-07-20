import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { FileText, Link as LinkIcon, Users, Shield, ClipboardList } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function QuickActions() {
  const { t } = useTranslation();

  const actions = [
    {
      label: t('quick.new_proposal'),
      description: t('quick.new_proposal_desc'),
      icon: FileText,
      path: 'CriarProposta',
      color: 'bg-[#1356E2]',
    },
    {
      label: t('quick.questionnaire_link'),
      description: t('quick.questionnaire_link_desc'),
      icon: ClipboardList,
      path: 'GerarLinkOnboarding',
      color: 'bg-[#E84B1C]',
    },
    {
      label: t('quick.generate_link'),
      description: t('quick.generate_link_desc'),
      icon: LinkIcon,
      path: 'GerarLinkOnboarding',
      color: 'bg-[#0A0A0A]',
    },
    {
      label: t('quick.view_leads'),
      description: t('quick.view_leads_desc'),
      icon: Users,
      path: 'QuestionariosLeads',
      color: 'bg-[#E84B1C]',
    },
    {
      label: t('quick.compliance'),
      description: t('quick.compliance_desc'),
      icon: Shield,
      path: 'AdminDashboard',
      color: 'bg-[#0A0A0A]',
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={createPageUrl(action.path)}
            className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-[#0A0A0A]/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className={`p-3.5 rounded-xl ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-[#0A0A0A] block">{action.label}</span>
              <span className="text-[10px] text-[#0A0A0A]/40 mt-0.5 block">{action.description}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}