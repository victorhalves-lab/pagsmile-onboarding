import React from 'react';
import { PageDetail } from './HowItWorksShared';

export default function SidebarPagesSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#002443]/70 mb-4 leading-relaxed">
        A seguir, cada página do sistema, suas funcionalidades, sub-abas e detalhamento microscópico de tudo o que se pode fazer dentro de cada uma.
      </p>

      {/* ═══════ HOME ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-6">🏠 Home</h3>
      <PageDetail name="Home" description="Página principal com visão 360° do estado operacional. É o ponto de partida para qualquer ação." access="Admin"
        funcionalidades={[
          "Hero Section com saudação personalizada (Bom dia/Boa tarde/Boa noite + nome do usuário)",
          "3 KPIs principais: Leads Ativos, Propostas em Aberto, Compliance Pendentes — cada um com subtotal e ícone",
          "Quick Actions: 4 botões de ação rápida para os fluxos mais usados (criar proposta, gerar link, pipeline, etc.)",
          "Helena Insights Alerts: alertas inteligentes da IA sobre leads inativos há +7 dias, casos manuais há +24h",
          "Pipeline Comercial Resumido: gráfico de resumo do funil de vendas com contagem por coluna",
          "Status de Propostas: gráfico resumido com propostas por status (rascunho, enviada, aceita, recusada)",
          "Compliance Summary: resumo dos casos de compliance com gráfico de distribuição Helena",
          "Atividade Recente: últimas 10 ações registradas no AuditLog (quem fez o quê e quando)",
          "Data e hora atuais no canto superior direito"
        ]}
        subAbas={[]}
      />

      {/* ═══════ LEADS & PROPOSTAS ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">📬 Leads & Propostas</h3>

      <PageDetail name="Links de Questionários" description="Central de geração e gestão de links públicos para coleta de dados de leads." access="Admin"
        funcionalidades={[
          "4 cards de questionários disponíveis, cada um com link copiável e botão de visualização externa",
          "Lead Completo v2.0 (Autocomplete): CNPJ preenche 14 campos automaticamente. 76 perguntas com validação avançada. Ao aceitar proposta, direciona para Compliance v2.0 correto.",
          "Questionário Completo (v1): questionário original para qualificação comercial detalhada",
          "Questionário Simplificado: coleta rápida de taxas atuais do cliente para geração imediata de proposta",
          "Questionário PIX: específico para clientes com interesse exclusivo em pagamentos via PIX",
          "Cada card possui botão 'Gerar Link Rastreável' que cria um OnboardingLink com uniqueCode, nome do vendedor opcional, e rastreamento UTM",
          "Card especial 'Gerar Link por Introducer': cria links rastreáveis vinculados a parceiros de indicação (Introducers)",
          "Links gerados são copiáveis com um clique e possuem métricas de cliques/submissões/conversões"
        ]}
        subAbas={[
          "Link Generator: formulário embutido para gerar link rastreável com nome do vendedor",
          "Introducer Link Generator Modal: modal para gerar links vinculados a Introducers específicos"
        ]}
      />

      <PageDetail name="Questionários Recebidos" description="Central de visualização e gestão de todos os questionários preenchidos por leads." access="Admin"
        funcionalidades={[
          "Hero Header com métricas: total este mês, aguardando, alto score, risco alto/crítico",
          "Botões de Exportar CSV e Atualizar",
          "Tabela com 11 colunas: Protocolo, Empresa, Tipo, Status, Score PRISCILA, Lead IA (Lead Qualifier), Risco, TPV Mensal, Introducer, Data (com SLA), Ações",
          "7 filtros simultâneos: Busca texto, Status, Período, Risco, Ordenação, Introducer + botão Limpar",
          "Ações por lead: Iniciar Contato (muda status + cria atividade), Gerar Proposta (redireciona para CriarProposta), Ver Respostas (abre modal com questionnaireData)",
          "Botão Ver (→ LeadDetails) e Excluir com confirmação",
          "Paginação 10 itens por página com navegação Anterior/Próxima"
        ]}
        subAbas={[
          "Completo: tabela principal de leads do questionário completo com todos filtros e ações",
          "Simplificado: cards de questionários simplificados com ações: Ver Detalhes, Vincular Lead, Gerar Proposta",
          "De Introducers: tabela filtrada apenas para leads que vieram de Introducers, com nome do Introducer destacado",
          "Questionário Reunião: tab para questionários internos preenchidos após reuniões presenciais/remotas",
          "Reunião PIX: variante do questionário de reunião focada em PIX",
          "Questionário com Robô: tab para questionários processados pela IA que transforma notas de reunião em dados estruturados"
        ]}
      />

      <PageDetail name="Pipeline Comercial" description="Kanban drag-and-drop para gestão visual do funil de vendas." access="Admin"
        funcionalidades={[
          "Hero Header com total de leads, TPV total, receita estimada (TPV × 2,5%)",
          "Filtro de período: Esta Semana, Este Mês, 3/6/12 Meses, Lifetime",
          "Pipeline Metrics: 4 cards de métricas (leads novos, propostas, taxa conversão, ticket médio)",
          "Gráfico de Conversão por estágio do funil",
          "Aging Alerts: alertas de leads parados há muito tempo em um estágio",
          "Busca por CNPJ, Nome ou Razão Social",
          "7 colunas Kanban: Leads (Quest. Completo), Em Contato + Quest. Simplificado, Proposta Enviada, Proposta Aceita, Em Compliance/KYC, Contrato Gerado, Perdido",
          "Cada coluna mostra: nome, contagem de leads, TPV/mês, TPV/ano, Receita/mês, Receita/ano",
          "Cards de lead arrastáveis com: nome, CNPJ, TPV, score, ícone de contrato/proposta",
          "Drag-and-drop atualiza status do lead + cria LeadActivity automaticamente",
          "Cada card tem botões de ação rápida: Iniciar Contato, Ver Detalhes"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Gestão de Propostas" description="Central de todas as propostas comerciais com métricas, versionamento e ações." access="Admin"
        funcionalidades={[
          "Hero Header com total de propostas e botão Nova Proposta",
          "ProposalMetrics: dashboard com 6 métricas (total, rascunho, enviadas, aceitas, recusadas, expiradas)",
          "Filtros: busca texto + filtro de status",
          "Tabela com 8 colunas: Número, Empresa, Modelo, CNPJ, Status, Timeline, Validade, Ações",
          "Ações por proposta: Simular Rentabilidade ($), Ver Detalhes (👁), Editar Rascunho (✏), Criar Nova Versão (🔀), Ver Proposta Pública (🔗), Copiar, Nova com Taxas, Histórico, Excluir",
          "Versionamento: cada proposta pode ter múltiplas versões (V1, V2, V3...) com lineage tracking",
          "Alerta visual de propostas próximas da expiração (≤3 dias)",
          "RentabilidadeDrawer: painel lateral para simular rentabilidade da proposta com TPV × taxas",
          "ProposalHistoryModal: modal com histórico completo de versões da proposta"
        ]}
        subAbas={[
          "Lista de Propostas: tabela principal com todos filtros e ações",
          "Propostas por Empresa: agrupamento visual de propostas por empresa/CNPJ"
        ]}
      />

      <PageDetail name="Criar Proposta" description="Editor completo de proposta comercial com taxas por bandeira, antecipação e prévia em tempo real." access="Admin"
        funcionalidades={[
          "Header fixo com botões Salvar Rascunho e Gerar Proposta",
          "Seção Dados do Cliente: Nome empresa, CNPJ, MCC, Contato, Tipo de Negócio (Merchant/Gateway/Marketplace)",
          "Seletor de Parceiro: escolha do parceiro adquirente com limites automáticos de taxas",
          "Card Taxas de Cartão: 5 bandeiras (Visa, Master, Elo, Amex, Outras) × 4 faixas (1x, 2-6x, 7-12x, 13-21x), com sync-all e copiar-para-todas",
          "Card Antecipação: taxa RAV, prazo recebimento (D+1 a Fluxo), switch usa antecipação, % do TPV antecipado",
          "Card Outras Taxas: PIX (% ou R$ fixo), Boleto, Fee Transação, Antifraude, Alerta Pré-Chargeback, 3DS, Setup, TPV Mínimo (3 meses)",
          "Painel Preview em tempo real: visualização da proposta como o cliente verá, com troca de bandeira",
          "Auto-preenchimento via URL params: ?lead=ID preenche dados do lead, ?edit=ID edita rascunho, ?templateFromId=ID usa taxas de outra proposta",
          "Validação de limites de taxa vs. custo do parceiro com alertas visuais",
          "Pode usar taxas sugeridas pela PRISCILA (se disponíveis)"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Propostas Padrão (GestaoPropostasPadrao)" description="Central de modelos de proposta com taxas fixas por segmento, links rápidos e gestão completa." access="Admin"
        funcionalidades={[
          "SEÇÃO LINKS RÁPIDOS POR SEGMENTO (topo da página): 6 cards com botão 'Copiar Link' e 'Abrir Proposta' para cada segmento — E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace",
          "Cada card identifica automaticamente a proposta padrão ativa (isDefaultForSegment=true) de cada segmento e gera o link público",
          "Se não houver proposta ativa para um segmento, exibe 'Nenhuma proposta ativa'",
          "6 propostas padrão pré-criadas no sistema, uma por segmento, com taxas oficiais Pagsmile e tokens públicos prontos para uso",
          "Hero Header com total de propostas e botão 'Nova Proposta Padrão'",
          "Filtros: busca por nome/código/segmento + filtro de status (Rascunho, Ativa, Inativa) + filtro de segmento",
          "Tabela com 7 colunas: Código, Nome, Segmento, Modelo (Merchant/Gateway/Marketplace), Status, Criada, Ações",
          "Ações por proposta: Ver Detalhes, Editar, Copiar Link Público (se ativa), Excluir com confirmação",
          "Lista de propostas padrão com status (Rascunho, Ativa, Inativa)",
          "Criar Nova (CriarPropostaPadrao): formulário com Dados da Empresa (Nome, CNPJ, Contato, Telefone, E-mail) + Dados da Proposta (Nome, Segmento, Descrição)",
          "Segmentos disponíveis: Educação, Infoprodutos, E-commerce, SaaS, Gateway, Marketplace",
          "Auto-preenchimento de taxas: ao selecionar segmento, todas as taxas são preenchidas automaticamente com valores padrão (MDR por bandeira, PIX, Boleto R$2,99, Setup R$5.000, Alerta Pré-Chargeback R$55)",
          "Parceiro adquirente é selecionado apenas para simulação de rentabilidade — NÃO aparece na proposta pública",
          "Link público exclusivo para compartilhamento com cliente",
          "Proposta Pública (PropostaPadraoPublica): Hero premium com logo Pagsmile + badge segmento, taxas por bandeira (TaxasPorBandeiraPublic), PIX, Boleto, Fees, Antecipação, TPV Mínimo, Tabela de Parcelas por Bandeira (ParcelasTableDetalhada) com simulador, CTA para questionário personalizado, Export Buttons (PDF/Print)"
        ]}
        subAbas={[
          "Links Rápidos por Segmento: seção de cards no topo com 'Copiar Link' instantâneo por segmento",
          "Tabela de Propostas: listagem completa com filtros, busca e ações"
        ]}
      />

      <PageDetail name="Propostas PIX (GestaoPropostasPix)" description="Gestão completa de propostas exclusivas para pagamentos via PIX, com versionamento, duplicação e KPIs." access="Admin"
        funcionalidades={[
          "Hero Header com total de propostas e botão 'Nova Proposta PIX'",
          "4 KPIs: Total, Ativas (enviadas/visualizadas), Aceitas, Recusadas",
          "Filtros: busca por número/empresa/CNPJ + filtro de status (7 status: Rascunho, Enviada, Visualizada, Contraproposta, Aceita, Recusada, Expirada)",
          "Tabela com 8 colunas: Número (com badge de versão), Empresa, CNPJ, Taxa PIX (badge com valor), Status, Timeline (aceite/recusa/criação), Validade (com alerta ≤3 dias), Ações",
          "Ações por proposta: Ver Detalhes (PropostaPixDetalhes), Editar (rascunho), Nova Versão (V2, V3...), Copiar Link, Duplicar, Excluir",
          "Versionamento: nova versão preserva dados e marca versão anterior como não-atual (isCurrentVersion=false)",
          "Duplicação: cria cópia independente como rascunho com novo código e token",
          "Alerta visual de propostas próximas da expiração (≤3 dias)",
          "Criar Nova (CriarPropostaPix): formulário dark com Dados do Cliente (Nome, CNPJ, MCC, Contato) + Taxa PIX (tipo: percentual % ou fixo R$, valor) + TPV Mínimo Garantido (3 meses) + Card de resumo em tempo real",
          "Seleção rápida de lead existente: botões com os últimos 6 leads para preencher dados automaticamente",
          "Validação obrigatória: nome, CNPJ (14 dígitos) e valor da taxa PIX",
          "Proposta Pública PIX (PropostaPixPublica): página pública com taxa PIX, TPV mínimo e CTA para questionário"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Introducers (GestaoIntroducers)" description="Gestão completa de parceiros de indicação (Introducers)." access="Admin"
        funcionalidades={[
          "KPIs: Total Introducers, Leads Gerados, Taxa de Conversão, Receita Potencial",
          "Tabela com filtros: busca, status (ativo/inativo)",
          "Cada Introducer tem: Nome, Tipo (Individual/Empresa), CPF/CNPJ, Código UTM, E-mail, Telefone, Comissão %, Landing Page",
          "Empresas podem ter: Logo, Nome Fantasia, Slug para Landing Page personalizada (/parceiro/slug), Taxas padrão por segmento",
          "Landing Page do Introducer: página pública co-branded com logo do parceiro + tabela de taxas por segmento + questionário integrado",
          "Modal de criação/edição completo com validação de código UTM e slug únicos",
          "Vinculação automática de leads ao Introducer via referralCode na URL"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Landing Pages de Parceiros (GestaoLandingPages)" description="Página dedicada à gestão visual de Landing Pages personalizadas para parceiros empresa." access="Admin"
        funcionalidades={[
          "4 KPIs: Total Landing Pages, Ativas, Inativas, Leads Gerados (soma de todas)",
          "Busca por nome do parceiro ou slug da landing page",
          "Tabela com 6 colunas: Parceiro (logo + nome + código UTM), URL da Landing Page (/parceiro/slug com botão copiar), Segmentos configurados, Status (Ativa/Inativa com toggle), Leads gerados, Ações",
          "Filtro automático: exibe apenas Introducers do tipo 'company' (empresas com landing page configurável)",
          "Toggle de ativação/desativação da landing page diretamente na tabela (landingPageActive)",
          "Botão Copiar Link: copia URL pública /parceiro/{slug} para clipboard",
          "Botão Visualizar: abre a landing page em nova aba para preview",
          "Botão Editar: abre modal IntroducerFormModal para editar dados do parceiro, logo, slug, taxas por segmento",
          "Botão Nova Landing Page: abre modal para criar novo Introducer empresa com landing page",
          "Contagem de leads gerados por parceiro via cruzamento introducerId/referralCode"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionário Reunião" description="Formulário interno para o time comercial registrar informações coletadas em reuniões." access="Admin"
        funcionalidades={[
          "Formulário completo com: dados da empresa, tipo de negócio, volume transacional, desafios, taxas atuais do cliente",
          "Preencher antes/depois de reunião presencial ou remota",
          "Dados salvos na entidade InternalCommercialQuestionnaire"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionário Reunião PIX (QuestionarioReuniaoPix)" description="Variante do questionário de reunião focada exclusivamente em clientes interessados em PIX." access="Admin"
        funcionalidades={[
          "Formulário simplificado focado em dados relevantes para PIX",
          "Dados da empresa, volume PIX mensal, taxa PIX desejada, concorrentes atuais",
          "Ideal para reuniões onde o foco é exclusivamente pagamentos via PIX",
          "Dados salvos e acessíveis na aba 'Reunião PIX' da página Questionários Recebidos"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionário com Robô (ProcessMeetingNotes)" description="IA que transforma notas de reunião em dados estruturados de lead." access="Admin"
        funcionalidades={[
          "Área de texto livre para colar anotações, transcrições, e-mails ou mensagens de reunião",
          "Aceita texto desestruturado, informal, com abreviações — a IA entende o contexto",
          "Backend function processMeetingNotes() usa InvokeLLM com response_json_schema para extrair dados",
          "Dados extraídos: nome empresa, CNPJ, contato, e-mail, telefone, tipo de negócio, TPV, ticket médio, taxas atuais (MDR, PIX, boleto), antecipação, provedor antifraude, desafios, timeline, notas",
          "Resultado é pré-preenchido no formulário do QuestionarioReuniao com status 'ai_preenchido'",
          "Comercial revisa, corrige e complementa antes de salvar",
          "Ao salvar: cria InternalCommercialQuestionnaire (origemIA=true) + Lead vinculado",
          "Aparece na aba 'Questionário com Robô' da página Questionários Recebidos com badge 🤖"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Detalhes do Lead (LeadDetails)" description="Página de detalhe completo de um lead individual com 7 abas internas, scores de IA e histórico." access="Admin"
        funcionalidades={[
          "Header com: nome/razão social do lead, badge de status (11 possíveis), badge tipo de negócio (Merchant/Gateway/Marketplace), protocolo, indicador SLA",
          "Seletor de status: permite alterar status do lead manualmente (cria LeadActivity + AuditLog)",
          "Quick Actions Bar (LeadQuickActions): botões rápidos para ações mais comuns (contato, proposta, compliance)",
          "7 abas internas organizadas por contexto de análise"
        ]}
        subAbas={[
          "Visão Geral: 3 cards — Dados da Empresa (nome, razão social, CNPJ, MCC, website), Contato (nome, cargo, e-mail, telefone), Score & Financeiro (score PRISCILA com coloração, TPV mensal, ticket médio, expectativa crescimento) + campo de adicionar notas/comentários com histórico",
          "Análise de Risco IA (IARiskPanel): iaRiskScore (0-100), iaDecision (AUTO_APROVAR/REVISAO_MANUAL/REJEITAR), iaPriority (URGENTE/ALTA/MEDIA/BAIXA), iaSuggestions[] para o time comercial, iaAnalysisReport completo, botão para disparar nova análise",
          "Lead Qualifier (LeadQualifierPanel): leadQualifierScore (0-100), leadQualifierLevel (EXCELENTE→INSUFICIENTE), leadQualifierReport com análise detalhada de maturidade do negócio, data da última análise, botão para re-analisar",
          "PRISCILA (PriscilaPanel): priscilaQualityScore (0-100), priscilaRiskLevel (BAIXO/MEDIO/ALTO/CRITICO), priscilaDecisionPath (AUTO_APROVAR/COM_FLAG/REVISAO/REJEITAR), priscilaAnalysisReport completo com análise de cada dimensão, botão para re-analisar",
          "Questionário: exibição de todas as respostas do questionnaireData do lead — organizado por campo, com seção separada para documentos enviados (com botões Visualizar e Baixar)",
          "Propostas (LeadProposals): lista de todas as propostas vinculadas ao lead (Proposal + PixProposal) com status, código, data, link para detalhes",
          "Histórico: timeline cronológica de todas as LeadActivity do lead — cada registro mostra: descrição, tipo de atividade (badge), data/hora, quem realizou"
        ]}
      />

      {/* ═══════ COMPLIANCE ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">🛡️ Compliance</h3>

      <PageDetail name="Dashboard de Compliance" description="Dashboard executivo com 20+ KPIs, gráficos e tabela de casos." access="Admin"
        funcionalidades={[
          "Hero Header com botões Atualizar e Gerar Link",
          "KPIs Row 1: Total Submissões, Aprovadas (Helena), Em Análise Manual, Reprovadas (Helena)",
          "KPIs Row 2: Tempo de Conclusão, Taxa de Conversão, Taxa de Rejeição, Aprovação Auto IA",
          "Quick Metrics: Tempo IA, Tempo Manual, Score Médio, Docs Pendentes",
          "Compliance Scores Overview (SENTINEL): médias SQ, SVE, SGC",
          "Actionable Insights: alertas de ações necessárias (revisão manual, docs pendentes, revalidações atrasadas)",
          "Helena Insights & Alertas: alertas inteligentes sobre tendências e anomalias",
          "Gráfico Funil de Conversão: Submissões → Análise IA → Aprovadas → Manual → Final",
          "Gráfico Pizza Helena: distribuição de decisões (Aprovado/Manual/Recusado)",
          "Gráfico Tendência: IA vs Manual nos últimos 6 meses",
          "Top Causas de Reprovação: ranking de red flags mais frequentes",
          "Distribuição de Scores: histograma por faixa (0-199, 200-399, 400-649, 650-849, 850-1000)",
          "Pipeline de Vendas: resumo integrado do funil comercial",
          "Distribuição de Risco: cards Baixo/Médio/Alto/Crítico",
          "Tabela de Casos com 6 tabs por status + busca + filtros (Tipo PF/PJ, Período) + 7 colunas ordenáveis"
        ]}
        subAbas={[
          "Todos: lista completa de casos",
          "Pendentes: casos aguardando análise",
          "Processando: casos em análise pela IA",
          "Manual: casos encaminhados para revisão humana",
          "Aprovados: casos aprovados",
          "Recusados: casos reprovados"
        ]}
      />

      <PageDetail name="Links de Compliance" description="Geração e gestão de links para questionários de compliance (KYC/KYB)." access="Admin"
        funcionalidades={[
          "Quick links por tipo de compliance: PIX, Full KYC, Lite, E-commerce, SaaS, Genérico",
          "Quick links por template especializado: Merchant, Gateway, Marketplace",
          "Geração de link rastreável com uniqueCode + template + agente comercial + UTMs",
          "Métricas por link: cliques, submissões, conversões, taxa",
          "Dashboard de analytics por link individual",
          "Histórico completo com filtros e busca"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionários Recebidos (Compliance)" description="Lista de todos os casos de compliance submetidos com filtros avançados e navegação para análise." access="Admin"
        funcionalidades={[
          "Tabela de OnboardingCases com filtros de status, período, tipo merchant (PF/PJ)",
          "6 tabs de status: Todos, Pendentes, Processando, Manual, Aprovados, Recusados",
          "Busca por nome, CPF/CNPJ, e-mail do merchant",
          "Cada linha mostra: merchant, score, status, prioridade, analista atribuído, data",
          "Navegação para AnaliseDeCasos para análise detalhada de cada caso"
        ]}
        subAbas={[
          "Todos: lista completa de casos sem filtro",
          "Pendentes: aguardando processamento pela IA",
          "Processando: IA SENTINEL analisando",
          "Manual: encaminhados para revisão humana",
          "Aprovados: casos aprovados (auto ou manual)",
          "Recusados: casos reprovados"
        ]}
      />

      <PageDetail name="Análise de Caso (AnaliseDeCasos)" description="Página de análise detalhada de um caso de compliance com 7 abas, painel IA SENTINEL e ações de aprovação/rejeição." access="Admin"
        funcionalidades={[
          "Header (CaseHeader): nome merchant, CNPJ, status com badge colorido, prioridade, analista atribuído, SLA",
          "Summary Cards (CaseSummaryCards): 4 cards com score SENTINEL, status IA, tempo de processamento, documentos",
          "Botões de ação (CaseReviewDialogs): Aprovar (muda status + AuditLog + Merchant), Recusar com motivo, Solicitar Docs Adicionais",
          "7 abas internas para análise microscópica de cada dimensão do caso",
          "Feedback na decisão IA: analista pode marcar 'concordo' ou 'discordo' para treinar modelo"
        ]}
        subAbas={[
          "Resumo (CaseReviewTab): visão geral do caso com CnpjEnrichmentSummaryCard (dados do CNPJ enriquecido), score SENTINEL 3 fases, recomendação final, sumário executivo, pontos positivos e negativos",
          "Merchant (CaseMerchantTab): dados completos do Merchant — tipo PF/PJ, CNPJ, nome, e-mail, telefone, status onboarding, score risco, serviços solicitados (Pix/Cartão)",
          "Respostas (ComplianceResponsesPanel): todas as respostas do questionário organizadas por seção, com ResponseCard para cada resposta — mostra pergunta, resposta, tipo, seção",
          "Documentos (CaseDocumentsTab): lista de DocumentUploads vinculados ao caso — para cada documento: nome, tipo, status validação (Pendente/Validado/Rejeitado), botão visualizar (DocumentViewerModal), botão aprovar/rejeitar com notas",
          "Painel IA (IAAnalysisPanel): ComplianceScore completo — score_questionario, score_validacao_externa, bonus_consistencia, score_geral_composto, classificação, recomendação. Sumário executivo, pontos positivos[], pontos de atenção[], red_flags[]. ComplianceFindings detalhados com severidade. QualityAssessment com scores 1-5. Nível de confiança da IA",
          "Validações Externas (CaseValidationsTab): ExternalValidationResult[] — cada resultado CAF/BigDataCorp com: provedor, tipo validação, score, status, dados completos (resultData JSON expansível), timestamp",
          "Histórico (CaseHistoryTab): timeline AuditLog filtrada por entidade/ID do caso — todas ações realizadas, por quem, quando, com detalhes"
        ]}
      />

      <PageDetail name="Gestão de Documentos" description="Validação e gestão de documentos enviados por merchants durante onboarding." access="Admin"
        funcionalidades={[
          "Lista de DocumentUploads por caso/merchant",
          "Validação manual: Pendente → Validado / Rejeitado",
          "Visualizador de documentos",
          "Notas de validação"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Revalidação" description="Ciclo de recertificação periódica de merchants aprovados." access="Admin"
        funcionalidades={[
          "Lista de agendamentos de revalidação (RevalidationSchedule)",
          "Tipos: periódica, baseada em risco, regulatória, manual",
          "Frequências: mensal, trimestral, semestral, anual",
          "Alertas de revalidações atrasadas",
          "Criação de novo agendamento vinculado a um merchant"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Links Subcontas" description="Gestão de links para onboarding de sub-sellers (subcontas)." access="Admin"
        funcionalidades={[
          "Geração de links para subsellers vinculados a um seller principal",
          "Cada subseller segue fluxo de onboarding próprio com referência ao parentMerchantId",
          "Tabela de links gerados com métricas"
        ]}
        subAbas={[]}
      />

      {/* ═══════ CONTRATOS ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">📝 Contratos</h3>

      <PageDetail name="Gestão de Contratos" description="Lista e gestão de contratos pré-gerados e finalizados." access="Admin"
        funcionalidades={[
          "6 cards de status: Total, Pré-gerados, Em Revisão, Prontos, Enviados, Assinados",
          "Filtros: busca por nome/CNPJ/código + filtro de status",
          "Cards de contrato com: nome cliente, código, status, campos pendentes/preenchidos",
          "Clique para abrir o Editor de Contrato"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Criar Contrato" description="Editor de contrato com formulário completo e pré-preenchimento por IA." access="Admin"
        funcionalidades={[
          "Pré-geração por IA: a partir do Lead + Proposta, a IA preenche todos os campos possíveis automaticamente",
          "Seções: Dados do Cliente, Módulos Contratados, Preços, SLAs, Assinatura, Cláusulas Customizadas",
          "Módulos: Conta Pagamento, Sub-adquirência Cartão, PIX Recebimentos, PIX Pagamentos, Boleto, Gateway",
          "Taxas do contrato herdam da proposta aceita",
          "Contrato Público: link para visualização/assinatura pelo cliente"
        ]}
        subAbas={[
          "ClienteForm: dados do contratante (nome, CNPJ, endereço, representante legal)",
          "ModulosForm: seleção de módulos contratados",
          "PrecosForm: taxas de cartão, PIX, boleto, fees, antecipação, TPV mínimo",
          "SLAsForm: SLA de disponibilidade, suporte, reserva de risco",
          "AssinaturaForm: dados do representante Pagsmile, testemunhas, datas"
        ]}
      />

      {/* ═══════ FERRAMENTAS ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">🔧 Ferramentas</h3>

      <PageDetail name="Gerar Link" description="Geração de link de onboarding com configuração detalhada." access="Admin"
        funcionalidades={[
          "Seleção de tipo de compliance e template",
          "Configuração de UTMs e agente comercial",
          "Preview do link antes de gerar"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Templates" description="Gestão de templates de questionários de compliance." access="Admin"
        funcionalidades={[
          "Lista de QuestionnaireTemplates com filtros por categoria (Lead/Compliance) e subCategory",
          "Editor de questionário: drag-and-drop de perguntas, lógica condicional, risk weights, validações",
          "Biblioteca de perguntas reutilizáveis",
          "Sugestão de perguntas por IA (suggestQuestionsAI)",
          "Versionamento de templates com histórico",
          "Documentos requeridos configuráveis por template"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Templates de Mensagem" description="Modelos de mensagens para comunicação com leads e merchants." access="Admin"
        funcionalidades={[
          "Criação de templates de e-mail/mensagem",
          "Variáveis dinâmicas (nome, empresa, protocolo)",
          "Templates para follow-up, boas-vindas, aprovação, recusa"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Regras & Workflows" description="Motor de regras de compliance para automação de decisões." access="Admin"
        funcionalidades={[
          "Criação de ComplianceRules com condições, operadores e ações",
          "Tipos: auto_approve, auto_reject, flag, escalate, notify, assign",
          "Prioridade numérica para resolução de conflitos",
          "Simulação de regra (simulateComplianceRule) antes de ativar",
          "Histórico de execuções por regra"
        ]}
        subAbas={[]}
      />

      {/* ═══════ INTEGRAÇÕES ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">🔌 Integrações</h3>

      <PageDetail name="CAF & BigDataCorp" description="Configuração e monitoramento de integrações externas de validação." access="Admin"
        funcionalidades={[
          "IntegrationConfig: configuração de provedor, ambiente (sandbox/production), URLs, webhook, serviços habilitados",
          "CAF: Liveness, Facematch, Face Auth, Document OCR, Documentoscopy, Onboarding Web",
          "BigDataCorp: Dados Empresa, KYC Empresa/Sócios, Relacionamentos, Indicadores, MCC",
          "Teste de conexão por provedor",
          "Logs de integração (IntegrationLog) com request/response/score/duração"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Helena IA" description="Dashboard e configuração da IA SENTINEL para análise de compliance." access="Admin"
        funcionalidades={[
          "Dashboard com métricas da Helena: total de análises, taxa de acerto, tempo médio",
          "Feedback loop: analistas podem concordar/discordar das decisões da IA",
          "Configuração da PriscilaConfig para lead analysis"
        ]}
        subAbas={[]}
      />

      {/* ═══════ ADMINISTRAÇÃO ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">⚙️ Administração</h3>

      <PageDetail name="Configurações" description="Configurações gerais do sistema." access="Admin"
        funcionalidades={[
          "Configurações de conta e perfil",
          "Gestão de usuários admin",
          "Configurações de notificação"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Auditoria" description="Logs completos de todas as ações realizadas no sistema com rastreabilidade 100%." access="Admin"
        funcionalidades={[
          "Tabela de AuditLog com: entidade, ID, tipo ação (CREATE/UPDATE/DELETE/VIEW/APPROVAL/REJECTION/VALIDATION), quem, quando, detalhes",
          "Filtros por entidade (Lead, Proposal, Contract, OnboardingCase, etc.), tipo de ação, período",
          "Rastreabilidade 100% de todas as operações — quem fez o quê e quando",
          "Detalhes JSON expansíveis para ver exatamente o que mudou",
          "Paginação para histórico longo",
          "Base para evidência regulatória em caso de auditoria externa (BACEN, PLD/FT)"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Dados & Insights (DadosInsights)" description="Central premium de inteligência de negócio com 17 abas analíticas em 5 grupos. Cruza dados de todas as entidades para gerar métricas, gráficos e insights acionáveis." access="Admin"
        funcionalidades={[
          "Header premium com 5 contadores (Leads, Propostas, Compliance, Merchants, Parceiros) em tempo real",
          "Navegação por 5 grupos de abas: Inteligência (1), Volume & Taxas (6), Comercial (3), Perfil & Risco (5), Parceiros (1)",
          "Consulta 9 entidades simultaneamente: Lead, Proposal, PixProposal, OnboardingCase, ComplianceScore, Merchant, DocumentUpload, QuestionnaireResponse, Partner",
          "17 abas analíticas com métricas, gráficos (Recharts) e insights por dimensão"
        ]}
        subAbas={[
          "🧠 Insights IA (InsightsAISection): IA analisa todos os dados e gera narrativas automáticas sobre tendências, anomalias e oportunidades de ação",
          "💰 TPV & Volume (InsightsTPVSection): TPV total/médio/mediano, histograma por faixa, distribuição por tipo de negócio, evolução temporal",
          "⚔️ Benchmark (InsightsBenchmarkSection): taxas esperadas pelos leads vs taxas oferecidas nas propostas, gap de preço, posição competitiva",
          "📊 Mix (InsightsMixSection): distribuição de métodos de pagamento preferidos (PIX, Crédito, Débito, Boleto) por segmento",
          "📈 Taxas Esperadas (InsightsRatesSection): MDR/PIX/boleto/antecipação que leads declaram pagar atualmente — pressão de preço do mercado",
          "💳 Taxas Propostas (InsightsProposalRatesSection): taxas efetivamente oferecidas nas propostas — heatmap bandeira × faixa, evolução temporal",
          "💰 Rentabilidade (InsightsProfitabilitySection): receita MDR estimada vs custo parceiro, margem bruta, ranking por proposta, propostas com margem negativa",
          "⏱️ Performance Comercial (InsightsCommercialPerfSection): tempo médio lead→proposta, proposta→aceite, taxa conversão, produtividade por vendedor",
          "📈 Funil (InsightsFunnelSection): funil de conversão completo com taxas entre cada estágio, volume por coluna, drop-off analysis",
          "👥 Introducers (InsightsIntroducerSection): leads por parceiro, conversão por Introducer, TPV gerado, receita estimada, ROI por canal",
          "👤 Perfil de Leads (InsightsLeadProfileSection): segmentação por tipo negócio, MCC, região, score, perfil do lead ideal",
          "🏢 Operacional (InsightsOperationalSection): volume mensal de leads e casos, tempo processamento, capacidade operacional",
          "🛡️ Risco (InsightsRiskPortfolioSection): distribuição de risco BAIXO/MÉDIO/ALTO/CRÍTICO, score médio carteira, concentração, histograma SENTINEL",
          "✅ Compliance (InsightsComplianceSection): taxa aprovação auto, revisão manual, docs por caso, respostas por caso, funil compliance",
          "📊 Saúde dos Dados (InsightsDataHealthSection): % completude por campo (e-mail, CNPJ, TPV, etc.), impacto na qualificação",
          "🤝 Parceiros (InsightsPartnerSection): propostas por parceiro adquirente, custo médio, margem, parceiro mais competitivo por MCC"
        ]}
      />

      <PageDetail name="Parceiros — Adquirentes (ConfiguracaoParceiros)" description="Página dedicada à gestão de parceiros adquirentes/subadquirentes e suas taxas de custo por MCC." access="Admin"
        funcionalidades={[
          "Lista de Partners com cards expandíveis",
          "Cada parceiro tem: Nome, Modelo de Precificação, Parcelas Máx, Fee Transação, Antifraude, 3DS, Antecipação, Notas",
          "Flag 'Principal': parceiro usado como base para cálculo de taxas e limites",
          "Tabela MDR por MCC: cada parceiro pode ter taxas diferenciadas por MCC (código de categoria do merchant)",
          "Cada MCC tem taxas por bandeira (Visa, Master, Elo, Amex, Outras) × 5 faixas (Débito, 1x, 2-6x, 7-12x, 13-24x)",
          "Limites de taxas são usados para validação na criação de propostas — alertas visuais quando taxa está abaixo do custo",
          "Criar/Editar/Excluir parceiro com formulário completo",
          "Acessível diretamente pelo sidebar como item standalone 'Parceiros'"
        ]}
        subAbas={[]}
      />

      {/* ═══════ PÁGINAS PÚBLICAS ═══════ */}
      <h3 className="text-base font-bold text-[#002443] border-b border-slate-200 pb-2 mt-8">🌐 Páginas Públicas (Cliente)</h3>

      <PageDetail name="Proposta Pública" description="Página de visualização da proposta comercial pelo cliente." access="Público"
        funcionalidades={[
          "Acesso via token único na URL (?token=xxx)",
          "Registro automático de visualização (status → 'visualizada') + notificação Slack",
          "Exibição completa: taxas por bandeira, PIX, boleto, fees, antecipação, TPV mínimo, tabela de parcelas",
          "Botões: Aceitar, Contraproposta, Recusar",
          "Aceite: muda status, cria atividade, inicia fluxo de compliance",
          "Contraproposta: modal para o cliente propor alterações",
          "Recusa: modal para informar motivo"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Contrato Público" description="Visualização do contrato pelo cliente para assinatura digital." access="Público"
        funcionalidades={[
          "Contrato completo renderizado em formato legal com todas as cláusulas",
          "Dados do cliente, módulos, taxas, SLAs, reservas de risco",
          "Assinatura digital via aceite"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Lead Questionnaire" description="Questionário público de qualificação comercial para novos leads." access="Público"
        funcionalidades={[
          "Formulário multi-step com seções: Dados Empresa, Tipo Negócio, Volume, Taxas Atuais, Contato",
          "Autocomplete CNPJ via API Brasil (versão v2.0 preenche 14 campos automaticamente)",
          "Validação de e-mail, telefone, CPF/CNPJ em tempo real",
          "Cria Lead + LeadActivity + dispara análise PRISCILA automaticamente"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Compliance Onboarding" description="Fluxos de compliance público para merchants (9 variantes)." access="Público"
        funcionalidades={[
          "ComplianceOnboardingStart: página inicial que direciona para o fluxo correto baseado no tipo",
          "9 variantes: PIX, Full KYC, Lite, E-commerce, SaaS, Merchant, Gateway, Marketplace, Genérico",
          "Questionário dinâmico multi-step com auto-save (DynamicQuestionnaire)",
          "Upload de documentos obrigatórios (DynamicDocumentUploadPage)",
          "Verificação biométrica (Liveness + Facematch)",
          "ComplianceResume: permite retomar sessão usando token salvo"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Introducer Landing Page" description="Landing page co-branded para parceiros de indicação." access="Público"
        funcionalidades={[
          "Acesso via /parceiro/:slug (ex: /parceiro/meu-parceiro)",
          "Header com logo do parceiro + logo Pagsmile",
          "Tabela de taxas por segmento configurada pelo Introducer (SegmentRatesTable)",
          "Calculadora de taxas interativa (RateCalculator): simula custo de transação cartão e PIX com antecipação",
          "Disclaimer de compliance (ComplianceDisclaimer)",
          "Questionário integrado para captação de lead vinculado ao Introducer via referralCode"
        ]}
        subAbas={[
          "Tabela de Taxas: exibição por segmento com MDR por faixa, PIX, fees",
          "Calculadora: simulação interativa com valor, parcelas e prazo"
        ]}
      />

      <PageDetail name="Proposta Padrão Pública (PropostaPadraoPublica)" description="Página pública de visualização da proposta padrão por segmento — sem dados de cliente, apenas taxas." access="Público"
        funcionalidades={[
          "Acesso via token único na URL (?token=xxx)",
          "Hero Header premium com logo Pagsmile, badge do segmento e título 'Condições Comerciais'",
          "Dados da empresa exibidos apenas se preenchidos (seção condicional)",
          "Cards de Segmento e Informações com disclaimers de compliance",
          "Taxas de Cartão de Crédito por bandeira (TaxasPorBandeiraPublic): Visa, Mastercard, Elo, Amex, Outras × 4 faixas",
          "Cards de outros métodos: PIX (% ou fixo), Boleto, Fee Transação, Antifraude, 3DS, Alerta Pré-Chargeback, Setup",
          "Cards de Prazo de Recebimento e Taxa de Antecipação",
          "Tabela de Parcelas por Bandeira (ParcelasTableDetalhada) com simulador de valor líquido",
          "TPV Mínimo Garantido (3 meses) exibido se configurado",
          "CTA 'Quer uma proposta personalizada?': botão que direciona para questionário de lead",
          "Export Buttons: exportação para impressão/PDF",
          "Footer com código da proposta e disclaimer regulatório"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Proposta PIX Pública (PropostaPixPublica)" description="Página pública de visualização da proposta PIX pelo cliente." access="Público"
        funcionalidades={[
          "Acesso via token único na URL (?token=xxx)",
          "Exibe taxa PIX (percentual ou fixa), TPV Mínimo Garantido e dados do cliente",
          "Botões: Aceitar, Contraproposta, Recusar",
          "CTA para questionário personalizado"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionário Lead PIX (LeadQuestionnairePix)" description="Questionário público simplificado focado em clientes interessados em PIX." access="Público"
        funcionalidades={[
          "Formulário multi-step focado em dados para PIX",
          "Dados da empresa, volume PIX, expectativa de taxas",
          "Cria Lead com businessSubCategory e foco em PIX automaticamente"
        ]}
        subAbas={[]}
      />

      <PageDetail name="Questionário de Subseller (SubsellerQuestionnaire)" description="Questionário público para onboarding de subcontas/subsellers vinculados a um seller principal." access="Público"
        funcionalidades={[
          "Formulário público para preenchimento por subsellers",
          "Vinculação ao seller principal (parentMerchantId) via parâmetro na URL",
          "Coleta dados específicos de subseller para compliance",
          "Cria Merchant com isSubseller=true e OnboardingCase vinculado"
        ]}
        subAbas={[]}
      />

      <PageDetail name="ComplianceResume" description="Página pública que permite ao merchant retomar uma sessão de compliance de onde parou." access="Público"
        funcionalidades={[
          "Merchant insere o token da sessão anterior (ComplianceSession.sessionToken)",
          "Sistema localiza a sessão ativa e redireciona para a fase/step correto",
          "Suporta retomada tanto da fase de questionário quanto da fase de documentos",
          "Exibe mensagem de erro se sessão não encontrada ou expirada"
        ]}
        subAbas={[]}
      />
    </div>
  );
}