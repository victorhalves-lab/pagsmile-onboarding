import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Microscope } from 'lucide-react';
import { DocH1, DocH2, DocP, DocBold, DocCode, DocCallout, DocTable } from './RiskAnalysisDocHelpers';
import RiskAnalysisDocBlocks1to6 from './RiskAnalysisDocBlocks1to6';
import RiskAnalysisDocBlocks7to12 from './RiskAnalysisDocBlocks7to12';

/**
 * Aba "Análise de Risco — Microscópico" dentro da página DocumentoKYCKYB.
 *
 * Documenta CADA componente, lógica e fonte de dados da tela de Análise de Risco
 * que aparece ao clicar no olhinho do card de compliance.
 *
 * Estrutura: 12 blocos (na ordem de renderização real do UnifiedRiskAnalysis.jsx).
 * Cada bloco mapeia 1:1 para um componente filho da aba.
 */
export default function RiskAnalysisDocTab() {
  return (
    <div id="risk-analysis-doc">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; background: white !important; }
          body > *:not(:has(#risk-analysis-doc)) { display: none !important; }
          .no-print { display: none !important; }
          #risk-analysis-doc { padding: 0 !important; max-width: 100% !important; }
          #risk-analysis-doc .print-avoid-break { page-break-inside: avoid; }
          #risk-analysis-doc .print-h1 { page-break-before: always; }
          #risk-analysis-doc .print-h1:first-child { page-break-before: avoid; }
          #risk-analysis-doc table { font-size: 7.5pt !important; page-break-inside: auto; }
          #risk-analysis-doc thead { display: table-header-group; }
          #risk-analysis-doc tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* ─── Header com botão de impressão ─── */}
      <div className="no-print sticky top-[68px] z-[5] bg-white border-b border-[#e8e8e8] max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#1356E2]/10">
            <Microscope className="w-4 h-4 text-[#1356E2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1356E2]">Documento Técnico</p>
            <p className="text-sm font-bold text-[#0A0A0A]">Análise de Risco — Microscópico (12 blocos)</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
          <Download className="w-4 h-4 mr-1.5" /> Baixar PDF
        </Button>
      </div>

      {/* ─── Conteúdo ─── */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 bg-white">
        {/* CAPA */}
        <div className="text-center py-12 border-b border-[#e8e8e8] mb-8 print-avoid-break">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1356E2]/10 mb-4">
            <Microscope className="w-10 h-10 text-[#1356E2]" />
          </div>
          <p className="text-[10pt] font-bold tracking-[0.25em] uppercase text-[#1356E2] mb-2">Documentação Microscópica</p>
          <h1 className="text-[28pt] font-black text-[#0A0A0A] leading-tight mb-3">
            Análise de Risco
          </h1>
          <p className="text-[12pt] text-[#1a1a1a]/60 max-w-2xl mx-auto leading-relaxed">
            Tudo o que aparece na aba "Análise de Risco" do card de compliance (olhinho do questionário
            respondido), documentado componente a componente, lógica a lógica, fonte de dado a fonte de dado.
          </p>
          <p className="text-[9pt] text-[#1a1a1a]/40 mt-6">
            12 blocos · Renderização real de <DocCode>UnifiedRiskAnalysis.jsx</DocCode> · Atualizado em{' '}
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* ═══ SEÇÃO 0 — INTRODUÇÃO ═══ */}
        <DocH1 num="0.">Onde fica essa tela e o que ela faz</DocH1>
        <DocP>
          A "Análise de Risco" é a aba principal exibida quando o analista clica no <DocBold>olhinho</DocBold>{' '}
          (ícone Eye) de um card de compliance — seja na fila "Análise Manual", em "Cadastro / Detalhe", ou
          em qualquer listagem de OnboardingCases. É a janela única consolidada do que TODOS os sistemas
          objetivos (BDC + CAF) e qualitativos (SENTINEL) descobriram sobre o caso.
        </DocP>

        <DocH2 num="0.1">Componente raiz</DocH2>
        <DocP>
          Tudo é orquestrado por <DocCode>components/case-analysis/UnifiedRiskAnalysis.jsx</DocCode>. Esse
          componente recebe 5 props e renderiza 12 blocos filhos em ordem fixa (lista abaixo).
        </DocP>

        <DocH2 num="0.2">Props recebidas</DocH2>
        <DocTable
          headers={['Prop', 'Tipo', 'Origem', 'Uso']}
          rows={[
            ['onboardingCase', 'Object (OnboardingCase)', 'base44.entities.OnboardingCase.get(id)', 'Score V4, subfaixa, redFlags, bloqueiosAtivos, decisão'],
            ['complianceScore', 'Object (ComplianceScore)', 'base44.entities.ComplianceScore.filter({onboarding_case_id})', 'Parecer SENTINEL, variáveis aplicadas, dimensional, summary'],
            ['validations', 'Array (ExternalValidationResult[])', 'base44.entities.ExternalValidationResult.filter({onboarding_case_id})', 'Resultados CAF/BDC para o sumário final (bloco 12)'],
            ['integrationLogs', 'Array (IntegrationLog[])', 'base44.entities.IntegrationLog.filter({onboarding_case_id})', 'Logs detalhados das chamadas externas (bloco 12)'],
            ['merchant', 'Object (Merchant)', 'base44.entities.Merchant.get(merchantId)', 'Dados declarados para cross-validation (bloco 7)'],
            ['onboardingCaseId', 'string', 'URL param', 'Usado pelo sumário de fontes (bloco 12)'],
          ]}
        />

        <DocH2 num="0.3">Função reconstructAnalysisFromCache</DocH2>
        <DocP>
          O componente faz <DocCode>useMemo(reconstructAnalysisFromCache(complianceScore))</DocCode> para
          construir um objeto <DocCode>bdcAnalysis</DocCode> que alimenta os blocos visuais BDC (4, 5, 6, 7,
          11). A função extrai:
        </DocP>
        <DocTable
          headers={['Campo do bdcAnalysis', 'Origem no ComplianceScore']}
          rows={[
            ['type', "segmento === 'subseller_pf' ? 'PF' : 'PJ'"],
            ['templateModel', 'segmento'],
            ['datasetGroup', '"CACHED" (hardcoded — pois é reconstrução)'],
            ['queryDate', 'data_analise_fase_2'],
            ['blocks', 'bloqueios_ativos.map(b => parseado para {code, label})'],
            ['hasBlock', 'bloqueios_ativos.length > 0'],
            ['sections', 'variaveis_aplicadas (12 dimensões BDC)'],
            ['scoring.{baseScore, variablesScore, enrichmentScore, finalScore, subfaixa, subfaixaNome}', 'score_base_segmento, score_variaveis, score_enriquecimento, score_final, subfaixa, subfaixa_nome'],
          ]}
        />

        <DocH2 num="0.4">Ordem de renderização (os 12 blocos)</DocH2>
        <DocTable
          headers={['#', 'Componente', 'Condição de render']}
          rows={[
            ['1', 'RiskVerdictBanner', 'Sempre (oculta se status = "Pendente" ou "Em Processamento")'],
            ['2', 'RiskScorePanel', 'Apenas se onboardingCase.riskScoreV4 != null'],
            ['3', 'RiskRedFlagsPanel', 'Apenas se há redFlags ou red_flags > 0'],
            ['4', 'BDCSmartAlerts', 'Apenas se bdcAnalysis existe E há alertas críticos/altos'],
            ['5', 'BDCRiskHeatmap', 'Apenas se ≥ 3 dimensões têm dados'],
            ['6', 'BDCDataConfidence', 'Apenas se há sections OU analise_dimensional'],
            ['7', 'BDCDeclaredVsConfirmed', 'Apenas se bdcAnalysis E merchant existem E há ≥ 1 linha'],
            ['8', 'RiskPositivesAndConcerns', 'Apenas se há ≥ 1 positivo ou ≥ 1 concern'],
            ['9', 'RiskDimensionalAnalysis', 'Apenas se variaveis_aplicadas existe'],
            ['10', 'RiskFinalVerdict', 'Apenas se complianceScore existe'],
            ['11', 'BDCNarrativeReport', 'Apenas se bdcAnalysis existe'],
            ['12', 'UnifiedSourcesSummary', 'Sempre (mesmo vazio mostra placeholder)'],
          ]}
        />

        <DocCallout kind="rule" title="Princípio de design">
          A tela é PROGRESSIVA: começa pela decisão (bloco 1), aprofunda no score (2), depois nos alertas
          consolidados (3-4), depois em visualizações (5-6), depois em cross-validation (7), depois em análise
          qualitativa (8), depois em dados brutos BDC item-a-item (9), depois no parecer SENTINEL completo
          (10), depois em narrativa (11), e finalmente em auditoria de fontes (12).
        </DocCallout>

        <DocCallout kind="info" title="Como ler esta documentação">
          Cada um dos 12 blocos abaixo segue a MESMA estrutura: header numerado com o nome do componente e
          path do arquivo, descrição funcional, fontes de dados, lógica interna detalhada, sub-componentes
          filhos e princípios de design (quando aplicável). Use para entender exatamente o que precisa
          refatorar e o que precisa preservar.
        </DocCallout>

        {/* ═══ BLOCOS 1-12 ═══ */}
        <DocH1 num="1-12.">Os 12 blocos da Análise de Risco</DocH1>
        <RiskAnalysisDocBlocks1to6 />
        <RiskAnalysisDocBlocks7to12 />

        {/* ═══ APÊNDICE — REFAT ═══ */}
        <DocH1 num="A.">Apêndice — Checklist para Refatoração</DocH1>
        <DocP>
          Antes de refatorar qualquer um dos 12 blocos, verifique abaixo o que NÃO pode ser perdido (regra de
          negócio / compliance) vs o que é apenas UI:
        </DocP>

        <DocH2 num="A.1">Regras de negócio invioláveis</DocH2>
        <DocTable
          headers={['#', 'Regra', 'Impacto se quebrar']}
          rows={[
            ['1', 'A decisão NUNCA é recalculada no front — só LIDA do ComplianceScore', 'Decisões divergentes entre tela e DB → falha de auditoria'],
            ['2', 'SENTINEL nunca pode RECUSAR — só sugerir Manual/Condições', 'Decisão automática de IA → risco regulatório (BCB)'],
            ['3', 'Bloqueios B01-B09 ANULAM o score V4 — força Recusado', 'Aprovação de empresa com bloqueio = exposição legal'],
            ['4', 'CAF fraude biométrica SOBRESCREVE V4', 'Aprovação de fraude detectada'],
            ['5', 'Cross-validation (bloco 7) usa compareValues com 4 níveis (match/divergence/mismatch/unknown)', 'Falsos positivos/negativos de divergência'],
            ['6', 'BDC datasets required: identity, owners, compliance, esg', 'Aprovação com fontes críticas faltando'],
          ]}
        />

        <DocH2 num="A.2">UI/UX que pode ser refatorado livremente</DocH2>
        <ul className="ml-5 list-disc">
          <li className="text-[10.5pt] mb-1">Cores, gradientes, spacings dos cards</li>
          <li className="text-[10.5pt] mb-1">Ícones (lucide-react)</li>
          <li className="text-[10.5pt] mb-1">Tooltips e popovers</li>
          <li className="text-[10.5pt] mb-1">Default open/closed dos colapsíveis (exceto onde marcado como sempre aberto)</li>
          <li className="text-[10.5pt] mb-1">Ordem dos blocos pode mudar SE mantida coerência narrativa (decisão → detalhe)</li>
          <li className="text-[10.5pt] mb-1">Granularidade dos sub-componentes</li>
          <li className="text-[10.5pt] mb-1">Animações framer-motion</li>
        </ul>

        <DocH2 num="A.3">Dependências cruzadas a observar</DocH2>
        <ul className="ml-5 list-disc">
          <li className="text-[10.5pt] mb-1">
            Bloco 1 (banner) referencia <DocCode>[data-sentinel-full-analysis]</DocCode> → âncora no bloco 10
          </li>
          <li className="text-[10.5pt] mb-1">
            Bloco 4 (Smart Alerts) referencia <DocCode>[data-red-flags-panel]</DocCode> → âncora no bloco 3
          </li>
          <li className="text-[10.5pt] mb-1">
            Bloco 1 dispara backend <DocCode>generateCompliancePdf</DocCode> via botão "Gerar parecer PDF"
          </li>
          <li className="text-[10.5pt] mb-1">
            Blocos 4, 5, 6, 7, 11 dependem de <DocCode>bdcAnalysis</DocCode> reconstruído no parent
          </li>
        </ul>

        <DocCallout kind="danger" title="ANTES DE QUEBRAR ALGO">
          Esta tela é a evidência primária de auditoria de uma decisão. Toda mudança DEVE:
          <br />
          1. Preservar todos os campos LIDOS do <DocCode>ComplianceScore</DocCode> e{' '}
          <DocCode>OnboardingCase</DocCode>
          <br />
          2. Manter a rastreabilidade até a fonte (sourceBadge nos red flags, source nos pontos
          positivos/atenção)
          <br />
          3. Não modificar nenhuma lógica de decisão — apenas apresentação
          <br />
          4. Garantir que o "Gerar parecer PDF" continue funcional (referenciado em processos regulatórios)
        </DocCallout>

        {/* Rodapé */}
        <div className="mt-10 border-t border-[#e0e0e0] pt-4 text-center">
          <p className="text-[9pt] text-[#1a1a1a]/30">
            Pin Bank — Documentação Microscópica da Tela de Análise de Risco
          </p>
          <p className="text-[8pt] text-[#1a1a1a]/20 mt-1">
            Documento Confidencial · Gerado em {new Date().toLocaleDateString('pt-BR')} · Versão{' '}
            {new Date().getFullYear()}.1
          </p>
        </div>
      </div>
    </div>
  );
}