import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';
import RiskScoringSellersDoc from './RiskScoringSellersDoc';
import RiskScoringSubsellersDoc from './RiskScoringSubsellersDoc';

export default function RiskScoringDocTab() {
  const [sub, setSub] = useState('sellers');

  return (
    <div className="bg-white">
      {/* Sub-tabs */}
      <div className="no-print sticky top-[68px] z-[6] bg-white border-b border-[#e8e8e8] max-w-[1100px] mx-auto px-6">
        <div className="flex items-center gap-1 pt-2">
          <SubTab active={sub === 'sellers'} onClick={() => setSub('sellers')} icon={Building2}
            label="Sellers Diretos" sublabel="PJ Cartão & PIX — modelo V4 (0–849)" />
          <SubTab active={sub === 'subsellers'} onClick={() => setSub('subsellers')} icon={User}
            label="Subsellers / Subcontas" sublabel="PJ & PF dentro de Marketplaces — modelo Subseller V2 (0–1000)" />
        </div>
      </div>

      {sub === 'sellers' && <RiskScoringSellersDoc />}
      {sub === 'subsellers' && <RiskScoringSubsellersDoc />}
    </div>
  );
}

function SubTab({ active, onClick, icon: Icon, label, sublabel }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 border-b-2 transition-all ${active
        ? 'border-[#2bc196] bg-white'
        : 'border-transparent text-[#1a1a1a]/50 hover:bg-[#f9fafb]'}`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-[#2bc196]' : 'text-[#1a1a1a]/40'}`} />
      <div className="text-left">
        <p className={`text-xs font-bold ${active ? 'text-[#002443]' : 'text-[#1a1a1a]/60'}`}>{label}</p>
        <p className="text-[10px] text-[#1a1a1a]/40">{sublabel}</p>
      </div>
    </button>
  );
}