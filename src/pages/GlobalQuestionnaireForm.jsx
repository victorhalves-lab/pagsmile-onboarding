import React from 'react';
import { Construction } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

/**
 * Formulário público que o lead internacional preenche em USD.
 * Implementação completa virá na Fase 3.
 */
export default function GlobalQuestionnaireForm() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-10 max-w-2xl w-full text-center">
        <div className="inline-flex p-4 rounded-2xl bg-[#2bc196]/10 mb-4">
          <Construction className="w-10 h-10 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Global Questionnaire</h1>
        <p className="text-[#002443]/60 mb-4">
          {t('global.public.questionnaire_coming') ||
            'Public questionnaire for international leads (USD, trilingual EN/PT/ZH) — coming in Phase 3.'}
        </p>
        <div className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full inline-block">
          Fase 3
        </div>
      </div>
    </div>
  );
}