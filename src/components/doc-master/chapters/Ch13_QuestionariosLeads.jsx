import React from 'react';
import { Sec, H1, H2, H3, H4, P, B, C, Table, Note, Source } from '@/components/doc-master/DocPrimitives';

/**
 * Capítulo 13 — Questionários de Leads (Microscópico)
 * Documenta cada pergunta dos dois questionários ativos:
 *   A) Pagsmile Lead V5 — 12 etapas, 10 segmentos, 45 perguntas + condicionais
 *   B) Lead PIX V4 — 7 etapas, 28 perguntas + condicionais (merchant/intermediário)
 *
 * Para cada pergunta: campo, label, tipo, obrigatoriedade (e gatilho), regra de validação, opções e flags.
 * Fonte: components/lead-pagsmile/* e components/lead-pix-v4/*
 */
export default function Ch13_QuestionariosLeads() {
  return (
    <Sec id="ch-13">
      <H1 num="13">Questionários de Leads — Visão Microscópica</H1>
      <P>
        Esta seção documenta, pergunta a pergunta, os dois questionários ativos de captação. Cada item lista
        o campo persistido (<C>form.X</C>), o label apresentado, o tipo de input, a obrigatoriedade
        (incondicional ou condicional) e a regra de validação aplicada em <C>validateStepV5</C> ou no
        componente PIX V4.
      </P>

      <Note kind="info" title="Onde os dados são persistidos">
        Ambos os questionários gravam em <C>Lead</C> (entidade central). O Lead V5 grava o snapshot em{' '}
        <C>questionnaireData</C> e calcula <C>leadQualifierScore</C>; o PIX V4 grava{' '}
        <C>questionnaireData.pix</C> e flags em <C>iaSuggestions</C>. Após enrich BDC, o pipeline
        <C>bdcEnrichLead</C> popula <C>bdcLeadScore</C>, <C>bdcFlags</C> e <C>bdcCrossValidation</C>.
      </Note>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PARTE A — LEAD V5 PAGSMILE */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <H2 num="13.A">Pagsmile Lead V5 — Questionário Comercial Completo</H2>
      <P>
        <B>Página:</B> <C>QuestionarioLeadsPagsmile</C> · <B>URL pública:</B>{' '}
        <C>/QuestionarioLeadsPagsmile?slug=…</C> · <B>Total de etapas:</B> 12 (índices 0–11) ·{' '}
        <B>Auto-save:</B> a cada 800ms via <C>useLeadV5Autosave</C>.
      </P>

      {/* ── Tabela panorâmica das etapas ── */}
      <H3>13.A.1 — Mapa das 12 etapas</H3>
      <Table
        headers={['#', 'Etapa', 'Componente', 'Obrigatoriedade']}
        rows={[
          ['0', 'Segmento', 'StepSegmento', '1 campo · sempre'],
          ['1', 'Dados da Empresa (CNPJ + Pres. Digital)', 'StepDadosEmpresa', '4 campos · sempre'],
          ['2', 'Endereço (auto via BDC + confirmação)', 'StepEndereco', '1 confirmação · sempre'],
          ['3', 'Contato (e-mail, fone, cargo)', 'StepContato', '4 campos · sempre'],
          ['4', 'Modelo de Negócio (+ condicionais por segmento)', 'StepModeloNegocio', '2 base + 1–3 por segmento'],
          ['5', 'Mix da Operação (% por vertical)', 'StepMixOperacao', '1 sum=100% · sempre'],
          ['6', 'Volumetria (TPV + ticket + faturamento)', 'StepVolumetria', '4 campos · sempre'],
          ['7', 'Distribuição (atual ou desejada)', 'StepDistribuicao', '1 sum=100% · sempre'],
          ['8', 'Taxas atuais (só se "já processa")', 'StepTaxasAtuais', 'Condicional · 6 a 8 campos'],
          ['9', 'Processador atual + Dores', 'StepProcessadorAtual', '0 — observacional'],
          ['10', 'Compliance & Risco (encerrado, CB, MED PIX)', 'StepComplianceRisco', '1 a 3 campos'],
          ['11', 'Fechamento (urgência + crescimento)', 'StepFechamento', '2 campos · sempre'],
        ]}
      />

      {/* ── ETAPA 0 ── */}
      <H3>13.A.2 — Etapa 0 · Seleção de Segmento</H3>
      <P>Pergunta única, obrigatória, define todo o branching condicional posterior.</P>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="s">segmento</C>,
            'Qual é o tipo de negócio?',
            'card-select (1 de 10)',
            'gateway · marketplace · plataforma_vertical · ecommerce · dropshipping · infoprodutos · saas · educacao · link_pagamento · mpe',
            'Sim',
          ],
        ]}
      />
      <Note kind="rule" title="Agrupamento por grupo">
        Os 10 segmentos pertencem a 2 grupos: <C>intermediario</C> (gateway, marketplace, plataforma_vertical){' '}
        e <C>merchant</C> (todos os outros). O grupo influencia o roteamento para Compliance V4.
      </Note>

      {/* ── ETAPA 1 ── */}
      <H3>13.A.3 — Etapa 1 · Dados da Empresa</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Validação', 'Obrigatório']}
        rows={[
          [<C key="a">cnpj</C>, 'CNPJ', 'masked-input (00.000.000/0000-00)', 'Dígito verificador (algoritmo BR oficial)', 'Sim'],
          [<C key="b">razaoSocial</C>, 'Razão Social', 'text · autopreenchido por BDC', 'mín. 2 caracteres', 'Sim'],
          [<C key="c">nomeFantasia</C>, 'Nome Fantasia', 'text · autopreenchido por BDC', 'mín. 2 caracteres', 'Sim'],
          [<C key="d">presencaDigital</C>, 'Site, @rede social ou "Não possuo"', 'text livre', 'mín. 2 caracteres', 'Sim'],
        ]}
      />
      <Note kind="info" title="Autofill BDC">
        Ao digitar CNPJ válido, o hook <C>useBdcCnpjEnrichment</C> chama <C>brasilApiCnpj</C> →{' '}
        <C>bdc_queryCnpjData</C> em paralelo e preenche razão, fantasia, endereço, CNAE, capital social,
        QSA. Campos preenchidos por BDC ganham badge "Confirmado por BDC".
      </Note>

      {/* ── ETAPA 2 ── */}
      <H3>13.A.4 — Etapa 2 · Endereço</H3>
      <Table
        dense
        headers={['Campo', 'Origem', 'Confirmação']}
        rows={[
          [<C key="e1">endereco.cep / logradouro / numero / bairro / cidade / uf</C>, 'BDC autofill (read-only por padrão)', '— '],
          [<C key="e2">_enderecoConfirmado</C>, 'Checkbox visual', 'Obrigatório marcar antes de avançar'],
        ]}
      />

      {/* ── ETAPA 3 ── */}
      <H3>13.A.5 — Etapa 3 · Contato</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Validação', 'Obrigatório']}
        rows={[
          [<C key="c1">email</C>, 'E-mail corporativo', 'email', 'RFC 5322 simplificado · flag PERSONAL_EMAIL se domínio livre', 'Sim'],
          [<C key="c2">phone</C>, 'Telefone', 'masked-input', 'DDD (11–99) + 8 ou 9 dígitos', 'Sim'],
          [<C key="c3">contactName</C>, 'Nome do contato', 'text', 'mín. 2 caracteres', 'Sim'],
          [
            <C key="c4">cargo</C>,
            'Cargo',
            'select',
            'Sócio/Proprietário · CEO/Diretor · Gerente · Financeiro · TI · Marketing · __other__',
            'Sim',
          ],
          [<C key="c5">cargoOutro</C>, 'Descreva o cargo (se "Outro")', 'text', 'mín. 2 caracteres', 'Condicional: cargo === __other__'],
        ]}
      />

      {/* ── ETAPA 4 ── */}
      <H3>13.A.6 — Etapa 4 · Modelo de Negócio</H3>
      <H4>Campos sempre obrigatórios:</H4>
      <Table
        dense
        headers={['Campo', 'Label', 'Opções', 'Obrigatório']}
        rows={[
          [<C key="m1">modeloCobranca</C>, 'Modelo de cobrança', 'Venda única · Parcelado 2-12x · Assinatura/Recorrência · Ambos', 'Sim'],
          [<C key="m2">descricaoNegocio</C>, 'Descreva seu negócio', 'textarea livre (mín. 10 chars)', 'Sim'],
          [
            <C key="m3">antifraude</C>,
            'Antifraude / 3DS',
            'Antifraude + 3DS · Só antifraude · Só 3DS · Não possuo',
            'Condicional: gateway/marketplace/plataforma_vertical/ecommerce/dropshipping/infoprodutos',
          ],
        ]}
      />

      <H4>Campos condicionais por segmento (Etapa 4):</H4>
      <Table
        dense
        headers={['Segmento', 'Campos adicionais obrigatórios', 'Opções']}
        rows={[
          [
            'gateway',
            <span key="g"><C>licencaBCB</C> · <C>splitPagamento</C></span>,
            'BCB: Sim própria · Via BaaS · Não · Não sei | Split: Auto · Manual · Não',
          ],
          [
            'marketplace',
            <span key="mp"><C>takeRate</C> · <C>kycSubSellers</C></span>,
            'Take rate: <5% · 5-10% · 10-20% · 20-30% · >30% | KYC: Completo · Básico · Não · Em implantação',
          ],
          [
            'plataforma_vertical',
            <C key="pv">verticalPrincipal</C>,
            'Foodtech/Delivery · PDV/Loja · Agendamento · Ticketing · Fitness',
          ],
          [
            'saas',
            <span key="sa"><C>churn</C> · <C>pricingSaas</C></span>,
            'Churn: <2% · 2-5% · 5-10% · >10% · N/S | Pricing: Flat · Per-user · Tiers · Usage · Freemium+paid',
          ],
          [
            'infoprodutos',
            <span key="info"><C>modeloAfiliados</C> · <C>garantia</C> · <C>pctAfiliados</C></span>,
            'Afiliados: 0/10/100/>100/Rede · Garantia: 7d/15d/30d/Sem/Condicional · % afiliados: 0/<20/20-50/>50',
          ],
          [
            'ecommerce',
            <span key="ec"><C>tipoProdutoEcommerce</C> · <C>modeloEntrega</C> · <C>politicaDevolucao</C></span>,
            'Produto: Moda/Eletro/Cosm/Aliment/Casa | Entrega: Própria/Correios/Transp/Fulfillment | Devolução: 7/15/30/Troca',
          ],
          [
            'dropshipping',
            <span key="ds"><C>tipoProdutoDrop</C> · <C>origemFornecedores</C> · <C>prazoEntrega</C></span>,
            'Origem: Nacional/China/EUA/Misto · Prazo: 7d/15d/30d/30+',
          ],
          [
            'link_pagamento',
            <span key="lp"><C>tipoProdutoLink</C> · <C>canaisLink</C></span>,
            'Produto: Físico/Digital/Serviço/Aliment/Consult · Canais: WA/Email/IG/FB/TikTok',
          ],
          [
            'mpe',
            <span key="mpe"><C>tipoMpe</C> · <C>oQueVendeMpe</C> · <C>modalidadeCartao</C></span>,
            'Tipo: Loja/Serviço/Aliment/Autônomo · Modalidade: Presencial/Online/Ambos',
          ],
        ]}
      />

      {/* ── ETAPA 5 ── */}
      <H3>13.A.7 — Etapa 5 · Mix da Operação</H3>
      <P>
        Slider de 5 verticais fixas (<C>ecommerce</C>, <C>dropshipping</C>, <C>infoproduto</C>,{' '}
        <C>saas</C>, <C>educacao</C>) + array dinâmico <C>mixOperacao.outros[]</C>.
      </P>
      <Note kind="warn" title="Validação rígida">
        Soma de TODOS os percentuais (fixos + outros) deve ser <B>exatamente 100%</B>. Cada item de "Outros"
        precisa de <C>nome</C> (mín. 2 chars) e <C>percentual</C> &gt; 0.
      </Note>

      {/* ── ETAPA 6 ── */}
      <H3>13.A.8 — Etapa 6 · Volumetria</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Validação', 'Obrigatório']}
        rows={[
          [<C key="v1">tpvMensal</C>, 'TPV Mensal (R$)', 'currency', '&gt; 0 · ≥ R$ 50.000 (gate)', 'Sim'],
          [<C key="v2">ticketMedio</C>, 'Ticket Médio (R$)', 'currency', '&gt; 0', 'Sim'],
          [
            <C key="v3">faturamentoAnual</C>,
            'Faturamento Anual',
            'select',
            'MEI (81k) · ME (360k) · EPP (4,8M) · 4,8-20M · 20-100M · >100M',
            'Sim',
          ],
          [<C key="v4">funcionarios</C>, 'Funcionários', 'select', 'Só eu · 2-5 · 6-20 · 21-100 · 101-500 · >500', 'Sim'],
        ]}
      />
      <Note kind="rule" title="Gate de qualificação">
        TPV abaixo de R$ 50.000/mês <B>bloqueia avanço</B> (mensagem: "Só aceitamos TPV mensal acima de R$
        50.000"). Flag <C>TPV_EXCEEDS_REVENUE</C> dispara se <C>tpvMensal × 12 &gt; faturamentoAnual</C>.
      </Note>

      {/* ── ETAPA 7 ── */}
      <H3>13.A.9 — Etapa 7 · Distribuição de Meios</H3>
      <Table
        dense
        headers={['Campo', 'Quando aparece', 'Estrutura', 'Validação']}
        rows={[
          [<C key="d1">jaProcessa</C>, 'Sempre', 'select', 'Sim, já processo · Não, estou começando'],
          [
            <C key="d2">distribuicao{'{credito, debito, pix, boleto}'}</C>,
            'jaProcessa = "Sim"',
            '4 sliders %',
            'Soma = 100%',
          ],
          [
            <C key="d3">distribuicaoParcelamento{'{avista, p2a6, p7a12, p13a21}'}</C>,
            'jaProcessa = "Sim"',
            '4 sliders %',
            'Soma = 100%',
          ],
          [
            <C key="d4">distribuicaoDesejada{'{credito, debito, pix, boleto}'}</C>,
            'jaProcessa = "Não, começando"',
            '4 sliders %',
            'Soma = 100%',
          ],
        ]}
      />

      {/* ── ETAPA 8 ── */}
      <H3>13.A.10 — Etapa 8 · Taxas Atuais (condicional)</H3>
      <Note kind="info" title="Só aparece se jaProcessa = 'Sim, já processo'">
        Os campos só são obrigatórios para os meios de pagamento com &gt; 0% na distribuição declarada.
      </Note>
      <Table
        dense
        headers={['Campo', 'Quando obrigatório', 'Tipo']}
        rows={[
          [<C key="t1">mdrAvista, mdr2a6x, mdr7a12x, mdrDebito</C>, 'distribuicao.credito > 0 || debito > 0', '% percentual'],
          [<C key="t2">taxaPix</C>, 'distribuicao.pix > 0', '% ou R$ fixo'],
          [<C key="t3">taxaBoleto</C>, 'distribuicao.boleto > 0', 'R$ fixo'],
          [<C key="t4">taxaAntecipacao</C>, 'Sempre (quando jaProcessa)', '% a.m.'],
          [<C key="t5">feeTransacao</C>, 'Sempre (quando jaProcessa)', 'R$ por transação'],
          [<C key="t6">custoAntifraude</C>, 'Sempre (quando jaProcessa)', 'R$ ou %'],
          [<C key="t7">taxa3ds</C>, 'Sempre (quando jaProcessa)', 'R$ por transação'],
        ]}
      />

      {/* ── ETAPA 9 ── */}
      <H3>13.A.11 — Etapa 9 · Processador Atual & Dores</H3>
      <Table
        dense
        headers={['Campo', 'Tipo', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="p1">processadorAtual</C>,
            'multi-select',
            'Cielo · Rede · Stone · PagSeguro · Mercado Pago · Getnet · Adyen · Stripe · Pagar.me · Zoop · Juno · Vindi · Asaas · Nenhum',
            'Não',
          ],
          [
            <C key="p2">satisfacao</C>,
            'radio',
            'Muito satisfeito · Satisfeito · Neutro · Insatisfeito · Muito insatisfeito',
            'Não',
          ],
          [
            <C key="p3">dorAtual</C>,
            'checkboxes',
            'Taxas altas · Suporte ruim · Instabilidade · Demora liquidação · Falta funcionalidades · Chargeback alto',
            'Não',
          ],
        ]}
      />

      {/* ── ETAPA 10 ── */}
      <H3>13.A.12 — Etapa 10 · Compliance & Risco</H3>
      <Table
        dense
        headers={['Campo', 'Quando obrigatório', 'Opções']}
        rows={[
          [<C key="cr1">encerrado</C>, 'Sempre', 'Nunca · Sim 1 vez · Sim mais de 1 vez'],
          [<C key="cr2">chargeback</C>, 'jaProcessa=Sim e tem crédito', '<1% · 1-2% · >2% · Não sei · N/A'],
          [<C key="cr3">medPix</C>, 'Tem PIX (atual ou desejado)', 'N/A · <0,3% · 0,3-0,5% · 0,5-1% · >1%'],
        ]}
      />
      <Note kind="danger" title="Penalidades de score">
        <C>encerrado ≠ "Nunca"</C> → flag <C>TERMINATED_BEFORE</C> (-15 pts) · <C>chargeback = "{'>'}2%"</C>{' '}
        → <C>HIGH_CHARGEBACK</C> (-10) · <C>medPix = "{'>'}1%"</C> → <C>HIGH_MED_PIX</C> (-10).
      </Note>

      {/* ── ETAPA 11 ── */}
      <H3>13.A.13 — Etapa 11 · Fechamento</H3>
      <Table
        dense
        headers={['Campo', 'Tipo', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="u1">urgencia</C>,
            'select',
            'Imediato (<1 semana) · Este mês · Próximos 2-3 meses · Estou apenas cotando',
            'Sim',
          ],
          [
            <C key="u2">crescimento</C>,
            'select',
            'Manter estável · Crescer até 30% · Crescer 30-100% · Mais que dobrar (>100%)',
            'Sim',
          ],
          [<C key="u3">comoConheceu</C>, 'select', 'Google · Indicação · LinkedIn · Evento · Parceiro', 'Não'],
        ]}
      />

      {/* ── SCORE V5 ── */}
      <H3>13.A.14 — Cálculo do Lead Score V5 (0-100)</H3>
      <P>Base 40 pts. Ajustes acumulativos:</P>
      <Table
        dense
        headers={['Condição', 'Δ pts', 'Bônus / Penalidade']}
        rows={[
          ['E-mail corporativo (domínio fora da lista de 20 free)', '+10', 'Bônus'],
          ['Cargo decisor (Sócio/Proprietário ou CEO/Diretor)', '+10', 'Bônus'],
          ['TPV ≥ R$ 200.000/mês', '+10', 'Bônus'],
          ['qtdSubSellers ∈ {1k-5k, >5k} (intermediários)', '+5', 'Bônus'],
          ['urgencia = "Imediato (<1 semana)"', '+15', 'Bônus'],
          ['crescimento = "Mais que dobrar (>100%)"', '+5', 'Bônus'],
          ['satisfacao ∈ {Insatisfeito, Muito insatisfeito}', '+5', 'Bônus (dor explícita)'],
          ['Flag TERMINATED_BEFORE', '−15', 'Penalidade'],
          ['Flag HIGH_CHARGEBACK', '−10', 'Penalidade'],
          ['Flag HIGH_MED_PIX', '−10', 'Penalidade'],
          ['Flag HIGH_REFUND_POLICY (garantia 30d ou condicional)', '−5', 'Penalidade'],
          ['Flag JUST_QUOTING', '−5', 'Penalidade'],
        ]}
      />
      <P>
        Score final clampado em [0, 100]. Faixas: <B>Frio</B> (&lt;40), <B>Morno</B> (40-59),{' '}
        <B>Quente</B> (60-79), <B>Muito Quente</B> (≥80).
      </P>

      {/* ── FLAGS SILENCIOSAS V5 ── */}
      <H3>13.A.15 — 16 Flags Silenciosas (calculadas no submit)</H3>
      <Table
        dense
        headers={['#', 'Flag', 'Regra']}
        rows={[
          ['1', 'PERSONAL_EMAIL', 'Domínio do e-mail ∈ FREE_EMAIL_DOMAINS (20 provedores: gmail, hotmail, yahoo, etc.)'],
          ['2', 'NO_WEBSITE', 'presencaDigital = "Não possuo" ou vazio'],
          ['3', 'NO_ANTIFRAUDE', 'antifraude = "Não possuo" + segmento ∈ {ecommerce, dropshipping} + TPV > 100k'],
          ['4', 'HIGH_CHARGEBACK', 'chargeback = ">2% (crítico)"'],
          ['5', 'HIGH_MED_PIX', 'medPix = ">1%"'],
          ['6', 'TERMINATED_BEFORE', 'encerrado ≠ "Nunca"'],
          ['7', 'TPV_EXCEEDS_REVENUE', 'TPV × 12 > faturamentoAnual (mapa MEI/ME/EPP/etc)'],
          ['8', 'NEW_MERCHANT', 'jaProcessa = "Não, estou começando"'],
          ['9', 'CNPJ_SITUACAO_IRREGULAR', 'BDC retorna situação_cadastral ≠ "ATIVA"'],
          ['10', 'EMPRESA_NOVA', 'BDC data_abertura < 6 meses'],
          ['11', 'SETOR_REGULADO', 'CNAE divisão ∈ {64, 65, 66} — financeiro/seguros/auxiliares'],
          ['12', 'CNAE_MISMATCH', 'CnaeCoherenceAlert detecta segmento declarado ≠ CNAE oficial'],
          ['13', 'VOLUME_INCOMPATIVEL', 'Porte vs volume incompatíveis (reservada — não implementada)'],
          ['14', 'JUST_QUOTING', 'urgencia = "Estou apenas cotando"'],
          ['15', 'LOW_TICKET', 'ticketMedio > 0 e < R$ 10'],
          ['16', 'HIGH_REFUND_POLICY', 'garantia ∈ {"30 dias", "Garantia condicional"} (infoprodutos)'],
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PARTE B — LEAD PIX V4 */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <H2 num="13.B">Lead PIX V4 — Questionário PIX (Merchant + Intermediário)</H2>
      <P>
        <B>Página:</B> <C>LeadPixV4</C> · <B>URL pública:</B> <C>/LeadPixV4</C> · <B>Total de etapas:</B> 7
        · <B>Branching:</B> a Etapa 1 define <C>tipoNegocio</C> ∈ {`{merchant, intermediario}`} que altera as
        opções da Etapa 2 e os campos de volumetria nas Etapas 4–5.
      </P>

      <H3>13.B.1 — Mapa das 7 etapas</H3>
      <Table
        headers={['#', 'Etapa', 'Componente', 'Branching']}
        rows={[
          ['1', 'Tipo de Negócio (merchant × intermediário)', 'StepTipoNegocio', 'Define todo o resto'],
          ['2', 'Dados da Empresa + Segmento PIX', 'StepDadosEmpresa', 'Segmento varia por tipo'],
          ['3', 'Contato', 'StepContato', '—'],
          ['4', 'Modelo de Negócio PIX', 'StepModeloNegocio', '—'],
          ['5', 'Volume PIX (TPV + qtd)', 'StepVolumePix', 'qtdMerchants só p/ intermediário'],
          ['6', 'Situação Atual (conta PIX, custo, motivo)', 'StepSituacaoAtual', '—'],
          ['7', 'Serviços + Fechamento', 'StepServicosComplementar', '—'],
        ]}
      />

      {/* ── ETAPA 1 ── */}
      <H3>13.B.2 — Etapa 1 · Tipo de Negócio</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="tn">tipoNegocio</C>,
            'Como você usa PIX?',
            'card-select (1 de 2)',
            <span key="o">
              <B>merchant</B>: Recebo PIX para minha própria empresa (e-commerce, restaurante, SaaS, etc.) ·{' '}
              <B>intermediario</B>: Recebo PIX em nome de outros e faço split (gateway, marketplace,
              foodtech)
            </span>,
            'Sim',
          ],
        ]}
      />

      {/* ── ETAPA 2 ── */}
      <H3>13.B.3 — Etapa 2 · Empresa + Segmento PIX</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo / Opções', 'Obrigatório']}
        rows={[
          [<C key="b1">cnpj</C>, 'CNPJ', 'masked + autofill BDC', 'Sim'],
          [<C key="b2">razaoSocial</C>, 'Razão Social', 'text (autofill)', 'Sim'],
          [<C key="b3">nomeFantasia</C>, 'Nome Fantasia', 'text (autofill)', 'Sim'],
          [<C key="b4">website</C>, 'Site / Presença digital', 'text livre', 'Não'],
          [
            <C key="b5">segmento</C>,
            'Segmento PIX',
            <span key="seg">
              Se merchant: E-commerce · Dropshipping · Infoprodutos · SaaS · Educação · Foodtech · Link de
              Pagamento · MPE · Se intermediário: Gateway/PSP · Marketplace · Plataforma Vertical
            </span>,
            'Sim',
          ],
        ]}
      />

      {/* ── ETAPA 3 ── */}
      <H3>13.B.4 — Etapa 3 · Contato</H3>
      <Table
        dense
        headers={['Campo', 'Tipo', 'Validação', 'Obrigatório']}
        rows={[
          [<C key="ct1">email</C>, 'email', 'RFC 5322 · flag PERSONAL_EMAIL se domínio livre', 'Sim'],
          [<C key="ct2">phone</C>, 'masked-input', 'DDD + 8/9 dígitos', 'Sim'],
          [<C key="ct3">contactName</C>, 'text', 'mín. 2 chars', 'Sim'],
          [
            <C key="ct4">cargo</C>,
            'select',
            'Sócio/Proprietário · CEO/Diretor · Gerente · Financeiro · TI · Outro',
            'Sim',
          ],
        ]}
      />

      {/* ── ETAPA 4 ── */}
      <H3>13.B.5 — Etapa 4 · Modelo de Negócio PIX</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="mc">modeloCobrancaPix</C>,
            'Como cobra via PIX?',
            'PIX avulso (venda única) · PIX recorrente (mensalidade) · PIX parcelado (PIX Garantido) · Ambos',
            'Sim',
          ],
          [
            <C key="fc">finalidadeConta</C>,
            'Para que usa a conta PIX?',
            'Só receber PIX de clientes · Receber + fazer pagamentos · Receber + split/repasse para merchants',
            'Sim',
          ],
          [<C key="hp">horarioPix</C>, 'Horário típico de PIX', 'Comercial 8-18h · Noturno 18-23h · 24 horas · Não sei', 'Não'],
        ]}
      />

      {/* ── ETAPA 5 ── */}
      <H3>13.B.6 — Etapa 5 · Volume PIX</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Tipo', 'Quando obrigatório']}
        rows={[
          [<C key="tp">tpvPix</C>, 'TPV PIX mensal (R$)', 'currency', 'Sempre · > 0'],
          [<C key="tm">ticketMedioPix</C>, 'Ticket médio PIX (R$)', 'currency', 'Sempre · > 0'],
          [<C key="qt">qtdMerchants</C>, 'Quantos merchants/sellers atende?', 'select: Até 50 · 51-200 · 201-1k · 1k-5k · >5k', 'Só se tipoNegocio = intermediario'],
        ]}
      />
      <Note kind="warn" title="Flags PIX por porte">
        <C>HIGH_PIX_VOLUME_MEI</C>: TPV &gt; R$ 6.750/mês + porte MEI (próximo do teto R$ 81k/ano). ·{' '}
        <C>MEI_AS_INTERMEDIARY</C>: tipoNegocio = intermediário + porte MEI (incompatível regulatório).
      </Note>

      {/* ── ETAPA 6 ── */}
      <H3>13.B.7 — Etapa 6 · Situação Atual</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Opções', 'Obrigatório']}
        rows={[
          [<C key="ja">jaTemConta</C>, 'Já tem conta PIX em algum provedor?', 'Sim · Não', 'Sim'],
          [<C key="te">tempoUso</C>, 'Há quanto tempo?', '<6 meses · 6-12 meses · 1-2 anos · >2 anos · É o primeiro', 'Se jaTemConta=Sim'],
          [<C key="cu">custoPix</C>, 'Custo atual por PIX', 'Até R$0,50 · R$0,50-1 · R$1-2 · >R$2 · % sobre valor · Não sei', 'Se jaTemConta=Sim'],
          [
            <C key="ce">contaEncerrada</C>,
            'Já teve conta PIX encerrada por compliance?',
            'Sim · Não',
            'Sim',
          ],
          [
            <C key="mb">motivoBusca</C>,
            'Por que está buscando outro parceiro?',
            'multi-select: Taxa alta · Instabilidade · Atendimento · Falta funcionalidades · Prazo · Precisa split · Primeiro parceiro · Outro',
            'Sim',
          ],
        ]}
      />
      <Note kind="danger" title="Auto-disqualification">
        <C>contaEncerrada = "Sim"</C> ativa flag <C>ACCOUNT_TERMINATED</C> (-15 pts) e marca o lead com{' '}
        <C>iaDecision = "REVISAO_MANUAL"</C> automaticamente — compliance recebe alerta Slack via{' '}
        <C>notifyLeadHighRisk</C>.
      </Note>

      {/* ── ETAPA 7 ── */}
      <H3>13.B.8 — Etapa 7 · Serviços + Fechamento</H3>
      <Table
        dense
        headers={['Campo', 'Label', 'Opções', 'Obrigatório']}
        rows={[
          [
            <C key="sv">servicosPix</C>,
            'Quais serviços PIX precisa?',
            'multi-select (9): Recebimentos · Pagamentos · QR estático · QR dinâmico · Cobrança · Garantido · Split · Conta Digital · Outro',
            'Sim · mín. 1',
          ],
          [<C key="ur">urgencia</C>, 'Urgência', 'Imediato · Até 30 dias · 1-3 meses · Pesquisando', 'Sim'],
          [<C key="cm">comoConheceu</C>, 'Como nos conheceu?', 'Google · Indicação · LinkedIn · Evento · Parceiro · Outro', 'Não'],
        ]}
      />

      {/* ── SCORE PIX V4 ── */}
      <H3>13.B.9 — Cálculo do Lead Score PIX V4 (0-100)</H3>
      <P>Base 40 pts. Ajustes:</P>
      <Table
        dense
        headers={['Condição', 'Δ pts']}
        rows={[
          ['TPV PIX ≥ R$ 1.000.000/mês', '+15'],
          ['TPV PIX ≥ R$ 500.000/mês', '+10'],
          ['TPV PIX ≥ R$ 100.000/mês', '+5'],
          ['Capital social BDC ≥ R$ 1.000.000', '+10'],
          ['Capital social BDC ≥ R$ 100.000', '+5'],
          ['Empresa BDC ≥ 5 anos', '+10'],
          ['Empresa BDC ≥ 2 anos', '+5'],
          ['Cargo decisor (Sócio/CEO/Diretor)', '+10'],
          ['E-mail corporativo (não free)', '+10'],
          ['presencaDigital ≠ "Não possuo"', '+5'],
          ['Porte BDC = DEMAIS (grande)', '+5'],
          ['Porte BDC = EPP', '+3'],
          ['tipoNegocio = intermediario', '+10'],
          ['qtdMerchants ∈ {1k-5k, >5k}', '+5'],
          ['Flag ACCOUNT_TERMINATED', '−15'],
          ['Flag HIGH_PIX_VOLUME_MEI', '−10'],
        ]}
      />

      {/* ── FLAGS PIX ── */}
      <H3>13.B.10 — 11 Flags Silenciosas PIX</H3>
      <Table
        dense
        headers={['#', 'Flag', 'Regra']}
        rows={[
          ['1', 'ACCOUNT_TERMINATED', 'contaEncerrada = "Sim"'],
          ['2', 'TPV_EXCEEDS_REVENUE', 'TPV × 12 > limite porte (MEI 81k, ME 360k, EPP 4,8M) × 1.3'],
          ['3', 'YOUNG_COMPANY', 'BDC data_inicio_atividade < 1 ano'],
          ['4', 'SPECIAL_SITUATION', 'BDC situacao_especial ≠ "" (ex.: RJ/Falência)'],
          ['5', 'PERSONAL_EMAIL', 'Domínio ∈ FREE_EMAIL_DOMAINS (15 provedores)'],
          ['6', 'REGULATED_SECTOR', 'CNAE divisão ∈ {64,65,66} + tipoNegocio = merchant'],
          ['7', 'RESTRICTED_ACTIVITY', 'Reservada (atividade vetada Anexo I) — não implementada'],
          ['8', 'CNAE_SEGMENT_MISMATCH', 'Setada por CnaeCoherenceAlert'],
          ['9', 'MEI_AS_INTERMEDIARY', 'tipoNegocio = intermediario + porte MEI (vetado regulatório)'],
          ['10', 'HIGH_PIX_VOLUME_MEI', 'tpvPix > R$ 6.750/mês + porte MEI'],
          ['11', 'INTERMEDIARY_WANTS_SPLIT', 'tipoNegocio = intermediario + servicosPix inclui "Split PIX"'],
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      <H2 num="13.C">Comparativo Lead V5 × PIX V4</H2>
      <Table
        headers={['Aspecto', 'Lead V5 Pagsmile', 'Lead PIX V4']}
        rows={[
          ['Página', '/QuestionarioLeadsPagsmile', '/LeadPixV4'],
          ['Etapas', '12 (índices 0–11)', '7'],
          ['Perguntas base', '45 + 18 condicionais', '28 + condicionais'],
          ['Segmentos', '10 (gateway, marketplace, vertical, ecommerce, dropshipping, infoprodutos, saas, educacao, link_pagamento, mpe)', '8 merchant + 3 intermediário'],
          ['Flags silenciosas', '16', '11'],
          ['Score', '0-100 (base 40)', '0-100 (base 40)'],
          ['TPV gate', 'R$ 50.000/mês mínimo', 'sem gate fixo'],
          ['Autofill BDC', 'CNPJ, endereço, QSA, CNAE', 'CNPJ, capital, porte, idade'],
          ['Auto-save', 'a cada 800ms (useLeadV5Autosave)', 'a cada submit de step'],
          ['Auto-disqualify', 'Não — apenas penalidades', 'contaEncerrada=Sim → REVISAO_MANUAL automático'],
          ['Roteamento Compliance', 'segmentToComplianceV4Map → 10 templates', 'segmentComplianceMap → pix_merchant / pix_intermediario'],
        ]}
      />

      <Note kind="rule" title="Princípio dos dois funis">
        Lead V5 é o funil <B>comercial completo</B> (qualifica todos os meios de pagamento). Lead PIX V4 é o
        funil <B>especializado PIX</B> com diferenciação clara entre <C>merchant</C> e <C>intermediario</C>{' '}
        (cada um aciona compliance e contratos diferentes). Ambos populam a mesma entidade <C>Lead</C> e
        seguem para <C>analyzeLeadQualifier</C> → <C>bdcEnrichLead</C> → atribuição comercial.
      </Note>

      <Source
        files={[
          'components/lead-pagsmile/pagsmileQuestionnaireData.js',
          'components/lead-pagsmile/leadV5Validators.js',
          'components/lead-pagsmile/StepSegmento.jsx',
          'components/lead-pagsmile/StepDadosEmpresa.jsx',
          'components/lead-pagsmile/StepEndereco.jsx',
          'components/lead-pagsmile/StepContato.jsx',
          'components/lead-pagsmile/StepModeloNegocio.jsx',
          'components/lead-pagsmile/StepMixOperacao.jsx',
          'components/lead-pagsmile/StepVolumetria.jsx',
          'components/lead-pagsmile/StepDistribuicao.jsx',
          'components/lead-pagsmile/StepTaxasAtuais.jsx',
          'components/lead-pagsmile/StepProcessadorAtual.jsx',
          'components/lead-pagsmile/StepComplianceRisco.jsx',
          'components/lead-pagsmile/StepFechamento.jsx',
          'components/lead-pix-v4/pixQuestionnaireData.js',
          'components/lead-pix-v4/StepTipoNegocio.jsx',
          'components/lead-pix-v4/StepDadosEmpresa.jsx',
          'components/lead-pix-v4/StepContato.jsx',
          'components/lead-pix-v4/StepModeloNegocio.jsx',
          'components/lead-pix-v4/StepVolumePix.jsx',
          'components/lead-pix-v4/StepSituacaoAtual.jsx',
          'components/lead-pix-v4/StepServicosComplementar.jsx',
          'pages/QuestionarioLeadsPagsmile.jsx',
          'pages/LeadPixV4.jsx',
        ]}
      />
    </Sec>
  );
}