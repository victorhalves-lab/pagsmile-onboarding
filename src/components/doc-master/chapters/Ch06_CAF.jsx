import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Endpoint, Threshold, Source } from '../DocPrimitives';

/**
 * Capítulo 6 — CAF Microscopia Completa
 */
export default function Ch06_CAF() {
  return (
    <Sec id="ch-06">
      <H1 num="06">CAF — Biometria, Documentoscopia, Screening (Microscopia)</H1>

      <P>A CAF é o provedor exclusivo de biometria e tem o ÚNICO poder de veto sobre o V4 (em fraudes biométricas confirmadas). Detalhamos cada serviço, threshold, e modo de captura.</P>

      <H2 num="6.1">Arquitetura — 3 Caminhos Paralelos</H2>
      <Table headers={['Caminho', 'Onde roda', 'Auth', 'Funções']} rows={[
        ['1. CAF SDK Web', 'Browser do cliente', 'JWT via cafGenerateToken (CAF_CLIENT_ID + CAF_CLIENT_SECRET + templateId)', 'Captura biométrica (FaceLiveness, DocumentDetector, SelfieWithDocument)'],
        ['2. CAF Core API', 'Backend', 'CAF_CORE_API_TOKEN (Bearer)', 'cafPostCaptureAnalysis, cafVerifaiDocs, cafScreeningInternacional, cafCpfValidation, cafCreditAnalysis, cafCheckProfile'],
        ['3. CAF Connect (Trust Platform)', 'Backend', 'OAuth Client Credentials (CAF_CONNECT_CLIENT_ID + _SECRET)', 'cafConnectCreateTransaction, cafConnectKybSearch — experimental'],
      ]} />

      <H2 num="6.2">CAF SDK Web — Geração de Token</H2>
      <Endpoint
        method="POST" path="cafGenerateToken (interna)" auth="Public com validação caseId"
        description="Gera JWT para o SDK CAF embedar no browser. TTL ~30min."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true, desc: 'Vincula a captura ao caso' },
          { name: 'merchantType', type: 'enum', required: true, desc: 'PF | PJ — determina templateId usado' },
          { name: 'cpf', type: 'string', required: false, desc: 'CPF a validar (PF ou rep. legal PJ)' },
          { name: 'name', type: 'string', required: false, desc: 'Nome a validar' },
        ]}
        returns={`{
  "token": "eyJhbG...",
  "templateId": "{CAF_TEMPLATE_ID_PF ou _PJ}",
  "client_id": "{CAF_CLIENT_ID}",
  "callbackUrl": ".../functions/cafWebhookHandler"
}`}
        source="functions/cafGenerateToken.js"
      />

      <H3 num="6.2.1">Eventos do SDK</H3>
      <Table dense headers={['Evento', 'Persistido em']} rows={[
        ['SDK_INIT', 'IntegrationLog{ service_type: "onboarding_web" }'],
        ['LIVENESS_START / LIVENESS_FRAME_FAIL', 'IntegrationLog (warn — não bloqueia)'],
        ['DOCUMENT_DETECTED_FRONT / _BACK', 'IntegrationLog'],
        ['CAPTURE_COMPLETE', 'IntegrationLog{status:"success"} + dispara cafPostCaptureAnalysis'],
        ['CAPTURE_TIMEOUT (após 30s)', 'IntegrationLog + oferece fallback BDC BigID'],
        ['CAMERA_DENIED / UNAVAILABLE', 'IntegrationLog + automatic fallback'],
      ]} />

      <H3 num="6.2.2">Fallback BDC BigID</H3>
      <P>Quando SDK CAF falha (CDN error, navegador, câmera, timeout), <C>BdcFallbackVerification</C> assume:</P>
      <Table dense headers={['Etapa', 'API BDC', 'Equivalente CAF']} rows={[
        ['Upload doc frente/verso', '/empresas datasets=document_validation', 'DocumentDetector'],
        ['Upload selfie + documentoscopia', 'BigID validateDocument', 'documentscopy'],
        ['Facematch BDC', 'BigID similarity', 'face_authentication (threshold 70%)'],
        ['Liveness BDC', 'BigID isAlive + probability', 'face_liveness'],
      ]} />

      <H2 num="6.3">Step 0 — cafPostCaptureAnalysis</H2>
      <Endpoint
        method="POST" path="cafPostCaptureAnalysis (interna)" auth="asServiceRole"
        description="OCR síncrono + 6 análises assíncronas via webhook."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true, desc: 'FK do caso' },
          { name: 'cpf', type: 'string', required: false, desc: 'Representante legal ou merchant PF' },
          { name: 'name', type: 'string', required: false, desc: 'Nome para cross-check OCR' },
        ]}
        returns={`{
  "success": true,
  "ocr": { "name": "...", "cpf": "...", "birth": "...", "mother": "..." },
  "ocrConfidence": 87,
  "ocrFlags": ["OCR_NAME_MISMATCH"],
  "asyncRequestIds": ["..."]
}`}
        source="functions/cafPostCaptureAnalysis.js"
      />

      <H3 num="6.3.1">OCR Cross-Validation</H3>
      <Threshold severity="ALTO" when="OCR.name vs declared.name diverge" points="Flag OCR_NAME_MISMATCH + reduz ocrConfidence em 25" />
      <Threshold severity="CRITICO" when="OCR.cpf vs declared.cpf diverge" points="Flag OCR_CPF_MISMATCH + reduz 25" />
      <Threshold severity="ALTO" when="OCR.birthDate diverge" points="Flag OCR_BIRTHDATE_MISMATCH + reduz 25" />
      <Threshold severity="MEDIO" when="OCR.mother diverge" points="Flag OCR_MOTHER_MISMATCH + reduz 25" />

      <H3 num="6.3.2">8 Análises Assíncronas Disparadas</H3>
      <Table dense headers={['CAF API', 'service_type', 'Webhook event']} rows={[
        ['POST /documentscopy', 'documentscopy', 'documentscopy.completed'],
        ['POST /document-liveness', 'document_liveness', 'document_liveness.completed'],
        ['POST /face-liveness', 'face_liveness', 'face_liveness.completed'],
        ['POST /face-authentication', 'face_authentication', 'face_authentication.completed'],
        ['POST /deepfake-detection', 'deepfake_detection', 'deepfake_detection.completed'],
        ['POST /official-biometrics', 'official_biometrics', 'official_biometrics.completed'],
        ['POST /private-faceset', 'private_faceset', 'private_faceset.completed'],
        ['POST /shared-faceset', 'shared_faceset', 'shared_faceset.completed'],
      ]} />

      <H2 num="6.4">CAF Webhook Handler — HMAC SHA-256 ASYNC</H2>
      <Endpoint
        method="POST" path="cafWebhookHandler (público)" auth="HMAC SHA-256 com CAF_WEBHOOK_SECRET"
        description="Recebe resultados assíncronos. Valida HMAC ANTES de qualquer processamento."
        params={[
          { name: 'X-Signature', type: 'header', required: true, desc: 'HMAC SHA-256 do raw body' },
          { name: 'event', type: 'string', required: true, desc: 'Tipo do evento' },
          { name: 'requestId', type: 'string', required: true, desc: 'ID da request original' },
          { name: 'result', type: 'object', required: true, desc: 'Status, score, details' },
        ]}
        source="functions/cafWebhookHandler.js"
      />

      <CodeBlock language="js">{`// CRÍTICO: Deno usa Web Crypto API (SubtleCrypto) ASYNC
const encoder = new TextEncoder();
const keyData = encoder.encode(Deno.env.get('CAF_WEBHOOK_SECRET'));
const cryptoKey = await crypto.subtle.importKey(
  'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
);
const sigBytes = hexToBytes(req.headers.get('x-signature') || '');
const isValid = await crypto.subtle.verify(
  'HMAC', cryptoKey, sigBytes, encoder.encode(rawBody)
);
if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 });`}</CodeBlock>

      <P>Idempotência: cada webhook é deduplicado por <C>requestId</C>. CAF pode retentar entregas — sistema ignora se já existe IntegrationLog com mesmo requestId + service_type completo.</P>

      <H2 num="6.5">Step 0.5 — cafCheckProfile (Cross-Merchant)</H2>
      <Endpoint
        method="POST" path="cafCheckProfile (interna)" auth="asServiceRole"
        description="Verifica histórico do CPF/CNPJ em outros clientes CAF."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true },
          { name: 'cpf | cnpj', type: 'string', required: true },
        ]}
        returns={`{ "profileExists": true, "transactions": [...], "flagCount": 3, "flags": ["FACE_REUSE_DIFFERENT_CPF"] }`}
        source="functions/cafCheckProfile.js"
      />

      <Table dense headers={['Flag', 'Significado', 'Trigger SENTINEL']} rows={[
        ['FACE_REUSE_DIFFERENT_CPF', 'Mesmo rosto cadastrado com outro CPF', 'Red flag CRITICO — fraude de identidade'],
        ['FACE_IN_FRAUD_DATABASE', 'Rosto na base de fraude compartilhada CAF', 'Red flag GRAVE — fraudador conhecido'],
        ['MULTIPLE_REJECTIONS_LAST_30D', '≥ 3 rejeições em 30 dias', 'Padrão suspeito'],
        ['CPF_RECENTLY_BLOCKED', 'CPF bloqueado em outro cliente recentemente', 'Atenção alta'],
      ]} />

      <H2 num="6.6">Step 1.7 — cafCreditAnalysis</H2>
      <P>Segunda fonte de crédito independente. Para PJ usa CPF do representante legal (perfil pessoal). Cross-validation com BDC credit_risk/credit_score.</P>
      <Endpoint
        method="POST" path="cafCreditAnalysis (interna)" auth="asServiceRole"
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true },
          { name: 'cpf', type: 'string', required: false },
          { name: 'cnpj', type: 'string', required: false },
        ]}
        returns={`{
  "creditScore": 580,
  "riskLevel": "MEDIUM",
  "delinquencyProbability": 0.18,
  "service_type": "pf_credit_profile" | "pj_credit_profile" | "kyb_credit_report"
}`}
        source="functions/cafCreditAnalysis.js"
      />

      <H2 num="6.7">Step 2 — cafScreeningInternacional</H2>
      <Endpoint
        method="POST" path="cafScreeningInternacional (interna)" auth="asServiceRole"
        description="Screening: PEP internacional, OFAC, UN, EU, Interpol Red Notices."
        returns={`{
  "pep": { "isPep": false, "matches": [] },
  "sanctions": {
    "ofac": { "hits": [], "matchType": "exact|fuzzy" },
    "un": { "hits": [] }, "eu": { "hits": [] }
  },
  "interpol": { "redNotices": [] },
  "service_types_logged": ["pep_international", "sanctions_international", "warnings_interpol"]
}`}
        source="functions/cafScreeningInternacional.js"
      />

      <Threshold severity="CRITICO" when="OFAC match exato (nome + nascimento)" points="B03 → score 850" />
      <Threshold severity="ALTO" when="OFAC fuzzy ≥ 90%" points="B03 → score 850" />
      <Threshold severity="MEDIO" when="OFAC fuzzy 70-89%" points="Red flag SENTINEL — analista decide" />

      <H2 num="6.8">Step 2.5 — cafCpfValidation</H2>
      <Endpoint
        method="POST" path="cafCpfValidation (interna)" auth="asServiceRole"
        description="Cross-check CPF × nome × nascimento × nome da mãe contra base CAF."
        params={[
          { name: 'onboardingCaseId', type: 'string', required: true },
          { name: 'cpf', type: 'string', required: true },
        ]}
        returns={`{ "cpfStatus": "REGULAR | SUSPENSO | CANCELADO | TITULAR_FALECIDO", "name": "...", "birthDate": "...", "motherName": "...", "divergences": ["NAME_MISMATCH"] }`}
        source="functions/cafCpfValidation.js"
      />

      <H2 num="6.9">Step 2.7 + on-upload — cafVerifaiDocs</H2>
      <P>Detecta Photoshop, recorte, colagem, padrões de moiré. Disparada para CADA DocumentUpload pendente individualmente. Também executada fire-and-forget em <C>publicComplianceDocUpload</C> imediatamente após cada upload — garantindo que <B>nenhum documento escape</B> da análise técnica, mesmo no fluxo Doc-Only sem CAF SDK.</P>
      <Endpoint
        method="POST" path="cafVerifaiDocs (interna, fire-and-forget)" auth="asServiceRole"
        params={[
          { name: 'documentUploadId', type: 'string', required: true },
          { name: 'onboardingCaseId', type: 'string', required: true },
        ]}
        returns={`{
  "verifaiResult": {
    "authentic": 0.94,
    "legible": 0.87,
    "manipulated": false,
    "tampering_signs": [],
    "compliant_with_type": true
  },
  "newValidationStatus": "Validado" | "Rejeitado"
}`}
        source="functions/cafVerifaiDocs.js"
      />

      <H2 num="6.10">Veto Biométrico — Tabela de Decisão Microscópica</H2>

      <H3 num="6.10.1">BINARY_FRAUD_SERVICES (REPROVED = fraude)</H3>
      <CodeBlock language="js">{`const BINARY_FRAUD_SERVICES = new Set(['deepfake_detection']);`}</CodeBlock>

      <H3 num="6.10.2">QUALITY_SCORED_SERVICES (depende do score)</H3>
      <CodeBlock language="js">{`const QUALITY_SCORED_SERVICES = new Set([
  'liveness', 'face_liveness',
  'face_authentication',
  'documentscopy', 'document_liveness'
]);

const FRAUD_SCORE_THRESHOLDS = {
  liveness: 40, face_liveness: 40, face_authentication: 40,
  documentscopy: 30, document_liveness: 30
};

const QUALITY_ZONE_MAX = 70;`}</CodeBlock>

      <H3 num="6.10.3">Classificação caso-a-caso (loop em IntegrationLog)</H3>
      <CodeBlock language="js">{`for (const log of cafLogs) {
  if (log.provider !== 'CAF' || log.result_status !== 'REPROVED') continue;
  const svc = log.service_type;
  const score = typeof log.score === 'number' ? log.score : null;

  if (BINARY_FRAUD_SERVICES.has(svc)) {
    confirmedFrauds.push({ svc, reason: \`\${svc} REPROVED — fraude binária\` });
    continue;
  }
  if (QUALITY_SCORED_SERVICES.has(svc)) {
    const threshold = FRAUD_SCORE_THRESHOLDS[svc] ?? 40;
    if (score == null) qualityIssues.push({ reason: \`\${svc} REPROVED sem score\` });
    else if (score < threshold) confirmedFrauds.push({ reason: \`\${svc} score \${score} (< \${threshold})\` });
    else if (score <= QUALITY_ZONE_MAX) qualityIssues.push({ reason: \`\${svc} zona cinza\` });
    else qualityIssues.push({ reason: \`\${svc} próximo do corte\` });
  }
}`}</CodeBlock>

      <H3 num="6.10.4">Hierarquia de Sinais por Subfaixa</H3>
      <CodeBlock language="js">{`const LOW_RISK_SUBFAIXAS = new Set(['1A', '1B', '2A']);
const uniqueConfirmedServices = new Set(confirmedFrauds.map(f => f.svc));
const requiredSignals = LOW_RISK_SUBFAIXAS.has(subfaixa) ? 2 : 1;
const cafFraudDetected = uniqueConfirmedServices.size >= requiredSignals;`}</CodeBlock>

      <Note title="Decisão final do veto biométrico" kind="rule">
        <p><B>cafFraudDetected</B> = true ⇔ número de service_types DISTINTOS com fraude confirmada ≥ requiredSignals. <C>uniqueConfirmedServices.size</C> conta tipos únicos: 2 falhas no mesmo service_type contam como 1.</p>
        <p>Se <B>cafFraudDetected</B> e decisão V4 não é "Recusado": sobrescreve para "Revisão Manual" com <C>escalationSource = "CAF_FRAUD"</C>.</p>
        <p>Se há quality issues SEM fraude confirmada E <C>cafRecaptureAttempts &lt; 2</C>: oferece recaptura via e-mail. <C>escalationSource = "CAF_QUALITY"</C>. Cliente recebe novo token CAF.</p>
      </Note>

      <H2 num="6.11">CAF Connect (Trust Platform — Experimental)</H2>
      <Endpoint
        method="POST" path="https://trust-api.caf.io/v1/oauth/token" auth="—"
        description="cafConnectAuth: gera access_token via OAuth Client Credentials."
        params={[
          { name: 'grant_type', type: 'string', required: true, desc: '"client_credentials"' },
          { name: 'client_id', type: 'string', required: true, desc: 'CAF_CONNECT_CLIENT_ID' },
          { name: 'client_secret', type: 'string', required: true, desc: 'CAF_CONNECT_CLIENT_SECRET' },
        ]}
        returns={`{ "access_token": "...", "expires_in": 3600 }`}
        source="functions/cafConnectAuth.js"
      />
      <P>Funções: <C>cafConnectCreateTransaction</C>, <C>cafConnectGetTransaction</C>, <C>cafConnectKybSearch</C>, <C>cafConnectProbePermissions</C>, <C>cafConnectTestSuite</C>. Estado: experimental, suite em <C>/CafTestLab</C>. Não substitui Caminho 2 em prod.</P>

      <Source files={[
        'functions/cafGenerateToken.js',
        'functions/cafPostCaptureAnalysis.js',
        'functions/cafWebhookHandler.js',
        'functions/cafCheckProfile.js',
        'functions/cafCreditAnalysis.js',
        'functions/cafScreeningInternacional.js',
        'functions/cafCpfValidation.js',
        'functions/cafVerifaiDocs.js',
        'functions/cafConnectAuth.js',
        'autoEnrichOnboarding.js linhas 535-600',
      ]} />
    </Sec>
  );
}