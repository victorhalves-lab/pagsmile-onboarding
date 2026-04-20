import React from 'react';
import { S, H1, H2, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocPipeline() {
  return (
    <S>
      <H1>8. Pipeline Automatizado (Orquestrador)</H1>

      <P>O orquestrador <code>autoEnrichOnboarding</code> é a função backend que coordena todo o pipeline de análise. Ele é acionado automaticamente quando o cliente finaliza o envio dos documentos e a verificação biométrica. Cada step é executado em sequência, mas cada step é "não-bloqueante" — se um step falhar, os demais continuam normalmente. Isso garante que uma indisponibilidade temporária da CAF, por exemplo, não impede a análise BDC de ser executada.</P>

      <Table headers={['Step', 'Nome da Função', 'Duração Típica', 'O que faz — descrição completa', 'Não-bloqueante?']} rows={[
        ['0', 'cafPostCaptureAnalysis', '3–8 seg', 'Envia as imagens capturadas (documento frente/verso + selfie) para a API CAF. Executa OCR síncrono (extrai nome, CPF, nascimento, mãe do documento) e dispara análise assíncrona completa (documentoscopia, document liveness, deepfake detection, official biometrics, private faceset, shared faceset). O OCR é cross-validado imediatamente com os dados declarados no questionário.', '✅ Sim'],
        ['0.5', 'cafCheckProfile', '1–3 seg', 'Verifica se o CPF/CNPJ já tem histórico prévio na base cross-merchant da CAF. Se a pessoa já abriu conta em outro cliente CAF e foi reprovada, essa informação aparece aqui como flag de atenção.', '✅ Sim'],
        ['1', 'bdcEnrichCase', '2–5 seg', 'Esta é a etapa mais importante de todo o pipeline. Consulta entre 22 e 39 datasets na BigDataCorp (dependendo do segmento), analisa bloqueios automáticos (B01-B10), calcula pontuação por dimensão (13 dimensões), aplica os pesos percentuais, soma com o score base do segmento e produz o Score V4 final. É a FONTE ÚNICA do score — nenhuma outra função pode alterar este número.', '✅ Sim'],
        ['1.5', 'cafFullEnrichment', '2–4 seg', 'KYC/KYB completo via API da CAF — segunda fonte independente de dados cadastrais. Os dados retornados são usados para cross-validation com a BDC: se a BDC diz que a empresa tem 5 sócios e a CAF diz que tem 3, isso é um ponto de atenção registrado pelo SENTINEL.', '✅ Sim'],
        ['1.7', 'cafCreditAnalysis', '1–3 seg', 'Análise de crédito PF/PJ via CAF — segundo score de crédito independente. Complementa o credit_risk/credit_score da BDC com uma segunda perspectiva.', '✅ Sim'],
        ['2', 'cafScreeningInternacional', '2–4 seg', 'Verificação completa de PEP (Pessoas Politicamente Expostas), sanções internacionais (OFAC, EU, UN, CEIS, CNEP) e alertas Interpol. Os resultados são cruzados com o KYC da BDC para confirmar ou divergir: se a BDC diz "sem sanções" e a CAF também, isso reforça a conclusão. Se uma diz "sim" e outra "não", isso é um red flag grave.', '✅ Sim'],
        ['2.5', 'cafCpfValidation', '1–2 seg', 'Cross-validation do CPF: consulta dados básicos do CPF via CAF e compara campo a campo com dados BDC. Detecta divergências de nome, status, nascimento e nome da mãe entre as duas fontes.', '✅ Sim (só PF)'],
        ['2.7', 'cafVerifaiDocs', '1–5 seg/doc', 'Para cada documento enviado que ainda está com status "Pendente", a IA VerifAI da CAF analisa: autenticidade, legibilidade, conformidade com o tipo esperado, e sinais de adulteração digital. Atualiza o status do documento para "Validado" ou "Rejeitado". IMPORTANTE: além de rodar no pipeline, a função é disparada AUTOMATICAMENTE (fire-and-forget) dentro da função publicComplianceDocUpload sempre que um cliente envia documentos — garante que nenhum documento fique sem análise técnica, mesmo em fluxos "só docs" (ComplianceDocOnly) que pulam o CAF SDK de identidade.', '✅ Sim'],
        ['3', 'analyzeOnboarding (SENTINEL)', '15–30 seg', 'O agente de IA SENTINEL executa 3 chamadas LLM em paralelo (questionário, BDC, CAF), depois uma 4ª chamada de consolidação. Produz o relatório narrativo completo para o dossiê. Não tem poder de decisão — é puramente informativo.', '✅ Sim'],
        ['4', 'Decisão Determinística', '< 1 seg', 'Lê a subfaixa V4 calculada no Step 1, aplica a tabela de decisão (1A→Aprovado, 4→Manual, 5→Recusado), verifica se a CAF detectou fraude biométrica (única exceção), e grava a decisão final no caso. Atualiza o Merchant, o ComplianceScore e o OnboardingCase.', '—'],
        ['5', 'Slack Notification', '< 1 seg', 'Envia mensagem formatada ao canal #compliance do Slack com: nome da empresa, CNPJ, score V4, subfaixa, decisão, rolling reserve, nível de monitoramento e top 4 red flags. Inclui link direto para o dossiê completo.', '✅ Sim'],
      ]} />

      <P><strong>Tempo total típico do pipeline:</strong> 30–60 segundos do início ao fim. Todos os resultados são persistidos em 4 entidades: <code>ComplianceScore</code> (score e análise SENTINEL), <code>ExternalValidationResult</code> (resultado de cada consulta BDC/CAF), <code>IntegrationLog</code> (log técnico de cada chamada API) e <code>OnboardingCase</code> (status e decisão final).</P>

      <InfoBox title="Safety Net — Trava de Segurança" color="red">
        <p>Existe uma trava de segurança no Step 4: se a decisão determinística resultar em "Recusado" MAS não houver nenhum bloqueio V4 ativo (B01-B10) E nenhuma fraude CAF confirmada, o sistema automaticamente rebaixa a decisão para "Revisão Manual". Isso previne recusas injustas causadas por acúmulo de pontos menores que não representam risco real. A filosofia é: "na dúvida, mande para um humano — nunca recuse sem certeza".</p>
      </InfoBox>
    </S>
  );
}