import React, { useState } from 'react';
import { Flag, Globe2, Handshake } from 'lucide-react';
import GestaoPropostas from './GestaoPropostas';
import GlobalHub from '@/components/global/GlobalHub';

/**
 * Hub central de Propostas. Switch entre:
 *  - Brasil (módulo legado intocado — reusa pages/GestaoPropostas)
 *  - Global (módulo USD trilíngue)
 *  - Juntas (visão consolidada — placeholder para Fase futura)
 */
const TABS = [
  { id: 'brasil', label: 'Propostas Brasil', icon: Flag,     accent: 'from-yellow-400 to-green-500' },
  { id: 'global', label: 'Propostas Global', icon: Globe2,   accent: 'from-[#2bc196] to-[#5cf7cf]' },
  { id: 'juntas', label: 'Propostas Juntas', icon: Handshake,accent: 'from-[#002443] to-[#003366]' },
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
      {tab === 'juntas' && (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-10 text-center">
          <Handshake className="w-12 h-12 text-[#002443]/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#002443]">Propostas Juntas</h3>
          <p className="text-sm text-[#002443]/60 max-w-md mx-auto mt-2">
            Visão consolidada de propostas Brasil + Global do mesmo cliente. Em breve.
          </p>
        </div>
      )}
    </div>
  );
}