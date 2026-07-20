import React, { useState } from 'react';
import {
  FileText, Shield, Users, GitBranch, Scale, DollarSign,
  TrendingDown, Smartphone, Star, AlertOctagon, Link2, Code,
} from 'lucide-react';

import BdcTabIdentidade from './tabs/BdcTabIdentidade';
import BdcTabKycPld from './tabs/BdcTabKycPld';
import BdcTabSocios from './tabs/BdcTabSocios';
import BdcTabCadeia from './tabs/BdcTabCadeia';
import BdcTabProcessos from './tabs/BdcTabProcessos';
import BdcTabFinanceiro from './tabs/BdcTabFinanceiro';
import BdcTabInadimplencia from './tabs/BdcTabInadimplencia';
import BdcTabDigital from './tabs/BdcTabDigital';
import BdcTabReputacao from './tabs/BdcTabReputacao';
import BdcTabWatchlists from './tabs/BdcTabWatchlists';
import BdcTabRelacionamentos from './tabs/BdcTabRelacionamentos';
import BdcTabRaw from './tabs/BdcTabRaw';

// Definição das abas — `pf` indica se a aba aparece em consultas PF
const TABS_PJ = [
  { id: 'identidade', label: 'Identidade', icon: FileText, Comp: BdcTabIdentidade },
  { id: 'kyc_pld', label: 'KYC/PLD', icon: Shield, Comp: BdcTabKycPld, highlight: true },
  { id: 'socios', label: 'Sócios', icon: Users, Comp: BdcTabSocios },
  { id: 'cadeia', label: 'Cadeia Societária', icon: GitBranch, Comp: BdcTabCadeia, highlight: true },
  { id: 'processos', label: 'Processos', icon: Scale, Comp: BdcTabProcessos },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, Comp: BdcTabFinanceiro, highlight: true },
  { id: 'inadimplencia', label: 'Inadimplência', icon: TrendingDown, Comp: BdcTabInadimplencia, highlight: true },
  { id: 'digital', label: 'Digital', icon: Smartphone, Comp: BdcTabDigital },
  { id: 'reputacao', label: 'Reputação', icon: Star, Comp: BdcTabReputacao },
  { id: 'watchlists', label: 'Watchlists', icon: AlertOctagon, Comp: BdcTabWatchlists, highlight: true },
  { id: 'relacionamentos', label: 'Relacionamentos', icon: Link2, Comp: BdcTabRelacionamentos },
  { id: 'raw', label: 'Raw JSON', icon: Code, Comp: BdcTabRaw },
];

const TABS_PF = [
  { id: 'identidade', label: 'Identidade', icon: FileText, Comp: BdcTabIdentidade },
  { id: 'kyc_pld', label: 'KYC/PLD', icon: Shield, Comp: BdcTabKycPld, highlight: true },
  { id: 'processos', label: 'Processos', icon: Scale, Comp: BdcTabProcessos },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, Comp: BdcTabFinanceiro, highlight: true },
  { id: 'inadimplencia', label: 'Inadimplência', icon: TrendingDown, Comp: BdcTabInadimplencia, highlight: true },
  { id: 'reputacao', label: 'Reputação', icon: Star, Comp: BdcTabReputacao },
  { id: 'watchlists', label: 'Watchlists', icon: AlertOctagon, Comp: BdcTabWatchlists },
  { id: 'relacionamentos', label: 'Relacionamentos', icon: Link2, Comp: BdcTabRelacionamentos },
  { id: 'raw', label: 'Raw JSON', icon: Code, Comp: BdcTabRaw },
];

export default function BdcLookupTabs({ result, docType, status, queryId }) {
  const tabs = docType === 'cpf' ? TABS_PF : TABS_PJ;
  const [active, setActive] = useState(tabs[0].id);
  const ActiveTab = tabs.find(t => t.id === active) || tabs[0];

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-[#1356E2] text-[#1356E2] bg-[#1356E2]/5'
                    : 'border-transparent text-slate-500 hover:text-[#0A0A0A] hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#1356E2]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <ActiveTab.Comp result={result} status={status} queryId={queryId} />
    </div>
  );
}