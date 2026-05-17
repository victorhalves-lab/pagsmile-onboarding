import React from 'react';
import { DocH3, DocP, DocLi, DocCode, DocBold, DocCallout, DocTable, BlockCard } from './RiskAnalysisDocHelpers';

/**
 * Blocos 7-12 da página "Análise de Risco".
 * Cobre: Declared vs Confirmed, Positivos & Concerns, Dimensional, SENTINEL, BDC Narrative, Sources.
 */
export default function RiskAnalysisDocBlocks7to12() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 7 — DECLARED VS CONFIRMED */}
      <BlockCard n="7" title="Declarado vs Confirmado (Cross-Validation)" source="components/bdc-enrichment/BDCDeclaredVsConfirmed.jsx">
        <DocP>
          Tabela lado-a-lado que confronta o que o merchant declarou no questionário com o que a BDC retornou
          oficialmente. Cada linha tem semáforo (✅/⚠️/❌/❓) e tooltip explicando a divergência.
        </DocP>

        <DocH3>7.1 — Campos comparados (até 8 linhas)</DocH3>
        <DocTable
          headers={['Campo', 'Origem declarada', 'Origem BDC']}
          rows={[
            ['Razão Social', 'merchant.fullName', 'identity item matching /razão|nome.*empresa/i'],
            ['CPF ou CNPJ', 'merchant.cpfCnpj', 'identity item matching /cnpj|cpf|documento/i'],
            ['CNAE/MCC Principal', 'questionnaireData.cnae || .mcc', 'identity item matching /cnae|atividade.*principal/i'],
            ['Capital Social', 'questionnaireData.capitalSocial (formatado R$)', 'identity item matching /capital.*social/i'],
            ['Situação Cadastral', '"Ativa (pressuposto)" (hardcoded)', 'identity item matching /situação|status.*cadastral/i'],
            ['Data de Fundação', 'questionnaireData.dataFundacao', 'identity item matching /fundação|data.*abertura/i'],
            ['Localização', 'questionnaireData.cidade || .endereco', 'identity item matching /endereço|cidade|UF/i'],
            ['Qtd. Sócios', 'questionnaireData.qtdSocios', 'owners item matching /total|qtd|sócios/i'],
          ]}
        />

        <DocH3>7.2 — Algoritmo de comparação (compareValues)</DocH3>
        <ol className="ml-5 list-decimal">
          <DocLi>Normaliza ambos: lowercase + trim + remove pontuação/espaços.</DocLi>
          <DocLi>Se idênticos após normalização → <DocCode>match</DocCode>.</DocLi>
          <DocLi>Se um contém o outro (substring) → <DocCode>divergence</DocCode>.</DocLi>
          <DocLi>Se ambos são numéricos: idênticos = match, diff &lt; 10% = divergence, &gt;10% = mismatch.</DocLi>
          <DocLi>Caso contrário → <DocCode>mismatch</DocCode>.</DocLi>
          <DocLi>Se um lado vazio/N/D → <DocCode>unknown</DocCode>.</DocLi>
        </ol>

        <DocH3>7.3 — Mapa DIVERGENCE_EXPLANATIONS</DocH3>
        <DocP>
          Cada campo tem 2 textos no tooltip (para divergência leve vs grave). Ex: "Razão Social mismatch =
          nomes completamente diferentes — sinal forte de identidade construída, investigar CNPJ".
        </DocP>

        <DocH3>7.4 — Header com contagens</DocH3>
        <DocP>
          Exibe badges agregadas no topo: "✅ N consistente(s) | ⚠️ N divergência(s) | ❌ N inconsistência(s)".
        </DocP>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 8 — POSITIVES & CONCERNS */}
      <BlockCard n="8" title="Pontos Positivos e Pontos de Atenção (SENTINEL)" source="components/risk-analysis/RiskPositivesAndConcerns.jsx">
        <DocP>
          Duas colunas (md:grid-cols-2): pontos positivos (verde) à esquerda, pontos de atenção (âmbar) à
          direita. Lê de <DocCode>complianceScore.pontos_positivos</DocCode> e{' '}
          <DocCode>pontos_atencao</DocCode>.
        </DocP>

        <DocH3>8.1 — Formato bruto do SENTINEL</DocH3>
        <DocP>
          O SENTINEL devolve cada ponto como string semi-estruturada:{' '}
          <DocCode>"[FONTE: X] O QUE: título. POR QUÊ: explicação. ONDE: evidência."</DocCode>
        </DocP>

        <DocH3>8.2 — Parser robusto (parseSentinelItem)</DocH3>
        <DocP>
          A função aplica regex tolerante a malformações (colchetes não fechados, ordem variável dos labels,
          pontuação ausente). Devolve <DocCode>{`{ title, why, where, source }`}</DocCode>.
        </DocP>

        <DocH3>8.3 — Detecção de fonte (normalizeSource)</DocH3>
        <DocP>Heurística por palavras-chave no texto. Buckets canônicos (6):</DocP>
        <DocTable
          headers={['Bucket', 'Tom (cor)', 'Palavras-chave detectadas']}
          rows={[
            ['Questionário', 'azul', 'question'],
            ['BDC', 'indigo', 'bdc, bigdatacorp, receita, cnpj'],
            ['CAF', 'roxo', 'caf, liveness, biometri, facematch, kyb'],
            ['Compliance', 'vermelho', 'process, sanç, sanc, pep, interpol'],
            ['Merchant', 'cinza', 'merchant, dados do cliente'],
            ['Sentinel', 'teal', 'sentinel, análise, analise'],
          ]}
        />

        <DocH3>8.4 — EnrichedItem (renderização final)</DocH3>
        <DocP>Cada ponto vira um card branco com:</DocP>
        <ul className="ml-5 list-disc">
          <DocLi>Ícone CheckCircle2 (positivo) ou AlertTriangle (atenção)</DocLi>
          <DocLi>Título em negrito (campo <DocCode>O QUE</DocCode>)</DocLi>
          <DocLi>Tag de fonte com cor canônica</DocLi>
          <DocLi>Seção "Por quê?" (separada por border-t)</DocLi>
          <DocLi>Seção "Onde encontramos" (em itálico)</DocLi>
          <DocLi>Botão "Ver texto bruto (auditoria)" — mostra o output original do SENTINEL em &lt;code&gt;</DocLi>
        </ul>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 9 — DIMENSIONAL ANALYSIS */}
      <BlockCard n="9" title="Análise Dimensional BDC (12 dimensões drilldown)" source="components/risk-analysis/RiskDimensionalAnalysis.jsx">
        <DocP>
          Lista colapsível de 12 dimensões BDC. Cada uma mostra: nome, qtd de itens, soma de pontos, contagem
          de críticos/altos, barra de % OK, e ao expandir mostra cada item individualmente. Lê de{' '}
          <DocCode>complianceScore.variaveis_aplicadas</DocCode>.
        </DocP>

        <DocH3>9.1 — As 12 dimensões mapeadas (DIMENSION_CONFIG)</DocH3>
        <DocTable
          headers={['Chave', 'Ícone', 'Label', 'O que cobre']}
          rows={[
            ['identity', 'Building2', 'Identidade & Cadastro', 'CNPJ, situação cadastral, CNAE, capital social, endereço'],
            ['owners', 'Users', 'Quadro Societário', 'Sócios, PEP, sanções, processos, grupo econômico'],
            ['digital', 'Globe', 'Presença Digital', 'Website, atividade online, shell company, passagens web'],
            ['compliance', 'Shield', 'Compliance & PLD', 'Sanções, dívida ativa, processos, negativação, cobrança'],
            ['reputation', 'TrendingUp', 'Reputação', 'Mídia, avaliações, prêmios, certificações'],
            ['financial', 'DollarSign', 'Financeiro', 'Grupo econômico, MCC, licenças, propriedade industrial'],
            ['evolution', 'History', 'Evolução Histórica', 'Alterações cadastrais, evolução de capital, mudanças CNAE'],
            ['esg', 'Leaf', 'ESG / Lista Suja MTE', 'Trabalho escravo, embargos IBAMA, ESG'],
            ['contacts', 'Phone', 'Validação de Contatos', 'Telefones, e-mails, endereços BDC'],
            ['employeesKyc', 'UserCheck', 'KYC Funcionários', 'Faixa de empregados RAIS/CAGED'],
            ['sectorial', 'BarChart3', 'Dados Setoriais', 'MCC, CNAEs financeiros, BCB/CVM, marketplaces'],
            ['assets', 'Landmark', 'Ativos Patrimoniais', 'Propriedade industrial, licenças, prêmios, capital'],
            ['creditRisk', 'CreditCard', 'Análise de Crédito', 'Score PJ, protestos, inadimplência, cheques'],
          ]}
        />

        <DocH3>9.2 — Cálculo de risco da dimensão (header)</DocH3>
        <ol className="ml-5 list-decimal">
          <DocLi>Conta items por severidade: <DocCode>critCount</DocCode>, <DocCode>altoCount</DocCode>, <DocCode>okCount</DocCode>.</DocLi>
          <DocLi><DocCode>overallRisk</DocCode>: se ≥1 CRITICO → CRITICO; se ≥1 ALTO → ALTO; se totalPts &gt; 20 → MEDIO; senão OK.</DocLi>
          <DocLi><DocCode>okPct = Math.round((okCount / totalItems) × 100)</DocCode> — barra de progresso (verde ≥70, âmbar ≥40, vermelho).</DocLi>
        </ol>

        <DocH3>9.3 — DimensionItem (cada item da dimensão)</DocH3>
        <DocP>Renderização de cada <DocCode>section.items[i]</DocCode>:</DocP>
        <ul className="ml-5 list-disc">
          <DocLi>Border-l-4 colorida se CRITICO (vermelho) ou ALTO (laranja)</DocLi>
          <DocLi>Dot de severidade + label + pontos (+X ou -X) + badge da severidade</DocLi>
          <DocLi>Valor (<DocCode>item.value</DocCode>) abaixo do label</DocLi>
          <DocLi>Botão HelpCircle (se label está em <DocCode>ITEM_EXPLANATIONS</DocCode>) abre painel azul com "O que isso significa"</DocLi>
          <DocLi>Se <DocCode>item.details</DocCode> existe (objeto) — renderiza key/value abaixo</DocLi>
          <DocLi>Se <DocCode>item.lawsuits</DocCode> existe — renderiza componente <DocCode>LawsuitsList</DocCode></DocLi>
        </ul>

        <DocH3>9.4 — LawsuitsList (drill-down de processos)</DocH3>
        <DocP>
          Mostra até 3 processos por padrão (botão "Ver todos os N" expande). Cada processo: número, tipo,
          assunto, tribunal, status, valor (R$), data de distribuição, sócio envolvido e até 3 partes.
        </DocP>

        <DocH3>9.5 — ITEM_EXPLANATIONS (glossário inline)</DocH3>
        <DocTable
          headers={['Label item BDC', 'Explicação (resumo)']}
          rows={[
            ['Nível de atividade', '0-25% muito baixo, 26-50% baixo, 51-75% moderado, 76-100% alto'],
            ['Shell Company score', '0-20 baixa, 21-40 moderada, 41-60 alta, 61-80 muito alta, 81-100 BLOQUEANTE'],
            ['Domínio ativo', 'NÃO ≠ fraude — muitas empresas B2B não têm site público'],
            ['Faixa de empregados', 'CAGED/eSocial (CLT). SEM VÍNCULOS = zero CLT, pode usar PJ'],
            ['Faixa de receita', 'ESTIMATIVA BDC com base em dados fiscais — não exato'],
            ['Passagens web', 'Nº de vezes que a empresa apareceu em sites/portais/redes/buscadores'],
          ]}
        />
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 10 — SENTINEL FINAL VERDICT */}
      <BlockCard n="10" title="Parecer SENTINEL Completo" source="components/risk-analysis/RiskFinalVerdict.jsx">
        <DocP>
          Renderiza TODO o output do agente SENTINEL em seções colapsíveis. Lê de múltiplos campos do{' '}
          <DocCode>complianceScore</DocCode>.
        </DocP>

        <DocH3>10.1 — As 7 seções do parecer</DocH3>
        <DocTable
          headers={['Seção', 'Campo origem', 'Ícone', 'Default aberto?']}
          rows={[
            ['Parecer Final', 'parecer_final', 'Eye', 'Sempre (não é colapsível)'],
            ['Condições Sugeridas', 'condicoes_aprovacao', 'Bookmark', 'Sempre'],
            ['Findings', 'total_findings + variaveis_aplicadas', 'Search', 'Sim'],
            ['Perguntas Sugeridas', 'perguntas_sugeridas[]', 'FileQuestion', 'Só se isManualReview'],
            ['Documentos Adicionais Sugeridos', 'documentos_adicionais_sugeridos[]', 'FileText', 'Sim'],
            ['Recomendações ao Analista', 'recomendacoes_revisao_manual', 'Lightbulb', 'Só se isManualReview'],
            ['Análise Completa', 'analise_completa_ia', 'Brain', 'Sim'],
          ]}
        />

        <DocH3>10.2 — Detecção isManualReview</DocH3>
        <DocP>
          <DocCode>isManualReview = recomendacao_final.includes('Manual') || .includes('Condições')</DocCode>{' '}
          — controla quais seções abrem por padrão.
        </DocP>

        <DocH3>10.3 — Sub-componentes especializados</DocH3>
        <ul className="ml-5 list-disc">
          <DocLi>
            <DocCode>SentinelTextFormatter</DocCode> — parseia formatação do SENTINEL (negritos via{' '}
            <DocCode>**texto**</DocCode>, listas, quebras de parágrafo).
          </DocLi>
          <DocLi>
            <DocCode>FindingsWithFallback</DocCode> — drill-down de cada finding por severidade com fallback
            garantido (se SENTINEL não retornou estrutura, gera a partir de <DocCode>variaveis_aplicadas</DocCode>).
          </DocLi>
          <DocLi>
            <DocCode>SentinelDocumentRenderer</DocCode> — renderiza o documento longo (análise completa) com
            sumário (TOC) navegável + cards por seção.
          </DocLi>
        </ul>

        <DocH3>10.4 — Âncora data-sentinel-full-analysis</DocH3>
        <DocP>
          O wrapper da seção "Análise Completa" tem esse data-attribute para o botão "Ver análise completa"
          do bloco 1 fazer scroll smooth até aqui.
        </DocP>

        <DocH3>10.5 — Metadata footer</DocH3>
        <DocP>
          Linha discreta com chips: Agent (versao_agente), Framework (framework_version), datas das Fases 1-3
          (data_analise_fase_1/2/3 — formatadas pt-BR).
        </DocP>

        <DocCallout kind="warn" title="Princípio SENTINEL">
          O SENTINEL NUNCA pode RECUSAR. No máximo escala para "Revisão Manual". O texto explicativo no
          cabeçalho diz literalmente: "O SENTINEL analisa dados de 3 fontes (Questionário + BDC + CAF) e
          sugere condições. NÃO tem poder de recusa."
        </DocCallout>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 11 — BDC NARRATIVE REPORT */}
      <BlockCard n="11" title="Relatório Narrativo BDC (IA-Generated)" source="components/bdc-enrichment/BDCNarrativeReport.jsx">
        <DocP>
          Relatório textual longo gerado por IA, organizando os achados BDC em narrativa contínua (não em
          cards). Renderiza apenas se <DocCode>bdcAnalysis</DocCode> existe.
        </DocP>

        <DocH3>11.1 — Estrutura típica do relatório</DocH3>
        <ul className="ml-5 list-disc">
          <DocLi>Apresentação da empresa (razão, fundação, capital, atividade)</DocLi>
          <DocLi>Análise societária (sócios, PEP, sanções)</DocLi>
          <DocLi>Compliance e processos (dívida ativa, sanções, ações judiciais)</DocLi>
          <DocLi>Presença digital e reputação</DocLi>
          <DocLi>Indicadores ESG e Lista Suja</DocLi>
          <DocLi>Conclusão narrativa</DocLi>
        </ul>

        <DocH3>11.2 — Diferença vs blocos 9 e 10</DocH3>
        <DocTable
          headers={['Bloco', 'Foco', 'Apresentação']}
          rows={[
            ['9 - Dimensional', 'Dados BDC item-a-item, drilldown', 'Tabela colapsível por dimensão'],
            ['10 - SENTINEL', 'Parecer da IA com decisão e condições', 'Seções colapsíveis com formatação rica'],
            ['11 - BDC Narrative', 'Storytelling sobre os achados BDC', 'Texto corrido tipo "carta executiva"'],
          ]}
        />
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 12 — UNIFIED SOURCES SUMMARY */}
      <BlockCard n="12" title="Sumário Unificado de Fontes (CAF + BDC)" source="components/case-analysis/UnifiedSourcesSummary.jsx">
        <DocP>
          Painel final expansível listando TODAS as integrações executadas no caso, organizadas por provedor
          (CAF e BDC). Recebe as props:
        </DocP>
        <ul className="ml-5 list-disc">
          <DocLi><DocCode>validations</DocCode> — array de <DocCode>ExternalValidationResult</DocCode></DocLi>
          <DocLi><DocCode>integrationLogs</DocCode> — array de <DocCode>IntegrationLog</DocCode></DocLi>
          <DocLi><DocCode>complianceScore</DocCode>, <DocCode>merchant</DocCode>, <DocCode>onboardingCaseId</DocCode></DocLi>
        </ul>

        <DocH3>12.1 — Conteúdo típico exibido</DocH3>
        <DocTable
          headers={['Seção', 'Conteúdo']}
          rows={[
            ['CAF', 'Liveness, FaceMatch, Documentoscopia, KYB Search, Credit Analysis, Sanctions Screening — cada um com status, score, request_id, data, image_urls'],
            ['BDC', 'Dataset queries (kyc, processes, owners, sanctions, etc.) com datasetSource, elapsedMs, queryId BDC, contagem de items retornados'],
            ['Outros', 'BrasilAPI CNPJ, PortalTransparência (se chamados)'],
          ]}
        />

        <DocH3>12.2 — Por que existe</DocH3>
        <DocP>
          Permite ao analista auditar a procedência de cada dado mostrado nos blocos 1-11. Se algo "não bate",
          pode clicar e ver o request_id e o response_payload da chamada original.
        </DocP>

        <DocCallout kind="info" title="Auditoria e LGPD">
          Cada item do sumário tem rastreabilidade total (timestamp, payload, status). Atende exigências de
          auditoria interna e DPO/LGPD para reconstrução de decisões.
        </DocCallout>
      </BlockCard>
    </>
  );
}