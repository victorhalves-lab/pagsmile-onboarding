import React from 'react';
import { TIPO_NEGOCIO_OPTIONS } from './pixQuestionnaireData';

export default function StepTipoNegocio({ form, updateField }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0A0A0A]">Sua empresa recebe PIX para si mesma ou intermedia PIX para terceiros?</h2>
        <p className="text-xs text-[#0A0A0A]/50 mt-1">Isso determina o fluxo de compliance e as perguntas condicionais.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIPO_NEGOCIO_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateField('tipoNegocio', opt.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              form.tipoNegocio === opt.id
                ? 'border-[#1356E2] bg-[#1356E2]/5 ring-2 ring-[#1356E2]/20'
                : 'border-[#0A0A0A]/10 hover:border-[#1356E2]/40'
            }`}
          >
            <div className="text-3xl mb-2">{opt.icon}</div>
            <h3 className="font-bold text-[#0A0A0A] text-sm">{opt.label}</h3>
            <p className="text-xs text-[#0A0A0A]/60 mt-1">{opt.description}</p>
            <p className="text-[10px] text-[#0A0A0A]/40 mt-1 italic">{opt.examples}</p>
          </button>
        ))}
      </div>
    </div>
  );
}