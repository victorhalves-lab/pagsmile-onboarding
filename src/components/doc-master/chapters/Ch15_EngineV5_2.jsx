import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Threshold, Source } from '../DocPrimitives';

/**
 * Capítulo 15 — Engine V5.2 (Scoring, Datasets, Bloqueios, Cross-Val, Patch Financeiro, Matriz Decisão)
 *
 * Foco: motor matemático e regras de bloqueio do framework V5.2.
 * Premissa: leitor já conhece Cap. 14 (tiers, capabilities, segmentos).
 *
 * Fonte real:
 *   lib/v5_2/scoringV5_2.js
 *   lib/v5_2/avaliarBloqueios.js
 *   lib/v5_2/crossValidation16.js
 *   lib/v5_2/financialCapacityValidation.js
 *   lib/v5_2/matrizDecisao.js
 *   lib/v5_2/deveConsultarDataset.js
 *   functions/bdcEnrichCaseV5_2.js
 *   functions/scoreV5_2DryRun.js
 */
export default function Ch15_EngineV5_2() {
  return (
    <Sec id="ch-15">
      <H1 num="15">Engine V5.2 — Scoring Tier-Aware, 58 Datasets, 72 Bloqueios, Matriz 5 Categorias</H1>

      <P>Este capítulo descreve o motor matemático do V5.2. Onde o V4 (Cap. 04) tem uma fórmula única com 13 dimensões e 10 bloqueios, o V5.2 introduz <B>5 camadas de scoring</B>, <B>13 dimensões analíticas BDC</B> (renomeadas e expandidas), <B>72 bloqueios</B> catalogados, <B>Cross-Validation 16 Campos</B> estruturada e o <B>Patch Financeiro</B> (5 dimensões coerência).</P>

      <Note title="Coexistência V4 / V5.2" kind="info">
        <p>Casos com <C>framework_version = 'v4.0'</C> seguem motor do Cap. 04 (<C>bdcEnrichCase.js</C>). Casos <C>v5.2</C> seguem motor descrito aqui (<C>bdcEnrichCaseV5_2.js</C> + <C>lib/v5_2/scoringV5_2.js</C>). Ambos persistem em <C>ComplianceScore</C> mas em campos distintos: V4 usa <C>score_final</C> + <C>subfaixa</C>; V5.2 usa <C>score_v5_1_final</C> + <C>subfaixa_tier_aware</C> + <C>categoria_decisao_v5_2</C>.</p>
      </Note>

      <H2 num="15.1">As 5 Camadas do Score V5.2</H2>

      <P>Definidas em <C>lib/v5_2/scoringV5_2.js</C> (linhas 60-185). Cada camada tem peso, datasets de origem e contribuição máxima específica ao tier:</P>

      <Table headers={['Camada', 'Nome', 'O que mede', 'Datasets / fontes']} rows={[
        ['C1', 'Base por Segmento+Tier', 'Risco inerente da atividade × porte', '— (constante baseado em SEGMENT_BASE_SCORES_V5_2[segmento][tier])'],
        ['C2', 'Ajuste Morfológico', 'Ajuste por composição operacional', '— (constante por morfologia)'],
        ['C3', 'Variáveis Declaradas+Confirmadas', 'V01-V60+ — variáveis específicas alimentadas pelo questionário e cross-validadas com BDC', '58 datasets BDC + QuestionnaireResponse'],
        ['C4', 'Capabilities Transversais', 'Pontos adicionais por capabilities ativas', 'Resolução das 4 capabilities (Cap. 14.5)'],
        ['C5', 'Patch Financeiro', 'Pontos por incoerências financeiras (5 dimensões)', 'BDC financial + ECF/DRE/RAIS + Open Finance + QuestionnaireResponse (TPV declarado)'],
      ]} />

      <H3 num="15.1.1">Fórmula completa</H3>
      <CodeBlock language="js">{`// lib/v5_2/scoringV5_2.js — fluxo essencial
export function calcularScoreV5_2({
  tier, segmento, morfologia, capabilitiesAtivas,
  variaveisInput, patchStatus, bloqueiosAtivos,
}) {
  // Bloqueio absoluto → score teto (cat_4_block) sem chance de cat_5
  const temBloqueioAbsoluto = bloqueiosAtivos.some(b => BLOQUEIOS_ABSOLUTOS.includes(b));
  if (temBloqueioAbsoluto) {
    return {
      score_final: getScoreMaxByTier(tier), // 850 ou 999
      categoria_decisao: 'cat_4_block',
      bloqueios_ativos: bloqueiosAtivos,
      razao: 'bloqueio_absoluto',
    };
  }

  // Camada 1 — base
  const c1 = SEGMENT_BASE_SCORES_V5_2[segmento]?.[tier] ?? 80;

  // Camada 2 — morfologia
  const c2 = MORFOLOGIA_ADJUSTMENTS[morfologia]?.[tier] ?? 0;

  // Camada 3 — variáveis
  const c3 = Object.entries(variaveisInput).reduce((acc, [varId, pts]) =>
    acc + (VARIAVEIS_PESO[varId]?.[tier] ?? 0) * pts, 0);

  // Camada 4 — capabilities
  const c4 = capabilitiesAtivas.reduce((acc, cap) =>
    acc + (CAPABILITY_ADJUSTMENTS[cap]?.[tier] ?? 0), 0);

  // Camada 5 — patch financeiro
  const c5 = PATCH_FINANCEIRO_AJUSTE[patchStatus] ?? 0;

  const score_final = Math.max(0, Math.min(
    getScoreMaxByTier(tier),
    c1 + c2 + c3 + c4 + c5
  ));

  return {
    score_final,
    score_max: getScoreMaxByTier(tier),
    camadas: { c1, c2, c3, c4, c5 },
    categoria_decisao: resolverCategoria(score_final, tier, bloqueiosAtivos),
    subfaixa_tier_aware: resolverSubfaixaTierAware(score_final, tier),
  };
}`}</CodeBlock>

      <H3 num="15.1.2">Escalas máximas por tier</H3>
      <Table dense headers={['Tier', 'Score máximo', 'Cat 4 (block) em']} rows={[
        ['tier_1', '850', '≥ 720'],
        ['tier_2', '850', '≥ 720'],
        ['tier_3', '999', '≥ 850'],
        ['subseller_pj', '850', '≥ 720'],
        ['subseller_pf', '850', '≥ 720'],
      ]} />

      <Note title="Por que T3 tem escala maior (0-999)?" kind="info">
        <p>Tier 3 = alta exposição. Precisa de <B>resolução fina</B> entre "aprovado com condições rigorosas" e "bloqueado" — 999 dá espaço para distinguir um Gateway com 1 finding crítico (score ~780) de um com múltiplos findings (score ~920). Em T1/T2 a granularidade fina não traz valor operacional — basta saber se está abaixo ou acima de 720.</p>
      </Note>

      <H2 num="15.2">As 13 Dimensões Analíticas V5.2</H2>

      <P>V5.2 renomeia e expande as dimensões. Cada dataset BDC mapeia para <B>exatamente uma</B> dimensão analítica, gravada em <C>IntegrationLog.dimensao_analitica</C> (denormalizado para queries rápidas na Aba 3 da nova UI):</P>

      <Table headers={['#', 'Dimensão (codigo)', 'O que cobre', 'Datasets principais']} rows={[
        ['1', 'identidade_cadastro', 'CNPJ/CPF cadastrais, situação RF, idade, capital', 'basic_data, registration_data, history_basic_data'],
        ['2', 'socios_beneficiarios', 'QSA, UBO, sócios PEP/sancionados', 'relationships, owners_kyc, configurable_recency_qsa'],
        ['3', 'estrutura_societaria', 'Grupo econômico, participações cruzadas', 'economic_group, economic_group_relationships, economic_group_kyc'],
        ['4', 'sancoes_internacionais_nacionais', 'OFAC, EU, UN, CEIS, CNEP, Interpol', 'kyc.Sanctions, owners_kyc.Sanctions, CAF screening'],
        ['5', 'processos_compliance', 'Processos judiciais, dívida ativa, collections', 'processes, owners_lawsuits, government_debtors, collections'],
        ['6', 'atividade_reputacao', 'Site, domínio, passagens, mídia, Reclame Aqui', 'domains, passages, media_profile_and_exposure, reputations_and_reviews'],
        ['7', 'financeiro_mercado', 'Falência, capital, crédito, Open Finance', 'financial_market, credit_risk, credit_score, scr_positive_score'],
        ['8', 'trabalho_esg', 'RAIS empregados, embargos IBAMA, Lista Suja MTE', 'activity_indicators (RAIS), esg_and_compliance'],
        ['9', 'compliance_setorial', 'Licenças regulatórias (Anvisa, BCB, CVM, SUSEP), CNAE alto risco', 'licenses_and_authorizations, financial_market (BCB/CVM)'],
        ['10', 'pld_ft', 'Vínculos políticos, doações eleitorais, PEP indireto', 'political_involvement, owners_electoral_donors, owners_influence'],
        ['11', 'risco_pais_internacional', 'Crossborder — exposição cambial, países sancionados, PEP internacional', 'CAF pep_international, CAF sanctions_international, declared crossborder data'],
        ['12', 'caf_biometria_screening', 'Liveness, facematch, documentoscopia, deepfake', 'CAF IntegrationLog (8 services biométricos)'],
        ['13', 'outras_integracoes', 'CFC, Open Finance, ECF, Portal Transparência, Brasil API', 'CFC, OpenFinance, ECF, BrasilAPI, PortalTransparencia (providers V5.2)'],
      ]} />

      <H3 num="15.2.1">Diferença vs V4 (7 dimensões SENTINEL × 13 dimensões score)</H3>
      <P>O V4 tem <B>13 dimensões no scoring</B> (Cap. 04.3) mas o <B>SENTINEL agrupa em 7</B> para narrativa (Cap. 07.7). V5.2 unifica em <B>13 dimensões analíticas únicas</B>, usadas tanto pelo scoring quanto pelo SENTINEL. Isso elimina o mismatch e simplifica a UI (Aba 3 "Dimensional BDC" passa a ter 13 cards uniformes).</P>

      <H2 num="15.3">Os 72 Bloqueios V5.2</H2>

      <P>V5.2 expande os 10 bloqueios V4 (B01-B10) para <B>72 códigos categorizados por dimensão</B>. Formato: <C>B-XXX-NN</C> onde XXX é o prefixo da dimensão e NN é o número sequencial dentro dela.</P>

      <H3 num="15.3.1">Distribuição por dimensão</H3>
      <Table dense headers={['Prefixo', 'Dimensão', 'Quantos bloqueios', 'Exemplos']} rows={[
        ['B-ID-NN', 'identidade_cadastro', '8', 'B-ID-01 CNPJ INATIVO · B-ID-02 CNPJ < 1 mês · B-ID-03 Capital social zerado · B-ID-04 Situação especial (RJ/Falência)'],
        ['B-SOC-NN', 'socios_beneficiarios', '10', 'B-SOC-01 Sócio sancionado · B-SOC-02 Sócio PEP sem EDD · B-SOC-03 QSA opaco · B-SOC-04 UBO não identificado'],
        ['B-EST-NN', 'estrutura_societaria', '6', 'B-EST-01 Participação circular · B-EST-02 Grupo > 50 empresas · B-EST-03 Empresa do grupo sancionada'],
        ['B-SAN-NN', 'sancoes_internacionais_nacionais', '8', 'B-SAN-01 Match OFAC exato · B-SAN-02 Match CEIS · B-SAN-03 Interpol Red Notice'],
        ['B-PRO-NN', 'processos_compliance', '6', 'B-PRO-01 Dívida ativa > R$ 500k · B-PRO-02 Processo criminal grave · B-PRO-03 Múltiplas execuções fiscais'],
        ['B-REP-NN', 'atividade_reputacao', '5', 'B-REP-01 Adverse media VERY_NEG fraude · B-REP-02 Shell Company > 80% · B-REP-03 Zero passagens web'],
        ['B-FIN-NN', 'financeiro_mercado', '6', 'B-FIN-01 Falência ativa · B-FIN-02 Credit score < 200 · B-FIN-03 Patch financeiro vermelho'],
        ['B-ESG-NN', 'trabalho_esg', '4', 'B-ESG-01 Lista Suja MTE · B-ESG-02 Embargo IBAMA · B-ESG-03 Desmatamento detectado'],
        ['B-SET-NN', 'compliance_setorial', '5', 'B-SET-01 Atividade regulada sem licença · B-SET-02 CNAE em vetados absolutos'],
        ['B-PLD-NN', 'pld_ft', '4', 'B-PLD-01 PEP grupo sem EDD · B-PLD-02 Doações > R$ 500k sem PEP declarado'],
        ['B-CB-NN', 'risco_pais_internacional', '4', 'B-CB-01 País sancionado · B-CB-02 PEP internacional sem EDD'],
        ['B-CAF-NN', 'caf_biometria_screening', '6', 'B-CAF-01 Liveness fraude (binary) · B-CAF-02 Deepfake detected · B-CAF-03 Documentscopia fraude'],
        ['B-SPL-NN', 'splits/subseller (capability)', '3', 'B-SPL-01 Marketplace sem KYC subsellers · B-SPL-02 Take rate > 30% sem justificativa'],
        ['B-REC-NN', 'recurrence (capability)', '2', 'B-REC-01 Chargeback recorrente > 5% · B-REC-02 Sem política cancelamento'],
        ['B-FCV-NN', 'cap_financial_capacity_validation', '3', 'B-FCV-01 TPV > 10× faturamento sem prova · B-FCV-02 ECF inexistente para porte declarado'],
      ]} />

      <P><B>Total: 72.</B> Catálogo completo em <C>lib/v5_2/avaliarBloqueios.js</C> + entidade <C>Bloqueio</C> seedada por <C>seedV5_2MasterData.js</C>.</P>

      <H3 num="15.3.2">Os 10 Bloqueios Absolutos</H3>
      <Note title="Bloqueio ABSOLUTO ≠ bloqueio comum" kind="rule">
        <p>Bloqueios comuns admitem <B>exceção via Categoria 5</B> (monitoramento intensivo) com aprovação de Head Compliance / CCO / Comitê. Os 10 ABSOLUTOS NÃO admitem nenhuma exceção — nem o Compliance Officer pode liberar. São bloqueios regulatoriamente intransponíveis.</p>
      </Note>

      <Table dense headers={['Código', 'Razão']} rows={[
        ['B-SAN-01', 'Match OFAC SDN exato — Lei 9.613/1998 Art. 10 §1º'],
        ['B-SAN-04', 'Match UN Security Council exato'],
        ['B-SAN-07', 'Interpol Red Notice ativo'],
        ['B-ID-01', 'CNPJ INAPTA/BAIXADA/NULA — não pode operar'],
        ['B-ESG-01', 'Lista Suja MTE (trabalho escravo) — Portaria Interministerial 4/2016'],
        ['B-CAF-01', 'Liveness fraude confirmada (score < threshold + binary)'],
        ['B-CAF-02', 'Deepfake DETECTED (binary)'],
        ['B-CAF-03', 'Documentscopia fraude confirmada'],
        ['B-SET-01', 'Atividade ilícita (jogos sem licença BCB, armas sem autorização Exército, etc.)'],
        ['B-CB-01', 'Operação com país sancionado (Coreia do Norte, Irã, Síria, etc.)'],
      ]} />

      <H2 num="15.4">Patch Financeiro — 5 Dimensões de Coerência</H2>

      <P>Camada exclusiva V5.2 que avalia <B>coerência entre TPV declarado e capacidade financeira comprovada</B>. Implementada em <C>lib/v5_2/financialCapacityValidation.js</C>. Ativada quando capability <C>cap_financial_capacity_validation</C> está ativa (Cap. 14.5).</P>

      <Table headers={['Dimensão', 'Valor declarado', 'Valor observado (fonte)', 'Threshold divergência', 'Bloqueio se exceder']} rows={[
        [<B key="d1">tpv_declarado_vs_bdc</B>, 'TPV mensal × 12', 'BDC TotalRevenue / EstimatedRevenue', '> 3× para cima', 'B-FCV-01'],
        [<B key="d2">faturamento_doc_vs_ecf</B>, 'Faturamento anual declarado', 'ECF + DRE quando enviados', '> 50%', 'B-FCV-02'],
        [<B key="d3">crc_status</B>, '—', 'Cadastro CRC do contador (quando aplicável)', 'Status irregular', 'Finding (não bloqueio)'],
        [<B key="d4">fluxo_caixa_open_finance</B>, 'TPV declarado / 12 (média)', 'Open Finance — média mensal últimos 6 meses (quando consentido)', '> 100%', 'Finding alto'],
        [<B key="d5">coerencia_setor</B>, 'TPV declarado', 'TPV médio do setor por porte (benchmark interno)', '> 5× a mediana', 'Finding alto'],
      ]} />

      <H3 num="15.4.1">Status colorido</H3>
      <Table dense headers={['Status', 'Condição', 'Pontos C5']} rows={[
        ['verde', 'Todas 5 dimensões coerentes', '0'],
        ['amarelo', '1-2 findings sem bloqueio', '+10 pts'],
        ['laranja', '3+ findings sem bloqueio OU 1 dimensão fora muito (mas sem cruzar bloqueio)', '+25 pts'],
        ['vermelho', '1+ bloqueio B-FCV-* ativo', '+50 pts + força Cat 5 ou Cat 4 dependendo do bloqueio'],
      ]} />

      <P>Status persistido em <C>OnboardingCase.patch_financeiro_status</C> + detalhes em <C>ComplianceScore.patch_financeiro_dimensoes</C>.</P>

      <H2 num="15.5">Cross-Validation 16 Campos (Estruturada)</H2>

      <P>V4 fazia cross-validation implícito no SENTINEL. V5.2 estrutura em <B>16 campos canônicos</B>, persistidos em <C>ComplianceScore.cross_validation_results</C> com schema fixo. Implementação: <C>lib/v5_2/crossValidation16.js</C>.</P>

      <H3 num="15.5.1">Os 16 campos</H3>
      <Table dense headers={['#', 'field_id', 'Declarado (questionário)', 'Observado (BDC dataset)']} rows={[
        ['1', 'razao_social', 'Pergunta razão social', 'basic_data.OfficialName'],
        ['2', 'nome_fantasia', 'Pergunta nome fantasia', 'basic_data.TradeName'],
        ['3', 'cnpj', 'Campo CNPJ form', 'basic_data.TaxIdNumber'],
        ['4', 'capital_social', 'Pergunta capital social', 'basic_data.ShareCapital'],
        ['5', 'data_abertura', 'Pergunta data fundação', 'basic_data.FoundedDate'],
        ['6', 'cnae_principal', 'Pergunta CNAE', 'basic_data.MainEconomicActivity'],
        ['7', 'endereco_logradouro', 'Pergunta endereço', 'addresses[].AddressLine1 (matriz)'],
        ['8', 'endereco_cidade', 'Pergunta cidade', 'addresses[].City'],
        ['9', 'endereco_uf', 'Pergunta UF', 'addresses[].State'],
        ['10', 'email_corporativo', 'Pergunta e-mail', 'emails_extended[] (matching)'],
        ['11', 'telefone', 'Pergunta telefone', 'phones_extended[] (matching)'],
        ['12', 'socios_quantidade', 'Pergunta # sócios', 'relationships[].length'],
        ['13', 'socios_nomes', 'Pergunta nomes sócios', 'relationships[].Name (set comparison)'],
        ['14', 'site_url', 'Pergunta presença digital', 'domains[].Domain'],
        ['15', 'tpv_mensal', 'Pergunta TPV', 'EstimatedRevenue / TotalRevenue (financial_market)'],
        ['16', 'funcionarios', 'Pergunta # funcionários', 'activity_indicators.EmployeesRange (RAIS)'],
      ]} />

      <H3 num="15.5.2">Schema do resultado</H3>
      <CodeBlock language="json">{`// ComplianceScore.cross_validation_results
{
  "fields": [
    {
      "field_id": "razao_social",
      "label": "Razão Social",
      "declared_value": "ACME COMERCIO LTDA",
      "bdc_value": "ACME COMERCIO E SERVICOS LTDA",
      "source_dataset": "basic_data",
      "status": "divergence",      // match | divergence | mismatch | unknown
      "divergence_pct": 23,         // só para numéricos
      "peso_v5_1": 2,               // peso na composição
      "bloqueio_disparado": null    // ou código B-XXX
    }
    // ... 15 outros campos
  ],
  "summary": {
    "match_count": 11,
    "divergence_count": 3,
    "mismatch_count": 1,
    "unknown_count": 1,
    "score_cross_val": 78           // 0-100 (16 - mismatches - 0.5*divergences) × 6.25
  }
}`}</CodeBlock>

      <H3 num="15.5.3">Status semantics</H3>
      <Table dense headers={['Status', 'Significado', 'Impacto']} rows={[
        ['match', 'Valores idênticos ou divergência ≤ 5%', '0 pts'],
        ['divergence', 'Divergência 5-30% (provavelmente desatualização)', '+5 a +15 pts'],
        ['mismatch', 'Divergência > 30% OU campos textuais sem similaridade significativa', '+25 pts (pode disparar bloqueio dimensão-dependente)'],
        ['unknown', 'BDC não retornou o campo OU declarado vazio', '0 pts (informativo)'],
      ]} />

      <H2 num="15.6">Matriz de Decisão V5.2 — 5 Categorias</H2>

      <P>Definida em <C>lib/v5_2/matrizDecisao.js</C>. Substitui as 4 categorias implícitas do V4 (Cap. 09) por 5 explícitas:</P>

      <Table headers={['Cat', 'Codigo', 'Quando aplica', 'Decisão UI', 'Ações automáticas']} rows={[
        ['1', <B key="c1">cat_1_auto_approve</B>, 'Score baixo + zero bloqueios + cross-val score ≥ 80 + patch verde', 'Aprovado', 'Setup conta normal · Monitoramento PADRÃO · 0% reserve'],
        ['2', <B key="c2">cat_2_conditional</B>, 'Score médio-baixo + 0-2 findings menores + patch ≤ amarelo', 'Aprovado com Condições', 'Condições automáticas (KYC subsellers em 30d, PLD trimestral, etc.) · Monitoramento REFORÇADO · 5-10% reserve'],
        ['3', <B key="c3">cat_3_manual_review</B>, 'Score alto-médio OU findings moderados OU patch laranja OU SENTINEL nivel_confianca < 60', 'Revisão Manual', 'Analista humano + SLA 48h · Bloqueia setup até decisão · Slack #compliance'],
        ['4', <B key="c4">cat_4_block</B>, 'Bloqueio absoluto (10 absolutos) OU score >= threshold tier sem chance de Cat 5', 'Recusado', 'Email automático · Bloqueio definitivo · Sem possibilidade de exceção (10 absolutos)'],
        ['5', <B key="c5">cat_5_intensive_monitoring</B>, 'Bloqueio comum (não absoluto) + valor comercial justifica + aceite Head Compliance', 'Aprovado com Monitoramento Intensivo (Cap. 17)', 'Cria PlanoMonitoramento · Exige aceite TermoAdicionalV5_2 · TPV cap inicial · Rolling reserve adicional · Gatilhos off-boarding ágil'],
      ]} />

      <H3 num="15.6.1">Função `resolverCategoria` — Pseudocódigo</H3>
      <CodeBlock language="js">{`// lib/v5_2/matrizDecisao.js — fluxo essencial
export function resolverCategoria(score, tier, bloqueiosAtivos, patchStatus, sentinelConfidence) {
  // 1. Bloqueio absoluto sempre Cat 4
  if (bloqueiosAtivos.some(b => BLOQUEIOS_ABSOLUTOS.includes(b))) {
    return 'cat_4_block';
  }

  // 2. Bloqueio comum: pode ser Cat 5 com aprovação manual
  if (bloqueiosAtivos.length > 0) {
    // Sistema não auto-aprova Cat 5 — requer ação manual de Head Compliance
    return 'cat_3_manual_review'; // analista decide entre Cat 4 ou aplicar Cat 5
  }

  // 3. Patch financeiro vermelho força Cat 3+
  if (patchStatus === 'vermelho') return 'cat_3_manual_review';

  // 4. SENTINEL confiança baixa força Cat 3
  if (sentinelConfidence < 60) return 'cat_3_manual_review';

  // 5. Score >= threshold do tier
  const blockThreshold = tier === 'tier_3' ? 850 : 720;
  if (score >= blockThreshold) return 'cat_3_manual_review';

  // 6. Categorias por faixa de score (tier-aware)
  return resolverCategoriaPorScoreFaixa(score, tier);
}`}</CodeBlock>

      <H2 num="15.7">Datasets — Lógica de Consulta Condicional</H2>

      <P>V4 consulta datasets em "grupos" estáticos por segmento (Cap. 05). V5.2 introduz <B>lógica condicional</B>: cada dataset tem regras explícitas para SER ou NÃO SER consultado. Implementado em <C>lib/v5_2/deveConsultarDataset.js</C>.</P>

      <H3 num="15.7.1">10 Razões catalogadas para não consultar</H3>
      <Table dense headers={['Razão', 'Quando aplica']} rows={[
        ['tier_1_below_threshold', 'Dataset caro só vale a pena ≥ T2 (ex: economic_group para tier_1 não justifica custo)'],
        ['tier_2_below_threshold', 'Dataset top-tier só ≥ T3'],
        ['capability_crossborder_not_active', 'Dataset crossborder só se capability ativa'],
        ['capability_splits_subseller_not_active', 'Datasets de splits só se capability ativa'],
        ['capability_recurrence_not_active', 'Datasets recorrência só se aplicável'],
        ['segment_not_applicable', 'Ex: dataset PIX_INTERMEDIARIO não para gateway de cartão'],
        ['morfologia_not_applicable', 'Ex: dataset de chargeback cartão para pix_heavy'],
        ['trigger_not_met', 'Trigger declarativo não satisfeito (ex: TPV < R$ 1M não dispara enriquecimento "deep")'],
        ['cost_optimization', 'Dataset opcional desativado por feature flag de custo'],
        ['dataset_not_contracted', 'BDC não inclui esse dataset no plano contratado'],
      ]} />

      <H3 num="15.7.2">Renderização "Not Consulted" na UI</H3>
      <Note title="Datasets não consultados são EXIBIDOS, não ocultados" kind="rule">
        <p>Princípio de transparência V5.2: na Aba 3 da nova UI, datasets não consultados aparecem em <B>estado próprio com tooltip explicativo da razão</B>. Analista entende exatamente o que foi (e não foi) avaliado. Persistido em <C>IntegrationLog.status = 'not_consulted'</C> + <C>not_consulted_reason</C>.</p>
      </Note>

      <H2 num="15.8">Snapshot — Imutabilidade da Decisão</H2>

      <P>Diferente do V4 que sobrescreve <C>ComplianceScore</C> a cada re-análise, V5.2 cria um <B>Snapshot imutável</B> da decisão final (entidade <C>Snapshot</C>). Permite:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><B>Replay determinístico:</B> reproduzir o cálculo exato com os mesmos inputs (função <C>replaySnapshotV5_2.js</C>)</li>
        <li><B>Diff entre versões:</B> ver exatamente o que mudou entre revalidações (componente <C>SnapshotDiffViewer</C>)</li>
        <li><B>Auditoria regulatória:</B> snapshot é a fonte legal — não importa se o código mudou depois</li>
        <li><B>Trilha de auditoria visual:</B> componente <C>AuditTimelineEvent</C> linha por linha (Aba 4 da nova UI)</li>
      </ul>

      <H3 num="15.8.1">Schema do Snapshot</H3>
      <CodeBlock language="js">{`// entities/Snapshot.json — campos principais
{
  onboarding_case_id: string,
  framework_version: 'v5.2',
  versao_engine: 'v5.2.3',          // versão exata do scoringV5_2.js
  inputs: {
    tier, segmento, morfologia,
    capabilities_ativas: string[],
    variaveis_input: object,         // todas variáveis V01-V60+ com valor
    cross_validation_input: object,
    patch_financeiro_input: object,
    bdc_raw: object,                 // raw BDC response (não modificado)
    caf_logs: object[],              // CAF integration logs no momento
  },
  outputs: {
    score_final: number,
    score_max: number,               // 850 ou 999
    subfaixa_tier_aware: string,
    categoria_decisao: string,
    bloqueios_ativos: string[],
    camadas: { c1, c2, c3, c4, c5 },
  },
  timestamp: ISO string,
  immutable: true,                   // RLS bloqueia update/delete
}`}</CodeBlock>

      <Source files={[
        'lib/v5_2/scoringV5_2.js',
        'lib/v5_2/avaliarBloqueios.js',
        'lib/v5_2/crossValidation16.js',
        'lib/v5_2/financialCapacityValidation.js',
        'lib/v5_2/matrizDecisao.js',
        'lib/v5_2/deveConsultarDataset.js',
        'lib/v5_2/constants.js (SEGMENT_BASE_SCORES_V5_2, MORFOLOGIA_ADJUSTMENTS, VARIAVEIS_PESO)',
        'functions/bdcEnrichCaseV5_2.js',
        'functions/scoreV5_2DryRun.js',
        'functions/replaySnapshotV5_2.js',
        'functions/seedV5_2MasterData.js (seed 58 datasets + 72 bloqueios)',
        'entities/Snapshot.json',
        'entities/Bloqueio.json',
        'entities/Dataset.json',
        'entities/Capability.json',
        'entities/ComplianceScore.json (campos v5_2: cross_validation_results, patch_financeiro_dimensoes, impact_score_top_alerts)',
        'docs/V5_2_BLOCO2_DATASETS_BLOQUEIOS.md',
      ]} />
    </Sec>
  );
}