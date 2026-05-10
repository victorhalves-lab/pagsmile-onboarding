import React from 'react';
import { H2, H3, P, B, C, Table, Note } from '../../DocPrimitives';

export default function Ch02_Subfaixas() {
  return (
    <>
      <H2 num="2.6">Subfaixas V4 — Tabela Mestre</H2>

      <P_Intro />

      <Table headers={['Subfaixa', 'Faixa Score', 'Nome', 'Decisão automática', 'Rolling Reserve', 'Monitoramento']} rows={[
        ['1A', '0-99', 'VERDE EXPRESS', 'Aprovado', '0%', 'PADRÃO'],
        ['1B', '100-199', 'VERDE', 'Aprovado', '0%', 'PADRÃO'],
        ['2A', '200-299', 'AZUL CLARO', 'Aprovado', '2%', 'REFORÇADO_LEVE'],
        ['2B', '300-399', 'AZUL', 'Aprovado com Condições', '5%', 'REFORÇADO'],
        ['3A', '400-499', 'AMARELO', 'Aprovado com Condições', '10%', 'INTENSO'],
        ['3B', '500-599', 'AMARELO ESCURO', 'Aprovado com Condições', '15%', 'INTENSO_PLUS'],
        ['4', '600-749', 'LARANJA', 'Revisão Manual (obrigatório)', '20%', 'MAXIMO'],
        ['5', '750-849', 'VERMELHO', 'Recusado', '—', '—'],
      ]} />

      <H3 num="2.6.1">Como o score é construído (3 camadas V4)</H3>
      <Table dense headers={['Camada', 'Campo', 'Faixa', 'Origem']} rows={[
        ['1', 'score_base_segmento', '0-200', 'Segmento (gateway, marketplace, etc.) — base por categoria'],
        ['2', 'score_variaveis', '0-400', 'Soma de pontos de variáveis aplicadas (porte, idade, sócios, etc.)'],
        ['3', 'score_enriquecimento', '0-249', 'BDC findings (PEP, dívidas, processos, ESG)'],
        ['Total', 'score_final', '0-849', 'Soma das 3 camadas — fonte ÚNICA: bdcEnrichCase'],
      ]} />

      <Note title="Score = MAIOR é PIOR" kind="warn">
        <B>IMPORTANTE</B>: Diferente de credit score tradicional, <C>score_final</C> V4 é <B>0=excelente, 849=péssimo</B>. Subfaixa 1A é a melhor, 5 é a pior. Esta convenção difere do score legado <C>riskScore</C> (0-100) que era o oposto.
      </Note>

      <H3 num="2.6.2">Mapeamento código → subfaixa</H3>
      <P>O mapeamento exato está em <C>autoEnrichOnboarding.js → rollingReserveMap</C> e <C>conditionsMap</C>:</P>
      <Table dense headers={['Subfaixa', 'rollingReserveMap', 'monitoramento']} rows={[
        ['1A', '0', 'PADRAO'],
        ['1B', '0', 'PADRAO'],
        ['2A', '2', 'REFORCADO_LEVE'],
        ['2B', '5', 'REFORCADO'],
        ['3A', '10', 'INTENSO'],
        ['3B', '15', 'INTENSO_PLUS'],
        ['4', '20', 'MAXIMO'],
        ['5', 'N/A', 'N/A (recusado)'],
      ]} />

      <Note title="Override SENTINEL" kind="info">
        SENTINEL <B>pode escalar</B> uma decisão V4 para mais conservadora (1A→Manual), mas <B>nunca rebaixa</B> (Manual→1A). Quando isso acontece, <C>decisao_escalada_sentinel=true</C> e <C>escalation_justification</C> preenchido. Detalhe completo no Cap. 7.
      </Note>
    </>
  );
}

function P_Intro() {
  return (
    <p style={{ color: '#002443', lineHeight: 1.65, margin: '8px 0 14px 0' }}>
      Subfaixa é o <strong>output principal</strong> do framework V4 e determina automaticamente: decisão, rolling reserve, nível de monitoramento e condições contratuais. Ela é função única do <code>score_final</code> calculado em <code>bdcEnrichCase</code>.
    </p>
  );
}