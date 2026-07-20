import React from 'react';
import { H2, H3, P, B, C, Table, Note } from '../../DocPrimitives';

export default function Ch02_RedFlags() {
  return (
    <>
      <H2 num="2.4">Red Flags — Catálogo Unificado</H2>

      <P_Intro />

      <H3 num="2.4.1">V4 — Prefixo livre (nome direto)</H3>
      <Table dense headers={['Red Flag', 'Origem', 'Severidade típica']} rows={[
        ['CNPJ_INATIVO', 'BDC basic_data.RegistrationStatus !== ATIVA', 'CRÍTICA — B01'],
        ['CNPJ_RECENTE', 'foundingDate &lt; 6 meses', 'ALTA'],
        ['CAPITAL_BAIXO', 'capital_social &lt; R$ 5.000', 'MÉDIA'],
        ['HIGH_RISK_CNAE', 'CNAE em lista bdcEnrichCase HIGH_RISK_CNAES', 'ALTA'],
        ['SOCIO_PEP', 'BDC kyc.IsPEP true em algum sócio', 'CRÍTICA — analyzeOwners +40pts'],
        ['SOCIO_SANCIONADO', 'BDC kyc.Sanctions hit', 'CRÍTICA — B02/B03'],
        ['PROCESSOS_CRIMINAIS', 'BDC lawsuits criminal &gt; 0', 'ALTA — B04'],
        ['DIVIDA_PGFN_ALTA', 'government_debtors.sum &gt; R$ 500k', 'ALTA — B06'],
        ['TRABALHO_ESCRAVO', 'BDC esg trabalho_escravo hit', 'CRÍTICA — B08'],
        ['EMBARGO_IBAMA', 'BDC esg ibama_embargo hit', 'CRÍTICA — B09'],
        ['MEI_TPV_INCOMPATIVEL', 'TPV declarado &gt; R$ 81k/ano e regime=MEI', 'ALTA'],
        ['CNAE_TPV_INCOMPATIVEL', 'CNAE declarado vs CNAE BDC divergem', 'MÉDIA'],
      ]} />

      <H3 num="2.4.2">SENTINEL — Prefixo "SENTINEL:"</H3>
      <P>Adicionados pelo orquestrador autoEnrichOnboarding ao mesclar V4 + SENTINEL no array <C>red_flags</C> do <C>ComplianceScore</C>. Exemplos:</P>
      <Table dense headers={['Red Flag', 'O que SENTINEL detectou']} rows={[
        ['SENTINEL: Site declarado não existe', 'Cross-validation: site informado retorna 404 ou timeout'],
        ['SENTINEL: Endereço operacional difere do cadastral', 'Cross-validation BDC addresses vs declarado'],
        ['SENTINEL: Sócio responsável não está no QSA', 'Cross-validation responsável declarado vs BDC relationships'],
        ['SENTINEL: Volume declarado incompatível com porte', 'Análise qualitativa BDC activity_indicators vs TPV declarado'],
        ['SENTINEL: Atividade declarada fora do CNAE principal', 'Análise qualitativa de coerência narrativa'],
      ]} />

      <H3 num="2.4.3">CAF — Prefixo "CAF:"</H3>
      <Table dense headers={['Red Flag', 'Origem CAF']} rows={[
        ['CAF: Liveness REPROVED score X', 'face_liveness.score &lt; 70'],
        ['CAF: Facematch similarity X%', 'facematch.similarity &lt; 70%'],
        ['CAF: Documento reprovado', 'document_detector.status REPROVED'],
        ['CAF: Documento adulterado (Verifai)', 'cafVerifaiDocs detectou tampering'],
        ['CAF: Deepfake detectado', 'deepfake_detection probability &gt; threshold'],
        ['CAF: PEP internacional', 'cafScreeningInternacional pep_international hit'],
        ['CAF: Sanção internacional', 'cafScreeningInternacional sanctions hit'],
        ['CAF: Interpol hit', 'cafScreeningInternacional warnings_interpol hit'],
      ]} />

      <H3 num="2.4.4">Pessoa Jurídica vs Física</H3>
      <Table dense headers={['Tipo Merchant', 'Red flags principais']} rows={[
        ['PJ', 'CNPJ_INATIVO, SOCIO_PEP, PROCESSOS_CRIMINAIS, DIVIDA_PGFN_ALTA, TRABALHO_ESCRAVO, EMBARGO_IBAMA, HIGH_RISK_CNAE'],
        ['PF', 'CPF_INATIVO, PEP_DIRETO, SANCAO_DIRETA, SCR_BAIXO, MEI_TPV_INCOMPATIVEL'],
        ['Subseller', 'Herda do parent + scoreSubseller específico (Cap. 4)'],
      ]} />

      <Note title="Onde aparecem na UI" kind="info">
        Red flags são exibidas em: <C>UnifiedRiskAnalysis</C>, <C>RiskRedFlagsPanel</C>, <C>SentinelDocumentRenderer</C>, painel do analista em <C>AnaliseDeCasos</C> e dossiê PDF gerado por <C>generateCompliancePdf</C>.
      </Note>
    </>
  );
}

function P_Intro() {
  return (
    <p style={{ color: '#0A0A0A', lineHeight: 1.65, margin: '8px 0 14px 0' }}>
      A plataforma usa <B>3 fontes</B> distintas de red flags, todas mescladas no campo <C>red_flags</C> de <C>ComplianceScore</C> com prefixos para rastreabilidade.
    </p>
  );
}