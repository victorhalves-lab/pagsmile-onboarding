import React from 'react';
import { H2, H3, B, C, Table, Note } from '../../DocPrimitives';

export default function Ch02_ServiceTypes() {
  return (
    <>
      <H2 num="2.5">IntegrationLog.service_type — Catálogo Completo</H2>

      <P_Intro />

      <H3 num="2.5.1">Serviços CAF (8 principais)</H3>
      <Table dense headers={['service_type', 'Descrição']} rows={[
        ['liveness', 'Prova de vida facial (CAF SDK)'],
        ['facematch', 'Comparação selfie vs foto do documento'],
        ['face_liveness', 'Liveness facial dedicado'],
        ['face_authentication', 'Autenticação facial (re-onboarding)'],
        ['document_ocr', 'OCR sincrono de documento'],
        ['document_detector', 'Análise documento completo'],
        ['document_detector_front', 'Análise frente'],
        ['document_detector_back', 'Análise verso'],
        ['documentscopy', 'Análise pericial documental'],
        ['onboarding_web', 'Sessão web onboarding'],
        ['transaction', 'Transação CAF Connect'],
        ['sdk_token_generation', 'cafGenerateToken (JWT SDK)'],
        ['document_liveness', 'Liveness sobre documento'],
        ['deepfake_detection', 'Detecção deepfake'],
        ['official_biometrics', 'Biometria oficial (governo)'],
        ['private_faceset', 'Faceset privado merchant'],
        ['shared_faceset', 'Faceset compartilhado anti-fraude'],
        ['verifai_docs', 'cafVerifaiDocs — anti-tampering'],
        ['pep_international', 'PEP internacional'],
        ['sanctions_international', 'Sanções internacionais'],
        ['warnings_interpol', 'Interpol watchlist'],
        ['cpf_cross_validation', 'cafCpfValidation Receita'],
        ['kyb_company_search', 'cafKybSearch'],
        ['kyb_business_identity', 'KYB identidade empresarial'],
        ['kyb_credit_report', 'KYB relatório de crédito'],
        ['pf_credit_profile', 'cafCreditAnalysis PF'],
        ['pj_credit_profile', 'cafCreditAnalysis PJ'],
        ['face_register', 'cafFaceRegister'],
        ['caf_webhook_received', 'cafWebhookHandler — payload registrado'],
        ['caf_post_capture_full', 'cafPostCaptureAnalysis — análise pós-captura'],
      ]} />

      <H3 num="2.5.2">Serviços BigDataCorp</H3>
      <Table dense headers={['service_type', 'Dataset BDC']} rows={[
        ['empresas_basic_data', 'basic_data PJ — razão, capital, abertura'],
        ['empresas_kyc', 'kyc PJ — PEP, sanções, COAF'],
        ['empresas_owners_kyc', 'owners_kyc — KYC dos sócios'],
        ['empresas_relationships', 'relationships — QSA'],
        ['empresas_phones', 'phones — telefones'],
        ['empresas_emails', 'emails — emails'],
        ['empresas_addresses', 'addresses — endereços'],
        ['empresas_activity_indicators', 'activity_indicators — sinais operacionais'],
        ['empresas_domains', 'domains — domínios web'],
        ['empresas_mcc', 'merchant_category_data — MCC'],
        ['empresas_basic_enrichment', 'Enriquecimento simplificado'],
        ['empresas_kyc_real', 'KYC profundo'],
        ['pessoas_kyc', 'PF kyc — PEP, sanções'],
        ['biometria_facial', 'BDC biometria facial (fallback)'],
        ['prova_de_vida', 'BDC prova de vida (fallback)'],
        ['ocr_sync', 'OCR síncrono BDC'],
      ]} />

      <Note title="Uso para diagnóstico" kind="info">
        Filtrar <C>IntegrationLog</C> por <C>onboarding_case_id</C> + <C>service_type</C> retorna a timeline exata de chamadas externas — quanto custou, quanto demorou, qual foi o resultado. Base do <B>BDCHealthDashboard</B> e <B>cafDiagnoseCase</B>.
      </Note>
    </>
  );
}

function P_Intro() {
  return (
    <p style={{ color: '#0A0A0A', lineHeight: 1.65, margin: '8px 0 14px 0' }}>
      Cada chamada a CAF ou BigDataCorp gera um <strong>IntegrationLog</strong> append-only. O campo <code>service_type</code> tem ~50 valores enumerados — abaixo a tabela completa.
    </p>
  );
}