import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ButtonSelector from './ButtonSelector';
import {
  MODELO_COBRANCA_OPTIONS, SUB_SELLERS_OPTIONS, PLATAFORMA_OPTIONS,
  ANTIFRAUDE_OPTIONS, ANTIFRAUDE_SEGMENTS, LICENCA_BCB_OPTIONS, SPLIT_PAGAMENTO_OPTIONS,
  TAKE_RATE_OPTIONS, KYC_SUB_SELLERS_OPTIONS, CHURN_OPTIONS, PRICING_SAAS_OPTIONS,
  AFILIADOS_OPTIONS, GARANTIA_OPTIONS, PCT_AFILIADOS_OPTIONS, VERTICAL_OPTIONS
} from './pagsmileQuestionnaireData';

/** ETAPA 4 — Modelo de Negócio (P10-P14) + Condicionais (P12G-P12V) */
export default function StepModeloNegocio({ form, updateField, errors }) {
  const seg = form.segmento;
  const isIntermediario = ['gateway', 'marketplace', 'plataforma_vertical'].includes(seg);
  const showPlataforma = ['ecommerce', 'dropshipping', 'plataforma_vertical', 'infoprodutos'].includes(seg);
  const showAntifraude = ANTIFRAUDE_SEGMENTS.includes(seg);
  const plataformaOpts = PLATAFORMA_OPTIONS[seg] || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Modelo de Negócio</h2>
      </div>

      {/* P10 — Modelo de Cobrança */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#002443]">Modelo de Cobrança *</label>
        <ButtonSelector options={MODELO_COBRANCA_OPTIONS} value={form.modeloCobranca} onChange={(v) => updateField('modeloCobranca', v)} columns={4} />
      </div>

      {/* P11 — Descrição do negócio */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Breve descrição do negócio *</label>
        <Textarea
          value={form.descricaoNegocio || ''}
          onChange={(e) => updateField('descricaoNegocio', e.target.value.slice(0, 500))}
          placeholder="Explique o que sua empresa faz em suas palavras (máx 500 caracteres)"
          className="rounded-xl min-h-[80px]"
          maxLength={500}
        />
        <p className="text-[10px] text-[#002443]/40 text-right">{(form.descricaoNegocio || '').length}/500</p>
      </div>

      {/* P12 — Qtd sub-sellers (condicional: intermediários) */}
      {isIntermediario && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Quantidade de sub-sellers/merchants</label>
          <ButtonSelector options={SUB_SELLERS_OPTIONS} value={form.qtdSubSellers} onChange={(v) => updateField('qtdSubSellers', v)} columns={5} />
        </div>
      )}

      {/* P13 — Plataforma (condicional) */}
      {showPlataforma && plataformaOpts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">
            {seg === 'infoprodutos' ? 'Plataforma de infoprodutos' : seg === 'plataforma_vertical' ? 'Plataforma / PDV' : 'Plataforma e-commerce'}
          </label>
          <ButtonSelector options={plataformaOpts} value={form.plataforma} onChange={(v) => updateField('plataforma', v)} />
        </div>
      )}

      {/* P14 — Antifraude / 3DS (condicional) */}
      {showAntifraude && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Antifraude / 3DS</label>
          <ButtonSelector options={ANTIFRAUDE_OPTIONS} value={form.antifraude} onChange={(v) => updateField('antifraude', v)} columns={4} />
        </div>
      )}

      {/* === CONDICIONAIS DINÂMICAS POR SEGMENTO (v5.0) === */}

      {/* Gateway */}
      {seg === 'gateway' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Possui licença BCB ou opera via BaaS?</label>
            <ButtonSelector options={LICENCA_BCB_OPTIONS} value={form.licencaBCB} onChange={(v) => updateField('licencaBCB', v)} columns={4} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Faz split de pagamento?</label>
            <ButtonSelector options={SPLIT_PAGAMENTO_OPTIONS} value={form.splitPagamento} onChange={(v) => updateField('splitPagamento', v)} columns={3} />
          </div>
        </>
      )}

      {/* Marketplace */}
      {seg === 'marketplace' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Qual é a take rate média (%)?</label>
            <ButtonSelector options={TAKE_RATE_OPTIONS} value={form.takeRate} onChange={(v) => updateField('takeRate', v)} columns={5} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">KYC de sub-sellers?</label>
            <ButtonSelector options={KYC_SUB_SELLERS_OPTIONS} value={form.kycSubSellers} onChange={(v) => updateField('kycSubSellers', v)} columns={4} />
          </div>
        </>
      )}

      {/* SaaS */}
      {seg === 'saas' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Churn mensal médio (%)</label>
            <ButtonSelector options={CHURN_OPTIONS} value={form.churn} onChange={(v) => updateField('churn', v)} columns={5} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Modelo de pricing</label>
            <ButtonSelector options={PRICING_SAAS_OPTIONS} value={form.pricingSaas} onChange={(v) => updateField('pricingSaas', v)} columns={5} />
          </div>
        </>
      )}

      {/* Infoprodutos */}
      {seg === 'infoprodutos' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Modelo de afiliados</label>
            <ButtonSelector options={AFILIADOS_OPTIONS} value={form.modeloAfiliados} onChange={(v) => updateField('modeloAfiliados', v)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Política de garantia/reembolso</label>
            <ButtonSelector options={GARANTIA_OPTIONS} value={form.garantia} onChange={(v) => updateField('garantia', v)} columns={5} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">% do faturamento vindo de afiliados</label>
            <ButtonSelector options={PCT_AFILIADOS_OPTIONS} value={form.pctAfiliados} onChange={(v) => updateField('pctAfiliados', v)} columns={4} />
          </div>
        </>
      )}

      {/* Plataforma Vertical */}
      {seg === 'plataforma_vertical' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#002443]">Vertical principal</label>
          <ButtonSelector options={VERTICAL_OPTIONS} value={form.verticalPrincipal} onChange={(v) => updateField('verticalPrincipal', v)} allowOther otherValue={form.verticalOutro} onOtherChange={(v) => updateField('verticalOutro', v)} columns={3} />
        </div>
      )}
    </div>
  );
}