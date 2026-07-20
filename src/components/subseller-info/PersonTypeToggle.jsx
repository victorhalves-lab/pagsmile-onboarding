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
            ? 'border-[#1356E2] bg-[#1356E2]/10'
            : 'border-[#0A0A0A]/10 bg-white hover:border-[#0A0A0A]/30'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'text-[#1356E2]' : 'text-[#0A0A0A]/50'}`} />
        <div className="text-left">
          <div className={`text-xs font-bold ${active ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/70'}`}>{label}</div>
          <div className="text-[10px] text-[#0A0A0A]/40">{sub}</div>
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