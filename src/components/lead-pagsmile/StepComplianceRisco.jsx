import React from 'react';
import ButtonSelector from './ButtonSelector';
import { ENCERRADO_OPTIONS } from './pagsmileQuestionnaireData';
import { CHARGEBACK_FAIXAS, MED_PIX_FAIXAS } from './productsCatalog';

/**
 * ETAPA — Compliance e Risco
 * Chargeback e MED PIX são SEMPRE visíveis e obrigatórios.
 * Cliente pode marcar checkbox "Não processo cartão" / "Não processo PIX" para pular.
 */
export default function StepComplianceRisco({ form, updateField, errors = {} }) {
  const naoProcessaCartao = !!form.naoProcessaCartao;
  const naoProcessaPix = !!form.naoProcessaPix;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Compliance e Risco</h2>
      </div>

      {/* P34 — Já foi encerrado? */}
      <div className="space-y-2" data-field="encerrado">
        <label className="text-sm font-semibold text-[#002443]">Já foi encerrado por algum processador? *</label>
        <ButtonSelector options={ENCERRADO_OPTIONS} value={form.encerrado} onChange={(v) => updateField('encerrado', v)} columns={3} />
        {errors?.encerrado && <p className="text-xs text-red-500">Campo obrigatório</p>}
      </div>

      {/* Chargeback — SEMPRE VISÍVEL com checkbox de exceção */}
      <div className="space-y-3" data-field="chargeback">
        <label className="text-sm font-semibold text-[#002443]">Qual sua taxa de chargeback atual? *</label>
        {!naoProcessaCartao && (
          <ButtonSelector
            options={CHARGEBACK_FAIXAS}
            value={form.chargeback}
            onChange={(v) => updateField('chargeback', v)}
            columns={3}
          />
        )}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={naoProcessaCartao}
            onChange={(e) => {
              updateField('naoProcessaCartao', e.target.checked);
              if (e.target.checked) updateField('chargeback', '');
            }}
            className="w-4 h-4 rounded border-[#002443]/30 text-[#2bc196] focus:ring-[#2bc196]"
          />
          <span className="text-xs text-[#002443]/70">Não processo pagamento de cartão</span>
        </label>
        {errors?.chargeback && (
          <p className="text-xs text-red-500">Informe a taxa de chargeback ou marque "Não processo cartão"</p>
        )}
      </div>

      {/* MED PIX — SEMPRE VISÍVEL com checkbox de exceção */}
      <div className="space-y-3" data-field="medPix">
        <label className="text-sm font-semibold text-[#002443]">Qual sua taxa de MED PIX atual? *</label>
        <p className="text-xs text-[#002443]/50">MED = Mecanismo Especial de Devolução do Banco Central</p>
        {!naoProcessaPix && (
          <ButtonSelector
            options={MED_PIX_FAIXAS}
            value={form.medPix}
            onChange={(v) => updateField('medPix', v)}
            columns={4}
          />
        )}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={naoProcessaPix}
            onChange={(e) => {
              updateField('naoProcessaPix', e.target.checked);
              if (e.target.checked) updateField('medPix', '');
            }}
            className="w-4 h-4 rounded border-[#002443]/30 text-[#2bc196] focus:ring-[#2bc196]"
          />
          <span className="text-xs text-[#002443]/70">Não processo PIX</span>
        </label>
        {errors?.medPix && (
          <p className="text-xs text-red-500">Informe a taxa de MED PIX ou marque "Não processo PIX"</p>
        )}
      </div>
    </div>
  );
}