// =============================================================================
// Doc microscópica do Questionário de Leads Pix V4 — 7 passos
// Dados-fonte: components/lead-pix-v4/pixQuestionnaireData.js
// =============================================================================

import React from 'react';
import { StepBlock, Question, FlagCard, ScoreRule, InfoBox } from './LeadsDocPrimitives';
import {
  TIPO_NEGOCIO_OPTIONS, SEGMENTO_MERCHANT_OPTIONS, SEGMENTO_INTERMEDIARIO_OPTIONS,
  CARGO_OPTIONS, MODELO_COBRANCA_PIX_OPTIONS, QTD_MERCHANTS_OPTIONS,
  FINALIDADE_CONTA_OPTIONS, HORARIO_PIX_OPTIONS, TEMPO_USO_OPTIONS,
  CUSTO_PIX_OPTIONS, MOTIVO_BUSCA_OPTIONS, SERVICOS_PIX_OPTIONS,
  URGENCIA_OPTIONS, COMO_CONHECEU_OPTIONS,
} from '@/components/lead-pix-v4/pixQuestionnaireData';

export default function LeadsPixV4QuestionnaireDoc() {
  return (
    <div className="space-y-6">
      <InfoBox title="Visão geral do fluxo" tone="info">
        <p>
          Questionário público em <strong>7 passos lineares</strong>, com primeiro fork crítico entre
          <strong> Merchant Direto</strong> (recebe Pix em nome próprio) e <strong>Intermediário</strong>
          (faz split/repasse para terceiros). Captura volumetria PIX, finalidade da conta, dores e fechamento.
          Calcula <strong>Score 0–100</strong> e <strong>11 flags silenciosas</strong>.
        </p>
        <p className="mt-2">
          Rota pública: <code className="bg-white/60 px-1.5 rounded">/LeadPixV4</code> · Arquivo:
          <code className="bg-white/60 px-1.5 rounded ml-1">pages/LeadPixV4.jsx</code>
        </p>
      </InfoBox>

      {/* Step 1 - Tipo de Negócio */}
      <StepBlock number="1" title="Tipo de Negócio" description="Primeiro fork — define todo o restante do fluxo">
        {TIPO_NEGOCIO_OPTIONS.map((t) => (
          <div key={t.id} className="bg-[#f4f4f4] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{t.icon}</span>
              <strong className="text-sm text-[#002443]">{t.label}</strong>
            </div>
            <p className="text-xs text-[#002443]/70">{t.description}</p>
            <p className="text-[11px] text-[#002443]/50 italic mt-1">{t.examples}</p>
          </div>
        ))}
        <Question
          id="tipoNegocio"
          label="Qual define melhor sua operação?"
          type="cards"
          required
          options={['merchant', 'intermediario']}
          hint="Escolha de 'intermediario' = +10 pts no score. Disponibiliza pergunta de split PIX."
        />
      </StepBlock>

      {/* Step 2 - Segmento */}
      <StepBlock number="2" title="Segmento" description="Lista adaptativa conforme o tipo escolhido no Step 1" condition="depende do Step 1">
        <Question id="segmento" label="Em qual segmento atua?" type="select" required options={SEGMENTO_MERCHANT_OPTIONS} condition="tipoNegocio = 'merchant'" />
        <Question id="segmento" label="Em qual segmento atua?" type="select" required options={SEGMENTO_INTERMEDIARIO_OPTIONS} condition="tipoNegocio = 'intermediario'" hint="MEI como Intermediário ativa flag MEI_AS_INTERMEDIARY" />
      </StepBlock>

      {/* Step 3 - Dados Empresa */}
      <StepBlock number="3" title="Dados da Empresa" description="CNPJ + autocomplete BDC">
        <Question id="cnpj" label="CNPJ" type="cnpj" required hint="Autocomplete BDC traz: razão social, porte, capital social, data início atividade, situação especial, CNAE" />
        <Question id="razaoSocial" label="Razão Social" type="text" required />
        <Question id="nomeFantasia" label="Nome Fantasia" type="text" />
        <Question id="nome" label="Nome do responsável" type="text" required />
        <Question id="email" label="E-mail" type="email" required hint="Domínio pessoal ativa flag PERSONAL_EMAIL" />
        <Question id="telefone" label="Telefone (WhatsApp)" type="phone" required />
        <Question id="cargo" label="Cargo" type="select" required options={CARGO_OPTIONS} hint="Sócio/CEO/Diretor = +10 pts no score" />
        <Question id="presencaDigital" label="Site ou Instagram" type="text" hint="Preenchido = +5 pts no score" />
      </StepBlock>

      {/* Step 4 - Volume PIX */}
      <StepBlock number="4" title="Volume PIX" description="Volumetria + modelo de cobrança">
        <Question id="tpvPix" label="TPV PIX mensal estimado (R$)" type="currency" required hint="TPV≥1M = +15 | ≥500k = +10 | ≥100k = +5. TPV>R$6.750/mês com MEI ativa HIGH_PIX_VOLUME_MEI" />
        <Question id="ticketMedio" label="Ticket médio PIX (R$)" type="currency" />
        <Question id="qtdTransacoes" label="Quantidade de transações/mês" type="number" />
        <Question id="modeloCobranca" label="Modelo de cobrança PIX" type="select" required options={MODELO_COBRANCA_PIX_OPTIONS} />
        <Question id="qtdMerchants" label="Quantos merchants/sellers você atende?" type="select" options={QTD_MERCHANTS_OPTIONS} condition="tipoNegocio = 'intermediario'" hint=">1k merchants = +5 pts" />
      </StepBlock>

      {/* Step 5 - Modelo de Negócio Pix */}
      <StepBlock number="5" title="Modelo de Negócio Pix" description="Finalidade da conta + perfil operacional">
        <Question id="finalidadeConta" label="Para que usa a conta Pix?" type="select" required options={FINALIDADE_CONTA_OPTIONS} />
        <Question id="horarioPix" label="Horário típico das transações" type="select" options={HORARIO_PIX_OPTIONS} />
        <Question id="tempoUsoPix" label="Há quanto tempo usa Pix?" type="select" options={TEMPO_USO_OPTIONS} />
        <Question id="custoPix" label="Custo médio atual por Pix" type="select" options={CUSTO_PIX_OPTIONS} />
      </StepBlock>

      {/* Step 6 - Situação Atual */}
      <StepBlock number="6" title="Situação Atual" description="Diagnóstico do que usa hoje + histórico">
        <Question id="parceiroAtual" label="Quem é seu parceiro Pix atual?" type="text" />
        <Question id="motivoBusca" label="Por que está buscando alternativa?" type="multiselect" required options={MOTIVO_BUSCA_OPTIONS} />
        <Question id="contaEncerrada" label="Já teve conta Pix encerrada?" type="select" options={['Sim', 'Não', 'Prefiro não dizer']} hint="'Sim' ativa flag ACCOUNT_TERMINATED (-15 pts)" />
        <Question id="motivoEncerramento" label="Motivo do encerramento" type="textarea" condition="contaEncerrada = 'Sim'" />
      </StepBlock>

      {/* Step 7 - Serviços Complementares + Fechamento */}
      <StepBlock number="7" title="Serviços Complementares & Fechamento" description="O que precisa + urgência">
        <Question id="servicosPix" label="Quais serviços Pix precisa?" type="multiselect" required options={SERVICOS_PIX_OPTIONS} hint="Intermediário + 'Split PIX' ativa flag INTERMEDIARY_WANTS_SPLIT" />
        <Question id="urgencia" label="Qual a urgência?" type="select" required options={URGENCIA_OPTIONS} />
        <Question id="comoConheceu" label="Como conheceu a Pagsmile?" type="select" options={COMO_CONHECEU_OPTIONS} />
        <Question id="observacoes" label="Observações" type="textarea" />
      </StepBlock>

      {/* SCORE 0-100 */}
      <div className="bg-white border-2 border-[#2bc196] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#002443] mb-3">📊 Cálculo do Lead Score Pix (0–100)</h3>
        <p className="text-xs text-[#002443]/70 mb-4">Score inicial = <strong>40</strong>. Aplicam-se bônus e penalidades.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 mb-2 uppercase tracking-wide">Bônus</div>
            <div className="space-y-1.5">
              <ScoreRule condition="TPV Pix ≥ R$ 1.000.000" points={15} />
              <ScoreRule condition="TPV Pix ≥ R$ 500.000" points={10} />
              <ScoreRule condition="TPV Pix ≥ R$ 100.000" points={5} />
              <ScoreRule condition="Capital social ≥ R$ 1.000.000" points={10} />
              <ScoreRule condition="Capital social ≥ R$ 100.000" points={5} />
              <ScoreRule condition="Empresa com 5+ anos de atividade" points={10} />
              <ScoreRule condition="Empresa com 2-5 anos de atividade" points={5} />
              <ScoreRule condition="Cargo decisor (Sócio/CEO/Diretor)" points={10} />
              <ScoreRule condition="E-mail corporativo" points={10} />
              <ScoreRule condition="Tem presença digital (site/Instagram)" points={5} />
              <ScoreRule condition="Porte DEMAIS (médio/grande)" points={5} />
              <ScoreRule condition="Porte EPP" points={3} />
              <ScoreRule condition="Tipo Intermediário (Gateway/Mkt/Plataforma)" points={10} />
              <ScoreRule condition=">1.000 merchants atendidos" points={5} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-700 mb-2 uppercase tracking-wide">Penalidades</div>
            <div className="space-y-1.5">
              <ScoreRule condition="Conta Pix encerrada antes (ACCOUNT_TERMINATED)" points={-15} type="penalty" />
              <ScoreRule condition="MEI com TPV Pix > R$ 6.750/mês (HIGH_PIX_VOLUME_MEI)" points={-10} type="penalty" />
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
        <h3 className="text-lg font-bold text-[#002443] mb-1">🚩 11 Flags Silenciosas Pix</h3>
        <p className="text-xs text-[#002443]/70 mb-4">Levantadas em background. <strong>Não aparecem para o lead</strong>, só no painel interno.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FlagCard code="ACCOUNT_TERMINATED" name="Conta encerrada antes" description="Lead declarou que já teve conta Pix encerrada" penalty="-15 pts" />
          <FlagCard code="TPV_EXCEEDS_REVENUE" name="TPV > Faturamento" description="(TPV × 12) > 1,3× faturamento anual estimado pelo porte" />
          <FlagCard code="YOUNG_COMPANY" name="Empresa muito nova" description="Menos de 1 ano de atividade (BDC data_inicio_atividade)" />
          <FlagCard code="SPECIAL_SITUATION" name="Situação especial" description="BDC retorna situacao_especial preenchida (falência, recuperação, etc.)" />
          <FlagCard code="PERSONAL_EMAIL" name="E-mail pessoal" description="Domínio gmail/hotmail/outlook/etc." />
          <FlagCard code="REGULATED_SECTOR" name="Setor regulado" description="CNAE divisão 64/65/66 + tipoNegocio=merchant" />
          <FlagCard code="RESTRICTED_ACTIVITY" name="Atividade restrita" description="Reservado para checagem contra Anexo I (não usado em V4)" />
          <FlagCard code="CNAE_SEGMENT_MISMATCH" name="CNAE incoerente" description="CNAE não bate com segmento declarado" />
          <FlagCard code="MEI_AS_INTERMEDIARY" name="MEI como Intermediário" description="MEI declara que faz split/repasse (incompatível regulatoriamente)" />
          <FlagCard code="HIGH_PIX_VOLUME_MEI" name="Volume alto em MEI" description="MEI com TPV Pix > R$ 6.750/mês (limite proporcional MEI)" penalty="-10 pts" />
          <FlagCard code="INTERMEDIARY_WANTS_SPLIT" name="Intermediário quer Split Pix" description="Tipo=intermediario + serviço 'Split PIX' selecionado" />
        </div>
      </div>
    </div>
  );
}