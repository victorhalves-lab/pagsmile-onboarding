// =============================================================================
// Doc microscópica do Questionário de Leads V5 (Cartão) — 9 passos
// Dados-fonte: components/lead-pagsmile/pagsmileQuestionnaireData.js
// =============================================================================

import React from 'react';
import { StepBlock, Question, FlagCard, ScoreRule, InfoBox } from './LeadsDocPrimitives';
import {
  SEGMENTS, CARGO_OPTIONS, MODELO_COBRANCA_OPTIONS, SUB_SELLERS_OPTIONS,
  PLATAFORMA_OPTIONS, ANTIFRAUDE_OPTIONS, LICENCA_BCB_OPTIONS, SPLIT_PAGAMENTO_OPTIONS,
  TAKE_RATE_OPTIONS, KYC_SUB_SELLERS_OPTIONS, CHURN_OPTIONS, PRICING_SAAS_OPTIONS,
  AFILIADOS_OPTIONS, GARANTIA_OPTIONS, PCT_AFILIADOS_OPTIONS, VERTICAL_OPTIONS,
  TIPO_PRODUTO_ECOMMERCE_OPTIONS, ENTREGA_OPTIONS, POLITICA_DEVOLUCAO_OPTIONS,
  TIPO_PRODUTO_DROP_OPTIONS, ORIGEM_FORNECEDORES_OPTIONS, PRAZO_ENTREGA_OPTIONS,
  TIPO_PRODUTO_LINK_OPTIONS, CANAIS_LINK_OPTIONS, TIPO_MPE_OPTIONS, MODALIDADE_CARTAO_OPTIONS,
  FATURAMENTO_ANUAL_OPTIONS, FUNCIONARIOS_OPTIONS,
  JA_PROCESSA_OPTIONS, ANTECIPACAO_OPTIONS, SABE_TAXAS_OPTIONS, PROCESSADOR_OPTIONS,
  SATISFACAO_OPTIONS, DOR_ATUAL_OPTIONS,
  ENCERRADO_OPTIONS, CHARGEBACK_OPTIONS, MED_PIX_OPTIONS,
  URGENCIA_OPTIONS, CRESCIMENTO_OPTIONS, COMO_CONHECEU_OPTIONS,
} from '@/components/lead-pagsmile/pagsmileQuestionnaireData';

