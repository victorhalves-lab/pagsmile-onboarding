import React from 'react';
import ButtonSelector from './ButtonSelector';
import CurrencyNumberInput from './CurrencyNumberInput';
import { SABE_TAXAS_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 7 — Taxas Atuais (P21-P30) */
export default function StepTaxasAtuais({ form, updateField }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';
  if (!jaProcessa) return null;

  const sabeTaxas = form.sabeTaxas === 'Sim, sei exatamente' || form.sabeTaxas === 'Sei mais ou menos';
  const dist = form.distribuicao || {};
  const temPix = (dist.pix || 0) > 0;
  const temBoleto = (dist.boleto || 0) > 0;
  const temCartao = (dist.credito || 0) > 0 || (dist.debito || 0) > 0;
  const usaAntecipacao = form.antecipacao?.startsWith('Sim');
  const temAntifraude = form.antifraude && form.antifraude !== 'Não possuo';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Taxas Atuais</h2>
      </div>

      {/* P21 — Sabe taxas? */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Sabe suas taxas atuais?</label>
        <ButtonSelector options={SABE_TAXAS_OPTIONS} value={form.sabeTaxas} onChange={(v) => updateField('sabeTaxas', v)} columns={3} />
      </div>

      {sabeTaxas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* P22-P24 — MDR Crédito */}
          {temCartao && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#002443]">MDR Crédito à Vista (%)</label>
                <CurrencyNumberInput value={form.mdrAvista} onChange={(v) => updateField('mdrAvista', v)} placeholder="3.29" prefix="%" suffix="" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#002443]">MDR Crédito 2-6x (%)</label>
                <CurrencyNumberInput value={form.mdr2a6x} onChange={(v) => updateField('mdr2a6x', v)} placeholder="3.99" prefix="%" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#002443]">MDR Crédito 7-12x (%)</label>
                <CurrencyNumberInput value={form.mdr7a12x} onChange={(v) => updateField('mdr7a12x', v)} placeholder="4.49" prefix="%" />
              </div>
              {/* P25 — Débito */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#002443]">MDR Débito (%)</label>
                <CurrencyNumberInput value={form.mdrDebito} onChange={(v) => updateField('mdrDebito', v)} placeholder="1.99" prefix="%" />
              </div>
            </>
          )}

          {/* P26 — Taxa PIX */}
          {temPix && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#002443]">Taxa PIX (% ou R$)</label>
              <CurrencyNumberInput value={form.taxaPix} onChange={(v) => updateField('taxaPix', v)} placeholder="0.99" prefix="" />
            </div>
          )}

          {/* P27 — Taxa Boleto */}
          {temBoleto && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#002443]">Taxa Boleto (R$)</label>
              <CurrencyNumberInput value={form.taxaBoleto} onChange={(v) => updateField('taxaBoleto', v)} placeholder="3.49" />
            </div>
          )}

          {/* P28 — Taxa Antecipação */}
          {usaAntecipacao && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#002443]">Taxa Antecipação (% a.m.)</label>
              <CurrencyNumberInput value={form.taxaAntecipacao} onChange={(v) => updateField('taxaAntecipacao', v)} placeholder="1.69" prefix="%" />
            </div>
          )}

          {/* P29 — Fee por transação */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#002443]">Fee por transação (R$)</label>
            <CurrencyNumberInput value={form.feeTransacao} onChange={(v) => updateField('feeTransacao', v)} placeholder="0.39" />
          </div>

          {/* P30 — Custo antifraude */}
          {temAntifraude && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#002443]">Custo antifraude (R$)</label>
              <CurrencyNumberInput value={form.custoAntifraude} onChange={(v) => updateField('custoAntifraude', v)} placeholder="0.39" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}