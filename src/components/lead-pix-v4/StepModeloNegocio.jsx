import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ButtonSelector from './ButtonSelector';
import {
  SEGMENTO_MERCHANT_OPTIONS, SEGMENTO_INTERMEDIARIO_OPTIONS,
  MODELO_COBRANCA_PIX_OPTIONS, QTD_MERCHANTS_OPTIONS, FINALIDADE_CONTA_OPTIONS
} from './pixQuestionnaireData';

export default function StepModeloNegocio({ form, updateField, errors }) {
  const isMerchant = form.tipoNegocio === 'merchant';
  const isIntermediario = form.tipoNegocio === 'intermediario';
  const segmentoOptions = isMerchant ? SEGMENTO_MERCHANT_OPTIONS : SEGMENTO_INTERMEDIARIO_OPTIONS;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#002443]">Modelo de Negócio</h2>

      <div>
        <Label className="text-xs mb-2 block">Segmento *</Label>
        <ButtonSelector options={segmentoOptions} value={form.segmentoPix} onChange={v => updateField('segmentoPix', v)} columns={isMerchant ? 4 : 3} />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Modelo de Cobrança PIX *</Label>
        <ButtonSelector options={MODELO_COBRANCA_PIX_OPTIONS} value={form.modeloCobrancaPix} onChange={v => updateField('modeloCobrancaPix', v)} columns={2} />
      </div>

      <div>
        <Label className="text-xs">Breve descrição do negócio *</Label>
        <Textarea
          value={form.descricaoNegocio || ''}
          onChange={e => updateField('descricaoNegocio', e.target.value)}
          placeholder="Descreva brevemente o que sua empresa faz..."
          maxLength={500}
          rows={3}
          className="text-xs"
        />
        <p className="text-[10px] text-[#002443]/40 text-right">{(form.descricaoNegocio || '').length}/500</p>
      </div>

      {isIntermediario && (
        <div>
          <Label className="text-xs mb-2 block">Quantos merchants/sellers recebem PIX via sua plataforma?</Label>
          <ButtonSelector options={QTD_MERCHANTS_OPTIONS} value={form.qtdMerchants} onChange={v => updateField('qtdMerchants', v)} columns={5} />
        </div>
      )}

      <div>
        <Label className="text-xs mb-2 block">Finalidade da conta PIX na PagSmile *</Label>
        <ButtonSelector options={FINALIDADE_CONTA_OPTIONS} value={form.finalidadeConta} onChange={v => updateField('finalidadeConta', v)} columns={1} />
      </div>
    </div>
  );
}