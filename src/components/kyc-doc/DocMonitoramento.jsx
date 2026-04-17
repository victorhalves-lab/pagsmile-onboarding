import React from 'react';
import { S, H1, H2, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocMonitoramento() {
  return (
    <S>
      <H1>12. Monitoramento Contínuo e Revalidação</H1>

      <P>Após a aprovação, todo cliente entra em um regime de monitoramento contínuo proporcional ao seu nível de risco (definido pela subfaixa V4). O monitoramento garante que mudanças na situação do cliente (processos judiciais novos, sanções, dívida ativa, queda de atividade) sejam detectadas precocemente.</P>

      <H2>12.1. Níveis de Monitoramento — Detalhamento Completo</H2>
      <Table headers={['Nível', 'Subfaixas', 'Frequência PLD', 'Revalidação BDC', 'Ações Automáticas']} rows={[
        ['PADRÃO', '1A, 1B', 'Trimestral', 'Anual', 'Monitoramento transacional padrão. Alertas apenas para desvios significativos (> 300% do TPV declarado).'],
        ['REFORÇADO LEVE', '2A', 'Trimestral', 'Semestral', 'Alerta de desvio de TPV configurado. Revalidação BDC busca novos processos, sanções e alterações cadastrais.'],
        ['REFORÇADO', '2B', 'Mensal', 'Semestral', 'Monitoramento de chargeback semanal. Taxa de chargeback > 1% gera alerta. Revalidação BDC completa.'],
        ['INTENSO', '3A', 'Quinzenal', 'Trimestral', 'Limite de TPV ativo (R$500k/mês). Revisão obrigatória a cada 90 dias por analista. Revalidação BDC com score delta.'],
        ['INTENSO PLUS', '3B', 'Semanal', 'Trimestral', 'Limite de TPV (R$200k/mês). Revisão a cada 60 dias. Antecipação bloqueada. Revalidação BDC com score delta.'],
        ['MÁXIMO', '4, 5', 'Semanal', 'Mensal', 'Todas as restrições ativas. Monitoramento diário de transações. Revalidação BDC mensal completa.'],
      ]} />

      <H2>12.2. Revalidação BDC — Como Funciona</H2>
      <P>A revalidação consiste em re-consultar todos os datasets BDC do segmento e recalcular o Score V4 completo. Se houver variação de mais de 100 pontos (positiva ou negativa), o sistema gera automaticamente um alerta <code>SCORE_DELTA</code> no <code>IntegrationLog</code> e envia notificação ao Slack. Se a variação for ≥ 200 pontos, o alerta é classificado como CRÍTICO.</P>
      <P>Exemplos de situações detectadas pela revalidação: novo processo criminal aberto contra a empresa, inscrição em dívida ativa, inclusão na Lista Suja MTE, alteração societária com entrada de PEP, queda do score de crédito, novo registro de negativação, empresa que mudou de situação ATIVA para SUSPENSA.</P>

      <H2>12.3. Revalidação Manual (sob demanda)</H2>
      <P>O analista pode, a qualquer momento, acionar manualmente a revalidação de um cliente específico ou de um grupo de clientes. O painel oferece revalidação individual (botão no detalhe do caso) e revalidação em massa (seleção múltipla na lista de clientes). Cada revalidação gera um novo registro de score V4 e compara com o anterior.</P>
    </S>
  );
}