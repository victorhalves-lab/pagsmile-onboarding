import React from 'react';
import { Building2, User } from 'lucide-react';

/**
 * Toggle para o subseller escolher entre PJ ou PF.
 */
export default function PersonTypeToggle({ value, onChange }) {
  const opt = (key, Icon, label, sub) => {
    const active = value === key;
    return (
      <button
        type="button"
        onClick={() => onChange(key)}
        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
          active
            ? 'border-[#2bc196] bg-[#2bc196]/10'
            : 'border-[#002443]/10 bg-white hover:border-[#002443]/30'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'text-[#2bc196]' : 'text-[#002443]/50'}`} />
        <div className="text-left">
          <div className={`text-xs font-bold ${active ? 'text-[#002443]' : 'text-[#002443]/70'}`}>{label}</div>
          <div className="text-[10px] text-[#002443]/40">{sub}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex gap-2">
      {opt('PJ', Building2, 'Empresa (PJ)', 'CNPJ')}
      {opt('PF', User, 'Pessoa Física (PF)', 'CPF')}
    </div>
  );
}