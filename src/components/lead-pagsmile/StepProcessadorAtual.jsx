import React from 'react';
import ButtonSelector from './ButtonSelector';
import { PROCESSADOR_OPTIONS, SATISFACAO_OPTIONS, DOR_ATUAL_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 8 — Processador Atual (P31-P33) */
export default function StepProcessadorAtual({ form, updateField }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';
  if (!jaProcessa) return null;

  const temProcessador = form.processador && form.processador !== 'Nenhum';
  const insatisfeito = ['Neutro', 'Insatisfeito', 'Muito insatisfeito'].includes(form.satisfacao);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Processador Atual</h2>
      </div>

      {/* P31 — Processador */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Processador/Adquirente atual</label>
        <ButtonSelector
          options={PROCESSADOR_OPTIONS}
          value={form.processador}
          onChange={(v) => updateField('processador', v)}
          allowOther
          otherValue={form.processadorOutro}
          onOtherChange={(v) => updateField('processadorOutro', v)}
          columns={4}
        />
      </div>

      {/* P32 — Satisfação */}
      {temProcessador && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Satisfação com processador atual</label>
          <ButtonSelector options={SATISFACAO_OPTIONS} value={form.satisfacao} onChange={(v) => updateField('satisfacao', v)} columns={5} />
        </div>
      )}

      {/* P33 — Principal dor */}
      {insatisfeito && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Principal dor atual</label>
          <ButtonSelector
            options={DOR_ATUAL_OPTIONS}
            value={form.dorAtual}
            onChange={(v) => updateField('dorAtual', v)}
            allowOther
            otherValue={form.dorOutro}
            onOtherChange={(v) => updateField('dorOutro', v)}
          />
        </div>
      )}
    </div>
  );
}