import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ButtonSelector from './ButtonSelector';
import {
  MODELO_COBRANCA_OPTIONS, SUB_SELLERS_OPTIONS, PLATAFORMA_OPTIONS,
  ANTIFRAUDE_OPTIONS, ANTIFRAUDE_SEGMENTS, LICENCA_BCB_OPTIONS, SPLIT_PAGAMENTO_OPTIONS,
  TAKE_RATE_OPTIONS, KYC_SUB_SELLERS_OPTIONS, CHURN_OPTIONS, PRICING_SAAS_OPTIONS,
  AFILIADOS_OPTIONS, GARANTIA_OPTIONS, PCT_AFILIADOS_OPTIONS, VERTICAL_OPTIONS,
  TIPO_PRODUTO_ECOMMERCE_OPTIONS, ENTREGA_OPTIONS, POLITICA_DEVOLUCAO_OPTIONS,
  TIPO_PRODUTO_DROP_OPTIONS, ORIGEM_FORNECEDORES_OPTIONS, PRAZO_ENTREGA_OPTIONS,
  TIPO_PRODUTO_LINK_OPTIONS, CANAIS_LINK_OPTIONS,
  TIPO_MPE_OPTIONS, MODALIDADE_CARTAO_OPTIONS
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
      <div className="space-y-2" data-field="modeloCobranca">
        <label className="text-sm font-semibold text-[#002443]">Modelo de Cobrança *</label>
        <ButtonSelector options={MODELO_COBRANCA_OPTIONS} value={form.modeloCobranca} onChange={(v) => updateField('modeloCobranca', v)} columns={4} />
        {errors?.modeloCobranca && <p className="text-xs text-red-500">Selecione o modelo de cobrança</p>}
      </div>

      {/* P11 — Descrição do negócio */}
      <div className="space-y-1" data-field="descricaoNegocio">
        <label className="text-sm font-semibold text-[#002443]">Breve descrição do negócio *</label>
        <Textarea
          value={form.descricaoNegocio || ''}
          onChange={(e) => updateField('descricaoNegocio', e.target.value.slice(0, 500))}
          placeholder="Explique o que sua empresa faz em suas palavras (mín 10, máx 500 caracteres)"
          className={`rounded-xl min-h-[80px] ${errors?.descricaoNegocio ? 'border-red-400' : ''}`}
          maxLength={500}
        />
        <p className="text-[10px] text-[#002443]/40 text-right">{(form.descricaoNegocio || '').length}/500</p>
        {errors?.descricaoNegocio && <p className="text-xs text-red-500">Descreva seu negócio (mín. 10 caracteres)</p>}
      </div>

      {/* P11.1 — Mix de produtos/serviços (NOVO — pergunta aberta detalhada) */}
      <div className="space-y-1" data-field="mixProdutosServicos">
        <div className="rounded-xl border-2 border-[#2bc196]/30 bg-[#2bc196]/5 p-4 space-y-2">
          <label className="text-sm font-bold text-[#002443] flex items-center gap-2">
            <span className="text-base">⭐</span>
            Conte em detalhes o que você vende *
          </label>
          <p className="text-xs text-[#002443]/70 leading-relaxed">
            Descreva o <strong>mix de produtos ou serviços</strong> que processa pagamentos (ex: moda feminina + acessórios; cursos de finanças + mentorias 1:1; suplementos + cosméticos importados; SaaS de gestão para clínicas).
          </p>
          <div className="rounded-lg bg-white border border-[#2bc196]/30 px-3 py-2 text-[11px] text-[#002443]/80 leading-relaxed">
            💡 <strong>Quanto mais detalhe você der aqui, mais sob medida será a sua proposta.</strong> Respostas genéricas como <em>"vendo produtos online"</em> geram apenas <strong>propostas padrão de mercado</strong> — sem otimização de taxas para o seu perfil.
          </div>
          <Textarea
            value={form.mixProdutosServicos || ''}
            onChange={(e) => updateField('mixProdutosServicos', e.target.value.slice(0, 1000))}
            placeholder="Ex: Vendemos moda feminina (vestidos, blusas, calças) + acessórios (bolsas, bijuterias) pelo Instagram e e-commerce próprio. Ticket médio R$ 180. Coleção nova a cada 45 dias. Atendemos todo o Brasil via Correios."
            className={`rounded-xl min-h-[120px] bg-white ${errors?.mixProdutosServicos ? 'border-red-400' : 'border-[#2bc196]/30'}`}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#002443]/40">Mínimo 30 caracteres para uma análise melhor</p>
            <p className="text-[10px] text-[#002443]/40">{(form.mixProdutosServicos || '').length}/1000</p>
          </div>
          {errors?.mixProdutosServicos && (
            <p className="text-xs text-red-500">Descreva com no mínimo 30 caracteres — quanto mais detalhe, melhor a proposta</p>
          )}
        </div>
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

      {/* E-commerce */}
      {seg === 'ecommerce' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">O que vende / tipo de produto *</label>
            <ButtonSelector options={TIPO_PRODUTO_ECOMMERCE_OPTIONS} value={form.tipoProdutoEcommerce} onChange={(v) => updateField('tipoProdutoEcommerce', v)} allowOther otherValue={form.tipoProdutoEcommerceOutro} onOtherChange={(v) => updateField('tipoProdutoEcommerceOutro', v)} columns={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Entrega própria ou terceirizada?</label>
            <ButtonSelector options={ENTREGA_OPTIONS} value={form.modeloEntrega} onChange={(v) => updateField('modeloEntrega', v)} columns={4} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Política de devolução</label>
            <ButtonSelector options={POLITICA_DEVOLUCAO_OPTIONS} value={form.politicaDevolucao} onChange={(v) => updateField('politicaDevolucao', v)} columns={4} />
          </div>
        </>
      )}

      {/* Dropshipping */}
      {seg === 'dropshipping' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">O que vende / tipo de produto *</label>
            <ButtonSelector options={TIPO_PRODUTO_DROP_OPTIONS} value={form.tipoProdutoDrop} onChange={(v) => updateField('tipoProdutoDrop', v)} allowOther otherValue={form.tipoProdutoDropOutro} onOtherChange={(v) => updateField('tipoProdutoDropOutro', v)} columns={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Origem dos fornecedores</label>
            <ButtonSelector options={ORIGEM_FORNECEDORES_OPTIONS} value={form.origemFornecedores} onChange={(v) => updateField('origemFornecedores', v)} columns={4} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Prazo médio de entrega</label>
            <ButtonSelector options={PRAZO_ENTREGA_OPTIONS} value={form.prazoEntrega} onChange={(v) => updateField('prazoEntrega', v)} columns={4} />
          </div>
        </>
      )}

      {/* Link de Pagamento */}
      {seg === 'link_pagamento' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Tipo de produto/serviço *</label>
            <ButtonSelector options={TIPO_PRODUTO_LINK_OPTIONS} value={form.tipoProdutoLink} onChange={(v) => updateField('tipoProdutoLink', v)} allowOther otherValue={form.tipoProdutoLinkOutro} onOtherChange={(v) => updateField('tipoProdutoLinkOutro', v)} columns={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Canais por onde envia o link *</label>
            <p className="text-xs text-[#002443]/50">Selecione todos que se aplicam</p>
            <div className="flex flex-wrap gap-2">
              {CANAIS_LINK_OPTIONS.map(canal => {
                const selected = (form.canaisLink || []).includes(canal);
                return (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => {
                      const current = form.canaisLink || [];
                      const updated = selected ? current.filter(c => c !== canal) : [...current, canal];
                      updateField('canaisLink', updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-[#2bc196]/10 border-[#2bc196] text-[#002443] font-semibold'
                        : 'bg-white border-[#002443]/10 text-[#002443]/60 hover:border-[#002443]/20'
                    }`}
                  >
                    {canal}
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="text"
                value={form.canaisLinkOutro || ''}
                onChange={(e) => updateField('canaisLinkOutro', e.target.value)}
                placeholder="Outros canais (opcional)"
                className="w-full h-10 rounded-xl border border-[#002443]/10 px-4 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {/* MPE */}
      {seg === 'mpe' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Tipo de negócio *</label>
            <ButtonSelector options={TIPO_MPE_OPTIONS} value={form.tipoMpe} onChange={(v) => updateField('tipoMpe', v)} columns={4} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#002443]">O que vende? *</label>
            <Textarea
              value={form.oQueVendeMpe || ''}
              onChange={(e) => updateField('oQueVendeMpe', e.target.value.slice(0, 300))}
              placeholder="Descreva seus produtos ou serviços"
              className="rounded-xl min-h-[60px]"
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#002443]">Aceita cartão presencial, só online, ou ambos?</label>
            <ButtonSelector options={MODALIDADE_CARTAO_OPTIONS} value={form.modalidadeCartao} onChange={(v) => updateField('modalidadeCartao', v)} columns={3} />
          </div>
        </>
      )}
    </div>
  );
}