export default function LeadsV5QuestionnaireDoc() {
  return (
    <div className="space-y-6">
      {/* Visão geral */}
      <InfoBox title="Visão geral do fluxo" tone="info">
        <p>
          Questionário público em <strong>9 passos lineares</strong>, com perguntas adaptativas conforme o segmento escolhido.
          Captura dados de identificação, modelo de negócio, volumetria, processador atual, compliance e fechamento.
          Ao final calcula <strong>Score 0–100</strong> e levanta <strong>16 flags silenciosas</strong>.
        </p>
        <p className="mt-2">
          Rota pública: <code className="bg-white/60 px-1.5 rounded">/QuestionarioLeadsPagsmile</code> · Arquivo:
          <code className="bg-white/60 px-1.5 rounded ml-1">pages/QuestionarioLeadsPagsmile.jsx</code>
        </p>
      </InfoBox>

      {/* Step 1 - Contato */}
      <StepBlock number="1" title="Contato" description="Dados de quem está respondendo o questionário">
        <Question id="nome" label="Nome completo" type="text" required />
        <Question id="email" label="E-mail corporativo" type="email" required hint="E-mail pessoal (gmail, hotmail, etc.) ativa flag PERSONAL_EMAIL" />
        <Question id="telefone" label="Telefone (WhatsApp)" type="phone" required />
        <Question id="cargo" label="Cargo na empresa" type="select" required options={CARGO_OPTIONS} hint="Sócio/CEO/Diretor = +10 pts no score (cargo decisor)" />
      </StepBlock>

      {/* Step 2 - Empresa */}
      <StepBlock number="2" title="Dados da Empresa" description="CNPJ + autocomplete BDC (BrasilAPI fallback)">
        <Question id="cnpj" label="CNPJ" type="cnpj" required hint="Autocomplete BDC: razão social, capital social, data de abertura, CNAE, porte, situação cadastral" />
        <Question id="razaoSocial" label="Razão Social" type="text" required hint="Pré-preenchido via BDC" />
        <Question id="nomeFantasia" label="Nome Fantasia" type="text" />
        <Question id="presencaDigital" label="Presença digital (site/Instagram)" type="text" hint="Vazio ou 'Não possuo' ativa flag NO_WEBSITE" />
      </StepBlock>

      {/* Step 3 - Segmento */}
      <StepBlock number="3" title="Segmento" description="V5.2: 15 segmentos canônicos (10 legados + 5 novos)">
        <Question
          id="segmento"
          label="Em qual segmento sua empresa atua?"
          type="cards"
          required
          options={SEGMENTS.map(s => `${s.label}${s.isNewInV5_2 ? ' ⭐' : ''}`)}
          hint="⭐ = segmento novo introduzido na V5.2. A escolha do segmento dispara o Step 4 condicional."
        />
      </StepBlock>

      {/* Step 4 - Modelo de Negócio (condicional por segmento) */}
      <StepBlock number="4" title="Modelo de Negócio" description="Perguntas adaptativas conforme o segmento">
        <Question id="qtdSubSellers" label="Quantos sub-sellers/merchants você processa?" type="select" options={SUB_SELLERS_OPTIONS} condition="segmento ∈ {gateway, marketplace, plataforma_vertical}" />
        <Question id="modeloCobranca" label="Modelo de cobrança principal" type="select" options={MODELO_COBRANCA_OPTIONS} />
        <Question id="antifraude" label="Estratégia antifraude" type="select" options={ANTIFRAUDE_OPTIONS} condition="segmento ∈ {gateway, marketplace, plataforma_vertical, ecommerce, dropshipping, infoprodutos}" hint="'Não possuo' + TPV>100k + e-com/drop ativa flag NO_ANTIFRAUDE" />

        <InfoBox title="Gateway" tone="info">
          <Question id="licencaBcb" label="Possui licença BCB?" type="select" options={LICENCA_BCB_OPTIONS} />
          <Question id="splitPagamento" label="Faz split de pagamento?" type="select" options={SPLIT_PAGAMENTO_OPTIONS} />
        </InfoBox>

        <InfoBox title="Marketplace" tone="info">
          <Question id="takeRate" label="Take rate aplicado" type="select" options={TAKE_RATE_OPTIONS} />
          <Question id="kycSubSellers" label="KYC dos sub-sellers" type="select" options={KYC_SUB_SELLERS_OPTIONS} />
        </InfoBox>

        <InfoBox title="SaaS" tone="info">
          <Question id="churnSaas" label="Churn mensal" type="select" options={CHURN_OPTIONS} />
          <Question id="pricingSaas" label="Modelo de pricing" type="select" options={PRICING_SAAS_OPTIONS} />
        </InfoBox>

        <InfoBox title="Infoprodutos" tone="info">
          <Question id="afiliados" label="Programa de afiliados" type="select" options={AFILIADOS_OPTIONS} />
          <Question id="pctAfiliados" label="% das vendas via afiliados" type="select" options={PCT_AFILIADOS_OPTIONS} />
          <Question id="garantia" label="Política de garantia" type="select" options={GARANTIA_OPTIONS} hint="'30 dias' ou 'condicional' ativa flag HIGH_REFUND_POLICY" />
          <Question id="plataformaInfo" label="Plataforma usada" type="select" options={PLATAFORMA_OPTIONS.infoprodutos} />
        </InfoBox>

        <InfoBox title="E-commerce" tone="info">
          <Question id="tipoProdutoEcom" label="Tipo de produto" type="select" options={TIPO_PRODUTO_ECOMMERCE_OPTIONS} />
          <Question id="entrega" label="Logística de entrega" type="select" options={ENTREGA_OPTIONS} />
          <Question id="politicaDevolucao" label="Política de devolução" type="select" options={POLITICA_DEVOLUCAO_OPTIONS} />
          <Question id="plataformaEcom" label="Plataforma e-commerce" type="select" options={PLATAFORMA_OPTIONS.ecommerce} />
        </InfoBox>

        <InfoBox title="Dropshipping" tone="info">
          <Question id="tipoProdutoDrop" label="Tipo de produto" type="select" options={TIPO_PRODUTO_DROP_OPTIONS} />
          <Question id="origemFornecedores" label="Origem dos fornecedores" type="select" options={ORIGEM_FORNECEDORES_OPTIONS} />
          <Question id="prazoEntrega" label="Prazo de entrega" type="select" options={PRAZO_ENTREGA_OPTIONS} />
        </InfoBox>

        <InfoBox title="Plataforma Vertical" tone="info">
          <Question id="verticalEspecifica" label="Qual vertical?" type="select" options={VERTICAL_OPTIONS} />
          <Question id="plataformaVertical" label="Plataforma" type="select" options={PLATAFORMA_OPTIONS.plataforma_vertical} />
        </InfoBox>

        <InfoBox title="Link de Pagamento" tone="info">
          <Question id="tipoProdutoLink" label="Tipo de produto/serviço" type="select" options={TIPO_PRODUTO_LINK_OPTIONS} />
          <Question id="canaisLink" label="Canais de divulgação" type="multiselect" options={CANAIS_LINK_OPTIONS} />
        </InfoBox>

        <InfoBox title="MPE" tone="info">
          <Question id="tipoMpe" label="Tipo de MPE" type="select" options={TIPO_MPE_OPTIONS} />
          <Question id="modalidadeCartao" label="Como aceita cartão" type="select" options={MODALIDADE_CARTAO_OPTIONS} />
        </InfoBox>
      </StepBlock>

      {/* Step 5 - Volumetria */}
      <StepBlock number="5" title="Volumetria" description="TPV mensal + ticket médio + faturamento anual">
        <Question id="tpvMensal" label="TPV mensal estimado (R$)" type="currency" required hint="TPV≥200k = +10 pts. (TPV × 12) > faturamento ativa flag TPV_EXCEEDS_REVENUE" />
        <Question id="ticketMedio" label="Ticket médio (R$)" type="currency" required hint="Ticket < R$10 ativa flag LOW_TICKET" />
        <Question id="faturamentoAnual" label="Faturamento anual" type="select" required options={FATURAMENTO_ANUAL_OPTIONS} />
        <Question id="funcionarios" label="Quantidade de funcionários" type="select" options={FUNCIONARIOS_OPTIONS} />
      </StepBlock>

      {/* Step 6 - Mix Operação */}
      <StepBlock number="6" title="Mix de Operação" description="Distribuição entre meios de pagamento">
        <Question id="mixCredito" label="% Crédito" type="slider" hint="Soma Crédito+Débito+Pix+Boleto = 100%" />
        <Question id="mixDebito" label="% Débito" type="slider" />
        <Question id="mixPix" label="% Pix" type="slider" />
        <Question id="mixBoleto" label="% Boleto" type="slider" />
      </StepBlock>

      {/* Step 7 - Processador Atual */}
      <StepBlock number="7" title="Processador Atual" description="Diagnóstico do que o lead já usa hoje">
        <Question id="jaProcessa" label="Já processa cartão?" type="select" required options={JA_PROCESSA_OPTIONS} hint="'Não, estou começando' ativa flag NEW_MERCHANT" />
        <Question id="processadorAtual" label="Qual processador usa?" type="select" options={PROCESSADOR_OPTIONS} condition="jaProcessa = 'Sim'" />
        <Question id="satisfacao" label="Satisfação com o atual" type="select" options={SATISFACAO_OPTIONS} condition="jaProcessa = 'Sim'" hint="Insatisfeito/Muito Insatisfeito = +5 pts" />
        <Question id="dorAtual" label="Principal dor com o atual" type="multiselect" options={DOR_ATUAL_OPTIONS} condition="jaProcessa = 'Sim'" />
        <Question id="usaAntecipacao" label="Usa antecipação?" type="select" options={ANTECIPACAO_OPTIONS} condition="jaProcessa = 'Sim'" />
        <Question id="sabeTaxas" label="Conhece as taxas atuais?" type="select" options={SABE_TAXAS_OPTIONS} condition="jaProcessa = 'Sim'" />
      </StepBlock>

      {/* Step 8 - Compliance & Risco */}
      <StepBlock number="8" title="Compliance & Risco" description="Histórico operacional do lead">
        <Question id="encerrado" label="Já teve conta encerrada por adquirente?" type="select" required options={ENCERRADO_OPTIONS} hint="≠ Nunca ativa flag TERMINATED_BEFORE (-15 pts)" />
        <Question id="chargeback" label="Taxa de chargeback atual" type="select" options={CHARGEBACK_OPTIONS} hint="'>2%' ativa flag HIGH_CHARGEBACK (-10 pts)" />
        <Question id="medPix" label="MED Pix (Mecanismo Especial de Devolução)" type="select" options={MED_PIX_OPTIONS} hint="'>1%' ativa flag HIGH_MED_PIX (-10 pts)" />
      </StepBlock>

      {/* Step 9 - Fechamento */}
      <StepBlock number="9" title="Fechamento" description="Intenção de compra + atribuição">
        <Question id="urgencia" label="Qual a urgência?" type="select" required options={URGENCIA_OPTIONS} hint="'Imediato' = +15 pts | 'Apenas cotando' = -5 pts (JUST_QUOTING)" />
        <Question id="crescimento" label="Expectativa de crescimento" type="select" options={CRESCIMENTO_OPTIONS} hint="'Mais que dobrar' = +5 pts" />
        <Question id="comoConheceu" label="Como conheceu a Pagsmile?" type="select" options={COMO_CONHECEU_OPTIONS} />
        <Question id="observacoes" label="Observações finais" type="textarea" />
      </StepBlock>

      {/* SCORE 0-100 */}
      <div className="bg-white border-2 border-[#002443] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#002443] mb-3">📊 Cálculo do Lead Score (0–100)</h3>
        <p className="text-xs text-[#002443]/70 mb-4">Score inicial = <strong>40</strong>. Aplicam-se bônus e penalidades.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 mb-2 uppercase tracking-wide">Bônus</div>
            <div className="space-y-1.5">
              <ScoreRule condition="E-mail corporativo (≠ gmail/hotmail/etc.)" points={10} />
              <ScoreRule condition="Cargo decisor (Sócio/CEO/Diretor)" points={10} />
              <ScoreRule condition="TPV mensal ≥ R$ 200.000" points={10} />
              <ScoreRule condition="Sub-sellers > 1.000 (1k-5k ou >5k)" points={5} />
              <ScoreRule condition="Urgência: Imediato (<1 semana)" points={15} />
              <ScoreRule condition="Crescimento: Mais que dobrar (>100%)" points={5} />
              <ScoreRule condition="Insatisfeito com o atual" points={5} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-700 mb-2 uppercase tracking-wide">Penalidades</div>
            <div className="space-y-1.5">
              <ScoreRule condition="Conta encerrada antes (TERMINATED_BEFORE)" points={-15} type="penalty" />
              <ScoreRule condition="Chargeback >2% (HIGH_CHARGEBACK)" points={-10} type="penalty" />
              <ScoreRule condition="MED Pix >1% (HIGH_MED_PIX)" points={-10} type="penalty" />
              <ScoreRule condition="Política de garantia ampla (HIGH_REFUND_POLICY)" points={-5} type="penalty" />
              <ScoreRule condition="Apenas cotando (JUST_QUOTING)" points={-5} type="penalty" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#002443]/10 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="bg-red-50 rounded p-2"><div className="text-xs font-bold text-red-700">Muito Quente</div><div className="text-[11px] text-red-600">≥ 80</div></div>
          <div className="bg-orange-50 rounded p-2"><div className="text-xs font-bold text-orange-700">Quente</div><div className="text-[11px] text-orange-600">60–79</div></div>
          <div className="bg-yellow-50 rounded p-2"><div className="text-xs font-bold text-yellow-700">Morno</div><div className="text-[11px] text-yellow-600">40–59</div></div>
          <div className="bg-blue-50 rounded p-2"><div className="text-xs font-bold text-blue-700">Frio</div><div className="text-[11px] text-blue-600">&lt; 40</div></div>
        </div>
      </div>

      {/* FLAGS SILENCIOSAS */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#002443] mb-1">🚩 16 Flags Silenciosas</h3>
        <p className="text-xs text-[#002443]/70 mb-4">Levantadas em background. <strong>Não aparecem para o lead</strong>, só no painel interno.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FlagCard code="PERSONAL_EMAIL" name="E-mail pessoal" description="Domínio gmail/hotmail/outlook/etc." />
          <FlagCard code="NO_WEBSITE" name="Sem presença digital" description="Não tem site, Instagram ou marca a opção 'Não possuo'" />
          <FlagCard code="NO_ANTIFRAUDE" name="Sem antifraude" description="E-commerce/drop com TPV>100k sem antifraude declarado" />
          <FlagCard code="HIGH_CHARGEBACK" name="Chargeback crítico" description="Taxa de chargeback declarada >2%" penalty="-10 pts" />
          <FlagCard code="HIGH_MED_PIX" name="MED Pix crítico" description="MED Pix declarado >1%" penalty="-10 pts" />
          <FlagCard code="TERMINATED_BEFORE" name="Encerrado antes" description="Já teve conta encerrada por adquirente" penalty="-15 pts" />
          <FlagCard code="TPV_EXCEEDS_REVENUE" name="TPV > Faturamento" description="(TPV × 12) maior que faturamento anual declarado" />
          <FlagCard code="NEW_MERCHANT" name="Merchant novo" description="Lead declara que está começando a processar agora" />
          <FlagCard code="CNPJ_SITUACAO_IRREGULAR" name="CNPJ irregular" description="BDC retorna situação cadastral ≠ Ativa" />
          <FlagCard code="EMPRESA_NOVA" name="Empresa muito nova" description="Abertura há menos de 6 meses (BDC data_abertura)" />
          <FlagCard code="SETOR_REGULADO" name="Setor regulado" description="CNAE da divisão 64/65/66 (financeiro/seguros)" />
          <FlagCard code="CNAE_MISMATCH" name="CNAE incoerente" description="Segmento declarado não bate com CNAE principal" />
          <FlagCard code="VOLUME_INCOMPATIVEL" name="Volume incompatível" description="Porte declarado vs volume informado" />
          <FlagCard code="JUST_QUOTING" name="Apenas cotando" description="Urgência: 'Estou apenas cotando'" penalty="-5 pts" />
          <FlagCard code="LOW_TICKET" name="Ticket muito baixo" description="Ticket médio < R$ 10" />
          <FlagCard code="HIGH_REFUND_POLICY" name="Política de devolução ampla" description="Garantia 30 dias ou condicional" penalty="-5 pts" />
        </div>
      </div>
    </div>
  );
}