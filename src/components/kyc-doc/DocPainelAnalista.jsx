import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocPainelAnalista() {
  return (
    <S>
      <H1>13. Painel de Análise de Risco — Visão Completa do Analista</H1>

      <P>Cada caso de onboarding é acessível através do painel administrativo em <strong>Cadastro → Detalhe</strong>. O painel apresenta uma visão unificada e completa do caso, dividida em abas especializadas. Abaixo está a descrição microscópica de cada aba e o que ela contém.</P>

      <H2>13.1. Aba Overview (Visão Geral)</H2>
      <P>A aba Overview é a primeira tela que o analista vê ao abrir um caso. Ela contém:</P>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li><Bold>Score Gauge Visual:</Bold> Um medidor circular colorido mostrando o Score V4 de 0 a 849, com a cor correspondente à subfaixa (verde, azul, amarelo, laranja, vermelho).</Li>
        <Li><Bold>Subfaixa e Decisão:</Bold> Badge colorido mostrando "1A — VERDE EXPRESS — Aprovado" ou "4 — VERMELHO — Revisão Manual", etc.</Li>
        <Li><Bold>Rolling Reserve:</Bold> Percentual de reserva aplicado (0% a 20%).</Li>
        <Li><Bold>Nível de Monitoramento:</Bold> PADRÃO, REFORÇADO LEVE, REFORÇADO, INTENSO, INTENSO PLUS ou MÁXIMO.</Li>
        <Li><Bold>Condições Automáticas:</Bold> Lista de todas as condições aplicadas (ex: "KYC completo em 30 dias", "Limite TPV R$500k/mês").</Li>
        <Li><Bold>Red Flags Consolidados:</Bold> Todos os red flags de todas as fontes (V4, SENTINEL, CAF) em uma única lista unificada.</Li>
        <Li><Bold>Decomposição do Score:</Bold> Gráfico mostrando Score Base + Variáveis + Enriquecimento = Score Final.</Li>
        <Li><Bold>Timeline de Integrações:</Bold> Linha do tempo mostrando cada chamada API feita (BDC, CAF) com status, duração e resultado.</Li>
      </ul>

      <H2>13.2. Aba Compliance (Dossiê SENTINEL)</H2>
      <P>Esta aba contém o relatório completo produzido pelo SENTINEL IA:</P>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li><Bold>Sumário Executivo:</Bold> 4-8 linhas com as informações mais relevantes e fontes citadas.</Li>
        <Li><Bold>Análise Dimensional (7 dimensões):</Bold> Cada dimensão (Identidade, Sócios, Compliance, Digital, Reputação, Financeiro, Biometria) exibida como um card com: veredicto (APROVADO/ATENÇÃO/REPROVADO em badge colorido), nível de confiança (%), resumo narrativo, e lista de findings específicos.</Li>
        <Li><Bold>Cross-Validation (Declarado vs Confirmado):</Bold> Tabela cruzando cada informação declarada pelo cliente no questionário com o valor confirmado por BDC ou CAF, indicando se são consistentes ou divergentes.</Li>
        <Li><Bold>Pontos Positivos:</Bold> Lista verde com todos os aspectos favoráveis da análise.</Li>
        <Li><Bold>Pontos de Atenção:</Bold> Lista amarela com observações que merecem nota mas não são problemas graves.</Li>
        <Li><Bold>Red Flags:</Bold> Lista vermelha com problemas confirmados por evidência concreta.</Li>
        <Li><Bold>Perguntas Sugeridas:</Bold> Se o caso for para revisão manual, lista de perguntas que o analista deveria fazer ao merchant.</Li>
        <Li><Bold>Documentos Adicionais Sugeridos:</Bold> Documentos que poderiam esclarecer pontos de atenção.</Li>
      </ul>

      <H2>13.3. Aba Análise BDC — Visão Microscópica</H2>
      <P>Esta é a aba mais detalhada de todo o sistema. O componente <code>BdcV4AnalysisPanel</code> exibe absolutamente CADA item analisado pelo V4, agrupado por dimensão:</P>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li><Bold>Header com Score:</Bold> Score final, subfaixa, decomposição (base + variáveis + enriquecimento) em cards visuais.</Li>
        <Li><Bold>Bloqueios Ativos:</Bold> Se houver, exibidos em cards vermelhos com código (B01-B10), descrição e consequência. Cada bloqueio tem botão "Entender este bloqueio" que expande explicação com base legal.</Li>
        <Li><Bold>Análise por Dimensão:</Bold> Cada dimensão é um bloco expansível com header mostrando ícone, título, número de itens, badges de itens críticos/altos, e score parcial. Ao expandir:</Li>
        <Li className="ml-4">Cada item mostra: <strong>label</strong> (ex: "Idade da empresa"), <strong>valor encontrado</strong> (ex: "3 anos"), <strong>badge de risco</strong> (CRÍTICO/ALTO/MÉDIO/BAIXO/OK/INFO), <strong>pontos</strong> (ex: "+5 pts"). Itens de alto risco têm fundo vermelho/laranja.</Li>
        <Li className="ml-4">Botão <strong>"Por que isso importa?"</strong> que expande 4 blocos: (a) O que é — explicação do campo, (b) Por que importa — relevância para compliance, (c) Base regulatória — artigos de lei aplicáveis, (d) Faixas de risco — thresholds e pontuações.</Li>
        <Li className="ml-4">Para <strong>processos judiciais</strong>: drill-down completo com número do processo, tribunal, tipo, partes (nome e CPF), valor da causa, data de início, status, últimas movimentações, e badge "CRIMINAL" em vermelho quando aplicável.</Li>
        <Li className="ml-4">Para itens com <strong>detalhes</strong>: grid de sub-informações (ex: para domínio: idade, SSL, plataforma, tipo de site).</Li>
      </ul>

      <H2>13.4. Aba Enriquecimento BDC</H2>
      <P>Exibe os dados BDC raw organizados por dataset, com:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>Smart Alerts:</Bold> Alertas inteligentes gerados automaticamente a partir dos dados (ex: "Shell Company Score acima de 50%").</Li>
        <Li><Bold>Relatório Narrativo:</Bold> Texto gerado por IA resumindo os dados BDC em linguagem de negócio.</Li>
        <Li><Bold>Declarado vs Confirmado:</Bold> Tabela comparando o que o cliente disse no questionário com o que a BDC encontrou.</Li>
        <Li><Bold>Heatmap de Risco:</Bold> Visualização por dimensão com cores indicando nível de risco por área.</Li>
        <Li><Bold>Dados Raw por Dataset:</Bold> Cada dataset expansível mostrando os dados brutos retornados pela API BDC em formato JSON legível.</Li>
        <Li><Bold>Viewer de Processos:</Bold> Para datasets de processos judiciais, viewer especializado com filtros por tipo, tribunal e status.</Li>
        <Li><Bold>Glossário:</Bold> Explicação de cada termo e sigla usado nos dados BDC.</Li>
      </ul>

      <H2>13.5. Aba Documentos</H2>
      <P>Lista todos os documentos enviados pelo cliente com: thumbnail de preview (para imagens), nome do arquivo, tamanho, data de upload, status de validação (Pendente/Validado/Rejeitado com badge colorido), resultado da análise VerifAI/documentoscopia da CAF, e botão para download/visualização em tela cheia.</P>

      <H2>13.6. Aba Dados (Respostas do Questionário)</H2>
      <P>Exibe todas as respostas do questionário de compliance em formato organizado por seção, com destaque visual para: campos preenchidos automaticamente via autocomplete CNPJ (badge "Receita Federal"), campos com flags de compliance ativos, e campos obrigatórios não respondidos.</P>

      <H2>13.7. Aba Regulatório</H2>
      <P>Esta aba especializada apresenta o checklist regulatório do caso contra as normas do Banco Central aplicáveis:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>BC 475 — Protege+:</Bold> Validação de que a consulta prévia à BigDataCorp foi realizada antes da abertura de conta (obrigatório a partir de Dez/2025).</Li>
        <Li><Bold>BC 3988 — Irregularidades RF:</Bold> Confirma que o CNPJ/CPF não possui irregularidades graves na Receita Federal (situação ATIVA obrigatória).</Li>
        <Li><Bold>BC 3978 — Motivos de Rejeição:</Bold> Verifica se os motivos da decisão estão explicitamente registrados (bloqueios V4 + red flags) para comunicação ao titular.</Li>
        <Li><Bold>BC 96 — Via do Contrato:</Bold> Confirma disponibilização da via do contrato ao cliente por meio eletrônico (Art.6 §1).</Li>
        <Li><Bold>Organograma Societário 100%:</Bold> Checklist de identificação de beneficiários finais com participação somando 100% (Circular BCB 3.978/2020 Art.16).</Li>
        <Li><Bold>Documentoscopia × Biometria:</Bold> Painel cruzando liveness CAF, facematch, documento frente e verso com threshold configurável de similaridade.</Li>
      </ul>

      <H2>13.8. Aba Propostas</H2>
      <P>Lista todas as propostas comerciais associadas ao caso (por lead, por CNPJ ou por nome comercial). Cada proposta mostra: código (PROP-YYYY-NNNNN), cliente, status (rascunho/enviada/visualizada/aceita/recusada/contraproposta/expirada), data de envio e validade, parceiro escolhido, rentabilidade estimada (TPV base + receita MDR + margem %), taxas por bandeira e versão atual da proposta. Link direto para <code>PropostaDetalhes</code> de cada item.</P>

      <H2>13.9. Aba Contratos</H2>
      <P>Lista todos os contratos vinculados ao merchant (por CNPJ ou por merchantId). Exibe: código do contrato, status (pre_generated/under_review/ready/sent/signed/cancelled), módulos contratados (conta pagamento, subadquirência cartão, PIX, boleto, gateway), datas de envio e assinatura, taxas consolidadas e link público amigável (slug <code>/c/:slug</code>).</P>

      <H2>13.10. Aba Subcontas (quando aplicável)</H2>
      <P>Para sellers que têm subsellers, esta aba lista todos os subsellers vinculados com: nome, CNPJ/CPF, score V4, subfaixa, status da decisão, e link para o dossiê completo de cada subseller.</P>

      <H2>13.11. Aba Histórico</H2>
      <P>Linha do tempo completa de todas as ações do caso: criação, submissão, cada etapa do pipeline (com duração), decisão automática, revisões manuais, revalidações, e alterações de status. Cada evento mostra: data/hora, ator (sistema ou analista), ação e detalhes.</P>

      <H2>13.12. Ações do Analista</H2>
      <P>Para casos em Revisão Manual (subfaixa 4), o analista tem as seguintes ações disponíveis:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>Aprovar:</Bold> Com ou sem condições adicionais. O analista pode adicionar condições customizadas além das automáticas.</Li>
        <Li><Bold>Recusar:</Bold> Com motivo obrigatório. O motivo é registrado no AuditLog e pode ser usado em comunicação com o cliente.</Li>
        <Li><Bold>Solicitar Documentos Adicionais:</Bold> Gera um link seguro enviado ao cliente para upload de documentos extras. O status muda para "Docs Solicitados".</Li>
        <Li><Bold>Reassignar:</Bold> Transfere o caso para outro analista da equipe.</Li>
      </ul>
      <P>Todas as ações geram registro em <code>AuditLog</code> com: quem fez, quando, o que fez, e detalhes. Também enviam notificação ao Slack.</P>
    </S>
  );
}