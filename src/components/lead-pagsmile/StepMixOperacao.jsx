import React from 'react';
import MixOperacaoSlider from './MixOperacaoSlider';

/**
 * ETAPA — Composição da Operação
 * Cliente declara o mix percentual do que vende.
 * Categorias fixas: E-commerce, Dropshipping, Infoproduto, SaaS, Educação.
 * "Outros" é dinâmico (lista com nome + percentual).
 * Total deve somar 100% (estimado).
 */
export default function StepMixOperacao({ form, updateField }) {
  const value = form.mixOperacao;

  return (
    <div className="space-y-4" data-field="mixOperacao">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Conte o que você vende na sua operação</h2>
        <p className="text-xs text-[#002443]/50 mt-1">
          Distribua 100% entre as categorias abaixo conforme o peso real de cada uma. Pode adicionar quantas categorias "Outros" precisar.
        </p>
      </div>

      <MixOperacaoSlider
        value={value}
        onChange={(v) => updateField('mixOperacao', v)}
      />
    </div>
  );
}