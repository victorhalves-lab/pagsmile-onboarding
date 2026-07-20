// =============================================================================
// Documentação MICROSCÓPICA dos Questionários de Leads (V5 Cartão + Pix V4)
// Renderiza todas as perguntas, opções, lógica condicional, flags e score.
// =============================================================================

import React from 'react';
import { CreditCard, Zap } from 'lucide-react';
import LeadsV5QuestionnaireDoc from './leads-questionarios/LeadsV5QuestionnaireDoc';
import LeadsPixV4QuestionnaireDoc from './leads-questionarios/LeadsPixV4QuestionnaireDoc';

export default function Ch21_QuestionariosLeads({ tab = 'v5' }) {
  return (
    <div className="space-y-8">
      {tab === 'v5' && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A]/5 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A0A0A]">Questionário de Leads V5 — Cartão</h2>
              <p className="text-xs text-[#0A0A0A]/60">Captação de leads de processamento de cartão (Visa/Master/Elo/Amex)</p>
            </div>
          </div>
          <LeadsV5QuestionnaireDoc />
        </section>
      )}

      {tab === 'pix' && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1356E2]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#1356E2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A0A0A]">Questionário de Leads Pix V4</h2>
              <p className="text-xs text-[#0A0A0A]/60">Captação de leads de processamento PIX (merchant direto + intermediário)</p>
            </div>
          </div>
          <LeadsPixV4QuestionnaireDoc />
        </section>
      )}
    </div>
  );
}