import React from 'react';
import { SectionHeading, ClauseTitle, SubClauseTitle, P, BrandTable, KVTable, V, Num, Pct } from './ContratoStyles';

export default function ContratoAnexos({ contract }) {
  const c = contract || {};
  const rates = c.rates || {};
  const cartao = rates.cartao || {};
  const debito = rates.debito || {};
  const pix = rates.pix || {};
  const rav = rates.rav || {};
  const mods = c.modules || {};

  return (
    <>
      {/* ===== ANEXO I ===== */}
      <SectionHeading>ANEXO I – MÓDULOS DE SERVIÇO</SectionHeading>

      <ClauseTitle>ANEXO I-A – MÓDULO SUBADQUIRÊNCIA / GATEWAY / ORQUESTRADOR / API CARTÃO / ANTIFRAUDE</ClauseTitle>
      <SubClauseTitle>1. OBJETO ESPECÍFICO</SubClauseTitle>
      <P>1.1. Os Serviços de Gateway e Orquestrador de Pagamento consistem na disponibilização, pela PAGSMILE, de uma infraestrutura tecnológica robusta e segura, destinada ao processamento, roteamento inteligente e gestão de Transações com cartões de crédito e débito, bem como outros meios de pagamento eletrônico. O serviço inclui a conectividade com múltiplos adquirentes e a aplicação de regras de negócio para otimização de taxas de aprovação e custos.</P>
      <P>1.2. Os Serviços de Solução Antifraude consistem na disponibilização de uma ferramenta tecnológica integrada à plataforma, que realiza a análise de risco em tempo real de cada transação. A ferramenta utiliza múltiplos critérios, regras customizáveis, inteligência artificial e bases de dados para atribuir um score de risco e permitir a tomada de decisão automática ou manual sobre a aprovação ou recusa da operação, visando a mitigação de perdas por fraude.</P>

      <SubClauseTitle>2. DIREITOS E OBRIGAÇÕES ESPECÍFICAS DA PAGSMILE</SubClauseTitle>
      <P>2.1. A PAGSMILE se obriga a garantir a disponibilização da Plataforma em um ambiente computacional seguro, certificado e em conformidade com as melhores práticas de segurança da informação, como o padrão PCI-DSS. Isso inclui a manutenção de sistemas de monitoramento contínuo de vulnerabilidades, a aplicação de patches de segurança e a atualização constante dos sistemas antifraude.</P>
      <P>2.4. A PAGSMILE poderá exercer o direito de retenção e compensação sobre os valores a serem repassados ao CONTRATANTE, nos termos da Seção III da Cláusula Décima do Contrato Master, por um período mínimo de 180 (cento e oitenta) dias, contados da data da transação, em casos que justifiquem a medida para cobertura de passivos de Chargeback e outras obrigações.</P>

      <SubClauseTitle>3. DIREITOS E OBRIGAÇÕES ESPECÍFICAS DO CONTRATANTE</SubClauseTitle>
      <P>3.1. O CONTRATANTE se obriga a manter seu Índice de Chargeback, calculado com base no volume financeiro total das contestações em relação ao volume total de Transações aprovadas, em um patamar mensal inferior a 5% (cinco por cento). Atingir ou superar este índice por meses consecutivos poderá ser considerado inadimplemento contratual grave, sujeito às sanções previstas neste Contrato.</P>
      <P>3.2. Notificado pela PAGSMILE sobre a ocorrência de um Chargeback, o CONTRATANTE deverá realizar a análise da contestação e apresentar toda a documentação necessária para a disputa (reapresentação) em um prazo máximo de 7 (sete) dias corridos, contados da data da notificação. A falha em apresentar a documentação neste prazo poderá resultar na perda do direito de disputa e na assunção do prejuízo pelo CONTRATANTE.</P>

      <ClauseTitle>ANEXO I-B – MÓDULO CONTA (CONTA DE PAGAMENTO / CONTA LIQUIDAÇÃO)</ClauseTitle>
      <SubClauseTitle>1. ABERTURA E MANUTENÇÃO DA CONTA DE PAGAMENTO</SubClauseTitle>
      <P>1.1. Constitui condição essencial e indispensável para a abertura e a manutenção da Conta de Pagamento junto à PAGSMILE que o CONTRATANTE seja uma pessoa jurídica regularmente constituída, com inscrição válida e em situação ativa no Cadastro Nacional da Pessoa Jurídica (CNPJ) no momento do cadastro e durante toda a vigência contratual. A irregularidade cadastral do CNPJ poderá ensejar o bloqueio ou encerramento da conta.</P>

      <ClauseTitle>ANEXO I-C – MÓDULO COBRANÇA PIX (API PIX PARA COBRANÇA)</ClauseTitle>
      <SubClauseTitle>1. OBJETO ESPECÍFICO</SubClauseTitle>
      <P>1.1. O presente Módulo tem por objeto a disponibilização, pela PAGSMILE ao CONTRATANTE, de uma Interface de Programação de Aplicações (API) específica para a geração e gestão de cobranças via PIX. O serviço permite a criação de QR Codes estáticos e dinâmicos, a definição de datas de vencimento e outros parâmetros de cobrança, e a conciliação automática dos pagamentos recebidos, através da notificação em tempo real (webhook) e de relatórios específicos.</P>

      {/* ===== ANEXO II ===== */}
      <SectionHeading>ANEXO II – REMUNERAÇÃO</SectionHeading>

      <ClauseTitle>ANEXO II-A – REMUNERAÇÃO MÓDULO SUBADQUIRÊNCIA</ClauseTitle>
      <SubClauseTitle>1. TABELA DE PREÇOS</SubClauseTitle>
      <KVTable items={[
        ['Setup', <Num value={c.setupFee ?? 6000} />],
        ['Fee por Transação (Gateway)', <Num value={rates.feeTransacao} />],
        ['Taxa de Antifraude', <Num value={rates.antifraude} />],
        ['Taxa de Pré-Chargeback e/ou Chargeback', 'R$ 65,00 (sessenta e cinco reais)'],
        ['Prazo de Recebimento', <V value={rav.prazo || c.paymentTerm} />],
      ]} />

      <SubClauseTitle>MDR Cartão de Crédito</SubClauseTitle>
      <BrandTable 
        headers={['Bandeira', 'À Vista', '2-6x', '7-12x', '13-21x']}
        rows={['visa', 'mastercard', 'elo', 'amex', 'outras'].map(b => [
          b === 'outras' ? 'Outras' : b.charAt(0).toUpperCase() + b.slice(1),
          <Pct value={cartao[b]?.avista} />,
          <Pct value={cartao[b]?.de2a6x} />,
          <Pct value={cartao[b]?.de7a12x} />,
          <Pct value={cartao[b]?.de13a21x} />,
        ])}
      />

      <SubClauseTitle>Débito</SubClauseTitle>
      <BrandTable
        headers={['Visa', 'Mastercard', 'Elo', 'Outras']}
        rows={[[
          <Pct value={debito.visa} />,
          <Pct value={debito.mastercard} />,
          <Pct value={debito.elo} />,
          <Pct value={debito.outras} />,
        ]]}
      />

      <SubClauseTitle>Outras Taxas</SubClauseTitle>
      <KVTable items={[
        ['Taxa PIX (Gateway)', pix.tipo === 'fixo' ? <Num value={pix.valor} /> : <Pct value={pix.valor} />],
        ['Boleto', <Num value={rates.boleto} />],
        ['Taxa de Antecipação', <Pct value={rates.percentualAntecipacao} />],
        ['Custo de Checkout (% TPV)', <Pct value={rav.taxa} />],
      ]} />

      <SubClauseTitle>3. COMPROMISSO DE VOLUME MÍNIMO DE TRANSAÇÕES</SubClauseTitle>
      <P>3.1. Em contrapartida aos preços e condições comerciais pactuados neste Instrumento, o CONTRATANTE compromete-se a manter, durante a vigência contratual, um volume mínimo mensal de transações processadas através da plataforma da PAGSMILE, conforme os patamares descritos na tabela abaixo.</P>
      <BrandTable
        headers={['Mês 1', 'Mês 2', 'Mês 3 em diante']}
        rows={[[
          <Num value={c.projectedTpvMonth1} />,
          <Num value={c.projectedTpvMonth2} />,
          <Num value={c.projectedTpvMonth3} />,
        ]]}
      />

      <ClauseTitle>ANEXO II-B – TARIFAS MÓDULO CONTA E COBRANÇA PIX</ClauseTitle>
      <SubClauseTitle>1. DADOS DA CONTA</SubClauseTitle>
      <KVTable items={[
        ['Instituição', <V value={c.bankInstitution || 'A55 Sociedade de Crédito Direto S/A'} />],
        ['Agência', <V value={c.bankAgency} />],
        ['Número da Conta', <V value={c.bankAccountNumber} />],
      ]} />

      <SubClauseTitle>2. TABELA DE TARIFAS</SubClauseTitle>
      <KVTable items={[
        ['Taxa PIX (Módulo Conta ou Cobrança Pix)', '0.15%'],
        ['Manutenção de Conta', <Num value={c.accountMaintenanceFee} />],
        ['Saque (Cartão)', <Num value={c.cardWithdrawalFee} />],
        ['Transferência TED/DOC', <Num value={c.tedDocTransferFee} />],
        ['Emissão de Cartão Físico', <Num value={c.physicalCardIssuanceFee} />],
        ['2ª Via de Cartão Físico', <Num value={c.physicalCard2ndCopyFee} />],
      ]} />

      {/* ===== ANEXO III ===== */}
      <SectionHeading>ANEXO III – ATIVIDADES PROIBIDAS / COMPLIANCE</SectionHeading>
      <P>Constituem atividades expressamente proibidas na plataforma PAGSMILE, cuja prática pelo CONTRATANTE configurará infração contratual grave, sujeita à rescisão imediata por justa causa e demais sanções cabíveis. Esta lista é exemplificativa e não exaustiva.</P>

      <SubClauseTitle>SEÇÃO I - FRAUDES E GOLPES</SubClauseTitle>
      <P>É vedada qualquer tipo de fraude, golpe ou esquema enganoso que vise lesar consumidores ou o sistema financeiro, incluindo a realização de transações simuladas, fictícias ou sem lastro comercial real. Também são proibidos esquemas de pirâmide financeira, marketing multinível irregular, a falsificação de documentos ou identidades e a clonagem de cartões ou o uso indevido de dados financeiros de terceiros.</P>

      <SubClauseTitle>SEÇÃO II - PRODUTOS E SERVIÇOS SEM ENTREGA</SubClauseTitle>
      <P>É proibida a venda de produtos físicos sem a comprovação de sua efetiva entrega ao consumidor, a comercialização de conteúdos digitais, cursos ou materiais sem a sua real disponibilização, e a oferta de serviços que não sejam efetivamente prestados ou que não possuam entregáveis concretos e verificáveis.</P>

      <SubClauseTitle>SEÇÃO III - ATIVIDADES ILEGAIS</SubClauseTitle>
      <P>É terminantemente vedada a utilização dos serviços para a prática de lavagem de dinheiro e financiamento ao terrorismo, bem como para quaisquer atividades criminosas tipificadas na legislação brasileira, como o tráfico de drogas, armas ou substâncias controladas.</P>

      <SubClauseTitle>SEÇÃO IV - ATIVIDADES NÃO AUTORIZADAS</SubClauseTitle>
      <P>É proibida a oferta de serviços financeiros, de investimento ou de crédito sem a devida licença dos órgãos competentes, bem como a operação de casas de apostas, jogos de azar, "bets" ou atividades similares sem a autorização e a licença exigidas pela legislação vigente.</P>

      <SubClauseTitle>SEÇÃO V - VIOLAÇÃO DE DIREITOS</SubClauseTitle>
      <P>É vedada a utilização da plataforma para a violação de direitos de propriedade intelectual, incluindo a comercialização de produtos pirateados, falsificados ou que infrinjam direitos autorais, marcas ou patentes de terceiros.</P>
      <P><em>PARÁGRAFO ÚNICO: A PAGSMILE poderá, a seu critério, classificar outras atividades como proibidas com base em sua análise de risco, em alterações na legislação aplicável ou em determinações de autoridades competentes, notificando o CONTRATANTE a respeito.</em></P>

      {/* ===== ANEXO IV ===== */}
      <SectionHeading>ANEXO IV – SLA + SUPORTE</SectionHeading>
      <SubClauseTitle>1. NÍVEIS DE SERVIÇO (SLA)</SubClauseTitle>
      <P>1.1. Disponibilidade da Plataforma: A PAGSMILE se compromete a manter a plataforma de produção disponível para processamento de transações em, no mínimo, <V value={c.slaUptime || '99.5%'} /> do tempo, apurado mensalmente.</P>
      <P>1.2. Tempo de Resposta da API: O tempo médio de resposta da API da PAGSMILE para o processamento síncrono de Transações de autorização não deverá exceder <V value={c.slaResponseTime || '600ms'} />, medido no servidor da PAGSMILE.</P>
      <P>1.3. Suporte Técnico - Escala de Prioridade:</P>
      <BrandTable
        headers={['Prioridade', 'Descrição', 'SLA de Resposta', 'Horário']}
        rows={[
          ['Crítico', 'Incidentes que impedem processamento de Transações', <V value={c.supportCriticalSLA || 'Até 1 hora'} />, '24/7'],
          ['Alto', 'Problemas que afetam funcionalidades importantes', <V value={c.supportHighSLA || 'Até 6 horas'} />, 'Horário comercial'],
          ['Médio', 'Questões que não impedem operação', <V value={c.supportMediumSLA || 'Até 1 dia'} />, 'Horário comercial'],
          ['Baixo', 'Melhorias e ajustes não urgentes', <V value={c.supportLowSLA || 'Até 5 dias úteis'} />, 'Horário comercial'],
        ]}
      />

      {/* ===== ANEXO V ===== */}
      <SectionHeading>ANEXO V – CHARGEBACK/DISPUTAS + MED PIX</SectionHeading>
      <SubClauseTitle>1. DEFINIÇÃO E RESPONSABILIDADES</SubClauseTitle>
      <P>1.1. Chargeback é o procedimento pelo qual um Consumidor Final contesta uma transação diretamente com o banco emissor de seu cartão, o que pode resultar no estorno (reversão) do valor, independentemente da autorização inicial.</P>
      <P>1.2. O CONTRATANTE é o responsável primário por todos os Chargebacks decorrentes de suas operações, especialmente aqueles imputáveis a sua conduta dolosa ou culposa (ex: não entrega do produto, produto com defeito, falha na prestação do serviço) ou que sejam decorrentes do risco inerente à sua atividade comercial (ex: fraude amiga).</P>
      <P>1.3. O Mecanismo Especial de Devolução (MED) do PIX é o procedimento regulamentado pelo Banco Central do Brasil que viabiliza a solicitação de devolução de valores em transações PIX, nos casos específicos de suspeita de fraude ou falha operacional no ambiente dos participantes. O CONTRATANTE se compromete a seguir as regras e prazos do MED, colaborando com a PAGSMILE na análise e eventual devolução de valores.</P>

      <SubClauseTitle>2. GESTÃO DE CHARGEBACKS ELEVADOS</SubClauseTitle>
      <P>4.1. Caso o CONTRATANTE apresente uma taxa de Chargeback, medida em volume financeiro, superior a <Pct value={c.chargebackThreshold || 5} /> do seu volume mensal de transações aprovadas, a PAGSMILE poderá, a seu critério e de forma cumulativa ou alternada, adotar as seguintes medidas: bloquear temporariamente o processamento de novas transações até a apresentação e aprovação de um plano de ação; aumentar o percentual de retenção de segurança previsto no Contrato; exigir a constituição de garantias adicionais, como fiança bancária; ou rescindir o Contrato Master e/ou o Módulo Subadquirência por justa causa, por quebra da segurança e do perfil de risco aceitável.</P>

      {/* ===== ANEXO VI ===== */}
      <SectionHeading>ANEXO VI – TRATAMENTO DE DADOS PESSOAIS</SectionHeading>
      <SubClauseTitle>1. DEFINIÇÃO DE PAPÉIS</SubClauseTitle>
      <P>1.1. CONTRATANTE como Controlador: Para todos os efeitos da LGPD e no que tange aos dados de seus Consumidores Finais, o CONTRATANTE é qualificado como o Controlador, pois é quem toma as decisões referentes ao tratamento de dados pessoais, definindo as finalidades e os meios de tratamento para viabilizar sua relação comercial com seus clientes.</P>
      <P>1.2. PAGSMILE como Operadora: No contexto da prestação dos serviços objeto deste Contrato e em relação aos dados dos Consumidores Finais do CONTRATANTE, a PAGSMILE é qualificada como Operadora. A PAGSMILE realizará o tratamento dos dados pessoais em nome do Controlador (CONTRATANTE), em estrita conformidade com as suas instruções lícitas e documentadas, e para as finalidades exclusivas de processamento de pagamentos, prevenção a fraudes e cumprimento de obrigações regulatórias, conforme permitido pela legislação.</P>

      <SubClauseTitle>2. OBRIGAÇÕES DAS PARTES</SubClauseTitle>
      <P>2.1. A PAGSMILE, como Operadora, compromete-se a tratar os dados pessoais estritamente para as finalidades autorizadas pelo CONTRATANTE e necessárias à execução do Contrato, a não compartilhar tais dados com terceiros sem instrução expressa, e a garantir que seus colaboradores e suboperadores envolvidos no tratamento estejam sujeitos a obrigações de confidencialidade.</P>
      <P>2.2. Compete ao CONTRATANTE, como Controlador, garantir que possui uma base legal válida para todo o tratamento de dados pessoais realizado, bem como gerenciar e responder às solicitações dos titulares de dados relativas ao exercício de seus direitos, contando com a cooperação da PAGSMILE para tanto, naquilo que lhe for aplicável.</P>

      {/* ===== ANEXO VII ===== */}
      <SectionHeading>ANEXO VII – DEFINIÇÕES</SectionHeading>
      <P>Para perfeita compreensão deste Contrato, os termos abaixo terão o seguinte significado:</P>
      <KVTable items={[
        ['Adquirente', 'Instituição financeira ou de pagamento credenciada a uma ou mais bandeiras e responsável pela captura, transmissão, processamento e liquidação das Transações de cartão.'],
        ['API', 'Interface de programação de aplicações que permite a integração segura e automatizada entre os sistemas do CONTRATANTE e a plataforma da PAGSMILE.'],
        ['Bandeira', 'Empresa instituidora do arranjo de pagamento, detentora da marca e das regras aplicáveis aos cartões de pagamento (ex: Visa, Mastercard, Elo, etc.).'],
        ['Chargeback', 'Contestação de uma Transação, iniciada pelo portador do cartão junto ao seu banco emissor, que pode resultar na reversão do pagamento.'],
        ['Consumidor Final', 'Pessoa física ou jurídica que adquire produtos ou serviços do CONTRATANTE e realiza o pagamento através da plataforma PAGSMILE.'],
        ['Conta de Pagamento', 'Conta de titularidade do CONTRATANTE, aberta e mantida junto à PAGSMILE, destinada à movimentação de recursos e à realização de pagamentos.'],
        ['Estabelecimento', 'Cliente do CONTRATANTE, pessoa física ou jurídica, para o qual o CONTRATANTE utiliza os serviços da PAGSMILE para processar pagamentos.'],
        ['Gateway de Pagamento', 'Sistema tecnológico que atua como um terminal virtual, estabelecendo a comunicação segura entre o website/aplicativo do CONTRATANTE, os adquirentes e as bandeiras.'],
        ['LGPD', 'Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).'],
        ['MDR', 'Taxa de Desconto do Lojista, expressa como um percentual cobrado pela PAGSMILE sobre o valor de cada transação com cartão.'],
        ['MED', 'Mecanismo Especial de Devolução do PIX, procedimento para devolução de valores em casos de fraude ou falha operacional.'],
        ['PIX', 'Sistema de pagamentos instantâneos brasileiro, operado e regulamentado pelo Banco Central do Brasil.'],
        ['PLD/FT', 'Prevenção à Lavagem de Dinheiro e ao Financiamento do Terrorismo.'],
        ['SLA', 'Acordo de Nível de Serviço, que define as métricas de desempenho e os compromissos de qualidade.'],
        ['TPV', 'Volume Total de Pagamentos, correspondente à soma dos valores de todas as transações processadas em um determinado período.'],
        ['Transação', 'Qualquer operação de pagamento, transferência ou movimentação de fundos processada através da Plataforma PAGSMILE.'],
        ['Usuário Master', 'Pessoa física devidamente indicada e autorizada pelo CONTRATANTE para acessar o Aplicativo da PAGSMILE e gerenciar a Conta de Pagamento.'],
      ]} />
    </>
  );
}