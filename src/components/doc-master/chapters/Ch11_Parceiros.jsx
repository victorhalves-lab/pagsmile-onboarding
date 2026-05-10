import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Endpoint, Pipeline, Source } from '../DocPrimitives';

/**
 * Capítulo 11 — Parceiros de Compliance, Doc-Only, Pré-KYC Bancário
 */
export default function Ch11_Parceiros() {
  return (
    <Sec id="ch-11">
      <H1 num="11">Parceiros de Compliance, Fluxo Doc-Only e Pré-KYC Bancário</H1>

      <P>Três funcionalidades adjacentes ao core de compliance, todas relacionadas a interações com terceiros (bureaus, BaaS, clientes em fluxos especiais). Cada uma com modelo de dados próprio e segregação de acesso.</P>

      <H2 num="11.1">Compliance Parceiros (Bureaus Externos)</H2>

      <P>Bureaus de compliance/auditorias externas podem ser convidados a analisar casos específicos sem acessar o sistema completo. Pertencem a uma camada de acesso DISTINTA — não usam AccessProfile, vivem em <C>CompliancePartner</C> + <C>CompliancePartnerUser</C>.</P>

      <H3 num="11.1.1">CompliancePartner Schema</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['name', 'string', 'Nome do bureau (ex: "Auditoria XYZ")'],
        ['cnpj', 'string', 'CNPJ do bureau'],
        ['contactEmail', 'string', 'E-mail principal'],
        ['contactPhone', 'string', 'Telefone'],
        ['status', 'enum', 'active | inactive'],
        ['slaHours', 'number', 'SLA contratual em horas (ex: 24, 48, 72)'],
        ['allowedOnboardingCaseModels', 'string[]', 'Modelos de template aos quais este parceiro pode ser atribuído. Ex: ["ComplianceGatewayV4", "ComplianceMarketplaceV4"]. Vazio = qualquer modelo.'],
        ['defaultVisibilityLevel', 'enum', 'FULL_DOSSIER | LIMITED | DOCUMENTS_ONLY — define quais dados o parceiro vê'],
        ['notificationChannels', 'object', '{ email: bool, slack: bool } — onde notificar atribuições'],
        ['createdBy', 'string', 'Email do admin criador'],
      ]} />

      <H3 num="11.1.2">CompliancePartnerUser Schema</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['userId', 'string (FK)', 'FK User da plataforma (registrado via convite)'],
        ['partnerId', 'string (FK)', 'FK CompliancePartner'],
        ['partnerRole', 'enum', 'viewer (read) | analyst (read + recommend) | manager (analyst + manage team)'],
        ['isActive', 'boolean', 'Permite revogação sem deletar'],
        ['invitedAt', 'datetime', '—'],
        ['invitedBy', 'string', 'Admin que convidou'],
      ]} />

      <H3 num="11.1.3">PartnerAssignment — Atribuição de Caso</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['onboardingCaseId', 'string (FK)', 'Caso atribuído'],
        ['partnerId', 'string (FK)', 'Bureau atribuído'],
        ['assignedBy', 'string', 'Email do admin que atribuiu'],
        ['assignedAt', 'datetime', '—'],
        ['status', 'enum', 'pending | in_review | recommended | completed | overdue'],
        ['dueDate', 'datetime', 'now + slaHours do partner'],
        ['partnerVisibilityLevel', 'enum', 'Override do default — pode ser mais restritivo'],
        ['partnerRecommendation', 'enum', 'Aprovado | Aprovado com Condições | Revisão Manual | Recusado | null'],
        ['partnerComments', 'string', 'Parecer textual (markdown permitido)'],
        ['partnerCompletedAt', 'datetime', '—'],
      ]} />

      <H3 num="11.1.4">PartnerAssignmentActivity — Log de Interação</H3>
      <Table dense headers={['activityType', 'Trigger']} rows={[
        ['assigned', 'PartnerAssignment criada'],
        ['viewed_dossie', 'Parceiro abriu /ComplianceParceiroDetalhe'],
        ['downloaded_document', 'Parceiro fez download de doc privado (signed URL)'],
        ['saved_draft', 'Parceiro salvou parecer parcial'],
        ['submitted_recommendation', 'Parceiro submeteu parecer final'],
        ['reassigned', 'Admin reatribuiu para outro parceiro'],
        ['released', 'Parceiro liberou caso (sem parecer)'],
        ['marked_overdue', 'partnerSlaMonitor marcou como overdue'],
        ['admin_message', 'Admin enviou mensagem ao parceiro'],
        ['partner_message', 'Parceiro enviou mensagem ao admin'],
      ]} />

      <H3 num="11.1.5">Páginas Dedicadas</H3>
      <Table dense headers={['Página', 'Audiência', 'Funcionalidade']} rows={[
        ['/ComplianceParceiro', 'Parceiros (bureaus)', 'Dashboard de seus casos atribuídos. Cards com SLA + status. Lista filtra por status/SLA/modelo.'],
        ['/ComplianceParceiroDetalhe', 'Parceiros', 'Dossiê do caso (visibility-level controlled). Form de parecer. Download de docs (signed URLs 5min).'],
        ['/AdminGestaoParceiros', 'Admins', 'CRUD de CompliancePartner + invite de users. Atribuição manual de casos (single ou bulk).'],
        ['/DocCompParceiros', 'Admins', 'Export consolidado em Excel/PDF do caso (BDC + CAF + SENTINEL + parecer parceiro).'],
      ]} />

      <H3 num="11.1.6">Funções Backend Dedicadas</H3>
      <Table dense headers={['Função', 'Caller', 'Propósito']} rows={[
        ['adminAssignCaseToPartner', 'Admin', 'Cria PartnerAssignment + envia notificação'],
        ['adminBulkAssignPartner', 'Admin', 'Atribui N casos de uma vez (até 100)'],
        ['partnerListMyCases', 'Partner User', 'Lista casos do parceiro autenticado (RLS server-side)'],
        ['partnerGetCaseDetail', 'Partner User', 'Retorna dossiê filtrado por visibility level'],
        ['partnerSubmitRecommendation', 'Partner User', 'Submete parecer + atualiza assignment'],
        ['partnerDownloadDocument', 'Partner User', 'Gera signed URL TTL 5min do doc'],
        ['partnerSlaMonitor', 'Scheduled (1h)', 'Marca assignments como overdue quando dueDate passou'],
        ['exportPartnerComplianceDoc', 'Admin/Partner', 'Gera Excel + PDF consolidados'],
      ]} />

      <H3 num="11.1.7">Visibility Levels (filtragem por nível)</H3>
      <Table headers={['Level', 'O que parceiro vê', 'O que parceiro NÃO vê']} rows={[
        ['FULL_DOSSIER', 'Tudo: BDC raw, CAF logs, SENTINEL, docs, score V4 completo, decisões automáticas, propostas, contratos', '—'],
        ['LIMITED', 'BDC summary (sem raw datasets), CAF result_status (sem scores precisos), SENTINEL sumario_executivo, docs, score V4 final', 'BDC raw, CAF detail, SENTINEL detalhado, propostas, contratos'],
        ['DOCUMENTS_ONLY', 'Apenas DocumentUpload + dados básicos do merchant (CNPJ, razão social)', 'Tudo o resto'],
      ]} />

      <H2 num="11.2">Fluxo Doc-Only (Captura sem CAF SDK)</H2>

      <P>Em alguns cenários, queremos que o cliente envie apenas documentos (sem captura biométrica via SDK CAF). Casos típicos: cliente offshore, ambiente sem câmera, cliente já KYC-aprovado em outra jurisdição mas precisa enviar contratos. O sistema gera um link público dedicado.</P>

      <H3 num="11.2.1">Geração do Link</H3>
      <Endpoint
        method="POST" path="generateDocOnlyLink (admin only)" auth="admin role"
        description="Gera token cripto-seguro vinculado ao OnboardingCase e cria link público."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true, desc: 'Caso ao qual o link se vincula' },
          { name: 'requiredDocuments', type: 'string[]', required: false, desc: 'Override da lista padrão de docs do template' },
          { name: 'expiresInDays', type: 'number', required: false, desc: 'Default 30' },
        ]}
        returns={`{
  "success": true,
  "url": "https://app.base44.com/ComplianceDocOnly?token={32-char-hex}",
  "docLinkToken": "...",
  "expiresAt": "..."
}`}
        source="functions/generateDocOnlyLink.js"
      />

      <H3 num="11.2.2">Página /ComplianceDocOnly</H3>
      <P>Pública. Recebe <C>?token=...</C>. Backend <C>publicReadContext</C> valida token e retorna lista de documentos esperados. Cliente faz upload de cada um. Cada upload dispara:</P>
      <Pipeline steps={[
        { id: '1', name: 'publicComplianceDocUpload', desc: 'Persiste DocumentUpload (isPrivate=true) e fileUri.', source: 'functions/publicComplianceDocUpload.js' },
        { id: '2', name: 'cafVerifaiDocs (fire-and-forget)', desc: 'Análise técnica do documento — manipulação digital, legibilidade, autenticidade.', source: 'functions/cafVerifaiDocs.js' },
        { id: '3', name: 'logPublicClientError (se erro)', desc: 'Se upload falhou no front, log estruturado.', source: 'functions/logPublicClientError.js' },
      ]} />

      <H3 num="11.2.3">Variantes do Doc-Only Link</H3>
      <Table headers={['Função', 'Diferença']} rows={[
        ['generateDocOnlyLink', 'Apenas docs. Sem CAF SDK. Sem questionário.'],
        ['generateCafOnlyLink', 'Apenas CAF SDK (selfie + documento via SDK). Sem docs adicionais. Sem questionário.'],
        ['generateDocsAndCafLink', 'Combo: CAF SDK + upload de docs adicionais. SEM questionário (questionário já foi feito antes).'],
      ]} />

      <H3 num="11.2.4">Fallback Links (cenários degradados)</H3>
      <P>Tabela <C>cafFallbackLinksConfig</C> mapeia cenários onde o SDK CAF é incompatível com o ambiente do cliente (ex: navegador in-app de WhatsApp não suporta câmera). Componente <C>BdcFallbackVerification</C> redireciona para fluxo BDC BigID. Função <C>cafFallbackLinkOpened</C> registra que o cliente acessou o fallback (telemetria).</P>

      <H2 num="11.3">Pré-KYC Bancário (BankDataCollection)</H2>

      <P>Após aprovação do KYC, o cliente precisa abrir conta operacional no banco parceiro (BaaS). Pagsmile coleta os dados bancários via página pública dedicada e exporta para o BaaS em XLSX padronizado.</P>

      <H3 num="11.3.1">BankDataCollection Schema</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['onboardingCaseId', 'string (FK)', 'Caso ao qual a coleta se vincula'],
        ['merchantId', 'string (FK)', '—'],
        ['cpfCnpj', 'string', 'Cache do CPF/CNPJ'],
        ['fullName', 'string', 'Cache do nome'],
        ['token', 'string (UQ)', 'Token cripto-seguro 192 bits gerado por crypto.getRandomValues + encoding hex (48 chars).'],
        ['status', 'enum', 'pending | submitted | exported | abandoned'],
        ['banco', 'string', 'Banco escolhido pelo cliente'],
        ['agencia', 'string', 'Agência (com dígito se aplicável)'],
        ['conta', 'string', 'Número da conta'],
        ['contaTipo', 'enum', 'corrente | poupanca'],
        ['titular', 'string', 'Nome do titular (geralmente igual fullName)'],
        ['titularCpfCnpj', 'string', 'Documento do titular (geralmente igual cpfCnpj)'],
        ['observacoes', 'string', 'Notas livres do cliente'],
        ['submittedAt', 'datetime', 'Quando cliente concluiu'],
        ['exportedAt', 'datetime', 'Quando admin exportou para XLSX'],
        ['clientIp', 'string', 'IP do cliente (LGPD: ip_hash em audit, IP em claro aqui apenas durante coleta)'],
        ['userAgent', 'string', '—'],
      ]} />

      <H3 num="11.3.2">Geração do Link</H3>
      <Endpoint
        method="POST" path="generateBankDataLink (admin only)" auth="admin role"
        description="Gera token + cria registro BankDataCollection com status=pending."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true, desc: 'Caso aprovado' },
        ]}
        returns={`{
  "success": true,
  "url": "https://app.base44.com/BankDataCollect?token={48-char-hex}",
  "token": "..."
}`}
        source="functions/generateBankDataLink.js"
      />

      <H3 num="11.3.3">Página /BankDataCollect (pública)</H3>
      <P>Cliente abre, valida token via <C>publicBankDataRead</C>, preenche formulário, submete via <C>publicBankDataSubmit</C>. Status muda pending → submitted. Página exibe checkmark + instruções de próximo passo.</P>

      <H3 num="11.3.4">Export XLSX (admin)</H3>
      <P>Admin acessa /Cadastro do caso aprovado → CadastroExportReportModal → seleciona "Exportar Pré-KYC para BaaS". Backend usa lib <C>xlsx</C> para gerar planilha com colunas padronizadas pelo BaaS (CNPJ, Razão Social, Banco, Agência, Conta, Tipo, Titular, Observações). Status muda para exported. Audit log registra export.</P>

      <H2 num="11.4">Bulk Reprocess (Reprocessamento em Massa)</H2>

      <P>Página <C>/BulkReprocess</C>. Admin pode disparar pipeline em N casos de uma vez. Casos típicos: nova versão de framework V4, fix de bug em analyzer, atualização de threshold, casos órfãos com BDC incompleto.</P>

      <H3 num="11.4.1">Modos de Reprocessamento</H3>
      <Table dense headers={['Mode', 'O que faz']} rows={[
        ['bdc-only', 'Re-roda apenas bdcEnrichCase. Mantém CAF e SENTINEL antigos.'],
        ['sentinel-only', 'Re-roda apenas analyzeOnboarding (SENTINEL).'],
        ['decision-only', 'Re-aplica Step 4 do pipeline (decisão determinística) sem re-fazer BDC/CAF/SENTINEL. Útil quando muda tabela de subfaixas.'],
        ['full-pipeline', 'Pipeline completo via autoEnrichOnboarding. Cuidado com créditos BDC/CAF.'],
      ]} />

      <H3 num="11.4.2">Backend</H3>
      <Endpoint
        method="POST" path="bulkReprocessCompliance (admin only)" auth="admin role"
        params={[
          { name: 'caseIds', type: 'string[]', required: true, desc: 'Limite 100 por chamada' },
          { name: 'mode', type: 'enum', required: true, desc: 'bdc-only | sentinel-only | decision-only | full-pipeline' },
          { name: 'cleanFirst', type: 'boolean', required: false, desc: 'Se true: deleta ComplianceScore + ExternalValidationResult + IntegrationLog antes (CUIDADO)' },
        ]}
        returns={`{ "queuedCount": 100, "skippedCount": 0, "errors": [] }`}
        source="functions/bulkReprocessCompliance.js"
      />

      <H3 num="11.4.3">UI Flow</H3>
      <Pipeline steps={[
        { id: '1', name: 'Filtros', desc: 'Admin filtra casos: status, subfaixa, template_model, data range, has_bdc_complete, etc.', source: 'components/bulk-reprocess/CaseSelectionTable' },
        { id: '2', name: 'Seleção', desc: 'Tabela com checkboxes. Select all / select page. Limite de 100 por batch.', source: 'idem' },
        { id: '3', name: 'Mode + cleanFirst', desc: 'Escolhe mode + opcional cleanFirst. Confirmação extra se cleanFirst=true.', source: 'pages/BulkReprocess' },
        { id: '4', name: 'Disparo', desc: 'Backend bulkReprocessCompliance. Cada caso entra em fila do worker do pipeline.', source: 'functions/bulkReprocessCompliance.js' },
        { id: '5', name: 'Acompanhamento', desc: 'ProcessingQueue mostra status em tempo real (refetch a cada 5s).', source: 'components/bulk-reprocess/ProcessingQueue' },
      ]} />

      <H2 num="11.5">Escalações Questionáveis (/EscalationsReview)</H2>

      <P>Página de governança operacional. Lista casos em status=Manual mas com subfaixa &lt; 4 (ou seja: V4 considera baixo risco mas alguma trava forçou Manual). Útil para detectar:</P>
      <ul className="list-disc ml-5 text-[12.5px] text-[#1a1a1a] leading-[1.7]">
        <li>Bugs no Step 4 (decisão errada)</li>
        <li>Quality issues CAF persistentes (cliente não recapturou)</li>
        <li>Safety Net trips (Recusado sem bloqueio rebaixado para Manual)</li>
        <li>Ações manuais inadequadas (analista colocou em Manual sem motivo)</li>
      </ul>

      <P>Filtros: <C>escalationSource</C>, <C>subfaixa</C>, <C>cafRecaptureAttempts</C>, data range. Admin pode reverter para "Aprovado" diretamente após review (action permission <C>case.escalation-review</C>).</P>

      <Source files={[
        'entities/CompliancePartner.json',
        'entities/CompliancePartnerUser.json',
        'entities/PartnerAssignment.json',
        'entities/PartnerAssignmentActivity.json',
        'entities/BankDataCollection.json',
        'pages/ComplianceParceiro.jsx',
        'pages/ComplianceParceiroDetalhe.jsx',
        'pages/AdminGestaoParceiros.jsx',
        'pages/DocCompParceiros.jsx',
        'pages/ComplianceDocOnly.jsx',
        'pages/BankDataCollect.jsx',
        'pages/BulkReprocess.jsx',
        'pages/EscalationsReview.jsx',
        'functions/generateDocOnlyLink.js',
        'functions/generateCafOnlyLink.js',
        'functions/generateDocsAndCafLink.js',
        'functions/generateBankDataLink.js',
        'functions/publicBankDataRead.js',
        'functions/publicBankDataSubmit.js',
        'functions/publicComplianceDocUpload.js',
        'functions/publicDirectDocUpload.js',
        'functions/adminAssignCaseToPartner.js',
        'functions/adminBulkAssignPartner.js',
        'functions/partnerListMyCases.js',
        'functions/partnerGetCaseDetail.js',
        'functions/partnerSubmitRecommendation.js',
        'functions/partnerDownloadDocument.js',
        'functions/partnerSlaMonitor.js',
        'functions/exportPartnerComplianceDoc.js',
        'functions/bulkReprocessCompliance.js',
      ]} />
    </Sec>
  );
}