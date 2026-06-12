import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox, QuestionTable } from './DocHelpers';

export default function DocSubsellers({ templates, questionsByTemplate }) {
  // Resolve os templates de subseller ativos hoje. Prioriza os modelos V4
  // atualizados (lite_v4 / v4_simplificado) e cai pros legados como fallback.
  const subsellerPJ =
    templates.find(t => t.model === 'subseller_pj_lite_v4' && t.isActive !== false) ||
    templates.find(t => t.model === 'subseller_v2' && t.isActive !== false);
  const subsellerPF =
    templates.find(t => t.model === 'subseller_pf_v4_simplificado' && t.isActive !== false) ||
    templates.find(t => t.model === 'subseller_pf' && t.isActive !== false);

  // Segmentos V4 disponíveis no SubsellerSegmentSelector (paridade com sellers diretos)
  const SUBSELLER_PJ_SEGMENTS = [
    ['ComplianceEcommerceV4', 'E-commerce', 'Loja virtual com produtos físicos'],
    ['ComplianceGatewayV4', 'Gateway de Pagamento', 'Plataforma que processa pagamentos para terceiros'],
    ['ComplianceMarketplaceV4', 'Marketplace', 'Plataforma com múltiplos vendedores'],
    ['ComplianceSaaSV4', 'SaaS', 'Software como serviço — assinatura recorrente'],
    ['ComplianceInfoprodutosV4', 'Infoprodutos', 'Cursos, e-books, mentorias digitais'],
    ['ComplianceEducacaoV4', 'Educação', 'Instituições e plataformas educacionais'],
    ['ComplianceDropshippingV4', 'Dropshipping', 'Venda sem estoque próprio'],
    ['ComplianceMPEV4', 'MEI / ME / EPP', 'Micro e pequenas empresas'],
    ['ComplianceLinkPagamentoV4', 'Link de Pagamento', 'Vendas por link direto ao consumidor'],
  ];

  return (
    <S>
      <H1>10. Fluxo de Subsellers (PJ e PF) — Arquitetura Unificada com Sellers Diretos</H1>

      <P>O fluxo de subsellers é usado quando um seller principal (marketplace, gateway, plataforma vertical) precisa cadastrar seus sub-merchants. Cada subseller passa por um processo KYC independente do seller principal, mas o caso fica vinculado via <code>parentMerchantId</code>. A partir de 2026, o fluxo foi completamente refatorado para <strong>paridade total com o fluxo de sellers diretos</strong>: o subseller agora passa pela MESMA profundidade de análise (mesmos questionários V4 por segmento, mesmos datasets BDC, mesmo CAF SDK de identidade, mesmo VerifAI, mesmo Risk Scoring V4).</P>

      <InfoBox title="Mudança arquitetural 2026 — Paridade com Sellers Diretos">
        <p>Antes: subsellers PJ tinham um único questionário inteligente com perguntas dinâmicas por sub-segmento (E-commerce, SaaS, Infoprodutos, Dropshipping). Agora: subsellers PJ escolhem entre 9 segmentos V4 completos, cada um resolvendo para um QuestionnaireTemplate V4 do mesmo calibre usado em sellers diretos. A análise de risco é idêntica — uma subconta não é mais "tratada com menos rigor" que um seller direto.</p>
      </InfoBox>

      <H2>10.1. Geração de Links de Onboarding (Admin)</H2>
      <P>O admin gera links do tipo <code>SUBSELLER_COMPLIANCE</code> em <strong>/GerenciarSubsellerLinks</strong>. O modal <code>GenerateLinkModal</code> permite escolher:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>Merchant principal (seller):</Bold> apenas merchants já aprovados (<code>onboardingStatus = "Aprovado"</code>) podem gerar links de subseller. A função <code>generateSubsellerLink</code> valida isso e bloqueia se o seller estiver pendente.</Li>
        <Li><Bold>Branding:</Bold> Padrão PagSmile OU Personalizado (white-label) com logo do seller, cor primária, cor secundária e slug amigável.</Li>
        <Li><Bold>Expiração:</Bold> opcional (null = sem expiração).</Li>
      </ul>
      <P>O link gerado tem formato: <code>https://app.pagsmile.com/SubsellerQuestionnaire?ref=SUB_XXXXXXXXXXX</code> (ou <code>/s/slug-personalizado</code> quando branding custom). Cada link contém: <code>parentMerchantId</code>, branding opcional (logo, cores), código único, template padrão vinculado, e contadores de cliques/submissões.</P>

      <H2>10.2. Passo 1 — Seleção PF vs PJ (MerchantTypeSelector)</H2>
      <P>Quando o subseller abre o link, a página <code>SubsellerQuestionnaire</code> carrega o contexto via <code>publicReadContext</code>, valida que o link está ativo e não expirado, e aplica o branding customizado (se houver). Em seguida, apresenta o seletor:</P>
      <Table headers={['Tipo', 'Descrição exibida', 'Fluxo resultante']} rows={[
        ['👤 Pessoa Física', 'CPF — Autônomo, profissional liberal ou vendedor individual', 'Vai direto para o questionário subseller_pf (55 perguntas BACEN-aderente).'],
        ['🏢 Pessoa Jurídica', 'CNPJ — Empresa, MEI, EIRELI ou sociedade', 'Vai para o seletor de segmento (passo 2).'],
      ]} />

      <H2>10.3. Passo 2 — Seleção de Segmento (SubsellerSegmentSelector — apenas PJ)</H2>
      <P>Se o subseller é PJ, ele escolhe entre <strong>9 segmentos V4 idênticos aos disponíveis para sellers diretos</strong> (excluindo apenas PIX Merchant e PIX Intermediário, que não são ofertados para subcontas). Cada segmento resolve para um QuestionnaireTemplate V4 específico:</P>
      <Table headers={['Segmento', 'Modelo V4', 'Descrição apresentada ao cliente']} rows={SUBSELLER_PJ_SEGMENTS} />
      <P>A seleção é feita em uma grade visual 3×3 com ícones e descrições. Cada card usa a cor de acento do segmento para facilitar o reconhecimento visual.</P>

      <H2>10.4. Passo 3 — Questionário Específico</H2>

      {subsellerPF && questionsByTemplate[subsellerPF.id]?.length > 0 && (
        <>
          <H3>10.4.A. Subseller PF — Questionário subseller_pf</H3>
          <P><strong>Modelo:</strong> {subsellerPF.model} | <strong>Tipo:</strong> {subsellerPF.merchantType} | <strong>Total de perguntas:</strong> {questionsByTemplate[subsellerPF.id].length} | <strong>Score Base V4:</strong> 30</P>
          <P><em>{subsellerPF.description}</em></P>
          <P>9 blocos temáticos: (1) identificação qualificada, (2) endereço residencial, (3) atividade de negócio, (4) perfil profissional & financeiro, (5) perfil transacional, (6) PEP & sanções internacionais, (7) Res. BCB 44/2020 + Circ. BCB 3.978 Art. 27-28, (8) LGPD (Lei 13.709/2018), (9) declarações finais. Base legal completa: Circ. BCB 3.978/2020 (KYC/PLD), Res. BCB 119/2021 (RBA), Res. BCB 44/2020 (sanções), Lei 9.613/1998 (PLD), LGPD.</P>
          <P>A lista completa de TODAS as perguntas do questionário PF:</P>
          <QuestionTable questions={questionsByTemplate[subsellerPF.id]} />

          <H3>Documentos — Subseller PF (via DynamicDocumentUploadPage)</H3>
          <Table headers={['Documento', 'Descrição', 'CAF SDK', 'Obrigatório']}
            rows={(subsellerPF.requiredDocuments || []).map(d => [
              d.label, d.description || '—', d.cafSdk || '—', d.required ? '✅ Sim' : 'Condicional'
            ])}
          />
          <P><strong>Fluxo de docs (PF):</strong> a página <code>SubsellerDocUpload</code> apresenta o <code>DynamicDocumentUploadPage</code> que carrega: (1) RG/CNH Frente via SDK CAF DocumentDetector; (2) RG/CNH Verso via CAF DocumentDetector; (3) Prova de Vida + Verificação Facial via CAF FaceLiveness; (4) Comprovante de Endereço; (5) Comprovante de Renda (condicional — apenas quando renda declarada &gt; R$10k/mês conforme Circ. BCB 3.978 Art. 15, I, 'e').</P>
        </>
      )}

      {subsellerPJ && questionsByTemplate[subsellerPJ.id]?.length > 0 && (
        <>
          <H3>10.4.B. Subseller PJ — Questionário V4 por Segmento</H3>
          <P>Cada segmento PJ resolve para seu próprio QuestionnaireTemplate V4 (ex: <code>ComplianceEcommerceV4</code>, <code>ComplianceGatewayV4</code>, etc.). As perguntas são IDÊNTICAS às de um seller direto no mesmo segmento — o fluxo é 100% paritário. Consulte a <strong>Seção 3 — Questionários de Compliance</strong> para ver todas as perguntas de cada modelo V4.</P>

          <H3>10.4.B.1. Template Legado subseller_v2 (fallback)</H3>
          <P>O template <code>subseller_v2</code> ainda existe como fallback para casos legados ou quando o merchant principal tem customização específica. Ele contém {questionsByTemplate[subsellerPJ.id].length} perguntas em um questionário "inteligente" com lógica condicional por sub-segmento (E-commerce, SaaS/Recorrência, Infoprodutos, Dropshipping). O sistema prefere sempre os templates V4 por segmento quando disponíveis.</P>
          <QuestionTable questions={questionsByTemplate[subsellerPJ.id]} />

          <H3>Documentos — Subseller PJ</H3>
          <P><strong>Documentos base (obrigatórios para todos os sub-segmentos):</strong></P>
          <Table headers={['Documento', 'Descrição', 'Formatos', 'Obrigatório']}
            rows={(subsellerPJ.requiredDocuments || []).filter(d => !d.conditionalLogic).map(d => [
              d.label, d.description || '—', (d.allowedFormats || []).join(', '), d.required ? '✅ Sim' : 'Não'
            ])}
          />
          {(subsellerPJ.requiredDocuments || []).filter(d => d.conditionalLogic).length > 0 && (
            <>
              <P><strong>Documentos condicionais por sub-segmento:</strong></P>
              <Table headers={['Documento', 'Descrição', 'Aparece quando segmento =', 'Formatos']}
                rows={(subsellerPJ.requiredDocuments || []).filter(d => d.conditionalLogic).map(d => [
                  d.label, d.description || '—', d.conditionalLogic?.value || '—', (d.allowedFormats || []).join(', ')
                ])}
              />
            </>
          )}
        </>
      )}

      <H2>10.5. Upload de Documentos + Identidade (SubsellerDocUpload)</H2>
      <P>Após finalizar o questionário, o cliente vai para <code>/SubsellerDocUpload</code> que reutiliza o mesmo <code>DynamicDocumentUploadPage</code> do fluxo seller direto:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li>Upload dos documentos societários (PJ) ou pessoais complementares (PF).</Li>
        <Li>CAF SDK inicia a captura biométrica do representante legal (DocumentDetector frente + verso + FaceLiveness).</Li>
        <Li>Fallback automático para BDC BigID se CAF SDK falhar.</Li>
        <Li>VerifAI Docs analisa cada documento para manipulação digital.</Li>
        <Li>Submissão cria o <code>OnboardingCase</code> com <code>isSubsellerCase = true</code> + <code>parentMerchantId</code>.</Li>
        <Li>Dispara o mesmo pipeline <code>autoEnrichOnboarding</code> usado em sellers diretos — 11 etapas idênticas.</Li>
      </ol>

      <H2>10.6. Datasets BDC para Subsellers</H2>
      <P>Subsellers PJ usam o grupo <code>SUBSELLER_PJ</code> (23 datasets via endpoint /empresas) — mais enxuto que o grupo FULL/STANDARD mas ainda cobrindo as dimensões críticas (basic_data, kyc, processes, owners_kyc, credit_risk, reputations_and_reviews, media_profile, activity_indicators). Subsellers PF usam o grupo <code>SUBSELLER_PF</code> (23 datasets via endpoint /pessoas) com fontes exclusivas de CPF (SCR Score BCB, KYC Familiar, Renda Presumida, Programas Sociais, Arrecadação Simples/MEI, Rede de Relacionamentos, Servidores Públicos) detalhadas na Seção 5.2.</P>

      <H2>10.7. Aba "Subcontas" no Seller Principal</H2>
      <P>No dossiê do seller principal (<code>/CadastroDetalhe</code>), aparece a aba "Subcontas" que lista todos os subsellers vinculados via <code>parentMerchantId</code>. Cada subseller mostra: nome, CPF/CNPJ, score V4, subfaixa, status da decisão, tipo (PF/PJ), segmento (para PJ) e link direto para o dossiê completo. Permite ao analista visualizar o saúde do portfólio do seller principal.</P>

      <H2>10.8. URL Curta Personalizada</H2>
      <P>Quando o admin cria um link com branding customizado e preenche <code>customSlug</code>, o sistema gera um redirecionador em <code>/s/:slug</code> que aponta para <code>/SubsellerQuestionnaire?ref=SUB_XXX</code>. Isso permite URLs curtas e brandadas como <code>app.pagsmile.com/s/marketplace-x-cadastro</code> em vez do código aleatório completo — melhor para compartilhamento e confiança do cliente final.</P>

      <InfoBox title="Teste de Paridade (QA contínuo)">
        <p>O time roda periodicamente um teste automatizado que: (1) gera um link de subseller PJ com branding custom; (2) abre o link como cliente anônimo; (3) verifica que o MerchantTypeSelector aparece; (4) seleciona PJ → aparece o SegmentSelector com 9 segmentos; (5) seleciona E-commerce → carrega o template V4 de E-commerce com as mesmas perguntas que seller direto teria. Qualquer divergência entre o fluxo subseller e seller direto gera alerta automático.</p>
      </InfoBox>
    </S>
  );
}