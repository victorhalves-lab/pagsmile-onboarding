import React from 'react';
import ButtonSelector from './ButtonSelector';
import SliderDistribution from './SliderDistribution';
import SliderDistributionParcelamento from './SliderDistributionParcelamento';
import { JA_PROCESSA_OPTIONS, ANTECIPACAO_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 6 — Distribuição de Meios de Pagamento (P18-P21) */
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
          <label className="text-sm font-semibold text-[#002443]">Distribuição atual por meio de pagamento (%) *</label>
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
          <label className="text-sm font-semibold text-[#002443]">Distribuição desejada por meio de pagamento (%) *</label>
          <p className="text-xs text-[#002443]/50">Como você gostaria de distribuir seus pagamentos?</p>
          <SliderDistribution
            values={form.distribuicaoDesejada || { credito: 0, debito: 0, pix: 0, boleto: 0 }}
            onChange={(v) => updateField('distribuicaoDesejada', v)}
          />
        </div>
      )}

      {/* P21 — Distribuição por faixa de parcelamento (PARA TODOS) */}
      {form.jaProcessa && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">
            Distribuição de vendas por parcelamento (%) *
          </label>
          <p className="text-xs text-[#002443]/50">
            {jaProcessa 
              ? 'Do total das suas vendas no cartão de crédito, quanto representa cada faixa de parcelamento?'
              : 'Como você estima distribuir suas vendas por faixa de parcelamento no cartão de crédito?'
            }
          </p>
          <SliderDistributionParcelamento
            values={form.distribuicaoParcelamento || { avista: 0, de2a6x: 0, de7a12x: 0, de13a21x: 0 }}
            onChange={(v) => updateField('distribuicaoParcelamento', v)}
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