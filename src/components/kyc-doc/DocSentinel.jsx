import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocSentinel() {
  return (
    <S>
      <H1>11. Análise SENTINEL IA (Agente Relator)</H1>

      <P>O SENTINEL v7.0 é um agente de inteligência artificial que lê absolutamente todos os dados disponíveis (questionário, BDC, CAF) e produz um relatório narrativo completo para o dossiê de compliance. É importante reforçar: o SENTINEL é um RELATOR — ele documenta e contextualiza, mas NÃO tem poder de decisão. A decisão é 100% determinística (subfaixa V4 + CAF).</P>

      <H2>11.1. Como o SENTINEL funciona — passo a passo</H2>
      <P>O SENTINEL executa 4 chamadas ao modelo de linguagem grande (LLM) — usando o modelo <code>gemini_3_1_pro</code> do Google — em uma arquitetura de "análise paralela + consolidação":</P>

      <ol className="list-decimal ml-6 space-y-3 mb-4">
        <Li><Bold>Chamada 1 — Análise do Questionário (paralela):</Bold> Recebe TODAS as respostas do questionário, já interpretadas semanticamente (ex: "Sim" em pergunta sobre PEP é flag, "Não" em pergunta sobre atividades proibidas é positivo). A IA analisa completude (quantas perguntas respondidas vs total), consistência (TPV declarado vs ticket médio × transações), e perfil declarado. Produz pontos positivos, pontos de atenção (NUNCA red flags — o questionário é contexto, não evidência), e cross-validations internas.</Li>
        <Li><Bold>Chamada 2 — Análise BDC (paralela):</Bold> Recebe o score V4 completo com todas as variáveis processadas por dimensão, os bloqueios, e os dados raw da BDC quando o tamanho permite (&lt;50k chars). A IA interpreta cada dado citando a fonte exata (ex: "BDC BasicData.TaxIdStatus = ATIVA"). Identifica apenas red flags com evidência concreta (sanções confirmadas, processos criminais). Dados neutros ou ausentes NÃO são classificados como negativos.</Li>
        <Li><Bold>Chamada 3 — Análise CAF (paralela):</Bold> Recebe todos os logs de integração CAF e resultados de validação. Analisa cada serviço: liveness, facematch, documentoscopia, screening, cross-validation OCR. Somente classifica como red flag: liveness REPROVED, deepfake DETECTED, documentoscopia REPROVED, ou sanções com hits confirmados.</Li>
        <Li><Bold>Chamada 4 — Consolidação (sequencial):</Bold> Recebe os 3 relatórios parciais e produz o relatório final unificado. Inclui: sumário executivo (4-8 linhas com fontes), análise dimensional (7 dimensões: identidade, sócios, compliance, digital, reputação, financeiro, biometria — cada uma com veredicto APROVADO/ATENÇÃO/REPROVADO), cross-validation cruzada (declarado vs BDC vs CAF), parecer final narrativo, pontos positivos, pontos de atenção, red flags (somente com evidência), recomendações para revisão manual, perguntas sugeridas ao merchant, documentos adicionais sugeridos, e nível de confiança (0-100%).</Li>
      </ol>

      <H2>11.2. Regras Invioláveis do SENTINEL</H2>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li>NUNCA afirma algo que não esteja explicitamente nos dados — cada afirmação DEVE citar a fonte exata.</Li>
        <Li>Se um dado não está disponível, diz "DADO NÃO DISPONÍVEL" — isso NÃO é um red flag.</Li>
        <Li>Red flags SOMENTE para: sanções confirmadas, fraude biométrica, processos criminais. NADA MAIS.</Li>
        <Li>Inconsistências no questionário são "pontos de atenção", NUNCA red flags.</Li>
        <Li>Ausência de dados (sem website, sem CAF, profileExists=false) NÃO é red flag.</Li>
        <Li>Se BDC e CAF dizem "sem sanções", isso é registrado como FORTE POSITIVO.</Li>
        <Li>A recomendação SENTINEL reflete a decisão V4 — não tenta contradizê-la.</Li>
      </ul>

      <H2>11.3. Output Completo do SENTINEL</H2>
      <Table headers={['Campo', 'Tipo', 'Descrição detalhada']} rows={[
        ['sumario_executivo', 'Texto', '4-8 linhas com as informações mais relevantes e fontes citadas. Começa SEMPRE com a subfaixa V4 e seu significado.'],
        ['analise_completa_ia', 'Texto longo', 'Análise consolidada completa com detalhes das 3 análises parciais (questionário, BDC, CAF).'],
        ['parecer_final', 'Texto', 'Parecer autocontido para dossiê — escrito para ser lido por um regulador ou auditor.'],
        ['pontos_positivos', 'Lista de textos', 'TODOS os dados limpos e aprovados: CNPJ ativo, sem sanções, sem processos criminais, liveness OK, etc.'],
        ['pontos_atencao', 'Lista de textos', 'Inconsistências, dados incompletos, observações — NÃO são problemas graves.'],
        ['red_flags', 'Lista de textos', 'SOMENTE com evidência concreta: sanções confirmadas, fraude biométrica, processos criminais.'],
        ['analise_dimensional', 'Objeto com 7 dimensões', 'Cada dimensão (identidade, sócios, compliance, digital, reputação, financeiro, biometria) tem: veredicto (APROVADO/ATENÇÃO/REPROVADO), confiança (0-100%), resumo narrativo, e lista de findings.'],
        ['cross_validation', 'Lista de objetos', 'Cruzamento declarado vs confirmado: campo, valor declarado, fonte, valor confirmado, fonte, consistente (sim/não), severidade, observação.'],
        ['nivel_confianca_ia', 'Número 0-100', 'Quanto o SENTINEL confia na própria análise — baseado na quantidade e qualidade dos dados disponíveis.'],
        ['perguntas_sugeridas', 'Lista de textos', 'Perguntas que o analista deveria fazer ao merchant em caso de revisão manual.'],
        ['documentos_adicionais_sugeridos', 'Lista de textos', 'Documentos que poderiam esclarecer pontos de atenção identificados.'],
      ]} />
    </S>
  );
}