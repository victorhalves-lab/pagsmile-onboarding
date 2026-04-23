import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, InfoBox } from './DocHelpers';

export default function DocVisaoGeral() {
  return (
    <S>
      <H1>1. Visão Geral — Arquitetura Completa do Pipeline KYC/KYB</H1>

      <H2>1.1. O que é o pipeline KYC/KYB da PagSmile</H2>
      <P>O pipeline de compliance da PagSmile é um sistema automatizado end-to-end que avalia o risco de cada empresa ou pessoa física que deseja processar pagamentos através da nossa plataforma. O objetivo é cumprir todas as obrigações regulatórias (Circular BCB 3.978/2020, Lei 9.613/1998) e ao mesmo tempo oferecer uma experiência rápida e eficiente para o cliente. <strong>Termos técnicos (KYC, KYB, EDD, UBO, PEP, Score V4, Subfaixa, Bloqueio, Safety Net, Veto Biométrico, etc.) estão definidos no Glossário (Seção 0)</strong> — consulte-o sempre que necessário.</P>
      <P>O processo inteiro — desde o momento em que o cliente começa a preencher o questionário até a decisão final automatizada — leva em média entre 2 e 5 minutos de interação do cliente (preenchimento + documentos + verificação biométrica), seguidos de 30 a 60 segundos de processamento automatizado no backend. A decisão é emitida sem intervenção humana em 95% dos casos.</P>

      <H2>1.2. Princípio Arquitetural Fundamental — Data-First v7.0</H2>
      <P>A arquitetura segue o princípio "Data-First", que significa que a decisão é baseada EXCLUSIVAMENTE em dados objetivos verificados por fontes externas (BigDataCorp e CAF), NUNCA em interpretações subjetivas. Concretamente, isso se traduz nas seguintes regras invioláveis:</P>
      <ul className="list-disc ml-6 space-y-2 mb-4">
        <Li><Bold>O Score V4 (calculado pela BigDataCorp) é o DECISOR ABSOLUTO.</Bold> Ele produz um número de 0 a 849 e uma subfaixa (1A até 5) que determina automaticamente se o cliente é aprovado, aprovado com condições, enviado para revisão manual ou recusado. Nenhum outro componente do sistema pode alterar essa decisão.</Li>
        <Li><Bold>O SENTINEL (Inteligência Artificial) é APENAS um RELATOR.</Bold> Ele lê todos os dados, cruza informações e escreve um relatório narrativo para o dossiê de compliance. Mas ele não tem poder para alterar o status do caso, não pode escalar uma decisão e não pode vetar uma aprovação. Sua função é puramente documental.</Li>
        <Li><Bold>A CAF (Combate à Fraude) tem poder de VETO BIOMÉTRICO.</Bold> Se a CAF detectar fraude biométrica confirmada (liveness reprovado, deepfake detectado ou documentoscopia reprovada), o caso é automaticamente encaminhado para revisão manual, independentemente do score V4. Esta é a ÚNICA exceção à decisão determinística.</Li>
        <Li><Bold>O Questionário é CONTEXTO, nunca veto.</Bold> As respostas do questionário alimentam o dossiê e podem gerar "pontos de atenção", mas nunca geram red flags ou impedem uma aprovação. O questionário serve para coletar dados declarados que serão posteriormente cruzados com os dados verificados da BigDataCorp e da CAF.</Li>
      </ul>

      <H2>1.3. As 6 Etapas do Processo Completo</H2>
      <P>O processo de onboarding completo segue obrigatoriamente estas 6 etapas, nesta exata ordem:</P>
      <ol className="list-decimal ml-6 space-y-3 mb-4">
        <Li><Bold>Etapa 1 — Questionário de Compliance:</Bold> O cliente preenche um formulário digital específico ao seu segmento de negócio. O questionário coleta informações cadastrais da empresa (CNPJ, razão social, endereço), dados dos sócios e representantes legais, informações operacionais (volume de transações, ticket médio, modelo de negócio), dados de compliance e PLD (programa de prevenção à lavagem de dinheiro) e declarações sobre atividades proibidas. O formulário possui autocomplete de CNPJ via Receita Federal, autocomplete de CEP via ViaCEP, lógica condicional (perguntas aparecem/desaparecem conforme respostas anteriores) e salvamento automático para retomada.</Li>
        <Li><Bold>Etapa 2 — Upload de Documentos:</Bold> O cliente envia os documentos societários e pessoais exigidos. Os documentos base (obrigatórios para todos) são: Contrato Social, Cartão CNPJ, Comprovante de Endereço, e RG/CNH do representante legal. Documentos adicionais são solicitados conforme o segmento — por exemplo, para Dropshipping é pedido print de rastreamento de pedido, para E-commerce é pedida nota fiscal de mercadoria.</Li>
        <Li><Bold>Etapa 3 — Verificação de Identidade (CAF):</Bold> O cliente realiza captura biométrica usando o SDK da CAF integrado ao navegador. São capturadas: foto da frente do documento, foto do verso do documento e prova de vida (liveness) com detecção anti-deepfake. Se o SDK da CAF falhar por qualquer motivo técnico, o sistema ativa automaticamente o fallback para a BigDataCorp BigID, que permite upload manual de imagens e realiza documentoscopia, facematch e liveness via API.</Li>
        <Li><Bold>Etapa 4 — Enriquecimento Automatizado (Pipeline Backend):</Bold> Assim que o cliente finaliza as etapas anteriores, o orquestrador (autoEnrichOnboarding) dispara automaticamente uma sequência de 11 etapas de verificação. Primeiro: análise pós-captura da CAF (OCR, documentoscopia, deepfake, facesets). Segundo: consulta massiva à BigDataCorp (entre 22 e 39 datasets dependendo do segmento) com cálculo do Risk Score V4 em 3 camadas. Terceiro: screening internacional de PEP e sanções via CAF. Quarto: análise SENTINEL IA que gera o relatório narrativo.</Li>
        <Li><Bold>Etapa 5 — Decisão Determinística:</Bold> Com base na subfaixa V4 calculada no step anterior, o sistema aplica automaticamente a tabela de decisão: subfaixas 1A/1B = aprovado automático, 2A/2B/3A/3B = aprovado com condições progressivas, 4 = revisão manual, 5 = recusado por bloqueios. Se a CAF detectou fraude biométrica, o caso vai para revisão manual independentemente da subfaixa.</Li>
        <Li><Bold>Etapa 6 — Notificação e Monitoramento:</Bold> Uma mensagem detalhada é enviada ao canal #compliance do Slack com o resumo do caso (nome, CNPJ, score, subfaixa, decisão, red flags). O caso fica disponível no painel administrativo para acompanhamento. Para clientes aprovados, inicia-se o monitoramento contínuo conforme o nível definido pela subfaixa.</Li>
      </ol>

      <H2>1.4. Regulamentações Base</H2>
      <P>Todo o processo é construído sobre as seguintes regulamentações brasileiras e internacionais:</P>
      <ul className="list-disc ml-6 space-y-1.5 mb-4">
        <Li><Bold>Circular BCB 3.978/2020:</Bold> Política de PLD/FT para instituições de pagamento. Define obrigatoriedade de KYC (Know Your Customer), CDD (Customer Due Diligence), EDD (Enhanced Due Diligence) para PEPs, identificação de beneficiários finais com participação igual ou superior a 25%, e monitoramento contínuo de transações.</Li>
        <Li><Bold>Lei 9.613/1998:</Bold> Lei brasileira de Prevenção à Lavagem de Dinheiro. Obriga a reportar operações suspeitas ao COAF (Conselho de Controle de Atividades Financeiras), manter cadastro atualizado de clientes e reter documentação por 5 anos.</Li>
        <Li><Bold>Resolução CMN 4.893/2021:</Bold> Classifica atividades econômicas por nível de risco para instituições de pagamento, definindo quais CNAEs exigem análise reforçada.</Li>
        <Li><Bold>IN RFB 1.863/2018:</Bold> Define as situações cadastrais possíveis de CNPJ/CPF na Receita Federal (Ativa, Suspensa, Inapta, Baixada, Cancelada).</Li>
        <Li><Bold>Resolução BCB 5.037/2022:</Bold> Regula o SCR (Sistema de Informações de Crédito do Banco Central), que é a base para o score de crédito BCB consultado na análise de PFs.</Li>
        <Li><Bold>Lei 6.830/1980:</Bold> Lei de Execuções Fiscais — fundamenta a análise de dívida ativa da União, Estados e Municípios.</Li>
        <Li><Bold>Portaria MTE 1.293/2017:</Bold> Regulamenta a Lista Suja do Ministério do Trabalho (trabalho escravo).</Li>
        <Li><Bold>Lei 9.605/1998:</Bold> Lei de Crimes Ambientais — fundamenta a verificação de embargos IBAMA.</Li>
      </ul>

      <InfoBox title="Tempo Total do Processo (perspectiva do cliente)" color="green">
        <p>• Preenchimento do questionário: 3–8 minutos (varia com o segmento; questionários PIX são mais curtos)</p>
        <p>• Upload de documentos: 1–3 minutos</p>
        <p>• Verificação biométrica (CAF): 1–2 minutos</p>
        <p>• Processamento automático (backend): 30–60 segundos (invisível para o cliente)</p>
        <p>• <strong>Total estimado: 5–14 minutos do início à decisão final.</strong></p>
      </InfoBox>
    </S>
  );
}