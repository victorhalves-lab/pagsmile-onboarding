import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocDocOnlyLink() {
  return (
    <S>
      <H1>17. Link de Documentos Exclusivos — Fluxo Acelerado</H1>

      <P>Em situações operacionais específicas, a Pagsmile precisa que um cliente envie apenas os documentos comerciais (contrato social, cartão CNPJ, comprovante de endereço, titularidade bancária) <strong>sem obrigá-lo a passar novamente pela verificação de identidade via CAF SDK (RG/CNH + selfie + liveness)</strong>. Isso acontece quando a identidade do representante legal já foi verificada em fluxo anterior, ou quando o caso é apenas coleta complementar de documentos societários pós-aprovação inicial. O módulo "Link de Documentos Exclusivos" resolve esse cenário.</P>

      <InfoBox title="Diferença em relação ao fluxo padrão">
        <p>No fluxo padrão (<code>/ComplianceDinamico</code>), o cliente passa por: questionário → upload de documentos → CAF SDK (identidade) → VerifAI Docs → submissão. No fluxo "só docs" (<code>/ComplianceDocOnly?mode=docs_only</code>), o cliente passa por: upload de documentos → VerifAI Docs → submissão. A etapa de CAF SDK é <strong>opcionalizada</strong>, mas a análise técnica de manipulação digital dos documentos via VerifAI continua <strong>obrigatória</strong> — conformidade com compliance é preservada.</p>
      </InfoBox>

      <H2>17.1. Quando Usar</H2>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li>Cliente já teve identidade verificada em caso anterior (representante legal confirmado por biometria no onboarding inicial) e agora precisa apenas enviar documentos societários atualizados após revalidação anual.</Li>
        <Li>Analista solicitou documentos adicionais pós-análise inicial (ex: balanço patrimonial, DRE, licença regulatória específica) e o representante legal já foi verificado.</Li>
        <Li>Caso veio com documentos incompletos ou ilegíveis e precisa de re-envio sem refazer biometria.</Li>
        <Li>Subseller cujo representante já passou por CAF no questionário de compliance e agora só precisa atualizar docs comerciais.</Li>
      </ul>

      <H2>17.2. Geração do Link (Admin)</H2>
      <P>Admin abre um caso qualquer no painel de compliance. No grid de casos (<code>ComplianceCasesCardsGrid</code>), o botão com ícone <strong>FileUp</strong> abre o modal <code>DocOnlyLinkModal</code>. A função backend <code>generateDocOnlyLink</code> é invocada e:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li>Autentica o admin (<code>user.role === 'admin'</code>).</Li>
        <Li>Carrega o <code>OnboardingCase</code> pelo <code>caseId</code>.</Li>
        <Li>BLOQUEIA se <code>docCompleted === true</code> — evita sobrescrever trabalho concluído. Retorna HTTP 409 com código <code>DOC_ALREADY_COMPLETED</code>. Para re-enviar nesse cenário, outro admin precisa resetar <code>docCompleted</code> primeiro.</Li>
        <Li>Valida que o caso tem <code>questionnaireTemplateId</code> vinculado (senão HTTP 400 <code>NO_TEMPLATE</code>).</Li>
        <Li>Carrega o template e valida que possui <code>requiredDocuments</code> não-vazio (senão HTTP 400 <code>TEMPLATE_HAS_NO_DOCS</code>).</Li>
        <Li>Gera um <code>docLinkToken</code> de 32 caracteres hex (cripto-seguro, via <code>crypto.getRandomValues</code>) e grava em <code>OnboardingCase.docLinkToken</code>. Se já existe, reutiliza.</Li>
        <Li>Monta URL final: <code>{`{origin}/ComplianceDocOnly?caseId={caseId}&token={token}&mode=docs_only`}</code>.</Li>
        <Li>Retorna: <code>url, token, requiredDocsCount, templateName, templateModel</code>.</Li>
      </ol>
      <P>O modal exibe a URL pronta, permite copiar para a área de transferência e abrir um preview em nova aba.</P>

      <H2>17.3. Página do Cliente — /ComplianceDocOnly</H2>
      <P>Página pública que valida o token e renderiza a UI correta conforme o parâmetro <code>mode</code>:</P>

      <Table headers={['Parâmetro', 'Valor', 'Comportamento']} rows={[
        ['mode', 'docs_only', 'Renderiza APENAS o uploader de documentos + VerifAI. Pula completamente o CafVerificationStep.'],
        ['mode', '(ausente)', 'Modo completo: uploader + CAF SDK + VerifAI. Usado por outros fluxos legados.'],
        ['caseId', '(obrigatório)', 'ID do OnboardingCase alvo. Sem ele a página retorna erro.'],
        ['token', '(obrigatório)', 'Deve bater com OnboardingCase.docLinkToken. Se não bater, a página exibe "Link inválido ou expirado".'],
      ]} />

      <H2>17.4. Submissão e Análise Automática</H2>
      <P>Quando o cliente clica "Enviar Documentos", o frontend invoca a função <code>publicComplianceDocUpload</code> que:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li>Valida o <code>caseId</code> e o <code>docLinkToken</code>.</Li>
        <Li>Cria um registro <code>DocumentUpload</code> para CADA arquivo enviado (com <code>validationStatus = "Pendente"</code>).</Li>
        <Li>Atualiza <code>OnboardingCase.docCompleted = true</code> quando todos os docs requeridos foram recebidos.</Li>
        <Li><Bold>Dispara AUTOMATICAMENTE em modo "fire-and-forget" a função <code>cafVerifaiDocs</code></Bold> — análise de manipulação digital em cada documento. O upload retorna rápido (&lt; 2s) enquanto o VerifAI processa em background.</Li>
        <Li>Retorna relatório ao cliente: <code>success, successCount, failedCount, skippedCount</code>.</Li>
      </ol>

      <H3>Resultado do VerifAI (assíncrono)</H3>
      <P>A função <code>cafVerifaiDocs</code> processa cada <code>DocumentUpload</code> pendente:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Gera URL temporária do arquivo no storage privado.</Li>
        <Li>Envia à API CAF VerifAI com o tipo esperado do documento.</Li>
        <Li>Recebe análise: autenticidade (0-100%), legibilidade (0-100%), detecção de manipulação digital (Photoshop, recorte, colagem), conformidade com o tipo esperado.</Li>
        <Li>Atualiza <code>DocumentUpload.validationStatus</code> para <code>Validado</code> ou <code>Rejeitado</code>.</Li>
        <Li>Grava <code>DocumentUpload.validationNotes</code> com o motivo detalhado.</Li>
        <Li>Registra tudo em <code>IntegrationLog</code> com <code>service_type = "verifai_docs"</code>.</Li>
      </ul>

      <InfoBox title="Por que o VerifAI é fire-and-forget e NÃO bloqueia a UX do cliente?">
        <p>O VerifAI pode levar de 1 a 5 segundos POR DOCUMENTO. Em um upload de 7 documentos, isso seria 7-35s de espera bloqueante. Arquitetura decidida: upload sincroniza rapidamente (só persiste os arquivos), VerifAI roda em paralelo, e o analista vê o resultado do VerifAI quando abre o dossiê (que acontece minutos depois). A conformidade técnica é 100% mantida — nenhum documento escapa da análise.</p>
      </InfoBox>

      <H2>17.5. Segurança</H2>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li><Bold>Token criptograficamente seguro:</Bold> gerado via <code>crypto.getRandomValues</code> (256 bits de entropia, 32 caracteres hex). Impossível de adivinhar por força bruta.</Li>
        <Li><Bold>Token vinculado a caso específico:</Bold> um token só funciona para o <code>caseId</code> para o qual foi gerado. Trocar o <code>caseId</code> na URL com o mesmo token resulta em erro.</Li>
        <Li><Bold>Bloqueio de caso concluído:</Bold> se o caso já foi finalizado, a URL é invalidada automaticamente.</Li>
        <Li><Bold>VerifAI sempre ativo:</Bold> mesmo pulando o CAF SDK, a análise técnica de manipulação permanece obrigatória — garante conformidade com a Circular BCB 3.978/2020 sobre autenticidade documental.</Li>
        <Li><Bold>Auditoria:</Bold> geração do link, cada upload e cada resultado do VerifAI são gravados em <code>AuditLog</code> e <code>IntegrationLog</code>.</Li>
      </ul>

      <H2>17.6. Entidades e Funções Envolvidas</H2>
      <Table headers={['Componente', 'Tipo', 'Papel']} rows={[
        ['generateDocOnlyLink', 'Backend function', 'Gera o token e retorna a URL pronta.'],
        ['publicComplianceDocUpload', 'Backend function (público)', 'Recebe os arquivos, cria DocumentUpload e dispara VerifAI.'],
        ['cafVerifaiDocs', 'Backend function', 'Análise assíncrona de manipulação digital em cada documento.'],
        ['ComplianceDocOnly', 'Página pública', 'UI do cliente com uploader e CAF SDK opcional via mode=docs_only.'],
        ['DocOnlyLinkModal', 'Componente admin', 'Modal que dispara a geração do link e mostra a URL copiar-colável.'],
        ['ComplianceCasesCardsGrid', 'Componente admin', 'Botão FileUp em cada card de caso que abre o modal.'],
        ['OnboardingCase.docLinkToken', 'Campo da entidade', 'Persiste o token que valida a URL pública.'],
        ['OnboardingCase.docCompleted', 'Campo da entidade', 'Flag de conclusão que bloqueia re-envio sem reset manual.'],
      ]} />
    </S>
  );
}