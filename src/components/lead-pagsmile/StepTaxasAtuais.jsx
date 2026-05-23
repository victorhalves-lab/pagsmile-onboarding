import React from 'react';
import CurrencyNumberInput from './CurrencyNumberInput';
import ComprovantesUpload from './ComprovantesUpload';
import { Info } from 'lucide-react';

/** ETAPA 7 — Taxas Atuais (obrigatórias se já processa). Upload de comprovantes SEMPRE visível. */
export default function StepTaxasAtuais({ form, updateField, errors = {} }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';

  // Quando NÃO processa, mostra só o upload (caso tenha proposta de outro player)
  if (!jaProcessa) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#002443]">Comprovantes de Outros Processadores</h2>
          <p className="text-xs text-[#002443]/50 mt-1">
            Mesmo não processando hoje, se você tem propostas de outros players em mãos, pode anexá-las aqui.
          </p>
        </div>
        <ComprovantesUpload
          value={form.comprovantesTaxas || []}
          onChange={(v) => updateField('comprovantesTaxas', v)}
        />
      </div>
    );
  }

  const dist = form.distribuicao || {};
  const temPix = (dist.pix || 0) > 0;
  const temBoleto = (dist.boleto || 0) > 0;
  const temCartao = (dist.credito || 0) > 0 || (dist.debito || 0) > 0;

  const fieldLabel = (label, fieldName) => (
    <label className={`text-xs font-semibold ${errors[fieldName] ? 'text-red-500' : 'text-[#002443]'}`}>
      {label} *
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Suas Taxas Atuais</h2>
      </div>

      {/* Texto motivacional */}
      <div className="flex items-start gap-3 bg-[#2bc196]/10 border border-[#2bc196]/20 rounded-xl p-4">
        <Info className="w-5 h-5 text-[#2bc196] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#002443]/80">
          <strong>Informe suas taxas atuais</strong> para que possamos montar uma proposta mais competitiva e garantir condições melhores do que você paga hoje. Todos os campos são obrigatórios.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* MDR Crédito */}
        {temCartao && (
          <>
            <div className="space-y-1">
              {fieldLabel('MDR Crédito à Vista (%)', 'mdrAvista')}
              <CurrencyNumberInput value={form.mdrAvista} onChange={(v) => updateField('mdrAvista', v)} placeholder="3.29" prefix="%" suffix="" />
            </div>
            <div className="space-y-1">
              {fieldLabel('MDR Crédito 2-6x (%)', 'mdr2a6x')}
              <CurrencyNumberInput value={form.mdr2a6x} onChange={(v) => updateField('mdr2a6x', v)} placeholder="3.99" prefix="%" />
            </div>
            <div className="space-y-1">
              {fieldLabel('MDR Crédito 7-12x (%)', 'mdr7a12x')}
              <CurrencyNumberInput value={form.mdr7a12x} onChange={(v) => updateField('mdr7a12x', v)} placeholder="4.49" prefix="%" />
            </div>
            <div className="space-y-1">
              {fieldLabel('MDR Débito (%)', 'mdrDebito')}
              <CurrencyNumberInput value={form.mdrDebito} onChange={(v) => updateField('mdrDebito', v)} placeholder="1.99" prefix="%" />
            </div>
          </>
        )}

        {/* Taxa PIX */}
        {temPix && (
          <div className="space-y-1">
            {fieldLabel('Taxa PIX (% ou R$)', 'taxaPix')}
            <CurrencyNumberInput value={form.taxaPix} onChange={(v) => updateField('taxaPix', v)} placeholder="0.99" prefix="" />
          </div>
        )}

        {/* Taxa Boleto */}
        {temBoleto && (
          <div className="space-y-1">
            {fieldLabel('Taxa Boleto (R$)', 'taxaBoleto')}
            <CurrencyNumberInput value={form.taxaBoleto} onChange={(v) => updateField('taxaBoleto', v)} placeholder="3.49" />
          </div>
        )}

        {/* Taxa Antecipação — sempre obrigatória */}
        <div className="space-y-1">
          {fieldLabel('Taxa Antecipação (% a.m.)', 'taxaAntecipacao')}
          <CurrencyNumberInput value={form.taxaAntecipacao} onChange={(v) => updateField('taxaAntecipacao', v)} placeholder="1.69" prefix="%" />
        </div>

        {/* Fee por transação */}
        <div className="space-y-1">
          {fieldLabel('Fee por transação (R$)', 'feeTransacao')}
          <CurrencyNumberInput value={form.feeTransacao} onChange={(v) => updateField('feeTransacao', v)} placeholder="0.39" />
        </div>

        {/* Custo antifraude — sempre obrigatório */}
        <div className="space-y-1">
          {fieldLabel('Custo antifraude (R$)', 'custoAntifraude')}
          <CurrencyNumberInput value={form.custoAntifraude} onChange={(v) => updateField('custoAntifraude', v)} placeholder="0.39" />
        </div>

        {/* Taxa 3DS — sempre obrigatória */}
        <div className="space-y-1">
          {fieldLabel('Taxa 3DS (R$)', 'taxa3ds')}
          <CurrencyNumberInput value={form.taxa3ds} onChange={(v) => updateField('taxa3ds', v)} placeholder="0.45" />
        </div>
      </div>

      {/* Upload de comprovantes — sempre visível, opcional */}
      <ComprovantesUpload
        value={form.comprovantesTaxas || []}
        onChange={(v) => updateField('comprovantesTaxas', v)}
      />
    </div>
  );
}