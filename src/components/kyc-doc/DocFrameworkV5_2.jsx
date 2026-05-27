import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Seção 20 — Framework V5.2 (Conceitos Gerais)
 *
 * V5.2 é ADITIVO ao V4 — toda a doc anterior (seções 0-19) permanece válida
 * para casos com framework_version = 'v4.0'. Esta seção introduz os conceitos
 * do novo framework para casos com framework_version = 'v5.2'.
 *
 * Versão resumida do conteúdo dos capítulos 14, 15, 16 da Documentação Master —
 * para consulta rápida pelo analista de compliance.
 */
export default function DocFrameworkV5_2() {
  return (
    <S>
      <H1>20. Framework V5.2 — Conceitos Gerais (Tiers, Capabilities, 5 Categorias)</H1>

      <P>O <Bold>Framework V5.2</Bold> é a evolução do modelo V4 (Seções 7-9 deste manual). É <Bold>ADITIVO</Bold> — V4 continua válido para casos antigos. Cada <code>OnboardingCase</code> carrega o campo <code>framework_version</code> imutável que define qual motor avalia o caso. Esta seção apresenta os conceitos para o analista entender casos V5.2 que aparecerem no painel.</P>

      <InfoBox title="Quando V5.2 é usado" color="blue">
        <p>Casos novos são criados com <code>framework_version = 'v5.2'</code> se a feature flag estiver ativa para o segmento/tier do seller. Casos legados continuam V4. A função <code>v5_2FeatureFlag</code> controla o rollout. Conforme calibragem, V5.2 entrou primeiro para Gateway, Crossborder e Plataformas Verticais (Tier 3) e depois rollout gradual para os demais segmentos.</p>
      </InfoBox>

      <H2>20.1. DNA do Caso — 4 Campos de Versionamento</H2>
      <P>Cada caso V5.2 carrega 4 campos imutáveis no <code>OnboardingCase</code>:</P>
      <Table headers={['Campo', 'O que registra', 'Quando se torna imutável']} rows={[
        ['framework_version', 'DNA principal do caso (v4.0 ou v5.2)', 'Criação do caso'],
        ['framework_version_at_start', 'Versão vigente quando seller iniciou o questionário', 'Bootstrap do questionário'],
        ['framework_version_at_submit', 'Versão no submit final do seller', 'Submissão'],
        ['framework_version_at_decision', 'Versão no momento da decisão final (SENTINEL)', 'Decisão final — é o que conta regulatoriamente'],
        ['is_transitional_case', 'true quando _at_start ≠ _at_submit/_at_decision', 'Setado automaticamente'],
      ]} />
      <P>Casos "transicionais" (que mudaram de versão durante o ciclo de vida) exibem banner amarelo no painel do analista.</P>

      <H2>20.2. Tiers Canônicos V5.2</H2>
      <P>V4 trata todos os sellers no mesmo eixo 0-849. V5.2 separa por <Bold>porte</Bold>:</P>
      <Table headers={['Tier', 'Definição', 'Escala score', 'Cat 4 (block) em']} rows={[
        ['tier_1', 'TPV ≤ R$ 30k/mês — MPE, autônomos, MEI iniciantes', '0-850', '≥ 720'],
        ['tier_2', 'TPV R$ 30k-200k — médias empresas, Marketplace FIXO aqui', '0-850', '≥ 720'],
        ['tier_3', 'TPV > R$ 200k OU crossborder OU gateway — alta exposição', '0-999', '≥ 850'],
        ['subseller_pj', 'Subseller PJ qualquer porte (graus A/B/C por TPV interno)', '0-850', '≥ 720'],
        ['subseller_pf', 'Subseller PF qualquer renda (graus A/B/C por renda líquida)', '0-850', '≥ 720'],
      ]} />

      <InfoBox title="Por que Marketplace fixo em T2?" color="amber">
        <p>Marketplaces têm TPV alto mas o risco é <Bold>distribuído entre sub-merchants</Bold> que já passam por KYC próprio. Mantê-lo em T2 evita dupla penalização: o seller principal tem score T2, e cada subseller tem seu próprio score (PJ ou PF).</p>
      </InfoBox>

      <H2>20.3. Capabilities Transversais</H2>
      <P>Capabilities atravessam segmentos e adicionam exigências regulatórias quando ATIVAS:</P>
      <Table headers={['Capability', 'Quando ativa', 'O que muda']} rows={[
        ['splits/subseller', 'Marketplace, Gateway/PSP, plataforma com repasse', '+12 perguntas Tier 3 + exige plano KYC subsellers + bloqueios B-SPL-*'],
        ['crossborder', 'Pagamentos internacionais (in/out)', '+8 perguntas câmbio + BCB Res. Conj. câmbio + bloqueios B-CB-*'],
        ['recurrence', 'Cobrança recorrente / assinaturas', '+5 perguntas churn/cancelamento + bloqueios B-REC-*'],
        ['cap_financial_capacity_validation', 'TPV declarado >> faturamento comprovado (RAIS/ECF)', 'Ativa Patch Financeiro (5 dim) + bloqueios B-FIN-* / B-FCV-*'],
      ]} />

      <H2>20.4. Segmentos Canônicos V5.2 (15 vs 13 do V4)</H2>
      <P>V5.2 mantém todos os 13 segmentos V4 e adiciona <Bold>crossborder</Bold> e <Bold>banking-as-a-service</Bold> como segmentos próprios (antes eram forçados em Gateway/Plataforma Vertical, mascarando risco específico).</P>

      <H2>20.5. Matriz de Decisão V5.2 — 5 Categorias</H2>
      <Table headers={['Cat', 'Codigo', 'Quando', 'Decisão UI']} rows={[
        ['1', 'cat_1_auto_approve', 'Score baixo + zero bloqueios + patch verde', 'Aprovado'],
        ['2', 'cat_2_conditional', 'Score médio-baixo + 0-2 findings menores', 'Aprovado com Condições'],
        ['3', 'cat_3_manual_review', 'Score alto-médio OU patch laranja OU SENTINEL confiança < 60', 'Revisão Manual'],
        ['4', 'cat_4_block', 'Bloqueio absoluto OU score acima do threshold sem chance de Cat 5', 'Recusado'],
        ['5', 'cat_5_intensive_monitoring', 'Bloqueio comum + valor comercial + aceite Head Compliance', 'Aprovado com Monitoramento Intensivo (Seção 21)'],
      ]} />

      <H2>20.6. Os 72 Bloqueios V5.2 (vs 10 do V4)</H2>
      <P>V4 tem 10 bloqueios (B01-B10, Seção 0.3). V5.2 expande para 72 códigos catalogados por dimensão (formato <code>B-XXX-NN</code>):</P>
      <Table dense headers={['Prefixo', 'Dimensão', 'Quantidade']} rows={[
        ['B-ID-NN', 'identidade_cadastro', '8'],
        ['B-SOC-NN', 'socios_beneficiarios', '10'],
        ['B-EST-NN', 'estrutura_societaria', '6'],
        ['B-SAN-NN', 'sancoes_internacionais_nacionais', '8'],
        ['B-PRO-NN', 'processos_compliance', '6'],
        ['B-REP-NN', 'atividade_reputacao', '5'],
        ['B-FIN-NN', 'financeiro_mercado', '6'],
        ['B-ESG-NN', 'trabalho_esg', '4'],
        ['B-SET-NN', 'compliance_setorial', '5'],
        ['B-PLD-NN', 'pld_ft', '4'],
        ['B-CB-NN', 'risco_pais_internacional', '4'],
        ['B-CAF-NN', 'caf_biometria_screening', '6'],
        ['B-SPL-NN', 'splits/subseller (capability)', '3'],
        ['B-REC-NN', 'recurrence (capability)', '2'],
        ['B-FCV-NN', 'cap_financial_capacity_validation', '3'],
      ]} />

      <InfoBox title="10 bloqueios ABSOLUTOS — sem exceção" color="amber">
        <p>Dos 72 bloqueios, <Bold>10 são absolutos</Bold> — não admitem Cat 5 mesmo com aprovação de Head Compliance. São: B-SAN-01 (OFAC), B-SAN-04 (UN), B-SAN-07 (Interpol), B-ID-01 (CNPJ inativo), B-ESG-01 (Lista Suja MTE), B-CAF-01/02/03 (fraude biométrica binária), B-SET-01 (atividade ilícita), B-CB-01 (país sancionado).</p>
      </InfoBox>

      <H2>20.7. As 5 Camadas do Score V5.2</H2>
      <Table headers={['Camada', 'Nome', 'O que mede']} rows={[
        ['C1', 'Base por Segmento+Tier', 'Risco inerente da atividade × porte'],
        ['C2', 'Ajuste Morfológico', 'Ajuste por composição operacional (cartao_heavy, pix_heavy, etc.)'],
        ['C3', 'Variáveis Declaradas+Confirmadas', 'V01-V60+ alimentadas pelo questionário + cross-validação BDC'],
        ['C4', 'Capabilities Transversais', 'Pontos adicionais por capabilities ativas'],
        ['C5', 'Patch Financeiro', 'Pontos por incoerências financeiras (verde/amarelo/laranja/vermelho)'],
      ]} />

      <H2>20.8. Cross-Validation 16 Campos (Estruturada)</H2>
      <P>V4 fazia cross-validation implícito no SENTINEL. V5.2 estrutura em 16 campos canônicos comparando declarado × BDC, com status <code>match/divergence/mismatch/unknown</code>. Os 16 campos incluem: razão social, nome fantasia, CNPJ, capital social, data abertura, CNAE, endereço (logradouro/cidade/UF), e-mail, telefone, sócios (quantidade/nomes), site, TPV, funcionários.</P>

      <H2>20.9. Patch Financeiro — 5 Dimensões de Coerência</H2>
      <Table dense headers={['Dimensão', 'Declarado', 'Observado']} rows={[
        ['tpv_declarado_vs_bdc', 'TPV declarado × 12', 'BDC revenue'],
        ['faturamento_doc_vs_ecf', 'Faturamento declarado', 'ECF + DRE'],
        ['crc_status', '—', 'CRC do contador'],
        ['fluxo_caixa_open_finance', 'TPV declarado / 12', 'Open Finance 6m'],
        ['coerencia_setor', 'TPV declarado', 'Benchmark setor × porte'],
      ]} />

      <H2>20.10. Questionário Dinâmico V5.2</H2>
      <P>V4 usa templates fixos por segmento (Seção 3). V5.2 usa <Bold>catálogo único</Bold> de ~80 perguntas (PJ) + 65 (PF subseller) com roteamento dinâmico. Cada pergunta tem 5 modalidades possíveis:</P>
      <Table headers={['Modalidade', 'Renderer', 'Quando']} rows={[
        ['A — BDC Confirmação', 'ConfirmCard', 'Dados que BDC já tem (CNPJ, endereço, CNAE)'],
        ['B — Input Híbrido', 'HybridInputCard', 'BDC sugere mas seller pode atualizar (TPV, # funcionários)'],
        ['C — Input Puro', 'PureInputCard', 'BDC não tem (modelo cobrança, urgência)'],
        ['D — Derivado', 'DerivedCard', 'Sistema deriva de outras respostas (morfologia, tier)'],
        ['E — Upload Documento', 'DocumentUploadCard / CompositeCard', 'Doc + opcional input no mesmo step'],
      ]} />

      <P>A engine seleciona quais perguntas mostrar baseado em tier + segmento + capabilities ativas + respostas anteriores. Tier 1 sem capabilities vê ~32 perguntas; Tier 3 Gateway com splits + crossborder vê ~83.</P>

      <H2>20.11. Real-Time Block Engine</H2>
      <P>V4 só avalia bloqueios no submit. V5.2 avalia durante o preenchimento (componente <code>RealtimeBlocksPanel</code>) — seller que declara operar com país sancionado vê imediatamente o bloqueio, abandona o processo, economiza créditos BDC. NÃO substitui validação backend (que sempre reavalia tudo no submit).</P>

      <H2>20.12. Pipeline V5.2 — Onde Diverge do V4</H2>
      <P>O orquestrador <code>autoEnrichOnboardingV5_2</code> é similar ao V4 (Seção 8) mas com 4 mudanças centrais:</P>
      <ul className="list-decimal ml-6 space-y-1 mb-3">
        <Li><Bold>Step 0.1 (NOVO):</Bold> Resolução de Tier + Capabilities ANTES do BDC (define quais datasets serão chamados — T1 usa subset, T3 usa todos os 58)</Li>
        <Li><Bold>Step 1:</Bold> Usa <code>bdcEnrichCaseV5_2</code> em vez de V4 — escalas tier-aware, 72 bloqueios, 13 dimensões analíticas</Li>
        <Li><Bold>Step 3.5 (NOVO):</Bold> Patch Financeiro (5 dimensões)</Li>
        <Li><Bold>Step 4 (alterado):</Bold> Decisão usa Matriz V5.2 (5 categorias). Cat 5 dispara criação de PlanoMonitoramento + TermoAdicionalV5_2 (Seção 21)</Li>
      </ul>

      <H2>20.13. Snapshot — Imutabilidade da Decisão</H2>
      <P>Diferente do V4 que sobrescreve <code>ComplianceScore</code>, V5.2 cria um <Bold>Snapshot imutável</Bold> da decisão final (entidade <code>Snapshot</code>). Permite replay determinístico, diff entre versões e auditoria regulatória forense — o snapshot é a fonte legal mesmo se o código evoluir depois.</P>

      <InfoBox title="O que muda para o analista no dia-a-dia" color="green">
        <p>Quando abrir um caso v5.2 no <code>/CadastroDetalhe</code>, o painel apresenta a <Bold>nova UI redesenhada</Bold> (Aba 6 deste documento — Análise de Risco) com Hero Verdict, 3 Smart Summary Cards (Top alertas, Top positivos, Cross-val resumo) e 4 abas: Resumo, Evidências, Dimensional BDC (13 dimensões), SENTINEL+Auditoria. Datasets não consultados aparecem com tooltip explicativo (10 razões catalogadas).</p>
      </InfoBox>
    </S>
  );
}