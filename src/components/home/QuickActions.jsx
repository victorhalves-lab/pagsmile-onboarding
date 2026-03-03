import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { FileText, Link as LinkIcon, Users, Shield, ClipboardList } from 'lucide-react';

const actions = [
  {
    label: 'Nova Proposta',
    description: 'Criar proposta comercial',
    icon: FileText,
    path: 'CriarProposta',
    color: 'bg-[#2bc196]',
  },
  {
    label: 'Link de Questionário',
    description: 'Enviar para leads',
    icon: ClipboardList,
    path: 'GerarLinkOnboarding',
    color: 'bg-[#36706c]',
  },
  {
    label: 'Gerar Link',
    description: 'Onboarding de merchant',
    icon: LinkIcon,
    path: 'GerarLinkOnboarding',
    color: 'bg-[#002443]',
  },
  {
    label: 'Ver Leads',
    description: 'Leads recebidos',
    icon: Users,
    path: 'QuestionariosLeads',
    color: 'bg-[#36706c]',
  },
  {
    label: 'Compliance',
    description: 'Dashboard completo',
    icon: Shield,
    path: 'AdminDashboard',
    color: 'bg-[#002443]',
  }
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={createPageUrl(action.path)}
            className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-[#002443]/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className={`p-3.5 rounded-xl ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-[#002443] block">{action.label}</span>
              <span className="text-[10px] text-[#282828]/40 mt-0.5 block">{action.description}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}