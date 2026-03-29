import React from 'react';
import ButtonSelector from './ButtonSelector';
import SliderDistribution from './SliderDistribution';
import { JA_PROCESSA_OPTIONS, ANTECIPACAO_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 6 — Distribuição de Meios de Pagamento (P18-P20) */
export default function StepDistribuicao({ form, updateField }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Distribuição de Meios de Pagamento</h2>
      </div>

      {/* P18 — Já processa? */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Já processa pagamentos? *</label>
        <ButtonSelector options={JA_PROCESSA_OPTIONS} value={form.jaProcessa} onChange={(v) => updateField('jaProcessa', v)} columns={2} />
      </div>

      {/* P19 — Distribuição (%) — se Sim */}
      {jaProcessa && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Distribuição atual (%) *</label>
          <p className="text-xs text-[#002443]/50">Os 4 sliders devem somar 100%</p>
          <SliderDistribution
            values={form.distribuicao || { credito: 0, debito: 0, pix: 0, boleto: 0 }}
            onChange={(v) => updateField('distribuicao', v)}
          />
        </div>
      )}

      {/* P19.NEW — Distribuição desejada (%) — se Não */}
      {form.jaProcessa === 'Não, estou começando' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Distribuição desejada (%) *</label>
          <p className="text-xs text-[#002443]/50">Como você gostaria de distribuir seus pagamentos?</p>
          <SliderDistribution
            values={form.distribuicaoDesejada || { credito: 0, debito: 0, pix: 0, boleto: 0 }}
            onChange={(v) => updateField('distribuicaoDesejada', v)}
          />
        </div>
      )}

      {/* P20 — Antecipação (condicional: já processa) */}
      {jaProcessa && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Já usa antecipação?</label>
          <ButtonSelector options={ANTECIPACAO_OPTIONS} value={form.antecipacao} onChange={(v) => updateField('antecipacao', v)} columns={4} />
        </div>
      )}
    </div>
  );
}