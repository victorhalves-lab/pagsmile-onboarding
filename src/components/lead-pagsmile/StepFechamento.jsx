import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ButtonSelector from './ButtonSelector';
import { URGENCIA_OPTIONS, CRESCIMENTO_OPTIONS, COMO_CONHECEU_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 10 — Expectativas e Fechamento (P36-P39) */
export default function StepFechamento({ form, updateField, errors = {} }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Expectativas e Fechamento</h2>
      </div>

      {/* P36 — Urgência */}
      <div className="space-y-2" data-field="urgencia">
        <label className="text-sm font-semibold text-[#002443]">Quando quer começar a operar? *</label>
        <ButtonSelector options={URGENCIA_OPTIONS} value={form.urgencia} onChange={(v) => updateField('urgencia', v)} columns={4} />
        {errors?.urgencia && <p className="text-xs text-red-500">Informe quando quer começar</p>}
      </div>

      {/* P37 — Crescimento */}
      <div className="space-y-2" data-field="crescimento">
        <label className="text-sm font-semibold text-[#002443]">Expectativa de crescimento (12 meses) *</label>
        <ButtonSelector options={CRESCIMENTO_OPTIONS} value={form.crescimento} onChange={(v) => updateField('crescimento', v)} columns={4} />
        {errors?.crescimento && <p className="text-xs text-red-500">Informe a expectativa de crescimento</p>}
      </div>

      {/* P38 — Como conheceu */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Como conheceu a Pagsmile?</label>
        <ButtonSelector
          options={COMO_CONHECEU_OPTIONS}
          value={form.comoConheceu}
          onChange={(v) => updateField('comoConheceu', v)}
          allowOther
          otherValue={form.comoConheceuOutro}
          onOtherChange={(v) => updateField('comoConheceuOutro', v)}
          columns={5}
        />
      </div>

      {/* P39 — Observações */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Observações adicionais</label>
        <Textarea
          value={form.observacoes || ''}
          onChange={(e) => updateField('observacoes', e.target.value.slice(0, 1000))}
          placeholder="Alguma informação adicional que gostaria de compartilhar? (opcional)"
          className="rounded-xl min-h-[80px]"
          maxLength={1000}
        />
        <p className="text-[10px] text-[#002443]/40 text-right">{(form.observacoes || '').length}/1000</p>
      </div>
    </div>
  );
}