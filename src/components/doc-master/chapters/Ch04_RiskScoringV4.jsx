import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Threshold, Source } from '../DocPrimitives';

/**
 * Capítulo 4 — Risk Scoring V4 Microscópico
 */
export default function Ch04_RiskScoringV4() {
  return (
    <Sec id="ch-04">
      <H1 num="04">Risk Scoring V4 — Cada Variável, Cada Peso, Cada Threshold</H1>

      <P>O motor de scoring V4 é o coração da decisão Data-First. Vive inteiramente em <C>functions/bdcEnrichCase.js</C> (1172 linhas). Tudo neste capítulo é extraído do código fonte real.</P>

      <H2 num="4.1">Fórmula Final do Score V4</H2>

      <CodeBlock language="js">{`// bdcEnrichCase.js linhas 1101-1108 (handler para PJ)
const COMPONENT_WEIGHTS = {
  identity: 0.10,    owners: 0.18,        digital: 0.07,
  compliance: 0.20,  reputation: 0.08,    financial: 0.08,
  evolution: 0.06,   esg: 0.05,           contacts: 0.03,
  employeesKyc: 0.02, sectorial: 0.02,    assets: 0.02,
  creditRisk: 0.09,
};

let weightedTotal = 0;
for (const [key, weight] of Object.entries(COMPONENT_WEIGHTS)) {
  weightedTotal += (componentScores[key] || 0) * weight;
}
const baseScore = SEGMENT_BASE_SCORES[templateModel] || 80;
const finalScore = Math.max(0, Math.min(849, baseScore + Math.round(weightedTotal)));
const hasBlock = blocks.length > 0;

// Score final salvo:
analysis.scoring.finalScore = hasBlock ? 850 : finalScore;`}</CodeBlock>

      <Note title="Fórmula matemática" kind="rule">
        <p className="font-mono"><B>Score Final = max(0, min(849, Score_Base + Σ(Score_Dimensão × Peso_Dimensão)))</B></p>
        <p>Se algum bloqueio B01-B10 ativo: <C>Score = 850</C>, <C>Subfaixa = 5</C>.</p>
        <p>Pesos somam exatamente <B>1.00</B> (100%): 0.10+0.18+0.07+0.20+0.08+0.08+0.06+0.05+0.03+0.02+0.02+0.02+0.09 = 1.00.</p>
      </Note>

      <H2 num="4.2">Camada 1 — SEGMENT_BASE_SCORES Exatos</H2>

      <P>Constante em <C>bdcEnrichCase.js</C> linhas 45-57. Templates não listados recebem default 80.</P>

      <Table headers={['Template Model', 'Score Base', 'Justificativa']} rows={[
        [<C key="1">ComplianceGatewayV4</C>, '175', 'Maior risco — intermediário de pagamentos'],
        [<C key="2">ComplianceGatewayAutocomplete</C>, '175', 'Mesmo do Gateway V4'],
        [<C key="3">pix_intermediario_v4</C>, '155', 'Intermediário PIX, alta velocidade transacional'],
        [<C key="4">ComplianceMarketplaceV4</C>, '140', 'Sub-merchants não verificados individualmente'],
        [<C key="5">ComplianceMarketplaceAutocomplete</C>, '140', 'Mesmo do Marketplace V4'],
        [<C key="6">CompliancePlataformaVerticalV4</C>, '120', 'Nichos regulados (saúde, educação, finanças)'],
        [<C key="7">ComplianceDropshippingV4</C>, '110', 'Alta taxa de chargeback por não entrega'],
        [<C key="8">pix_api_enterprise</C>, '200', 'Enterprise PIX direto API — alta exposição'],
        [<C key="9">ComplianceInfoprodutosV4</C>, '90', 'Produto intangível, alta taxa reembolso'],
        [<C key="10">ComplianceEcommerceV4</C>, '80', 'Padrão E-commerce com estoque'],
        [<C key="11">ComplianceMerchantAutocomplete</C>, '80', 'Mesmo do E-commerce V4'],
        [<C key="12">ComplianceSaaSV4</C>, '70', 'Receita recorrente previsível'],
        [<C key="13">CompliancePixMerchantV4</C>, '65', 'PIX direto, sem intermediação'],
        [<C key="14">pix_merchant_v4</C>, '65', 'Alias do Pix Merchant V4'],
        [<C key="15">ComplianceMerchantLinkV4</C>, '60', 'Link de pagamento avulso'],
        [<C key="16">ComplianceEducacaoV4</C>, '50', 'Setor regulado MEC'],
        [<C key="17">subseller, subseller_v2</C>, '45', 'Subseller PJ'],
        [<C key="18">ComplianceMPEV4</C>, '35', 'MPE — análise simplificada'],
        [<C key="19">subseller_pf</C>, '30', 'Subseller PF'],
      ]} />

      <H2 num="4.3">Camada 2 — As 13 Dimensões com Pesos %</H2>

      <H3 num="4.3.1">Compliance (peso 20%) — A maior dimensão</H3>
      <P>Função <C>analyzeCompliance</C> linhas 406-433. Datasets: <C>government_debtors, collections</C>.</P>
      <Threshold severity="CRITICO" when={'totalDebt > 500.000'} points="+80 pts (também ativa B06)" source="ln 414" />
      <Threshold severity="ALTO" when={'totalDebt > 100.000 e ≤ 500.000'} points="+40 pts" source="ln 414" />
      <Threshold severity="MEDIO" when={'totalDebt > 0 e ≤ 100.000'} points="+20 pts" source="ln 414" />
      <Threshold severity="OK" when="totalDebt = 0" points="0 pts" source="ln 418" />
      <Threshold severity="ALTO" when={'HasCollectionRecords = true OU TotalRecords > 0 (Collections)'} points="+30 pts" source="ln 426-429" />

      <H3 num="4.3.2">Owners QSA (peso 18%) — Sócios</H3>
      <P>Função <C>analyzeOwners</C> linhas 375-404. Datasets: <C>relationships, owners_kyc</C>.</P>
      <Threshold severity="ALTO" when="owners.length === 0 (zero sócios no QSA)" points="+15 pts" source="ln 388" />
      <Threshold severity="ALTO" when="qualquer sócio com IsPEP/IsPep === true" points="+40 pts" source="ln 400" />
      <Threshold severity="CRITICO" when={'qualquer sócio com Sanctions[].length > 0'} points="+80 pts (também ativa B03)" source="ln 401" />

      <H3 num="4.3.3">Identity (peso 10%) — Cadastral</H3>
      <P>Função <C>analyzeIdentity</C> linhas 337-373. Dataset: <C>basic_data</C>.</P>
      <Threshold severity="ALTO" when="months ≤ 1 desde FoundedDate" points="+25 pts (também ativa B10)" source="ln 352" />
      <Threshold severity="BAIXO" when={'years < 2 (mas months > 1)'} points="+5 pts" source="ln 353" />
      <Threshold severity="BAIXO" when={'years < 5 (e ≥ 2)'} points="+5 pts" source="ln 354" />
      <Threshold severity="OK" when="years ≥ 5" points="0 pts" source="ln 355" />
      <Threshold severity="ALTO" when={'ShareCapital < R$ 1.000'} points="+15 pts" source="ln 362" />
      <Threshold severity="MEDIO" when="ShareCapital R$ 1.000-10.000" points="+5 pts" source="ln 362" />
      <Threshold severity="OK" when="ShareCapital ≥ R$ 10.000" points="0 pts" source="ln 362" />
      <Threshold severity="CRITICO" when="MainEconomicActivity em HIGH_RISK_CNAES (lista de 13 CNAEs)" points="+30 pts" source="ln 369" />

      <H3 num="4.3.4">Credit Risk (peso 9%)</H3>
      <P>Função <C>analyzeCreditRisk</C> linhas 750-796. Datasets: <C>credit_risk, credit_score, scr_positive_score</C>.</P>
      <Threshold severity="CRITICO" when={'Credit Score < 200'} points="+50 pts" source="ln 764" />
      <Threshold severity="ALTO" when="Credit Score 200-399" points="+30 pts" source="ln 765" />
      <Threshold severity="MEDIO" when="Credit Score 400-599" points="+15 pts" source="ln 766" />
      <Threshold severity="OK" when="Credit Score ≥ 600" points="0 pts" source="ln 767" />
      <Threshold severity="ALTO" when="RiskLevel inclui HIGH/ALTO" points="+25 pts" source="ln 778" />
      <Threshold severity="MEDIO" when="RiskLevel inclui MEDIUM/MEDIO" points="+10 pts" source="ln 779" />
      <Threshold severity="ALTO" when={'SCR BCB Score < 300 (PF)'} points="badge ALTO (informativo)" source="ln 789" />

      <H3 num="4.3.5">Reputation (peso 8%)</H3>
      <P>Função <C>analyzeReputation</C> linhas 508-548. Datasets: <C>reputations_and_reviews, media_profile_and_exposure</C>.</P>
      <Threshold severity="ALTO" when={'Reclame Aqui Score < 5'} points="+30 pts" source="ln 521" />
      <Threshold severity="MEDIO" when="Reclame Aqui Score 5-7" points="+10 pts" source="ln 522" />
      <Threshold severity="OK" when="Reclame Aqui Score ≥ 7" points="0 pts" source="ln 523" />
      <Threshold severity="MEDIO" when="Sentiment NEGATIVE (sem VERY_)" points="+15 pts" source="ln 535" />

      <H3 num="4.3.6">Financial (peso 8%)</H3>
      <P>Função <C>analyzeFinancial</C> linhas 550-585. Datasets: <C>financial_market, company_evolution</C>.</P>
      <Threshold severity="CRITICO" when="HasBankruptcy = true OU Bankruptcy = true" points="+50 pts" source="ln 566" />
      <Threshold severity="ALTO" when={'RevenueGrowthPercentage < -30%'} points="+20 pts" source="ln 576" />

      <H3 num="4.3.7">Digital (peso 7%)</H3>
      <P>Função <C>analyzeDigital</C> linhas 435-449. Dataset: <C>activity_indicators</C> (apenas badge — pontos vêm do B05).</P>
      <Threshold severity="CRITICO" when={'ShellCompanyLikelyhood > 0.5 (50%)'} points="badge CRITICO (sem +pts; B05 ativa em > 0.8)" source="ln 444" />
      <Threshold severity="ALTO" when="ShellCompanyLikelyhood 0.3-0.5" points="badge ALTO" source="ln 444" />

      <H3 num="4.3.8">Evolution (peso 6%)</H3>
      <P>Função <C>analyzeEvolution</C> linhas 475-506. Dataset: <C>history_basic_data</C>.</P>
      <Threshold severity="ALTO" when="CnaeTotalChanges ≥ 5" points="+25 pts" source="ln 484" />
      <Threshold severity="MEDIO" when="CnaeTotalChanges 3-4" points="+15 pts" source="ln 485" />
      <Threshold severity="ALTO" when="TradeNameTotalChanges ≥ 3" points="+15 pts" source="ln 489" />
      <Threshold severity="MEDIO" when="TradeNameTotalChanges 2" points="+5 pts" source="ln 490" />
      <Threshold severity="ALTO" when="TaxRegimeTotalChanges ≥ 3" points="+15 pts" source="ln 494" />
      <Threshold severity="MEDIO" when="CapitalTotalChanges ≥ 4" points="+10 pts" source="ln 498" />

      <H3 num="4.3.9">ESG (peso 5%)</H3>
      <P>Função <C>analyzeESG</C> linhas 451-466. Dataset: <C>esg_and_compliance</C>.</P>
      <Threshold severity="CRITICO" when="SlaveLabor = true (Lista Suja MTE)" points="+200 pts (também ativa B08)" source="ln 459" />

      <H3 num="4.3.10">Contacts (peso 3%)</H3>
      <P>Função <C>analyzeContacts</C> linhas 587-641.</P>
      <Threshold severity="MEDIO" when="emailList.length === 0" points="+10 pts" source="ln 609" />
      <Threshold severity="MEDIO" when="todos os e-mails em FREE_PROVIDERS" points="+15 pts" source="ln 610" />
      <Threshold severity="MEDIO" when="phoneCount === 0" points="+10 pts" source="ln 622" />
      <Threshold severity="MEDIO" when="addrCount === 0" points="+5 pts" source="ln 634" />

      <CodeBlock language="js">{`// linha 590 — provedores considerados "gratuitos"
const FREE_PROVIDERS = [
  'gmail.com', 'hotmail.com', 'outlook.com',
  'yahoo.com', 'yahoo.com.br', 'bol.com.br',
  'uol.com.br', 'icloud.com', 'protonmail.com', 'live.com'
];`}</CodeBlock>

      <H3 num="4.3.11">Employees KYC (peso 2%)</H3>
      <P>Função <C>analyzeEmployeesKyc</C> linhas 643-676.</P>
      <Threshold severity="ALTO" when="≥ 1 PEP em funcionários-chave (related_people)" points="+25 pts" source="ln 659" />
      <Threshold severity="CRITICO" when="≥ 1 funcionário sancionado" points="+40 pts" source="ln 660" />
      <Threshold severity="MEDIO" when={'OwnersInfluence > 0.7'} points="+15 pts" source="ln 669" />

      <H3 num="4.3.12">Sectorial (peso 2%)</H3>
      <P>Função <C>analyzeSectorial</C> linhas 678-716.</P>
      <Threshold severity="MEDIO" when={'Activities.length > 8 (CNAEs secundários)'} points="+10 pts" source="ln 700" />

      <H3 num="4.3.13">Assets (peso 2%)</H3>
      <P>Função <C>analyzeAssets</C> linhas 718-748. Apenas informativo (0 pts em PJ).</P>

      <H2 num="4.4">Camada 3 — Bloqueios B01-B10 (Análise Completa)</H2>

      <P>Função <C>analyzeBlocks</C> em bdcEnrichCase.js linhas 217-332. Cada bloqueio tem código, label, severity, detalhe regulatório e score 850.</P>

      <Table headers={['Código', 'Trigger exato', 'Mensagem persistida', 'Base regulatória']} rows={[
        ['B01', 'TaxIdStatus / TaxIdStatusDescription NÃO contém "ATIV" nem "REGULAR"', 'CNPJ Inativo — empresa não pode exercer atividades', 'Circ. BCB 3.978/2020 Art. 2º'],
        ['B10', 'months = (now - FoundedDate) / 30.44 dias ≤ 1', 'CNPJ recém-aberto (≤ 1 mês) — recusa automática', 'Política interna v4'],
        ['B03', 'Kyc.Sanctions[].length > 0 (empresa em lista)', 'Empresa em lista de sanções — N sanção(ões): {sources}', 'Lei 9.613/1998 Art. 10'],
        ['B03 (sócio)', 'OwnersKyc.Sanctions[].length > 0 (algum sócio)', 'Sócio(s) em lista de sanções: {nomes}', 'Circ. BCB 3.978/2020 Art. 16'],
        ['B03c', 'EconomicGroupKyc.Sanctions[].length > 0', 'Entidade do grupo econômico em sanções: {nomes}', 'FATF Rec. 24-25'],
        ['B05', 'ActivityIndicators.ShellCompanyLikelyhood > 0.8 (80%)', 'Provável empresa de fachada — Shell Company score: X%', 'Política interna v4'],
        ['B06', 'sum(GovernmentDebtors[].TotalValue OR Value) > 500.000', 'Dívida ativa > R$500k — Total: R$ X', 'Lei 6.830/1980'],
        ['B07', 'MediaProfileAndExposure.Sentiment inclui VERY_NEGATIVE E topics regex /fraude|lavagem|crime|corrup/i', 'Adverse media grave — Mídia VERY_NEGATIVE: {topics}', 'Circ. BCB 3.978/2020 Art. 11'],
        ['B08', 'EsgAndCompliance.SlaveLabor === true OU regex /sim|true|encontrad/i', 'Lista Suja MTE — Trabalho Escravo', 'Portaria Interministerial 4/2016'],
        ['B09', 'EsgAndCompliance.EnvironmentalEmbargo === true OU IbamaEmbargo', 'Embargo ambiental IBAMA ativo', 'Lei 9.605/1998'],
      ]} />

      <Note title="Bloqueios PF (B01, B02, B03)" kind="info">
        Função <C>analyzePersonBlocks</C> linhas 798-825. <B>B01:</B> TaxIdStatus PF não contém "REGULAR". <B>B02:</B> idade &lt; 18 anos. <B>B03:</B> Kyc.Sanctions[].length &gt; 0.
      </Note>

      <H2 num="4.5">Mapeamento Score → Subfaixa</H2>

      <CodeBlock language="js">{`// bdcEnrichCase.js linha 1120 — lógica EXATA
const subfaixa = hasBlock ? '5' :
  finalScore <= 100 ? '1A' :
  finalScore <= 200 ? '1B' :
  finalScore <= 300 ? '2A' :
  finalScore <= 400 ? '2B' :
  finalScore <= 500 ? '3A' :
  finalScore <= 600 ? '3B' :
  finalScore <= 700 ? '4' :   // 601-700
  '5';                          // 701-849 também = 5

const subfaixaNames = {
  '1A': 'VERDE EXPRESS',  '1B': 'VERDE',
  '2A': 'AZUL LEVE',      '2B': 'AZUL',
  '3A': 'AMARELO',        '3B': 'LARANJA',
  '4': 'VERMELHO',        '5': 'BLOQUEIO'
};`}</CodeBlock>

      <Note title="Sutileza: faixas de score 701-849 vs 850" kind="warn">
        O comparador <C>{'finalScore <= 700 ? \'4\' : \'5\''}</C> mapeia <B>701-849 também para subfaixa 5</B> (BLOQUEIO) mesmo SEM bloqueio explícito. <B>Apenas 850 explícito vem de bloqueios B01-B10.</B>
      </Note>

      <H2 num="4.6">Resilência: Try/Catch em Cada Analyzer</H2>

      <P>Cada analyzer (analyzeEvolution, analyzeReputation, etc.) é envelopado em try/catch:</P>
      <CodeBlock language="js">{`function analyzeEvolution(result) {
  try {
    // ... análise
    return { score, items };
  } catch (e) {
    return { score: 0, items: [{ label: 'Evolução', value: \`Erro parse: \${e.message}\`, risk: 'INFO', points: 0 }] };
  }
}`}</CodeBlock>
      <P>Se um dataset BDC vier com shape inesperado, o analyzer retorna <C>score: 0</C> + item de erro. <B>Pipeline nunca quebra.</B></P>

      <H2 num="4.7">All-or-Enqueue v2 (2026-04-21)</H2>

      <P>SE QUALQUER lote (mesmo non-critical) falhar, o pipeline BLOQUEIA e enfileira em <C>BdcRetryQueue</C>. Filosofia: score só calcula com 100% dos datasets disponíveis.</P>

      <CodeBlock language="js">{`// bdcEnrichCase.js linhas 1023-1064
const failedNonCritical = Object.entries(batchStatuses)
  .filter(([_, s]) => !s.success && s.priority !== 'CRITICAL');

if (failedNonCritical.length > 0 && onboardingCaseId) {
  const queueData = {
    onboarding_case_id: onboardingCaseId,
    batches_pending: [...batchesPending],
    batches_success: [...batchesSuccess],
    next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    status: 'pending',
  };
  // upsert BdcRetryQueue + atualiza OnboardingCase status

  return Response.json({
    success: false, reason: 'non_critical_batches_failed_enqueued',
    failedBatches: [...], willRetry: true,
  }, { status: 202 });
}`}</CodeBlock>

      <P>O <C>bdcRetryWorker</C> (automation 5min) varre <C>BdcRetryQueue.status='pending' AND next_retry_at &lt;= now</C> e processa lotes individualmente.</P>

      <H2 num="4.8">Persistência Final</H2>

      <CodeBlock language="js">{`// bdcEnrichCase.js linhas 1129-1153
const v4RedFlags = analysis.blocks.map(b => \`V4: \${b.code}_\${b.label}\`);
const scoreData = {
  onboarding_case_id: onboardingCaseId,
  framework_version: 'v4.0',
  segmento: templateModel || 'unknown',
  score_base_segmento: analysis.scoring.baseScore,        // C1
  score_variaveis: analysis.scoring.variablesScore,        // C2 (60% do weightedTotal)
  score_enriquecimento: analysis.scoring.enrichmentScore,  // C3 (40% do weightedTotal)
  score_final: analysis.scoring.finalScore,                // PERSISTIDO — fonte única
  subfaixa: analysis.scoring.subfaixa,
  subfaixa_nome: analysis.scoring.subfaixaNome,
  bloqueios_ativos: analysis.blocks.map(b => \`\${b.code}_\${b.label}\`),
  variaveis_aplicadas: analysis.sections,
  red_flags: v4RedFlags,
  fase_2_completa: true,
  data_analise_fase_2: new Date().toISOString(),
};
// upsert em ComplianceScore + update em OnboardingCase`}</CodeBlock>

      <Note title="Decomposição: variablesScore vs enrichmentScore" kind="info">
        Para PJ, divisão é <C>variablesScore = round(weightedTotal * 0.6)</C> e <C>enrichmentScore = round(weightedTotal * 0.4)</C>. Convenção visual para a UI mostrar "quanto vem de variáveis vs enriquecimento" — matematicamente os dois saem do mesmo cálculo ponderado.
      </Note>

      <Source files={[
        'functions/bdcEnrichCase.js (1172 linhas — todas as constantes e analyzers)',
        'entities/ComplianceScore.json',
        'entities/BdcRetryQueue.json',
        'functions/bdcRetryWorker.js',
      ]} />
    </Sec>
  );
}