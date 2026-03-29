import React from 'react';
import { TIPO_NEGOCIO_OPTIONS } from './pixQuestionnaireData';

export default function StepTipoNegocio({ form, updateField }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Sua empresa recebe PIX para si mesma ou intermedia PIX para terceiros?</h2>
        <p className="text-xs text-[#002443]/50 mt-1">Isso determina o fluxo de compliance e as perguntas condicionais.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIPO_NEGOCIO_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateField('tipoNegocio', opt.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              form.tipoNegocio === opt.id
                ? 'border-[#2bc196] bg-[#2bc196]/5 ring-2 ring-[#2bc196]/20'
                : 'border-[#002443]/10 hover:border-[#2bc196]/40'
            }`}
          >
            <div className="text-3xl mb-2">{opt.icon}</div>
            <h3 className="font-bold text-[#002443] text-sm">{opt.label}</h3>
            <p className="text-xs text-[#002443]/60 mt-1">{opt.description}</p>
            <p className="text-[10px] text-[#002443]/40 mt-1 italic">{opt.examples}</p>
          </button>
        ))}
      </div>
    </div>
  );
}