import React from 'react';
import { DocH3, DocP, DocLi, DocCode, DocBold, DocCallout, DocTable, BlockCard } from './RiskAnalysisDocHelpers';

/**
 * Blocos 1-6 da página "Análise de Risco" (aba do olhinho do compliance).
 * Cobre: Verdict Banner, Score Panel, Red Flags, Smart Alerts, Heatmap, Data Confidence.
 * Fonte: components/case-analysis/UnifiedRiskAnalysis.jsx (ordem da renderização real).
 */
export default function RiskAnalysisDocBlocks1to6() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 1 — VERDICT BANNER */}
      <BlockCard n="1" title="Veredito (Decisão Final)" source="components/risk-analysis/RiskVerdictBanner.jsx">
        <DocP>
          É o banner colorido de topo que comunica a decisão consolidada (Aprovado, Aprovado com Condições
          Leves, Aprovado com Condições, Revisão Manual ou Recusado). Lê de{' '}
          <DocCode>complianceScore.recomendacao_final</DocCode> (fonte primária) com fallback para{' '}
          <DocCode>onboardingCase.iaDecision</DocCode> ou <DocCode>onboardingCase.status</DocCode>.
        </DocP>

        <DocH3>1.1 — Mapa de decisões (cor, ícone, sublabel)</DocH3>
        <DocTable
          headers={['Decisão', 'BG', 'Ícone', 'Sublabel exibido']}
          rows={[
            ['Aprovado', 'emerald-900', 'CheckCircle2', 'Dados objetivos (BDC + CAF) não identificaram riscos impeditivos. Aprovação automática.'],
            ['Aprovado com Condições Leves', 'blue-900', 'ShieldCheck', 'Dados objetivos limpos, mas com pontos de atenção menores que justificam monitoramento básico.'],
            ['Aprovado com Condições', 'amber-900', 'AlertTriangle', 'Dados objetivos limpos, porém inconsistências detectadas justificam condições rigorosas.'],
            ['Revisão Manual', 'orange-900', 'ShieldAlert', 'Inconsistências significativas requerem análise humana antes da decisão final.'],
            ['Recusado', 'red-900', 'XCircle', 'Bloqueio objetivo detectado OU análise IA identificou risco crítico.'],
          ]}
        />

        <DocH3>1.2 — Sinalizadores de contexto (badges)</DocH3>
        <DocP>Após o título, o banner adiciona badges informativas:</DocP>
        <ul className="ml-5 list-disc">
          <DocLi><DocBold>Confiança IA: X%</DocBold> — lido de <DocCode>complianceScore.nivel_confianca_ia</DocCode>.</DocLi>
          <DocLi><DocBold>⚠️ Reprocessamento recomendado</DocBold> — pisca animado quando há mismatch entre V4 e decisão final.</DocLi>
          <DocLi><DocBold>Score V4: X/849</DocBold> — lido de <DocCode>onboardingCase.riskScoreV4</DocCode>.</DocLi>
          <DocLi><DocBold>Subfaixa: 1A — VERDE EXPRESS</DocBold> — calculado de <DocCode>onboardingCase.subfaixa</DocCode>.</DocLi>
          <DocLi><DocBold>N bloqueio(s) ativo(s)</DocBold> — em vermelho, lê de <DocCode>onboardingCase.bloqueiosAtivos</DocCode>.</DocLi>
        </ul>

        <DocH3>1.3 — Explicação contextual (5 casos disjuntos)</DocH3>
        <DocP>
          A função <DocCode>DecisionExplanation</DocCode> escolhe UMA das 5 narrativas baseada em flags:
        </DocP>
        <DocTable
          headers={['#', 'Quando', 'Narrativa exibida']}
          rows={[
            [
              '1',
              'hasV4Block === true',
              'Render N cards expansíveis com BLOCK_EXPLANATIONS — um por bloqueio (B01-B09). Cada card mostra título, "O que isso significa" e "Ação necessária".',
            ],
            [
              '2',
              'hasCafFraud === true (algum redFlag contém "CAF:" + "fraude")',
              'Lista de 4 possíveis fraudes biométricas (Liveness reprovado, FaceMatch reprovado, Documentoscopia, Deepfake) + nota: "fraude biométrica sobrescreve V4".',
            ],
            [
              '3',
              'decision = Recusado MAS v4Decision ∈ {Aprovado, Aprovado com Condições Leves}',
              'Alerta amarelo "Inconsistência Detectada" — recusa veio do SENTINEL antigo (v5.0). Recomenda reprocessar com pipeline atual.',
            ],
            [
              '4',
              'complianceScore.decisao_escalada_sentinel === true',
              'Fluxo visual "V4 → SENTINEL" com badges arrow-right. Explica que V4 sugeriu X, SENTINEL escalou para Y por motivos qualitativos.',
            ],
            [
              '5',
              'Caso normal (nada acima)',
              'Resumo simples: "Score V4 X/849, subfaixa Y. Sem bloqueios, sem escalação."',
            ],
          ]}
        />

        <DocH3>1.4 — Mapa BLOCK_EXPLANATIONS (B01-B09)</DocH3>
        <DocP>
          Cada bloqueio tem 3 campos: <DocCode>title</DocCode>, <DocCode>explanation</DocCode> (texto educativo
          extenso) e <DocCode>action</DocCode> (próximo passo recomendado).
        </DocP>
        <DocTable
          headers={['Código', 'Título', 'Fundamento legal/regulatório']}
          rows={[
            ['B01', 'CNPJ/CPF Inativo ou Irregular', 'Circular BCB 3.978/2020'],
            ['B02', 'Empresa com menos de 6 meses', '~20% mortalidade no 1º ano'],
            ['B03', 'Empresa ou Sócio em Lista de Sanções', 'Lei 9.613/1998 Art. 10 PLD/FT (OFAC, UE, ONU, COAF, CEIS, CNEP)'],
            ['B03c', 'Grupo Econômico com Sanções', 'Circular BCB 3.978/2020 Art. 16 §§1-4'],
            ['B04', 'Pessoa Falecida', 'Fraude — operação em nome de óbito'],
            ['B05', 'Shell Company (score BDC > 80%)', 'Zero empregados + sem domínio + sem passagens web + endereço virtual + capital mínimo'],
            ['B06', 'Dívida Ativa > R$ 500.000', 'Risco financeiro extremo'],
            ['B07', 'Adverse Media Grave', 'Risco reputacional e regulatório'],
            ['B08', 'Lista Suja MTE (trabalho escravo)', 'Legislação trabalhista + ESG — responsabilização solidária'],
            ['B09', 'Embargo Ambiental IBAMA', 'Infração ambiental grave'],
          ]}
        />

        <DocH3>1.5 — Componentes filhos do banner</DocH3>
        <ul className="ml-5 list-disc">
          <DocLi>
            <DocCode>EscalationReasonBanner</DocCode> — exibe justificativa técnica da escalação (lido de{' '}
            <DocCode>onboardingCase.escalationReason</DocCode>).
          </DocLi>
          <DocLi>
            <DocCode>EscalationPointsList</DocCode> — lista numerada dos pontos que motivaram escalação,
            extraídos de <DocCode>red_flags</DocCode> e <DocCode>pontos_atencao</DocCode>.
          </DocLi>
          <DocLi>
            <DocCode>ExecutiveSummary</DocCode> — renderiza{' '}
            <DocCode>complianceScore.sumario_executivo</DocCode> com primeira sentença em negrito.
          </DocLi>
          <DocLi>
            <DocCode>BannerActionButtons</DocCode> — botões "Ver análise completa" (scroll para{' '}
            <DocCode>[data-sentinel-full-analysis]</DocCode>) e "Gerar parecer PDF" (chama backend{' '}
            <DocCode>generateCompliancePdf</DocCode>).
          </DocLi>
        </ul>

        <DocCallout kind="rule" title="Princípio do banner">
          O banner NUNCA recalcula a decisão — apenas LÊ <DocCode>recomendacao_final</DocCode> da entidade
          ComplianceScore (calculado pelo orquestrador <DocCode>autoEnrichOnboarding</DocCode>). Todas as
          narrativas são apresentações distintas da MESMA decisão persistida.
        </DocCallout>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 2 — SCORE PANEL */}
      <BlockCard n="2" title="Painel de Score V4 (Dados Objetivos)" source="components/risk-analysis/RiskScorePanel.jsx">
        <DocP>
          Mostra o score 0-849 calculado por fórmula determinística sobre dados BDC + CAF. Renderiza apenas se{' '}
          <DocCode>onboardingCase.riskScoreV4</DocCode> existir (caso contrário retorna <DocCode>null</DocCode>).
        </DocP>

        <DocH3>2.1 — Três cards principais (grid 3 colunas)</DocH3>
        <DocTable
          headers={['Card', 'O que mostra', 'Fonte']}
          rows={[
            [
              'Score Final',
              'Número grande (ex: 423) + "/849" + barra de progresso colorida pela subfaixa',
              'onboardingCase.riskScoreV4',
            ],
            [
              'Classificação',
              'Badge "Subfaixa — VERDE/AZUL/AMARELO/LARANJA/VERMELHO" + Monitoramento (PADRÃO/REFORÇADO/INTENSO) + Rolling Reserve %',
              'onboardingCase.subfaixa + monitoramentoNivel + rollingReservePercent',
            ],
            [
              'Composição (Decomposição)',
              'C1 base do segmento + C2 variáveis BDC + C3 enriquecimento = Total',
              'complianceScore.{score_base_segmento, score_variaveis, score_enriquecimento}',
            ],
          ]}
        />

        <DocH3>2.2 — Régua visual de 8 subfaixas</DocH3>
        <DocP>
          Barra horizontal com 8 segmentos coloridos (1A→5). A subfaixa atual ganha um anel ring-[#002443] +
          scale-105 destacando a posição.
        </DocP>
        <DocTable
          headers={['Subfaixa', 'Label', 'Faixa de pts', 'Cor']}
          rows={[
            ['1A', 'VERDE EXPRESS', '0-100', 'emerald-500'],
            ['1B', 'VERDE', '101-200', 'emerald-400'],
            ['2A', 'AZUL LEVE', '201-300', 'blue-400'],
            ['2B', 'AZUL', '301-400', 'blue-500'],
            ['3A', 'AMARELO', '401-500', 'amber-400'],
            ['3B', 'LARANJA', '501-600', 'orange-500'],
            ['4', 'VERMELHO', '601-700', 'red-500'],
            ['5', 'BLOQUEIO', '701-849', 'red-700'],
          ]}
        />

        <DocH3>2.3 — Sub-componente: ScoreBreakdownExplainer</DocH3>
        <DocP>
          Painel expansível "Entenda o Score V4" — explica camada por camada como o score foi formado, com
          drill-down nas variáveis aplicadas. Renderizado após a régua.
        </DocP>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 3 — RED FLAGS PANEL */}
      <BlockCard n="3" title="Alertas Identificados (Red Flags)" source="components/risk-analysis/RiskRedFlagsPanel.jsx">
        <DocP>
          Painel colapsível (default: aberto) que mostra TODOS os <DocCode>redFlags</DocCode> agrupados por
          fonte e classificados por severidade. Lê de <DocCode>onboardingCase.redFlags</DocCode> com fallback
          para <DocCode>complianceScore.red_flags</DocCode>.
        </DocP>

        <DocH3>3.1 — Pipeline de enrichment</DocH3>
        <DocP>
          Cada flag bruta (string) passa pela função <DocCode>enrichRedFlags()</DocCode> do{' '}
          <DocCode>redFlagEnricher.js</DocCode> que devolve um objeto rico:
        </DocP>
        <DocTable
          headers={['Campo', 'Descrição']}
          rows={[
            ['title', 'Título humano normalizado (ex: "Empresa com menos de 6 meses")'],
            ['severity', 'BLOQUEANTE | CRITICAL | HIGH | MEDIUM | LOW | INFO'],
            ['sourceBadge', 'BDC | CAF | SENTINEL | (outro)'],
            ['sourceTone', 'Cor do badge (blue/purple/amber/slate)'],
            ['dimension', 'Dimensão analítica (identity, owners, digital, compliance, etc.)'],
            ['whyItMatters', 'Texto explicando o impacto no negócio'],
            ['evidenceHints', 'Array de pistas onde procurar evidências'],
            ['suggestedAction', 'Ação recomendada ao analista'],
            ['source', 'Caminho lógico de origem (ex: "BDC dataset compliance")'],
            ['matched', 'true se o enricher encontrou padrão; false se devolveu fallback'],
          ]}
        />

        <DocH3>3.2 — Agrupamento e ordenação visual</DocH3>
        <DocP>Após enrichment, os flags são separados em 4 grupos (SourceGroup):</DocP>
        <ul className="ml-5 list-disc">
          <DocLi><DocBold>BDC (azul)</DocBold> — Database icon — "Dados Objetivos — Big Data Corp"</DocLi>
          <DocLi><DocBold>CAF (roxo)</DocBold> — Shield icon — "Biometria & Identidade — CAF"</DocLi>
          <DocLi><DocBold>SENTINEL (âmbar)</DocBold> — Brain icon — "Análise Qualitativa — SENTINEL IA"</DocLi>
          <DocLi><DocBold>Outros (slate)</DocBold> — Flag icon — "Outros Alertas"</DocLi>
        </ul>

        <DocH3>3.3 — Pílulas de severidade (header)</DocH3>
        <DocP>
          Conta agregada exibida ao topo do painel quando expandido. Ordem: BLOQUEANTE (vermelho escuro) →
          CRITICAL → HIGH → MEDIUM → LOW → INFO.
        </DocP>

        <DocH3>3.4 — Renderização item-a-item (RedFlagCard)</DocH3>
        <DocP>
          Cada flag vira um card expansível com: ícone de severidade, título, badge de fonte+dimensão e ao
          expandir mostra "Por que importa", "Evidências para verificar", "Ação sugerida" e "Fonte".
        </DocP>

        <DocCallout kind="info" title="Atalho âncora">
          O painel tem <DocCode>data-red-flags-panel</DocCode> que serve de âncora para o bloco "Smart Alerts"
          (bloco 4) que linka de volta com "↑ ver lá".
        </DocCallout>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 4 — SMART ALERTS */}
      <BlockCard n="4" title="Alertas Inteligentes BDC (Top 10 Críticos)" source="components/bdc-enrichment/BDCSmartAlerts.jsx">
        <DocP>
          Consolida automaticamente os achados mais graves DE TODAS as 12 seções BDC em cards clicáveis. Não
          aparece se a análise BDC não foi reconstruída (<DocCode>bdcAnalysis === null</DocCode>) ou se não há
          alertas.
        </DocP>

        <DocH3>4.1 — Pipeline de extração</DocH3>
        <DocP>O hook <DocCode>useMemo</DocCode> faz 3 varreduras paralelas sobre <DocCode>analysis</DocCode>:</DocP>
        <ol className="ml-5 list-decimal">
          <DocLi>
            <DocBold>Loop por 12 seções</DocBold> (identity, owners, digital, compliance, reputation,
            financial, evolution, esg, contacts, employeesKyc, sectorial, assets) — extrai items com{' '}
            <DocCode>risk === 'CRITICO' || 'ALTO'</DocCode>.
          </DocLi>
          <DocLi>
            <DocBold>Loop por blocos V4</DocBold> — cada bloqueio ativo vira um alerta BLOQUEANTE com{' '}
            <DocCode>blockToEnrichedFlag()</DocCode>.
          </DocLi>
          <DocLi>
            <DocBold>Verificação CNAE</DocBold> — extrai o CNAE da seção <DocCode>identity</DocCode> e cruza
            com <DocCode>CNAE_RISK_MAP</DocCode>: códigos 6311, 6619, 6499, 9200, 6492, 4712, 4789, 8299.
          </DocLi>
        </ol>

        <DocH3>4.2 — Tabela de CNAEs de risco hardcoded</DocH3>
        <DocTable
          headers={['CNAE', 'Severidade', 'Descrição']}
          rows={[
            ['9200', 'CRITICAL', 'Jogos de azar e apostas — setor regulado, exige licença'],
            ['6492', 'HIGH', 'Crédito, financiamento e investimento — regulado BCB'],
            ['6499', 'HIGH', 'Outros serviços financeiros NCO — categoria genérica'],
            ['6311', 'HIGH', 'Portais e serviços de internet — usado por fintechs/apostas'],
            ['6619', 'HIGH', 'Auxiliares de serviços financeiros — correspondentes bancários'],
            ['4712', 'MEDIUM', 'Comércio varejista — comum em e-commerce'],
            ['4789', 'MEDIUM', 'Comércio de outros produtos — pode indicar dropshipping'],
            ['8299', 'MEDIUM', 'Outras atividades — categoria genérica'],
          ]}
        />

        <DocH3>4.3 — Mapeamento de severidade V1→V2</DocH3>
        <DocP>
          BDC retorna severidades em português (CRITICO, ALTO, MEDIO, BAIXO). O componente converte para o
          sistema unificado (CRITICAL, HIGH, MEDIUM, LOW) via <DocCode>SEVERITY_V1_TO_V2</DocCode>.
        </DocP>

        <DocH3>4.4 — Dedup com Red Flags Panel</DocH3>
        <DocP>
          Cada alerta é normalizado via <DocCode>normaliseForMatch()</DocCode> (lowercase + sem acentos +
          alfanumérico + 40 chars). Se o título já aparece em <DocCode>existingRedFlags</DocCode> (bloco 3),
          renderiza versão compacta cinza com link "↑ ver lá".
        </DocP>

        <DocH3>4.5 — Limite e overflow</DocH3>
        <DocP>
          Exibe apenas os <DocBold>top 10</DocBold> alertas (ordenados por severidade: BLOQUEANTE=0 → INFO=5).
          Se houver mais, mostra mensagem "+ N achados adicionais disponíveis na Análise Dimensional".
        </DocP>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 5 — RISK HEATMAP */}
      <BlockCard n="5" title="Mapa de Calor de Risco (Radar)" source="components/bdc-enrichment/BDCRiskHeatmap.jsx">
        <DocP>
          Gráfico radar (recharts) que plota o risco 0-100 em cada uma das 12 dimensões BDC. Renderiza apenas
          se houver ≥ 3 dimensões com dados.
        </DocP>

        <DocH3>5.1 — Duas fontes de dimensões (fallback)</DocH3>
        <DocP>Tenta primeiro <DocCode>analysis.sections</DocCode> (BDC reconstruído). Se &lt; 3 dimensões, usa <DocCode>complianceScore.analise_dimensional</DocCode>.</DocP>
        <DocTable
          headers={['Fonte', 'Cálculo do risk 0-100']}
          rows={[
            [
              'analysis.sections (BDC)',
              <span key="s">
                Weighted avg por item: peso = <DocCode>Math.abs(item.points)+1</DocCode>, risco = CRITICO×100,
                ALTO×75, MEDIO×40, BAIXO×15.
              </span>,
            ],
            [
              'analise_dimensional (SENTINEL)',
              <span key="d">
                <DocCode>VEREDICTO_TO_RISK</DocCode>: REPROVADO/CRITICO=90, ALTO=75, ATENCAO=50, MEDIO=45,
                OK/APROVADO/BAIXO=10-15, NAO_DISPONIVEL=60.
              </span>,
            ],
          ]}
        />

        <DocH3>5.2 — Mapeamento de chaves entre fontes</DocH3>
        <DocTable
          headers={['Chave analise_dimensional', 'Chave BDC sections']}
          rows={[
            ['identidade', 'identity'],
            ['socios', 'owners'],
            ['compliance', 'compliance'],
            ['digital', 'digital'],
            ['reputacao', 'reputation'],
            ['financeiro', 'financial'],
            ['biometria', 'biometria (não tem section direta)'],
          ]}
        />

        <DocH3>5.3 — Cores e labels de risco</DocH3>
        <ul className="ml-5 list-disc">
          <DocLi><DocCode>{'>='} 70</DocCode> → #dc2626 (vermelho) → "Alto"</DocLi>
          <DocLi><DocCode>{'>='} 40</DocCode> → #f59e0b (âmbar) → "Moderado"</DocLi>
          <DocLi><DocCode>{'<'} 40</DocCode> → #22c55e (verde) → "Baixo"</DocLi>
        </ul>

        <DocH3>5.4 — Interatividade (drill-down)</DocH3>
        <DocP>
          Clicar em qualquer dimensão da legenda lateral seta <DocCode>selectedDim</DocCode> e abre o sub-componente{' '}
          <DocCode>HeatmapDrillDown</DocCode> abaixo, mostrando: o que a dimensão analisa, por que o score é X,
          o que score alto significa e a ação recomendada.
        </DocP>
      </BlockCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BLOCO 6 — DATA CONFIDENCE */}
      <BlockCard n="6" title="Score de Confiança dos Dados" source="components/bdc-enrichment/BDCDataConfidence.jsx">
        <DocP>
          Grid de 12 cards (um por dataset BDC) indicando quais responderam com dados e quais vieram vazios.
          Calcula um % de cobertura no canto superior direito.
        </DocP>

        <DocH3>6.1 — Os 12 datasets monitorados</DocH3>
        <DocTable
          headers={['Chave', 'Label', 'Obrigatório?', 'O que traz']}
          rows={[
            ['identity', 'Dados Cadastrais', 'Sim', 'Razão social, CNPJ, situação, fundação'],
            ['owners', 'Quadro Societário', 'Sim', 'Sócios, PEP, sanções, grupo econômico'],
            ['digital', 'Presença Digital', 'Não', 'Domínios, passagens, atividade online'],
            ['compliance', 'Compliance / PLD', 'Sim', 'Sanções, processos, dívida ativa, distribuição'],
            ['reputation', 'Reputação / Mídia', 'Não', 'Notícias, avaliações, Reclame Aqui'],
            ['financial', 'Financeiro / Mercado', 'Não', 'BCB, CVM, grupo econômico, MCC, ativos'],
            ['evolution', 'Evolução Histórica', 'Não', 'Capital, funcionários, alterações cadastrais'],
            ['esg', 'ESG / Lista Suja', 'Sim', 'Lista Suja MTE, IBAMA, ESG'],
            ['contacts', 'Validação Contatos', 'Não', 'Telefones, e-mails, endereços validados'],
            ['employeesKyc', 'KYC Funcionários', 'Não', 'PEP e sanções entre funcionários-chave'],
            ['sectorial', 'Dados Setoriais', 'Não', 'ANVISA, CVM, ANS, OAB, CRM, CREA'],
            ['assets', 'Ativos Patrimoniais', 'Não', 'Imóveis, veículos, aeronaves, embarcações'],
          ]}
        />

        <DocH3>6.2 — Cálculo do % cobertura</DocH3>
        <DocP>
          <DocCode>confidencePercent = Math.round((withData / total) × 100)</DocCode> — verde se ≥80%, âmbar
          se ≥50%, vermelho abaixo.
        </DocP>

        <DocH3>6.3 — Alerta de fonte crítica ausente</DocH3>
        <DocP>
          Se algum dataset com <DocCode>required: true</DocCode> está vazio (identity, owners, compliance,
          esg), exibe banner âmbar listando quais e avisando "análise pode estar incompleta".
        </DocP>

        <DocH3>6.4 — Tooltip por dataset</DocH3>
        <DocP>
          Cada card tem tooltip (lê de <DocCode>getDatasetInfo(key)</DocCode> em{' '}
          <DocCode>datasetGlossary.js</DocCode>) mostrando o label, o que traz e quais datasets BDC nominais
          alimentam aquela seção.
        </DocP>

        <DocH3>6.5 — Rodapé técnico</DocH3>
        <DocP>
          Linha discreta com: "<DocCode>X datasets consultados na BDC • Grupo: Y • Modelo: Z</DocCode>" (lido
          de <DocCode>analysis.datasetsQueried/datasetGroup/templateModel</DocCode>).
        </DocP>
      </BlockCard>
    </>
  );
}