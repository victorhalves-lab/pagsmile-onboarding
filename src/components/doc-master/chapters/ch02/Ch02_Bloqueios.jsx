import React from 'react';
import { H2, H3, P, B, C, Table, Note } from '../../DocPrimitives';

export default function Ch02_Bloqueios() {
  return (
    <>
      <H2 num="2.7">Bloqueios B01-B10 — Veto Regulatório Automático</H2>

      <P_Intro />

      <Table headers={['Código', 'Nome', 'Trigger BDC', 'Threshold', 'Ação']} rows={[
        ['B01', 'CNPJ INATIVO', 'basic_data.RegistrationStatus', '!== "ATIVA"', 'Recusa automática'],
        ['B02', 'SANÇÃO INTERNACIONAL', 'kyc.Sanctions (OFAC, ONU, UE)', 'qualquer hit', 'Recusa automática'],
        ['B03', 'COAF / CEIS / CNEP', 'kyc lista nacional', 'qualquer hit', 'Recusa automática'],
        ['B04', 'PROCESSOS CRIMINAIS', 'lawsuits.criminal.count', '> 0', 'Recusa automática'],
        ['B05', 'PROCESSOS TRABALHISTAS GRAVES', 'lawsuits.labor.sum', '> R$ 500k', 'Subfaixa 4 (Manual)'],
        ['B06', 'DÍVIDA PGFN ALTA', 'government_debtors.sum', '> R$ 500k', 'Subfaixa 4 (Manual)'],
        ['B07', 'FALÊNCIA / RECUPERAÇÃO', 'basic_data.IsBankrupt OR lawsuits.recovery', 'true', 'Recusa automática'],
        ['B08', 'TRABALHO ESCRAVO', 'esg.trabalho_escravo', 'hit', 'Recusa automática'],
        ['B09', 'EMBARGO IBAMA', 'esg.ibama_embargo', 'hit', 'Recusa automática'],
        ['B10', 'PEP DIRETO (representante legal)', 'kyc.IsPEP do representante', 'true sem mitigação', 'Subfaixa 4 (Manual)'],
      ]} />

      <H3 num="2.7.1">Persistência</H3>
      <P>Bloqueios ativos ficam em <B>2 lugares</B>:</P>
      <Table dense headers={['Campo', 'Entidade', 'Conteúdo']} rows={[
        ['bloqueiosAtivos', 'OnboardingCase', 'Array códigos B01-B10'],
        ['bloqueios_ativos', 'ComplianceScore', 'Mesmo array (cópia para auditoria)'],
        ['red_flags', 'ComplianceScore', 'Inclui descrição humana (ex: "B01: CNPJ INATIVO desde 2024-03-12")'],
      ]} />

      <H3 num="2.7.2">Hierarquia de severidade</H3>
      <Table dense headers={['Severidade', 'Códigos', 'Comportamento']} rows={[
        ['CRÍTICA — recusa imediata', 'B01, B02, B03, B04, B07, B08, B09', 'autoEnrichOnboarding força status="Recusado", subfaixa=5'],
        ['ALTA — escalação obrigatória', 'B05, B06, B10', 'autoEnrichOnboarding força subfaixa=4, status="Manual"'],
      ]} />

      <Note title="Como auditor humano vê" kind="info">
        Página <C>EscalationsReview</C> filtra casos por <C>escalationSource</C>=V4_BLOCK. Página <C>AnaliseCompleta</C> exibe a tabela B01-B10 com hits destacados. Dossiê PDF (<C>generateCompliancePdf</C>) inclui seção dedicada "Bloqueios Regulatórios".
      </Note>

      <Note title="Quando adicionar B11+" kind="warn">
        Adicionar novo bloqueio exige: (1) novo código no <C>bloqueios_ativos</C> de <C>OnboardingCase</C> e <C>ComplianceScore</C>; (2) função analyzer em <C>bdcEnrichCase.js</C>; (3) atualização do mapa <C>rollingReserveMap</C>/<C>conditionsMap</C> em <C>autoEnrichOnboarding</C>; (4) entrada nesta tabela; (5) backfill em casos antigos via <C>bulkRecomputeDecisions</C>.
      </Note>
    </>
  );
}

function P_Intro() {
  return (
    <p style={{ color: '#002443', lineHeight: 1.65, margin: '8px 0 14px 0' }}>
      Bloqueios são <strong>vetos regulatórios automáticos</strong> que <strong>não dependem do score V4</strong> — eles forçam decisão imediata mesmo se o score estaria em subfaixa verde. São disparados pela função <code>analyzeBlocks</code> em <code>bdcEnrichCase.js</code>.
    </p>
  );
}