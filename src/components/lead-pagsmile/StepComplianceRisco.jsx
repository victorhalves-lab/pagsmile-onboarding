import React from 'react';
import ButtonSelector from './ButtonSelector';
import { ENCERRADO_OPTIONS, CHARGEBACK_OPTIONS, MED_PIX_OPTIONS } from './pagsmileQuestionnaireData';

/** ETAPA 9 — Compliance e Risco (P34-P35.1) */
export default function StepComplianceRisco({ form, updateField }) {
  const jaProcessa = form.jaProcessa === 'Sim, já processo';
  const dist = form.distribuicao || {};
  const temCartao = (dist.credito || 0) > 0;
  const temPix = (dist.pix || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Compliance e Risco</h2>
      </div>

      {/* P34 — Já foi encerrado? */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Já foi encerrado por algum processador? *</label>
        <ButtonSelector options={ENCERRADO_OPTIONS} value={form.encerrado} onChange={(v) => updateField('encerrado', v)} columns={3} />
      </div>

      {/* P35 — Chargeback (condicional: já processa + cartão > 0%) */}
      {jaProcessa && temCartao && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Taxa de chargeback atual (%)</label>
          <ButtonSelector options={CHARGEBACK_OPTIONS} value={form.chargeback} onChange={(v) => updateField('chargeback', v)} columns={5} />
        </div>
      )}

      {/* P35.1 — MED PIX (NOVO v5.0 — condicional: PIX > 0%) */}
      {temPix && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Taxa de MED PIX (%)</label>
          <p className="text-xs text-[#002443]/50">MED = Mecanismo Especial de Devolução do Banco Central</p>
          <ButtonSelector options={MED_PIX_OPTIONS} value={form.medPix} onChange={(v) => updateField('medPix', v)} columns={5} />
        </div>
      )}
    </div>
  );
}