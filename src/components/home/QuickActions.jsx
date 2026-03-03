import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { FileText, Link as LinkIcon, Users, Shield, ClipboardList } from 'lucide-react';

const actions = [
  {
    label: 'Criar Nova Proposta',
    icon: FileText,
    path: 'CriarProposta',
    color: 'bg-[var(--pagsmile-green)]',
    iconColor: 'text-white'
  },
  {
    label: 'Enviar Link de Questionário',
    icon: ClipboardList,
    path: 'GerarLinkOnboarding',
    color: 'bg-blue-600',
    iconColor: 'text-white'
  },
  {
    label: 'Gerar Link de Onboarding',
    icon: LinkIcon,
    path: 'GerarLinkOnboarding',
    color: 'bg-purple-600',
    iconColor: 'text-white'
  },
  {
    label: 'Ver Todos os Leads',
    icon: Users,
    path: 'QuestionariosLeads',
    color: 'bg-amber-500',
    iconColor: 'text-white'
  },
  {
    label: 'Compliance Dashboard',
    icon: Shield,
    path: 'AdminDashboard',
    color: 'bg-[var(--pagsmile-blue)]',
    iconColor: 'text-white'
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
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className={`p-3 rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${action.iconColor}`} />
            </div>
            <span className="text-xs font-semibold text-center text-[var(--pagsmile-blue)]">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}