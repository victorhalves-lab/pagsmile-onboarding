import React from 'react';
import { cn } from '@/lib/utils';
import {
  Building2, User, Briefcase, DollarSign, MapPin,
  CreditCard, Shield, FileText, Users, Globe, Settings
} from 'lucide-react';

const SECTION_ICONS = {
  'Identificação': Building2,
  'Contato': User,
  'Endereço': MapPin,
  'Atividade': Briefcase,
  'Modelo de Negócio': Briefcase,
  'Volume': DollarSign,
  'Volumetria': DollarSign,
  'Financeiro': DollarSign,
  'Clientes': Users,
  'Responsável': User,
  'Compliance': Shield,
  'PLD': Shield,
  'Sócios': Users,
  'Governança': Users,
  'Declarações': FileText,
  'Confirmação': FileText,
  'SAC': Settings,
  'Internacional': Globe,
  'Marketplace': Globe,
  'Recorrência': CreditCard,
  'Disputas': CreditCard,
  'Cartão': CreditCard,
  'Transacional': DollarSign,
  'Geral': FileText,
};

function getIcon(sectionName) {
  for (const [key, Icon] of Object.entries(SECTION_ICONS)) {
    if (sectionName.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return FileText;
}

const SECTION_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-pink-50 text-pink-700 border-pink-200',
];

export default function ResponsesSectionNav({ sections, activeSection, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((sec, idx) => {
        const Icon = getIcon(sec.name);
        const isActive = activeSection === sec.name;
        const colorSet = SECTION_COLORS[idx % SECTION_COLORS.length];
        
        return (
          <button
            key={sec.name}
            onClick={() => onSelect(sec.name)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200',
              isActive
                ? colorSet + ' shadow-sm scale-[1.02]'
                : 'bg-white text-[#0A0A0A]/60 border-[#0A0A0A]/8 hover:bg-[#f4f4f4] hover:border-[#0A0A0A]/12'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{sec.name}</span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
              isActive ? 'bg-white/50' : 'bg-[#f4f4f4]'
            )}>
              {sec.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}