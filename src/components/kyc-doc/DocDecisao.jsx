import React from 'react';
import { S, H1, H2, P, Table, InfoBox } from './DocHelpers';

export default function DocDecisao() {
  return (
    <S>
      <H1>9. Tabela de Decisão Determinística</H1>

      <P>A decisão final é 100% determinística — baseada exclusivamente na subfaixa V4 (calculada pela BDC no Step 1 do pipeline) e em fraude CAF confirmada. Nenhum outro fator, incluindo o relatório SENTINEL, tem poder de alterar a decisão. A tabela abaixo é a "lei" do sistema:</P>

      <Table headers={['Subfaixa V4', 'Decisão', 'Tipo', 'Condições Automáticas Aplicadas', 'Rolling Reserve', 'Monitoramento']} rows={[
        ['1A (0-100)', '✅ APROVADO', 'Automática', 'Nenhuma condição — operação livre.', '0%', 'PADRÃO: PLD trimestral, revalidação BDC anual.'],
        ['1B (101-200)', '✅ APROVADO', 'Automática', 'Nenhuma condição — operação livre.', '0%', 'PADRÃO: PLD trimestral, revalidação BDC anual.'],
        ['2A (201-300)', '✅ APROVADO COM CONDIÇÕES LEVES', 'Automática', '1) KYC completo dos merchants em até 60 dias. 2) PLD trimestral.', '5%', 'REFORÇADO LEVE: revalidação BDC semestral, alerta desvio TPV.'],
        ['2B (301-400)', '✅ APROVADO COM CONDIÇÕES', 'Automática', '1) KYC completo em 45 dias. 2) PLD mensal. 3) Monitoramento de chargeback semanal.', '10%', 'REFORÇADO: revalidação BDC semestral, monitoramento chargeback.'],
        ['3A (401-500)', '✅ APROVADO COM CONDIÇÕES RIGOROSAS', 'Automática', '1) KYC completo em 30 dias. 2) PLD quinzenal. 3) Limite de TPV: R$500.000/mês. 4) Revisão obrigatória a cada 90 dias.', '15%', 'INTENSO: revalidação BDC trimestral, limite TPV.'],
        ['3B (501-600)', '✅ APROVADO COM CONDIÇÕES RIGOROSAS', 'Automática', '1) KYC completo em 15 dias. 2) PLD semanal. 3) Limite de TPV: R$200.000/mês. 4) Revisão obrigatória a cada 60 dias. 5) Antecipação de recebíveis bloqueada.', '20%', 'INTENSO PLUS: revalidação BDC trimestral, todas restrições.'],
        ['4 (601-700)', '🔍 REVISÃO MANUAL', 'Humana', 'Um analista de compliance sênior deve revisar o dossiê completo (SENTINEL, BDC, CAF, documentos) e tomar a decisão manualmente.', '20%', 'MÁXIMO: revalidação BDC mensal se aprovado.'],
        ['5 (701-850)', '🚫 RECUSADO', 'Automática', 'Existem bloqueios V4 ativos (B01-B10) que impedem qualquer tipo de aprovação. Empresa com sanções, CNPJ inativo, shell company, lista suja ou dívida ativa > R$500k.', '—', '—'],
      ]} />

      <H2>9.1. Exceção CAF — Veto Biométrico</H2>
      <P>A ÚNICA exceção à tabela acima é quando a CAF detecta fraude biométrica CONFIRMADA. Neste caso, independentemente da subfaixa V4 (mesmo que seja 1A — melhor score possível), o caso é automaticamente encaminhado para Revisão Manual. As condições que ativam o veto CAF são:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <li className="text-sm text-[#0A0A0A]/80"><strong>Liveness REPROVED:</strong> A prova de vida detectou que não é uma pessoa real (foto, vídeo, máscara).</li>
        <li className="text-sm text-[#0A0A0A]/80"><strong>Face Liveness REPROVED:</strong> O liveness facial falhou por motivo técnico ou anti-spoofing.</li>
        <li className="text-sm text-[#0A0A0A]/80"><strong>Deepfake DETECTED:</strong> A selfie apresenta sinais de deepfake gerado por inteligência artificial.</li>
        <li className="text-sm text-[#0A0A0A]/80"><strong>Documentscopy REPROVED:</strong> O documento apresenta sinais de adulteração digital (Photoshop, montagem, recorte).</li>
      </ul>

      <InfoBox title="Por que a decisão é determinística e não baseada em IA?" color="green">
        <p>A decisão é determinística (baseada em regras matemáticas fixas) porque reguladores exigem que as decisões de compliance sejam <strong>auditáveis, reproduzíveis e explicáveis</strong>. Se um regulador perguntar "por que esta empresa foi recusada?", a resposta precisa ser precisa: "porque o CNPJ está em situação INAPTA na Receita Federal, o que ativou o bloqueio B01". Uma decisão baseada em IA seria "porque o modelo achou que parecia arriscado" — isso não é aceitável regulatoriamente. A IA (SENTINEL) é usada apenas para DOCUMENTAR a análise em linguagem natural, nunca para DECIDIR.</p>
      </InfoBox>
    </S>
  );
}