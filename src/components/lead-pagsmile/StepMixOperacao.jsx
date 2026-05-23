import React from 'react';
import MixOperacaoSlider from './MixOperacaoSlider';

/**
 * ETAPA — Composição da Operação
 * Cliente declara o mix percentual dos PRODUTOS que selecionou na Etapa anterior.
 * Sliders dinâmicos: 1 para cada produto selecionado.
 * Total deve somar 100% (estimado).
 */
export default function StepMixOperacao({ form, updateField }) {
  const produtos = form.produtosSelecionados || [];

  return (
    <div className="space-y-4" data-field="mixOperacao">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Distribua o percentual de cada produto</h2>
        <p className="text-xs text-[#002443]/50 mt-1">
          Para cada produto selecionado, informe quanto ele representa da sua operação. A soma deve dar 100%.
        </p>
      </div>

      <MixOperacaoSlider
        value={form.mixOperacao}
        onChange={(v) => updateField('mixOperacao', v)}
        produtos={produtos}
      />
    </div>
  );
}