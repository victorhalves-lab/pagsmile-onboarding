import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 7 — SENTINEL IA Microscopia
 */
export default function Ch07_Sentinel() {
  return (
    <Sec id="ch-07">
      <H1 num="07">SENTINEL — Agente IA Relator (Não-Decisor)</H1>

      <P>SENTINEL é o agente de IA que produz a narrativa qualitativa do dossiê. Implementado em <C>functions/analyzeOnboarding.js</C> + <C>agents/sentinel</C>. Premissa de v7: <B>SENTINEL é RELATOR, nunca DECISOR</B>. Pode escalar V4 → Manual em casos qualitativos extremos, mas <B>nunca rebaixa</B> Manual → Aprovado.</P>

      <H2 num="7.1">Modelo e Configuração</H2>
      <Table headers={['Parâmetro', 'Valor', 'Justificativa']} rows={[
        ['Modelo', 'gemini_3_1_pro', 'Maior contexto + custo aceitável para análise complexa. Suporta web search via add_context_from_internet quando necessário.'],
        ['Temperatura efetiva', 'baixa (~0.2 implícita)', 'Análise compliance exige consistência > criatividade.'],
        ['Concurrency', '4 chamadas paralelas', 'Reduz latência total de ~60s sequencial para ~25s paralelo.'],
        ['Output', 'JSON estruturado via response_json_schema', 'Garante parseability — sem text-mining frágil.'],
      ]} />

      <H2 num="7.2">As 4 Chamadas Paralelas</H2>
      <Table headers={['Chamada', 'Input', 'Output JSON']} rows={[
        ['1. Análise Questionário', 'Todas as QuestionnaireResponse + template metadata', 'pontos_positivos[], pontos_atencao[], red_flags qualitativos[], cross_validation[] (declarado vs verificável)'],
        ['2. Análise BDC', 'ExternalValidationResult resultData (provider=BigDataCorp) raw', 'analise_dimensional{} por dimensão (7 dims), interpretação por dataset, narrativa'],
        ['3. Análise CAF', 'IntegrationLog filtrado provider=CAF + DocumentUpload notes', 'avaliação biométrica qualitativa, interpretação OCR confidence, padrões anômalos'],
        ['4. Consolidação', 'Outputs 1+2+3 + V4 (subfaixa, score, blocks)', 'sumario_executivo, analise_completa_ia, parecer_final, sentinel_recommendation, nivel_confianca_ia'],
      ]} />

      <H2 num="7.3">JSON Schema do Output Consolidado</H2>
      <CodeBlock language="json">{`{
  "type": "object",
  "properties": {
    "sumario_executivo": { "type": "string", "description": "Resumo 3-4 parágrafos para o analista" },
    "analise_completa_ia": { "type": "string", "description": "Markdown longo com seções H2/H3" },
    "parecer_final": { "type": "string", "description": "Veredito qualitativo do agente" },
    "pontos_positivos": { "type": "array", "items": { "type": "string" } },
    "pontos_atencao": { "type": "array", "items": { "type": "string" } },
    "sentinel_red_flags": { "type": "array", "items": { "type": "string" } },
    "recomendacoes_revisao_manual": { "type": "string" },
    "perguntas_sugeridas": { "type": "array", "items": { "type": "string" } },
    "documentos_adicionais_sugeridos": { "type": "array", "items": { "type": "string" } },
    "nivel_confianca_ia": { "type": "number", "minimum": 0, "maximum": 100 },
    "analise_dimensional": {
      "type": "object",
      "properties": {
        "identidade": { "score": 0, "narrativa": "..." },
        "estrutura_societaria": { "score": 0, "narrativa": "..." },
        "compliance_legal": { "score": 0, "narrativa": "..." },
        "saude_financeira": { "score": 0, "narrativa": "..." },
        "reputacao_publica": { "score": 0, "narrativa": "..." },
        "biometria_documentos": { "score": 0, "narrativa": "..." },
        "perfil_operacional": { "score": 0, "narrativa": "..." }
      }
    },
    "cross_validation": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "campo": { "type": "string" },
          "declarado": { "type": "string" },
          "verificado": { "type": "string" },
          "fonte_verificacao": { "type": "string" },
          "status": { "enum": ["MATCH", "DIVERGENTE", "PARCIAL", "NAO_VERIFICAVEL"] },
          "severidade": { "enum": ["CRITICO", "ALTO", "MEDIO", "BAIXO", "INFO"] }
        }
      }
    },
    "sentinel_recommendation": {
      "enum": ["Aprovado", "Aprovado com Condições", "Revisão Manual", "Recusado"],
      "description": "Recomendação qualitativa — pode escalar V4, NUNCA rebaixar"
    }
  }
}`}</CodeBlock>

      <H2 num="7.4">Persistência em ComplianceScore (Campos SENTINEL)</H2>
      <Table dense headers={['Campo entity', 'Origem', 'Visualização']} rows={[
        ['sumario_executivo', 'Output 4 consolidado', 'Banner topo do CadastroDetalhe — Aba Compliance'],
        ['analise_completa_ia', 'Output 4 markdown', 'SentinelTextFormatter renderiza com seções colapsáveis'],
        ['parecer_final', 'Output 4', 'Box destacado no painel SentinelAnalysisPanel'],
        ['pontos_positivos[]', 'Output 1+2+3 mergeados', 'PointsAndFlags componente — coluna verde'],
        ['pontos_atencao[]', 'Output 1+2+3 mergeados', 'PointsAndFlags — coluna amarela'],
        ['sentinel_red_flags[]', 'Output 1+2+3 mergeados', 'Merge com V4 + CAF em redFlags unificados (Step 4 pipeline)'],
        ['recomendacoes_revisao_manual', 'Output 4', 'Exibido apenas quando status = Manual'],
        ['perguntas_sugeridas[]', 'Output 4', 'Lista para analista enviar ao cliente em revisão manual'],
        ['documentos_adicionais_sugeridos[]', 'Output 4', 'Lista para analista pedir docs extras'],
        ['nivel_confianca_ia', 'Output 4 (0-100)', 'Badge no header — abaixo de 60 sinaliza confiança baixa'],
        ['analise_dimensional', 'Output 4', 'SentinelDimensionsPanel — 7 dimensões com gauge'],
        ['cross_validation[]', 'Output 1', 'BDCDeclaredVsConfirmed table — destaca DIVERGENTE em vermelho'],
        ['sentinel_recommendation', 'Output 4', 'Comparado com V4 no Step 4 do pipeline'],
        ['decisao_escalada_sentinel', 'Step 4 pipeline', 'SEMPRE FALSE em v7 (SENTINEL never escalates V4 in v7)'],
        ['fase_3_completa', 'analyzeOnboarding handler', 'true ao final'],
        ['data_analise_fase_3', 'analyzeOnboarding handler', 'now ISO'],
      ]} />

      <H2 num="7.5">Como SENTINEL é Acionado</H2>

      <H3 num="7.5.1">No pipeline (autoEnrichOnboarding Step 3)</H3>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js linhas 455-464
try {
  console.log('[AutoEnrich] Step 3: SENTINEL analysis...');
  const sentinelRes = await base44.asServiceRole.functions.invoke(
    'analyzeOnboarding',
    { onboardingCaseId: caseId, force: true }
  );
  sentinelSuccess = sentinelRes?.data?.success === true;
} catch (sentinelErr) {
  console.warn(\`[AutoEnrich] Step 3 failed (non-blocking): \${sentinelErr.message}\`);
}`}</CodeBlock>

      <H3 num="7.5.2">Manualmente pelo analista</H3>
      <P>Botão "Re-rodar SENTINEL" em <C>/CadastroDetalhe</C> aba Compliance. Disponível apenas para users com action permission <C>sentinel.rerun</C>. Útil quando: dossiê foi revisado manualmente e quer-se nova narrativa, ou houve update de documentos e o pipeline foi pulado.</P>

      <H3 num="7.5.3">Bulk via /BulkReprocess</H3>
      <P>Admins podem disparar SENTINEL em massa (até 100 casos por batch). Backend: <C>bulkReprocessCompliance</C> com <C>mode: 'sentinel-only'</C>.</P>

      <H2 num="7.6">Anti-Hallucination — Validação de Output</H2>

      <P>SENTINEL pode alucinar (inventar dados). 3 camadas de defesa:</P>

      <H3 num="7.6.1">Schema-Strict</H3>
      <P>response_json_schema é STRICT. Se IA retornar shape inválido → função retorna erro, pipeline continua sem persistir output corrompido. Não há fallback "best effort".</P>

      <H3 num="7.6.2">Cross-Validation Anchor</H3>
      <P>Cada item de <C>cross_validation[]</C> exige <C>fonte_verificacao</C> não-vazia. Se IA inventa "verificado: true" sem citar fonte → item é descartado pelo pós-processador.</P>

      <H3 num="7.6.3">Decisão Determinística como Trava</H3>
      <P>Mesmo se SENTINEL alucinar e retornar <C>sentinel_recommendation: "Aprovado"</C> para um caso com bloqueio V4 ativo, o Step 4 do pipeline IGNORA — usa apenas a tabela de subfaixa V4. SENTINEL nunca afeta a decisão automática. <B>Princípio Data-First v7.0</B>.</P>

      <Note title="Por que SENTINEL existe se não decide" kind="info">
        SENTINEL produz o <B>dossiê narrativo</B> que o analista lê em revisão manual + o relatório regulatório (PDF) que vai para o BCB se exigido. Sem SENTINEL, analista teria que ler 200+ campos brutos do BDC + IntegrationLog + responses. Com SENTINEL, recebe um documento estruturado em ~3 minutos de leitura. <B>SENTINEL é o relator técnico do dossiê — analista é o juiz.</B>
      </Note>

      <H2 num="7.7">Dimensões da analise_dimensional (7)</H2>
      <Table headers={['Dimensão', 'Datasets / fontes consideradas', 'Score 0-100']} rows={[
        ['identidade', 'BDC basic_data + history_basic_data + OCR + CPF cross-validation', 'Baixo = OK; Alto = problemas cadastrais'],
        ['estrutura_societaria', 'BDC relationships + owners_kyc + economic_group_*', 'Alto = QSA opaco, sócios PEP/sancionados, grupo complexo'],
        ['compliance_legal', 'BDC processes + government_debtors + collections + lawsuits_distribution', 'Alto = passivo legal/fiscal relevante'],
        ['saude_financeira', 'BDC financial_market + company_evolution + credit_risk + credit_score', 'Alto = falência, queda revenue, crédito ruim'],
        ['reputacao_publica', 'BDC reputations_and_reviews + media_profile_and_exposure', 'Alto = mídia adversa, score baixo Reclame Aqui'],
        ['biometria_documentos', 'CAF IntegrationLog (todos os 8 services) + VerifAI', 'Alto = REPROVED, scores baixos, manipulação detectada'],
        ['perfil_operacional', 'Questionário V4 + cross-validation com BDC activity_indicators', 'Alto = TPV declarado incompatível com porte/CNPJ'],
      ]} />

      <H2 num="7.8">Caso Especial: Subfaixa 4 (Manual)</H2>
      <P>Quando subfaixa = 4, SENTINEL é instruído a popular <C>recomendacoes_revisao_manual</C> com 3-5 ações concretas, <C>perguntas_sugeridas</C> com 3-5 perguntas para o analista enviar ao cliente, e <C>documentos_adicionais_sugeridos</C> com 0-3 docs extras. Esse é o caso de uso central do SENTINEL — guiar a revisão manual.</P>

      <Source files={[
        'functions/analyzeOnboarding.js',
        'agents/sentinel.json',
        'autoEnrichOnboarding.js linhas 455-464 (invocação Step 3)',
        'components/risk-analysis/SentinelDocumentRenderer',
        'components/compliance/SentinelAnalysisPanel',
        'components/compliance-v2/SentinelDimensionsPanel',
        'components/compliance-v2/SentinelReportV2',
        'entities/ComplianceScore.json (campos sentinel_*)',
      ]} />
    </Sec>
  );
}