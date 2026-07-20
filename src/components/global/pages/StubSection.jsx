import React from 'react';
import { Construction } from 'lucide-react';

/**
 * Stub temporário usado pelas sub-páginas do GlobalHub que ainda serão
 * implementadas nas próximas fases (2, 3 e 4). Padroniza o visual de
 * "página em construção" mantendo o design system Pin Bank.
 */
export default function StubSection({ title, subtitle, phase = 2, icon: Icon = Construction }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-10">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-[#1356E2]/10">
          <Icon className="w-6 h-6 text-[#1356E2]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-[#0A0A0A]">{title}</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Fase {phase}
            </span>
          </div>
          {subtitle && <p className="text-[#0A0A0A]/60 text-sm">{subtitle}</p>}
          <div className="mt-6 p-4 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5 text-sm text-[#0A0A0A]/70">
            Esta tela será construída na Fase {phase} da migração do módulo Propostas Global.
            A estrutura, entidades e roteamento já estão prontos.
          </div>
        </div>
      </div>
    </div>
  );
}