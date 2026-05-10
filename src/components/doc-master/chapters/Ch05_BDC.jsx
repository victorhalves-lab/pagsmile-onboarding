import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Endpoint, Source } from '../DocPrimitives';

/**
 * Capítulo 5 — BigDataCorp Dataset-by-Dataset
 */
export default function Ch05_BDC() {
  return (
    <Sec id="ch-05">
      <H1 num="05">BigDataCorp — Cada Dataset, Cada Campo, Cada Interpretação</H1>

      <P>Documentação granular de cada dataset BDC consultado. Cada dataset tem: campos retornados pela API, como o sistema interpreta, qual analyzer no V4 consome, e impacto exato no scoring.</P>

      <H2 num="5.1">Endpoint Único da API</H2>

      <Endpoint
        method="POST"
        path="https://plataforma.bigdatacorp.com.br/empresas (PJ) | /pessoas (PF)"
        auth="AccessToken + TokenId headers"
        description="Endpoint único para todas as consultas BDC."
        params={[
          { name: 'Datasets', type: 'string (CSV)', required: true, desc: 'Lista de datasets concatenada por vírgula. Ex: "basic_data,kyc,owners_kyc"' },
          { name: 'q', type: 'string', required: true, desc: 'Query exata: "doc{CNPJ_OU_CPF_LIMPO}"' },
          { name: 'Limit', type: 'integer', required: false, desc: 'Sempre 1 nas chamadas do sistema' },
        ]}
        returns={`{
  "Status": [{ "Code": 200 }],
  "Result": [{
    "MatchKeys": "...",
    "BasicData": { ... },
    "Kyc": { ... }
  }]
}

// Erros HTTP tratados:
// 500/502/503/504 — Transient (BDC instável) → retry com backoff jittered
// 429              — Rate limit (throttling) → retry com backoff
// 408              — Timeout (BDC lento) → retry
// 400/401/403      — Non-retryable (erro permanente) → para imediatamente`}
        source="bdcEnrichCase.js linhas 112-191 (callBdcBatch)"
      />

      <H2 num="5.2">Bloco A — Dados Cadastrais (CRITICAL)</H2>

      <H3 num="5.2.1">basic_data</H3>
      <P>Dados oficiais Receita Federal. Acessado via <C>extractBasicData(result)</C>: tenta <C>result.BasicData</C>, depois <C>result.basic_data</C>.</P>
      <Table headers={['Campo BDC', 'Significado', 'Uso no V4']} rows={[
        ['OfficialName / CompanyName', 'Razão social', 'analyzeIdentity ln 342 — exibido como label'],
        ['TradeName / FantasyName', 'Nome fantasia', 'analyzeIdentity ln 344'],
        ['FoundedDate / Age.FoundedDate', 'Data abertura', 'analyzeIdentity ln 346 → calcula idade. analyzeBlocks ln 230 → B10 se ≤ 1 mês'],
        ['TaxIdStatus / TaxIdStatusDescription', 'Situação cadastral', 'analyzeBlocks ln 221 → B01 se não ATIVA/REGULAR'],
        ['ShareCapital / Capital', 'Capital social', 'analyzeIdentity ln 359 → +15 se < 1k, +5 se 1k-10k'],
        ['MainEconomicActivity / MainActivityCode', 'CNAE principal', 'analyzeIdentity ln 365 → +30 se em HIGH_RISK_CNAES'],
        ['Activities[]', 'CNAEs secundários', 'analyzeSectorial ln 700 → +10 se length > 8'],
      ]} />

      <H3 num="5.2.2">history_basic_data</H3>
      <P>Série temporal de alterações cadastrais. Função <C>analyzeEvolution</C> ln 475-506. Já documentado no Cap. 4.3.8.</P>

      <H2 num="5.3">Bloco B — KYC e Sanções (CRITICAL)</H2>

      <H3 num="5.3.1">kyc</H3>
      <P>Verificação contra OFAC SDN, EU Consolidated, UN, COAF, CEIS, CNEP, listas PEP.</P>
      <Table dense headers={['Campo', 'Trigger']} rows={[
        ['Sanctions / SanctionsDetails', 'length > 0 → B03 (score 850). Persiste sources: "OFAC, CEIS, etc"'],
        ['IsPEP / IsPep', 'true → +40 pts dimensão Owners (analyzeOwners ln 396)'],
      ]} />

      <H3 num="5.3.2">owners_kyc</H3>
      <CodeBlock language="js">{`// bdcEnrichCase.js linhas 393-402
for (const item of kycItems) {
  const name = item?.Name || 'N/I';
  if (item?.IsPEP || item?.IsPep) pepFound.push(name);
  const sanctions = item?.Sanctions || [];
  if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedFound.push(name);
}
if (pepFound.length > 0) score += 40;
if (sanctionedFound.length > 0) {
  // sócio sancionado também ativa B03 em analyzeBlocks
  items.push({ label: 'Sócios em sanções', value: sanctionedFound.join(', '), risk: 'CRITICO', points: 80 });
}`}</CodeBlock>

      <H3 num="5.3.3">economic_group_kyc</H3>
      <P>KYC de empresas vinculadas. Sanção em qualquer entidade ativa <B>B03c</B> (variante de B03 para grupo).</P>

      <H2 num="5.4">Bloco C — Processos e Dívidas (CRITICAL)</H2>

      <H3 num="5.4.1">processes, lawsuits_distribution_data, owners_lawsuits</H3>
      <P>Coletados, persistidos em ExternalValidationResult. <B>Sem analyzer dedicado direto no V4 atual</B> — análise é via SENTINEL e exibição em <C>BDCLawsuitsViewer</C>.</P>

      <H3 num="5.4.2">government_debtors</H3>
      <P>Inscrição em dívida ativa (PGFN, Estados, Municípios). Dupla checagem: analyzeCompliance ln 408-419 + analyzeBlocks ln 288-296.</P>
      <Table dense headers={['Threshold', 'Pts / Bloqueio']} rows={[
        ['sum > R$ 500.000', '+80 pts + B06 (score 850)'],
        ['sum 100k-500k', '+40 pts'],
        ['sum > 0 e ≤ 100k', '+20 pts'],
      ]} />

      <H3 num="5.4.3">collections</H3>
      <P>Negativações Serasa/SPC/Boa Vista. analyzeCompliance ln 421-431. <C>HasCollectionRecords = true</C> ou <C>{'TotalRecords > 0'}</C> → +30 pts.</P>

      <H2 num="5.5">Bloco D — Sócios e Política (IMPORTANT)</H2>

      <H3 num="5.5.1">relationships (QSA)</H3>
      <P>Lista oficial Receita Federal. Função <C>analyzeOwners</C> ln 376-389.</P>
      <Table dense headers={['Campo', 'Mapeamento']} rows={[
        ['RelatedEntityName / Name', 'Nome do sócio'],
        ['RelatedEntityTaxIdNumber / TaxIdNumber', 'CPF/CNPJ do sócio'],
        ['RelationshipName / Qualification / Role', 'Cargo (sócio admin, quotista, diretor)'],
      ]} />
      <P>Esta é a fonte <B>P5</B> do representante legal pós-BDC em autoEnrichOnboarding.</P>

      <H3 num="5.5.2">configurable_recency_qsa, political_involvement, owners_influence, owners_electoral_donors</H3>
      <P>QSA tempo-real + vínculos políticos. <C>analyzeEmployeesKyc</C> ln 666-670: <C>{'OwnersInfluence > 0.7'}</C> → +15 pts.</P>

      <H2 num="5.6">Bloco E — Pegada Digital (COMPLEMENTARY)</H2>

      <H3 num="5.6.1">activity_indicators (chave para Shell Company)</H3>
      <Table dense headers={['Campo', 'Threshold', 'Efeito']} rows={[
        ['ShellCompanyLikelyhood / ShellCompanyLikelihood', '> 0.8', 'B05 → score 850'],
        ['ShellCompanyLikelyhood', '0.5-0.8', 'badge CRITICO'],
        ['ShellCompanyLikelyhood', '0.3-0.5', 'badge ALTO'],
      ]} />

      <H3 num="5.6.2">domains, passages, online_ads, marketplace_data, merchant_category_data</H3>
      <P>Coletados, exibidos em BDCAnalysisSection. Sem +pts diretos no V4 atual — alimentam SENTINEL para narrativa.</P>

      <H2 num="5.7">Bloco F — Reputação (IMPORTANT)</H2>

      <H3 num="5.7.1">reputations_and_reviews</H3>
      <P>Reclame Aqui + Google Reviews. analyzeReputation ln 515-527. Score &lt; 5 → +30. Score 5-7 → +10.</P>

      <H3 num="5.7.2">media_profile_and_exposure</H3>
      <P>Análise NLP de mídia. analyzeReputation ln 529-543 + analyzeBlocks ln 298-312.</P>
      <Table dense headers={['Trigger', 'Efeito']} rows={[
        ['Sentiment "VERY_NEGATIVE" + topics regex /fraude|lavagem|crime|corrup/i', 'B07 → score 850'],
        ['Sentiment "NEGATIVE" sem VERY_', '+15 pts'],
      ]} />

      <H2 num="5.8">Bloco G — Financeiro (COMPLEMENTARY)</H2>

      <H3 num="5.8.1">financial_market</H3>
      <P>analyzeFinancial ln 557-568.</P>
      <Table dense headers={['Campo', 'Trigger', 'Pts']} rows={[
        ['HasBankruptcy = true OR Bankruptcy = true', 'Falência/RJ', '+50'],
        ['TotalRevenue / EstimatedRevenue', '> 0', 'informativo — alimenta cross-validation TPV'],
      ]} />

      <H3 num="5.8.2">company_evolution</H3>
      <P>analyzeFinancial ln 570-579. <C>RevenueGrowthPercentage &lt; -30%</C> → +20 pts.</P>

      <H3 num="5.8.3">economic_group, economic_group_relationships</H3>
      <P>Grupo. Coletado para BDCFullAnalysis. Sem +pts no V4 atual.</P>

      <H2 num="5.9">Bloco H — ESG, Crédito, Contatos</H2>

      <H3 num="5.9.1">esg_and_compliance — ALTO IMPACTO</H3>
      <P>analyzeESG ln 451-466 + analyzeBlocks ln 314-329.</P>
      <Table dense headers={['Campo', 'Trigger', 'Efeito']} rows={[
        ['SlaveLabor / SlaveLaborList / ListaSuja / TrabalhoEscravo', 'true OU regex /sim|true|encontrad/i', 'B08 → 850 + 200 pts ESG'],
        ['EnvironmentalEmbargo / IbamaEmbargo', 'true', 'B09 → score 850'],
      ]} />

      <H3 num="5.9.2">credit_risk + credit_score + scr_positive_score</H3>
      <P>analyzeCreditRisk ln 750-796 (visto em Cap. 4.3.4).</P>

      <H3 num="5.9.3">phones_extended, emails_extended, addresses_extended, related_people_*</H3>
      <P>analyzeContacts (Cap. 4.3.10). FREE_PROVIDERS hardcoded em ln 590.</P>

      <H3 num="5.9.4">industrial_property, owners_industrial_property, licenses_and_authorizations</H3>
      <P>Coletados, exibidos em painel Assets. Sem pts no V4 atual.</P>

      <H2 num="5.10">Datasets Exclusivos PF (endpoint /pessoas)</H2>
      <Table headers={['Dataset', 'Conteúdo', 'Uso V4 PF']} rows={[
        ['scr_positive_score', 'Score SCR Banco Central. 0-1000.', 'analyzeCreditRisk ln 784-790: ALTO se < 300'],
        ['first_level_family_kyc', 'KYC parentes 1º grau', 'CRITICAL — alimenta B04'],
        ['social_assistance', 'Beneficiário Bolsa/BPC/CadÚnico', 'IMPORTANT — perfil incompatível se TPV alto'],
        ['presumed_income', 'Estimativa renda mensal', 'Cross-validation TPV declarado'],
        ['financial_interests', 'Fundos, seguros, previdência', 'SENTINEL'],
        ['personal_relationships', 'Rede pessoal (coabitação)', 'Detecta múltiplas pessoas mesmo endereço (rede laranjas)'],
        ['simples_nacional_collection', 'Histórico Simples/MEI', 'Cross-check teto MEI R$81k/ano'],
        ['electoral_donors', 'Doações TSE', '> R$100k = vínculo político'],
        ['public_servants', 'Vínculo órgão público', 'Conflito Lei 8.112/1990'],
        ['risk_data', 'Indicadores agregados PF', '+pts se em cobrança'],
      ]} />

      <H2 num="5.11">Sistema de Lotes Detalhado</H2>

      <H3 num="5.11.1">CRITICAL — Sequencial</H3>
      <P>Lotes CRITICAL rodam <B>sequencialmente</B>. Razão: se IDENTIDADE falha, KYC e LEGAL não são chamados (economiza créditos BDC).</P>

      <H3 num="5.11.2">IMPORTANT + COMPLEMENTARY — Paralelo</H3>
      <CodeBlock language="js">{`// linhas 998-1010
const nonCriticalBatches = Object.entries(batchDefs)
  .filter(([_, def]) => def.priority !== 'CRITICAL');

const parallelResults = await Promise.all(
  nonCriticalBatches.map(([batchId, def]) =>
    callBdcBatch({ accessToken, tokenId, endpoint, document: cleanDoc, datasets: def.datasets, batchId, priority: def.priority })
  )
);`}</CodeBlock>

      <H3 num="5.11.3">Detecção de resposta vazia</H3>
      <CodeBlock language="js">{`// linhas 99-107
function isResponseMeaningful(bdcData, datasets) {
  if (!bdcData) return false;
  if (bdcData.Status?.some(s => s.Code >= 400)) return false;
  const result = bdcData.Result?.[0];
  if (!result) return false;
  const resultKeys = Object.keys(result).filter(k => k !== 'MatchKeys');
  return resultKeys.length > 0;
}`}</CodeBlock>
      <P>Vazio → conta como falha → triggers retry.</P>

      <H2 num="5.12">Autorização de bdcEnrichCase</H2>

      <CodeBlock language="js">{`// linhas 856-895 — 3 caminhos de autorização
let isAuthorized = false;

// 1. Admin direto
try { const u = await base44.auth.me(); if (u?.role === 'admin') isAuthorized = true; } catch {}

// 2. Service-role probe (pipeline interno)
if (!isAuthorized) {
  try {
    await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1);
    isAuthorized = true;
  } catch {}
}

// 3. Anonymous com onboardingCaseId válido (chained call fallback)
// Janela de 24h previne ataque com caseId antigo
if (!isAuthorized && onboardingCaseId) {
  const caseRec = (await base44.asServiceRole.entities.OnboardingCase
    .filter({ id: onboardingCaseId }))[0];
  if (caseRec) {
    const caseAgeHours = (Date.now() - new Date(caseRec.created_date).getTime()) / 3600000;
    const isRecent = caseAgeHours < 24;
    const bdcNotRun = !caseRec.bigDataCorpCompleted;
    const inProcessing = caseRec.status === 'Pendente' || caseRec.status === 'Em Processamento';
    if (isRecent && bdcNotRun && inProcessing) isAuthorized = true;
  }
}`}</CodeBlock>

      <Note title="Por que essa lógica existe" kind="warn">
        Bug histórico: <C>asServiceRole.functions.invoke</C> entre funções perde contexto e retorna 403 ("chained call 403"). Solução: aceitar caller anônimo com onboardingCaseId válido SE caso tem &lt; 24h, ainda não rodou BDC e está processável. Janela de 24h previne ataque com caseId antigo queimando créditos BDC.
      </Note>

      <Source files={[
        'functions/bdcEnrichCase.js (1172 linhas)',
        'functions/bdcQueryCompany.js',
        'functions/bdcQueryPerson.js',
        'functions/bdcEnrichLead.js',
        'functions/bdcDeepDueLead.js',
        'functions/bdcRetryWorker.js',
        'functions/bdcBigIdFallback.js',
        'functions/bdcHealthCheck.js',
        'entities/BdcRetryQueue.json',
      ]} />
    </Sec>
  );
}