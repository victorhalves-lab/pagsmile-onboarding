import React from 'react';
import ButtonSelector from './ButtonSelector';
import SliderDistribution from './SliderDistribution';
import SliderDistributionParcelamento from './SliderDistributionParcelamento';
import { JA_PROCESSA_OPTIONS, ANTECIPACAO_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 6 — Distribuição de Meios de Pagamento (P18-P21) */
export default function StepDistribuicao({ form, updateField, errors = {} }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';

  const sumObj = (obj) => Object.values(obj || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalDist = Math.round(sumObj(form.distribuicao));
  const totalDes = Math.round(sumObj(form.distribuicaoDesejada));
  const totalParc = Math.round(sumObj(form.distribuicaoParcelamento));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Distribuição de Meios de Pagamento</h2>
      </div>

      {/* P18 — Já processa? */}
      <div className="space-y-2" data-field="jaProcessa">
        <label className="text-sm font-semibold text-[#002443]">Já processa pagamentos? *</label>
        <ButtonSelector options={JA_PROCESSA_OPTIONS} value={form.jaProcessa} onChange={(v) => updateField('jaProcessa', v)} columns={2} />
        {errors?.jaProcessa && <p className="text-xs text-red-500">Informe se já processa pagamentos</p>}
      </div>

      {/* P19 — Distribuição (%) — se Sim */}
      {jaProcessa && (
        <div className="space-y-2" data-field="distribuicao">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-semibold text-[#002443]">Distribuição atual por meio de pagamento (%) *</label>
            <span className={`text-xs font-bold ${totalDist === 100 ? 'text-[#2bc196]' : 'text-red-600'}`}>
              Soma: {totalDist}% {totalDist === 100 ? '✓' : `(faltam ${100 - totalDist}%)`}
            </span>
          </div>
          <p className="text-xs text-[#002443]/50">Os 4 sliders devem somar 100%</p>
          <SliderDistribution
            values={form.distribuicao || { credito: 0, debito: 0, pix: 0, boleto: 0 }}
            onChange={(v) => updateField('distribuicao', v)}
          />
          {errors?.distribuicao && <p className="text-xs text-red-500">Ajuste os sliders para somar 100%</p>}
        </div>
      )}

      {/* P19.NEW — Distribuição desejada (%) — se Não */}
      {form.jaProcessa === 'Não, estou começando' && (
        <div className="space-y-2" data-field="distribuicaoDesejada">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-semibold text-[#002443]">Distribuição desejada por meio de pagamento (%) *</label>
            <span className={`text-xs font-bold ${totalDes === 100 ? 'text-[#2bc196]' : 'text-red-600'}`}>
              Soma: {totalDes}% {totalDes === 100 ? '✓' : `(faltam ${100 - totalDes}%)`}
            </span>
          </div>
          <p className="text-xs text-[#002443]/50">Como você gostaria de distribuir seus pagamentos?</p>
          <SliderDistribution
            values={form.distribuicaoDesejada || { credito: 0, debito: 0, pix: 0, boleto: 0 }}
            onChange={(v) => updateField('distribuicaoDesejada', v)}
          />
          {errors?.distribuicaoDesejada && <p className="text-xs text-red-500">Ajuste os sliders para somar 100%</p>}
        </div>
      )}

      {/* P21 — Distribuição por faixa de parcelamento (PARA TODOS) */}
      {form.jaProcessa && (
        <div className="space-y-2" data-field="distribuicaoParcelamento">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-semibold text-[#002443]">
              Distribuição de vendas por parcelamento (%) *
            </label>
            <span className={`text-xs font-bold ${totalParc === 100 ? 'text-[#2bc196]' : 'text-red-600'}`}>
              Soma: {totalParc}% {totalParc === 100 ? '✓' : `(faltam ${100 - totalParc}%)`}
            </span>
          </div>
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
          {errors?.distribuicaoParcelamento && <p className="text-xs text-red-500">Ajuste os sliders para somar 100%</p>}
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