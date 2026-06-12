import React, { useState } from 'react';
import { Flag, Globe2, Handshake, Download } from 'lucide-react';
import GestaoPropostas from './GestaoPropostas';
import GlobalHub from '@/components/global/GlobalHub';
import UnifiedProposalsList from '@/components/unified/UnifiedProposalsList';
import DownloadDocumentos from './DownloadDocumentos';

/**
 * Hub central de Propostas. Switch entre:
 *  - Brasil (módulo legado intocado — reusa pages/GestaoPropostas)
 *  - Global (módulo USD trilíngue)
 *  - Juntas (visão consolidada — placeholder para Fase futura)
 *  - Download de Documentos (docs microscópicas dos questionários de leads)
 */
const TABS = [
  { id: 'brasil', label: 'Propostas Brasil', icon: Flag,     accent: 'from-yellow-400 to-green-500' },
  { id: 'global', label: 'Propostas Global', icon: Globe2,   accent: 'from-[#2bc196] to-[#5cf7cf]' },
  { id: 'juntas', label: 'Propostas Unificadas', icon: Handshake,accent: 'from-[#002443] to-[#003366]' },
  { id: 'download', label: 'Download de Documentos', icon: Download, accent: 'from-[#002443] to-[#2bc196]' },
];

export default function HubPropostas() {
  const [tab, setTab] = useState('brasil');

  return (
    <div className="space-y-6">
      {/* Switch principal */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-2 inline-flex gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? `bg-gradient-to-r ${t.accent} text-white shadow`
                  : 'text-[#002443]/60 hover:bg-[#f4f4f4]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {tab === 'brasil' && <GestaoPropostas />}
      {tab === 'global' && <GlobalHub />}
      {tab === 'juntas' && <UnifiedProposalsList />}
      {tab === 'download' && <DownloadDocumentos />}
    </div>
  );
}