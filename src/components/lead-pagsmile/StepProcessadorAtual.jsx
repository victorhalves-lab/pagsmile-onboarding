import React from 'react';
import ButtonSelector from './ButtonSelector';
import { PROCESSADOR_OPTIONS, SATISFACAO_OPTIONS, DOR_ATUAL_OPTIONS } from './pagsmileQuestionnaireData';
import { DORES_MERCADO_OPTIONS } from './productsCatalog';

/** ETAPA — Processador Atual + Dores no Mercado (sempre visíveis) */
export default function StepProcessadorAtual({ form, updateField, errors = {} }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';
  const temProcessador = form.processador && form.processador !== 'Nenhum';
  const insatisfeito = ['Neutro', 'Insatisfeito', 'Muito insatisfeito'].includes(form.satisfacao);

  const dores = form.doresMercado || [];
  const toggleDor = (dor) => {
    const updated = dores.includes(dor) ? dores.filter(d => d !== dor) : [...dores, dor];
    updateField('doresMercado', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#0A0A0A]">Processador & Dores do Mercado</h2>
      </div>

      {/* Processador (só se já processa) */}
      {jaProcessa && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#0A0A0A]">Processador/Adquirente atual</label>
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

          {temProcessador && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0A0A0A]">Satisfação com processador atual</label>
              <ButtonSelector options={SATISFACAO_OPTIONS} value={form.satisfacao} onChange={(v) => updateField('satisfacao', v)} columns={5} />
            </div>
          )}

          {insatisfeito && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0A0A0A]">Principal dor com seu processador atual</label>
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
        </>
      )}

      {/* Dores no Mercado — SEMPRE VISÍVEL (multi-seleção em chips) */}
      <div className="space-y-3 pt-2 border-t border-[#0A0A0A]/10" data-field="doresMercado">
        <div>
          <label className="text-sm font-semibold text-[#0A0A0A]">
            Quais as principais dores que você tem hoje no mercado de pagamentos? *
          </label>
          <p className="text-xs text-[#0A0A0A]/50">
            Selecione todas que se aplicam — mesmo que você não processe ainda, conte o que mais te preocupa
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {DORES_MERCADO_OPTIONS.map(dor => {
            const selected = dores.includes(dor);
            return (
              <button
                key={dor}
                type="button"
                onClick={() => toggleDor(dor)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium border-2 transition-all
                  ${selected
                    ? 'bg-[#1356E2] border-[#1356E2] text-white shadow-sm'
                    : 'bg-white border-[#0A0A0A]/15 text-[#0A0A0A]/70 hover:border-[#1356E2]/40 hover:bg-[#1356E2]/5'
                  }`}
              >
                {selected && '✓ '}{dor}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#0A0A0A]/60">Outras dores (opcional)</label>
          <input
            type="text"
            value={form.doresMercadoOutro || ''}
            onChange={(e) => updateField('doresMercadoOutro', e.target.value.slice(0, 200))}
            placeholder="Descreva outras dores que você sente..."
            className="w-full h-10 rounded-xl border border-[#0A0A0A]/10 px-4 text-sm bg-white"
          />
        </div>

        {errors?.doresMercado && (
          <p className="text-xs text-red-500">Selecione pelo menos 1 dor</p>
        )}
      </div>
    </div>
  );
}