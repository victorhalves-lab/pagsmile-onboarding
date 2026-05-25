import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tela mostrada após o cliente aceitar a proposta pública.
 * CTA principal leva ao formulário KYC Global (próximo passo do onboarding).
 */
export default function ProposalAcceptedScreen({ t, lang = 'en' }) {
  const kycUrl = `${window.location.origin}/GlobalComplianceForm?lang=${lang}`;

  return (
    <div className="p-10 text-center max-w-xl mx-auto">
      <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
      <h2 className="text-2xl font-bold text-[#002443] mb-2">{t('prop_accepted_title')}</h2>
      <p className="text-[#002443]/70 mb-6">{t('prop_accepted_desc')}</p>

      <div className="bg-gradient-to-br from-[#2bc196]/8 to-[#5cf7cf]/8 border border-[#2bc196]/30 rounded-2xl p-6 text-left mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[#2bc196]/15">
            <ShieldCheck className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#002443]">{t('next_step_kyc_title')}</h3>
            <p className="text-xs text-[#002443]/70 mt-1">{t('next_step_kyc_desc')}</p>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = kycUrl}
          className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-1.5"
        >
          {t('next_step_kyc_cta')} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-[10px] text-[#002443]/50">
        {t('next_step_kyc_help')}
      </p>
    </div>
  );
}