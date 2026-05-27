import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';

/**
 * Capítulo 16 — Questionário Dinâmico V5.2
 *
 * V4 tem ~12 templates por segmento (Ch13 + Doc KYC §3). V5.2 substitui por um
 * CATÁLOGO ÚNICO de 80 perguntas (PJ) + 65 perguntas (PF subseller), com
 * roteamento dinâmico por tier + segmento + capabilities ativas.
 *
 * Fonte real:
 *   lib/v5_2/questionCatalog.js
 *   lib/v5_2/realtimeBlockEngine.js
 *   lib/v5_2/triggersTier.js
 *   lib/v5_2/microcopy.js
 *   functions/seedV5_2Questions.js
 *   components/v5_2/questionnaire/* (renderers por modalidade)
 *   entities/Question.json (campos categoria_funcional, modalidade_origem, etc.)
 */
export default function Ch16_QuestionarioV5_2() {
  return (
    <Sec id="ch-16">
      <H1 num="16">Questionário Dinâmico V5.2 — Catálogo Único, 5 Modalidades, Real-Time Blocks</H1>

      <P>O V4 entrega ao seller um <B>template fixo por segmento</B> com perguntas pré-definidas (Ch13). V5.2 inverte: existe <B>um único catálogo</B> de perguntas com IDs canônicos, e o questionário renderizado para o seller é <B>composto em runtime</B> baseado em tier + segmento + capabilities + modalidade declarada. Resultado: zero duplicação, fácil adição de pergunta, fluxo mais curto para sellers de baixo risco.</P>

      <Note title="V4 + V5.2 coexistem" kind="info">
        <p>Templates V4 (ComplianceEcommerceV4, ComplianceGatewayV4, etc.) continuam em produção para casos legados. Casos novos com <C>framework_version = 'v5.2'</C> usam o template único <B>V5_2_DYNAMIC</B> (marcado em <C>QuestionnaireTemplate.subCategory = 'V5_2_DYNAMIC'</C>). A engine de runtime seleciona quais perguntas do catálogo mostrar.</p>
      </Note>

      <H2 num="16.1">Estrutura do Catálogo Único</H2>

      <P>Catálogo definido em <C>lib/v5_2/questionCatalog.js</C> + seed na entidade <C>Question</C> via <C>seedV5_2Questions.js</C>. Cada pergunta tem <B>ID canônico estável</B> (campo <C>id_canonico</C>) independente do ID do banco:</P>

      <CodeBlock language="js">{`// Exemplo de pergunta canônica do catálogo
{
  id_canonico: 'q_t2_revenue_proof',  // ID canônico V5.2
  text: 'Envie comprovante de receita (DRE ou extrato bancário últimos 6 meses)',
  type: 'COMPOSITE',                   // input + upload no mesmo step
  categoria_funcional: 'documental',
  modalidade_origem: 'modalidade_e_documento_upload',
  tiers_aplicaveis: ['tier_2', 'tier_3'],
  segmentos_aplicaveis: ['all'],
  capabilities_ativam: ['cap_financial_capacity_validation'],
  variaveis_risk_score: ['V42_receita_comprovada'],
  b_series_disparados: ['B-FIN-03', 'B-FCV-02'],
  documentos_relacionados: ['doc_dre_assinado', 'doc_extrato_bancario_6m'],
  norma_regulatoria: 'Circ. BCB 3.978/2020 Art. 11; Res. BCB 119/2021',
  framework_version_intro: 'v5.2',
  id_canonico_v4_equivalente: null,    // se for pergunta nova v5.2
}`}</CodeBlock>

      <H3 num="16.1.1">Volumes do catálogo</H3>
      <Table dense headers={['Bloco', 'Total perguntas']} rows={[
        ['PJ — Base comum (T1+T2+T3)', '32'],
        ['PJ — Tier 2 adicional', '15'],
        ['PJ — Tier 3 adicional', '20'],
        ['PJ — Capability splits/subseller', '8'],
        ['PJ — Capability crossborder', '8'],
        ['PJ — Capability recurrence', '5'],
        ['PJ — Capability cap_financial_capacity_validation', '6'],
        ['PJ — Segmento-específicas (e-commerce, dropshipping, etc.)', '12'],
        [<B key="t">Total PJ</B>, <B key="tt">~80 perguntas</B>],
        ['Subseller PF — Base BACEN-aderente', '40'],
        ['Subseller PF — Renda + atividade', '15'],
        ['Subseller PF — PEP/sanções/LGPD', '10'],
        [<B key="t2">Total Subseller PF</B>, <B key="tt2">~65 perguntas</B>],
      ]} />

      <Note title="Não é cumulativo bobo" kind="info">
        <p>Um seller PJ Tier 1 sem capabilities responde só ~32 perguntas (base). Um Tier 3 Gateway com splits + crossborder responde ~32+15+20+8+8 = ~83 perguntas. A engine garante que <B>cada pergunta só aparece UMA vez</B> mesmo se múltiplos triggers a selecionariam.</p>
      </Note>

      <H2 num="16.2">As 5 Modalidades de Coleta</H2>

      <P>Cada pergunta tem <C>modalidade_origem</C> que define como o seller responde. Renderers correspondentes em <C>components/v5_2/questionnaire/*</C>:</P>

      <Table headers={['Modalidade', 'Renderer', 'O que faz', 'Quando usar']} rows={[
        [<B key="a">A — BDC Confirmação</B>, <C key="ar">ConfirmCard</C>, 'Mostra valor que BDC já trouxe e pede "Está correto?" (sim/não/corrigir)', 'Dados que o BDC tem (razão social, CNPJ, endereço, CNAE, sócios)'],
        [<B key="b">B — Input Híbrido</B>, <C key="br">HybridInputCard</C>, 'Sugere valor BDC mas aceita override pelo seller (com justificativa)', 'Dados que o BDC tem mas o seller pode ter info mais recente (TPV, # funcionários)'],
        [<B key="c">C — Input Puro</B>, <C key="cr">PureInputCard</C>, 'Input livre — BDC não tem o dado', 'Modelo de cobrança, urgência, política de devolução'],
        [<B key="d">D — Derivado</B>, <C key="dr">DerivedCard</C>, 'Automático — sistema deriva de outras respostas, exibe apenas como preview', 'Morfologia operacional, tier, capabilities ativas'],
        [<B key="e">E — Upload Documento</B>, <span key="er"><C>DocumentUploadCard</C> ou <C>CompositeCard</C></span>, 'Upload de doc + (opcional) input complementar', 'Contrato social, DRE, comprovante de endereço, licenças'],
      ]} />

      <H3 num="16.2.1">Estado do CompositeCard (modalidade E especial)</H3>
      <P>O tipo <C>COMPOSITE</C> permite input + upload no mesmo step — útil para "comprovante de receita" onde o seller declara o valor E envia o doc. Diferente do V4 que separava em 2 steps. Implementado em <C>components/v5_2/questionnaire/CompositeCard.jsx</C>.</P>

      <H2 num="16.3">Engine de Roteamento</H2>

      <P>A função <C>selectQuestionsForCase</C> (em <C>lib/v5_2/questionCatalog.js</C>) recebe o estado do caso e retorna a lista ordenada de perguntas:</P>

      <CodeBlock language="js">{`// Pseudocódigo da seleção
function selectQuestionsForCase({ tier, segmento, capabilitiesAtivas, currentAnswers }) {
  const allQuestions = await base44.entities.Question.filter({
    questionnaireTemplateId: V5_2_DYNAMIC_TEMPLATE_ID,
    framework_version_removed: null,  // ainda ativas
  });

  return allQuestions.filter(q => {
    // 1. Tier match
    if (q.tiers_aplicaveis?.length > 0 && !q.tiers_aplicaveis.includes(tier)) return false;

    // 2. Segmento match
    if (q.segmentos_aplicaveis?.length > 0 && !q.segmentos_aplicaveis.includes('all')) {
      if (!q.segmentos_aplicaveis.includes(segmento)) return false;
    }

    // 3. Capability gate
    if (q.capabilities_ativam?.length > 0) {
      const anyActive = q.capabilities_ativam.some(c => capabilitiesAtivas.includes(c));
      if (!anyActive) return false;
    }

    // 4. Conditional logic (depende de resposta anterior)
    if (q.conditionalLogic?.dependsOn) {
      const dep = currentAnswers[q.conditionalLogic.dependsOn];
      if (!matchesCondition(dep, q.conditionalLogic.operator, q.conditionalLogic.value)) return false;
    }

    return true;
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}`}</CodeBlock>

      <H2 num="16.4">Real-Time Block Engine</H2>

      <P>V4 só avalia bloqueios <B>no final</B> (depois do pipeline). V5.2 avalia <B>durante o preenchimento</B> — o seller recebe feedback imediato quando uma resposta dispara um bloqueio. Componente: <C>RealtimeBlocksPanel.jsx</C>. Engine: <C>lib/v5_2/realtimeBlockEngine.js</C>.</P>

      <H3 num="16.4.1">Fluxo</H3>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Seller responde uma pergunta (ex: "Você processa pagamentos para Coreia do Norte?" → "Sim")</li>
        <li><C>RealtimeBlocksPanel</C> avalia a resposta contra os 72 bloqueios em tempo real (client-side, sem chamada backend)</li>
        <li>Se dispara bloqueio absoluto: exibe <B>banner vermelho persistente</B> + impede submit do step</li>
        <li>Se dispara bloqueio comum: exibe <B>aviso amarelo</B> informando que será necessária análise manual</li>
        <li>Seller pode corrigir a resposta — o painel atualiza imediatamente</li>
      </ol>

      <Note title="Real-time não substitui validação backend" kind="warn">
        <p>Toda avaliação client-side é <B>reavaliada no submit</B> (server-side, com BDC enriquecido). O painel real-time é UX informativo + corta atrito (seller que mente sobre operar com país sancionado vê imediatamente que será bloqueado, abandona o processo, economiza créditos de BDC). NÃO é validação de segurança.</p>
      </Note>

      <H3 num="16.4.2">TierEscalatedBanner</H3>
      <P>Quando o seller declara TPV mais alto do que o tier inicial sugeria (ex: começou T1, declarou TPV R$ 250k → vira T3), o componente <C>TierEscalatedBanner</C> aparece informando: "Seu porte declarado eleva sua análise para Tier 3. Você verá ~20 perguntas adicionais relativas a alta exposição regulatória." Transparência total.</P>

      <H2 num="16.5">Categorias Funcionais (agrupamento na UI)</H2>

      <P>Cada pergunta tem <C>categoria_funcional</C> que agrupa visualmente na UI. Lista enum oficial:</P>

      <Table dense headers={['Codigo', 'Nome exibido', 'Exemplos de perguntas']} rows={[
        ['identidade', 'Identidade & Dados Cadastrais', 'CNPJ, razão social, endereço, fundação'],
        ['atividade_economica', 'Atividade Econômica', 'O que vende, descrição negócio, CNAE'],
        ['volumetria', 'Volumetria', 'TPV, ticket médio, transações/mês, faturamento'],
        ['modelo_operacional', 'Modelo Operacional', 'Distribuição meios, parcelamento, modalidade'],
        ['estrutura_societaria', 'Estrutura Societária', 'Sócios, UBO, grupo econômico, controle'],
        ['compliance_pld', 'Compliance & PLD', 'PEP, sanções, processos, dívida ativa, COAF'],
        ['internacional_crossborder', 'Internacional / Crossborder', 'Países operação, exposição cambial, regulamentação'],
        ['splits_marketplace', 'Splits & Marketplace', 'Subsellers, take rate, KYC subsellers, repasse'],
        ['recorrencia_assinaturas', 'Recorrência & Assinaturas', 'Churn, cancelamento, política reembolso'],
        ['documental', 'Documental', 'Contrato social, DRE, comprovantes, licenças'],
        ['declaracao_atestacao', 'Declarações Finais', 'LGPD, veracidade, ciência das condições'],
        ['subseller_pj', 'Subseller PJ Específicas', '— (catálogo subseller PJ)'],
        ['subseller_pf', 'Subseller PF Específicas', '— (catálogo subseller PF BACEN-aderente)'],
        ['outra', 'Outras', 'Fallback'],
      ]} />

      <H2 num="16.6">Variáveis de Risk Score Alimentadas (V01-V60+)</H2>

      <P>Cada pergunta lista quais <B>variáveis do scoring</B> ela alimenta (campo <C>variaveis_risk_score</C>). Permite traceability completa: para qualquer V-NN, sabemos exatamente qual pergunta a originou.</P>

      <Table dense headers={['Variável', 'O que mede', 'Pergunta que alimenta']} rows={[
        ['V01_cnpj_valido_e_ativo', 'CNPJ ativo na RF', 'Confirmação CNPJ (modalidade A) — cross-validado com BDC'],
        ['V02_capital_social_minimo', 'Capital ≥ R$ 1k', 'Confirmação capital (mod A) — cross-validado'],
        ['V07_socios_pep_identificados', 'PEPs em sócios identificados e declarados', 'Pergunta "Algum sócio é PEP?" (mod C) + cross-validação BDC owners_kyc'],
        ['V15_tpv_coerencia', 'TPV declarado coerente com BDC', 'Pergunta TPV (mod B) + Patch Financeiro'],
        ['V23_splits_kyc_subsellers', 'Marketplace tem KYC dos sellers', 'Pergunta "Como faz KYC dos seus sellers?" (mod C, só se cap splits)'],
        ['V42_receita_comprovada', 'Receita comprovada documentalmente', 'Pergunta COMPOSITE comprovante receita (mod E)'],
        ['... (40+ outras)', '—', '—'],
      ]} />

      <H2 num="16.7">Microcopy e Tooltips</H2>

      <P>V5.2 padroniza microcopy (textos curtos de ajuda) em <C>lib/v5_2/microcopy.js</C>. Cada pergunta crítica tem:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a]">
        <li><B>label:</B> texto da pergunta (40-80 chars)</li>
        <li><B>helpText:</B> contexto regulatório resumido (até 200 chars)</li>
        <li><B>tooltip_norma:</B> base regulatória citada (ex: "Circ. BCB 3.978/2020 Art. 15, I, 'e'")</li>
        <li><B>placeholder:</B> exemplo de resposta válida</li>
        <li><B>error_message:</B> mensagem específica se validação falhar</li>
      </ul>

      <Note title="Acessibilidade" kind="info">
        <p>Todos renderers (PureInputCard, ConfirmCard, HybridInputCard, DerivedCard, DocumentUploadCard, CompositeCard) suportam navegação por teclado, ARIA labels e atalhos de pular para próximo erro (atalho <C>?</C> abre painel de shortcuts via <C>V5_2ShortcutsProvider</C>).</p>
      </Note>

      <H2 num="16.8">Pergunta Removida vs Pergunta Versionada</H2>

      <P>Quando uma pergunta sai de uso, NÃO é deletada — recebe <C>framework_version_removed</C> = "v5.X". Isso preserva o histórico dos casos antigos que responderam essa pergunta. A engine ignora perguntas com <C>framework_version_removed</C> setado.</P>

      <CodeBlock language="js">{`// Exemplo: pergunta legada que saiu do uso
{
  id: 'pergunta_antiga_xyz',
  text: 'Já não usamos isso',
  framework_version_intro: 'v4.0',
  framework_version_removed: 'v5.2',   // saiu de uso a partir de v5.2
  // ... outros campos preservados
}`}</CodeBlock>

      <H2 num="16.9">Bootstrap do Questionário V5.2</H2>

      <P>Quando um caso v5.2 é criado, a sequência é:</P>
      <ol className="list-decimal ml-5 space-y-1 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li><C>publicOnboardingBootstrap.js</C> cria o caso com <C>framework_version = 'v5.2'</C></li>
        <li>Grava <C>framework_version_at_start = 'v5.2'</C> (imutável)</li>
        <li>Resolve tier inicial usando dados do Lead (TPV declarado, segmento)</li>
        <li>Resolve capabilities iniciais</li>
        <li>Chama <C>selectQuestionsForCase</C> e renderiza primeira etapa</li>
        <li>A cada resposta significativa (TPV, declaração de splits/crossborder/etc.), re-resolve tier + capabilities + atualiza lista</li>
        <li>No submit, <C>publicComplianceSubmit.js</C> grava <C>framework_version_at_submit</C> + dispara <C>autoEnrichOnboardingV5_2</C></li>
      </ol>

      <Source files={[
        'lib/v5_2/questionCatalog.js',
        'lib/v5_2/realtimeBlockEngine.js',
        'lib/v5_2/triggersTier.js',
        'lib/v5_2/microcopy.js',
        'functions/seedV5_2Questions.js',
        'functions/publicOnboardingBootstrap.js',
        'functions/publicComplianceSubmit.js',
        'components/v5_2/questionnaire/QuestionRendererV5_2.jsx',
        'components/v5_2/questionnaire/RealtimeBlocksPanel.jsx',
        'components/v5_2/questionnaire/TierEscalatedBanner.jsx',
        'components/v5_2/questionnaire/ConfirmCard.jsx (Modalidade A)',
        'components/v5_2/questionnaire/HybridInputCard.jsx (Modalidade B)',
        'components/v5_2/questionnaire/PureInputCard.jsx (Modalidade C)',
        'components/v5_2/questionnaire/DerivedCard.jsx (Modalidade D)',
        'components/v5_2/questionnaire/DocumentUploadCard.jsx (Modalidade E)',
        'components/v5_2/questionnaire/CompositeCard.jsx (Modalidade E composta)',
        'components/compliance/ComplianceV5_2Renderer.jsx (orquestrador frontend)',
        'entities/Question.json (campos categoria_funcional, modalidade_origem, tiers_aplicaveis, capabilities_ativam, variaveis_risk_score, b_series_disparados, framework_version_*)',
        'entities/QuestionnaireTemplate.json (subCategory V5_2_DYNAMIC)',
        'docs/V5_2_BLOCO4_QUESTIONARIO.md',
      ]} />
    </Sec>
  );
}