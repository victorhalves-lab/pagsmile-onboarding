import React from 'react';
import { CircleDot, ArrowRight, ArrowDown, CheckCircle2, XCircle, AlertTriangle, GitBranch, Zap, Brain, FileText, Link as LinkIcon, Users, BarChart3, ClipboardList, Send, Eye, Copy, Trash2, DollarSign, Pencil, Building2, Search, Filter, Download, Bot, Phone, MessageSquareText, UserPlus, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const FlowStep = ({ icon: Icon, text, color = '#1356E2', arrow = true }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-[#0A0A0A] shadow-sm">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <span>{text}</span>
    </div>
    {arrow && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
  </div>
);

const FlowDecision = ({ text }) => (
  <div className="flex items-center gap-2">
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-700">
      ⟐ {text}
    </div>
    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
  </div>
);

const PageDoc = ({ name, route, description, purpose, access, funcionalidades, subAbas, fluxo, entidadesAfetadas }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
    {/* Header */}
    <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003a66] p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-bold text-sm">{name}</h4>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 text-white/80 border-0 text-[10px] font-mono">{route}</Badge>
          <Badge className="bg-[#1356E2]/20 text-[#E84B1C] border-0 text-[10px]">{access}</Badge>
        </div>
      </div>
      <p className="text-white/60 text-xs mt-1">{description}</p>
    </div>

    <div className="p-4 space-y-4">
      {/* O que é e para que serve */}
      <div>
        <h5 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">🎯 Para que serve</h5>
        <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">{purpose}</p>
      </div>

      {/* Funcionalidades microscópicas */}
      <div>
        <h5 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">⚙️ Funcionalidades ({funcionalidades.length})</h5>
        <ul className="space-y-1">
          {funcionalidades.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#0A0A0A]/70">
              <CircleDot className="w-2.5 h-2.5 text-[#1356E2] mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sub-abas */}
      {subAbas && subAbas.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">📑 Sub-abas / Seções Internas ({subAbas.length})</h5>
          <div className="space-y-1.5">
            {subAbas.map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <p className="text-[11px] text-[#0A0A0A]/80">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fluxograma */}
      {fluxo && fluxo.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">🔀 Fluxograma — O que dá para fazer</h5>
          <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-200 space-y-3">
            {fluxo.map((f, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-bold text-[#0A0A0A]/50 uppercase">{f.titulo}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {f.steps.map((s, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                        s.type === 'action' ? 'bg-[#1356E2]/10 text-[#1356E2] border-[#1356E2]/20' :
                        s.type === 'decision' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        s.type === 'result' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        s.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {s.text}
                      </div>
                      {j < f.steps.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entidades afetadas */}
      {entidadesAfetadas && entidadesAfetadas.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">🗄️ Entidades Afetadas</h5>
          <div className="flex flex-wrap gap-1">
            {entidadesAfetadas.map((e, i) => (
              <Badge key={i} className="bg-[#0A0A0A] text-white font-mono text-[9px] border-0">{e}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default function LeadsPropostasSection() {
  return (
    <div className="space-y-6">
      {/* Visão Geral do Módulo */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Módulo de Leads & Propostas — Catálogo Microscópico de Páginas</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Documentação completa, página por página, de todo o módulo comercial. Cada página tem: descrição, propósito, funcionalidades microscópicas, sub-abas, fluxogramas de ações e entidades afetadas.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className="bg-white/10 text-white/80 border-0">17 Páginas</Badge>
          <Badge className="bg-[#1356E2]/20 text-[#E84B1C] border-0">9 Entidades</Badge>
          <Badge className="bg-blue-500/20 text-blue-200 border-0">3 Tipos de Proposta</Badge>
        </div>
      </div>

      {/* ═══════ PÁGINA 1: Links de Questionários ═══════ */}
      <PageDoc
        name="Links de Questionários de Lead"
        route="/LinksQuestionariosLeads"
        access="Admin"
        description="Central de geração e gerenciamento de links de questionários para captação de leads. Quatro tipos de link, cada um com gerador rastreável e opção de vincular a Introducers."
        purpose="Permite ao time comercial gerar links rastreáveis para os 4 tipos de questionário de lead (v2 Autocomplete, Completo v1, Simplificado pós-reunião, PIX), copiar com um clique e enviar para clientes potenciais. Cada link gera um OnboardingLink com código único para rastrear conversões por agente comercial e canal."
        funcionalidades={[
          'Grid 2×2 com 4 cards de questionário: Lead v2.0 (Autocomplete com CNPJ), Lead Completo (v1 legado), Simplificado (pós-reunião), PIX Only',
          'Cada card mostra: ícone, nome, descrição, link padrão em campo readonly, botão "Copiar" com feedback visual (ícone muda para ✓ por 2s)',
          'Botão "Visualizar" abre o questionário público em nova aba para preview do que o cliente vê',
          'Badge "RECOMENDADO" no card Lead v2.0 Autocomplete por ser o mais completo',
          'Painel informativo em cada card explicando quando usar aquele tipo de link',
          'Gerador de Link Rastreável (componente LinkGenerator): expande ao clicar em "+ Gerar Link Rastreável"',
          'LinkGenerator solicita nome do agente comercial (opcional), gera OnboardingLink com uniqueCode aleatório de 8 caracteres uppercase',
          'Link gerado inclui parâmetro ?ref=CODIGO para rastreamento de origem',
          'Link v2.0 também inclui ?templateId=69c3b5af17040531b06c5c16 para autocomplete CNPJ',
          'Após gerar: campo readonly com link completo + botão copiar + botão "Gerar outro"',
          'Card especial "Gerar Link por Introducer" na base: abre IntroducerLinkGeneratorModal para criar link com referral code de um parceiro cadastrado',
          'Todos os links são contabilizados em clickCount, submissionCount e completedCount no OnboardingLink'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Copiar link padrão',
            steps: [
              { type: 'action', text: 'Clica "Copiar"' },
              { type: 'result', text: 'Link copiado para clipboard' },
              { type: 'result', text: 'Toast "Link copiado!"' },
              { type: 'action', text: 'Envia link ao cliente via WhatsApp/email' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Gerar link rastreável',
            steps: [
              { type: 'action', text: 'Clica "+ Gerar Link Rastreável"' },
              { type: 'action', text: 'Digita nome do vendedor (opcional)' },
              { type: 'action', text: 'Clica "Gerar"' },
              { type: 'result', text: 'Cria OnboardingLink no banco' },
              { type: 'result', text: 'Exibe link com ?ref=CODIGO' },
              { type: 'action', text: 'Copia e envia ao cliente' },
            ]
          },
          {
            titulo: 'Fluxo 3 — Link por Introducer',
            steps: [
              { type: 'action', text: 'Clica "Gerar Link por Introducer"' },
              { type: 'result', text: 'Abre IntroducerLinkGeneratorModal' },
              { type: 'action', text: 'Seleciona Introducer cadastrado' },
              { type: 'action', text: 'Escolhe tipo de questionário' },
              { type: 'result', text: 'Gera link com referralCode do Introducer' },
            ]
          }
        ]}
        entidadesAfetadas={['OnboardingLink', 'Introducer']}
      />

      {/* ═══════ PÁGINA 2: Questionários Recebidos ═══════ */}
      <PageDoc
        name="Questionários Recebidos"
        route="/QuestionariosLeads"
        access="Admin"
        description="Central de gestão de todos os leads captados. 6 abas internas organizam leads por canal de entrada: questionário completo, simplificado, por Introducer, reunião presencial, reunião PIX e IA. Inclui tabela com filtros avançados, ações rápidas e exportação CSV."
        purpose="Concentrar e organizar todos os leads que entraram na plataforma, independente do canal de captação, com filtros avançados para triagem rápida, ações de contato/proposta em um clique e visibilidade de scores de IA (PRISCILA + Lead Qualifier)."
        funcionalidades={[
          'Header hero com gradiente mostrando 4 contadores: leads este mês, aguardando ação, score alto (≥70), risco crítico/alto',
          'Botões de ação no header: "Exportar CSV" (gera arquivo com 10 colunas de todos os leads filtrados), "Refresh" (recarrega dados)',
          '6 abas internas com contagem em cada: Completo (leads.length), Simplificado (questionariosSimplificados.length), Introducers, Reunião, Reunião PIX, IA/Robô',
          'Aba "Completo": tabela com 11 colunas — Protocolo, Empresa, Tipo (Merchan/Gateway/Marketplace), Status (7 opções), Score PRISCILA (colorido), Lead Qualifier (badge), Risco (5 níveis), TPV Mensal, Introducer, Data + SLA, Ações',
          'Filtros da aba Completo: busca texto (nome, CNPJ, e-mail, protocolo), Status (7 opções), Período (hoje, 7d, 30d, 90d), Risco (BAIXO/MEDIO/ALTO/CRITICO), Ordenação (data, score ↑↓, TPV), Introducer (dinâmico)',
          'Botão "Limpar filtros" aparece quando algum filtro está ativo',
          'Paginação: 10 itens por página, botões Anterior/Próximo + indicador de página',
          'Ações por lead: "Iniciar Contato" (muda status para em_contato_comercial + cria LeadActivity), "Gerar Proposta" (redireciona para CriarProposta?lead=ID), "Ver Respostas" (abre QuestionnaireResponsesModal)',
          'Botão "Ver detalhes" (olho): navega para LeadDetails?id=ID',
          'Botão "Excluir" (lixeira vermelha): abre AlertDialog de confirmação antes de deletar',
          'Score PRISCILA colorido: verde ≥70, âmbar ≥40, vermelho <40',
          'Lead Qualifier Badge: componente separado com nível (EXCELENTE→INSUFICIENTE)',
          'SLA Indicator: componente LeadSLAIndicator mostra tempo desde última interação',
          'Badge de Introducer: se lead tem introducerName, mostra badge roxo',
          'Aba "Simplificado": lista de QuestionarioSimplificado com cards expandíveis (QuestionarioSimplificadoCard) — ações: Ver Detalhes, Vincular Lead (cria Lead + LeadActivity), Gerar Proposta',
          'Aba "Introducers": componente IntroducerLeadsTab — filtra leads que têm introducerReferralCode, agrupa por parceiro',
          'Aba "Reunião": componente MeetingQuestionnaireTab — lista de InternalCommercialQuestionnaires do tipo reunião presencial',
          'Aba "Reunião PIX": componente PixMeetingQuestionnaireTab — lista de questionários de reunião focados em PIX',
          'Aba "IA/Robô": componente AIQuestionnaireTab — questionários gerados pelo ProcessMeetingNotes (origemIA=true), com badge 🤖',
          'QuestionnaireResponsesModal: modal com todas as respostas do questionnaireData do lead, organizado por campo'
        ]}
        subAbas={[
          'Completo: tabela interativa com 11 colunas, filtros (5 tipos), paginação, ações rápidas (contato/proposta/respostas/detalhes/excluir), exportação CSV',
          'Simplificado: cards de QuestionarioSimplificado com ações de vincular a Lead e gerar proposta',
          'Introducers: leads agrupados por Introducer (parceiro de indicação) com métricas por parceiro',
          'Reunião: InternalCommercialQuestionnaires preenchidos em reunião presencial com o cliente',
          'Reunião PIX: questionários de reunião focados em operação PIX',
          'IA/Robô 🤖: questionários gerados automaticamente pela IA a partir de notas de reunião (ProcessMeetingNotes)'
        ]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Triagem de lead novo',
            steps: [
              { type: 'action', text: 'Lead entra (questionário submetido)' },
              { type: 'result', text: 'Aparece na aba "Completo" com status "Novo"' },
              { type: 'action', text: 'Analista filtra por Score ↓ ou Risco' },
              { type: 'action', text: 'Clica "Iniciar Contato"' },
              { type: 'result', text: 'Status → em_contato_comercial' },
              { type: 'result', text: 'Cria LeadActivity "contato_iniciado"' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Gerar proposta a partir de lead',
            steps: [
              { type: 'action', text: 'Seleciona lead qualificado' },
              { type: 'decision', text: 'Score ≥ 40 e risco ≠ CRITICO?' },
              { type: 'action', text: 'Clica "Gerar Proposta"' },
              { type: 'result', text: 'Redireciona → CriarProposta?lead=ID' },
              { type: 'result', text: 'Dados do lead pré-preenchidos no formulário' },
            ]
          },
          {
            titulo: 'Fluxo 3 — Vincular questionário simplificado',
            steps: [
              { type: 'action', text: 'Aba "Simplificado" → card do questionário' },
              { type: 'action', text: 'Clica "Vincular Lead"' },
              { type: 'result', text: 'Cria Lead com dados do questionário' },
              { type: 'result', text: 'Cria LeadActivity "contato_iniciado"' },
              { type: 'result', text: 'Atualiza QuestionarioSimplificado status=vinculado' },
            ]
          },
          {
            titulo: 'Fluxo 4 — Exportação CSV',
            steps: [
              { type: 'action', text: 'Aplica filtros desejados' },
              { type: 'action', text: 'Clica "Exportar CSV"' },
              { type: 'result', text: 'Gera CSV com 10 colunas dos leads filtrados' },
              { type: 'result', text: 'Download automático do arquivo' },
            ]
          }
        ]}
        entidadesAfetadas={['Lead', 'LeadActivity', 'QuestionarioSimplificado', 'InternalCommercialQuestionnaire']}
      />

      {/* ═══════ PÁGINA 3: Pipeline Comercial ═══════ */}
      <PageDoc
        name="Pipeline Comercial (Kanban)"
        route="/PipelineComercial"
        access="Admin"
        description="Board Kanban drag-and-drop com 7 colunas representando o funil de vendas completo. Cada coluna mostra métricas de TPV e receita. Inclui gráfico de conversão, alertas de aging e busca."
        purpose="Dar visão panorâmica e controle total do funil comercial, permitindo mover leads entre estágios com drag-and-drop, monitorar métricas financeiras por coluna (TPV/receita), identificar gargalos com aging alerts e acompanhar conversão entre estágios."
        funcionalidades={[
          'Header hero com: total de leads filtrados, TPV total, receita potencial estimada (2.5% do TPV)',
          'Filtro de período: Semana, Mês, 3 meses, 6 meses, 12 meses, Lifetime',
          'Componente PipelineMetrics: KPIs consolidados do funil (leads total, TPV, receita, contratos, taxa conversão)',
          'Componente PipelineConversionChart: gráfico de barras (Recharts) mostrando leads por estágio com taxas de conversão entre cada estágio',
          'Componente PipelineAgingAlerts: alertas de leads parados há muito tempo em cada estágio (configurável por coluna)',
          'Campo de busca: filtra por nome, CNPJ ou nome fantasia em tempo real',
          '7 colunas Kanban: "Leads (Quest. Completo)" (cinza), "Em Contato + Quest. Simplificado" (amarelo), "Proposta Enviada" (azul), "Proposta Aceita" (roxo), "Compliance KYC" (verde), "Contrato Gerado" (verde escuro), "Perdido" (vermelho)',
          'Header de cada coluna: barra de cor + nome + badge com contagem + grid 2×2 com: TPV/mês, TPV/ano, Receita/mês (2.5%), Receita/ano',
          'Cards de lead (LeadKanbanCard): nome empresa, CNPJ, tipo negócio (badge), TPV mensal, score PRISCILA (colorido), tempo no estágio, proposta vinculada, contrato vinculado',
          'Drag-and-drop (@hello-pangea/dnd): arrastar card entre colunas atualiza Lead.status + cria LeadActivity "status_alterado_manual"',
          'Coluna "Contrato Gerado" usa lógica especial: inclui leads com status "ativado" OU leads que têm Contract vinculado (match por leadId, CNPJ ou nome)',
          'Match de contratos inteligente: primeiro por leadId direto, depois por CNPJ normalizado, depois por fullName/companyName',
          'Match de propostas: mostra proposta mais recente (isCurrentVersion !== false) vinculada ao lead',
          'Cards enriquecidos com dados de _contract e _proposal para exibição inline',
          'Ação rápida no card: "Iniciar Contato" (muda status + cria LeadActivity)',
          'Highlight de card arrastado: sombra + anel verde + rotação -1deg',
          'Drop zone visual: borda pontilhada verde quando arrastando sobre coluna',
          'Coluna vazia mostra mensagem "Nenhum lead neste estágio"'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Mover lead no pipeline',
            steps: [
              { type: 'action', text: 'Arrasta card para nova coluna' },
              { type: 'result', text: 'Lead.status → primeiro status da coluna destino' },
              { type: 'result', text: 'Lead.lastInteractionDate → agora' },
              { type: 'result', text: 'Cria LeadActivity "status_alterado_manual"' },
              { type: 'result', text: 'Toast "Lead movido!"' },
              { type: 'result', text: 'Métricas das colunas recalculadas' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Monitorar gargalos',
            steps: [
              { type: 'action', text: 'Observa PipelineAgingAlerts' },
              { type: 'decision', text: 'Leads parados há mais de X dias?' },
              { type: 'result', text: 'Alerta visual com lista de leads em risco' },
              { type: 'action', text: 'Clica no lead para ir ao detalhe' },
            ]
          },
          {
            titulo: 'Fluxo 3 — Analisar conversão',
            steps: [
              { type: 'action', text: 'Visualiza PipelineConversionChart' },
              { type: 'result', text: 'Barras por estágio com % conversão entre cada' },
              { type: 'decision', text: 'Drop-off alto em algum estágio?' },
              { type: 'action', text: 'Foca esforço comercial naquele estágio' },
            ]
          }
        ]}
        entidadesAfetadas={['Lead', 'LeadActivity', 'Proposal', 'Contract', 'Merchant', 'OnboardingLink']}
      />

      {/* ═══════ PÁGINA 4: Gestão de Propostas ═══════ */}
      <PageDoc
        name="Gestão de Propostas Personalizadas"
        route="/GestaoPropostas"
        access="Admin"
        description="Tabela completa de todas as propostas personalizadas com 8 status, filtros, métricas (ProposalMetrics), histórico de versões, simulador de rentabilidade, duplicação, e visão por empresa."
        purpose="Gerenciar o ciclo de vida completo de propostas personalizadas: criar, enviar, acompanhar visualizações, aceites, recusas, criar novas versões, simular rentabilidade e agrupar por empresa."
        funcionalidades={[
          'Header hero com: título, contagem de propostas filtradas, botão "Nova Proposta" (navega para CriarProposta)',
          'ProposalMetrics: 6 cards KPI — Total, Rascunho, Enviadas, Aceitas, Recusadas, Expiradas',
          '2 abas: "Lista" (tabela) e "Por Empresa" (ProposalsByCompanyTab agrupado por CNPJ)',
          'Filtros: busca por código/nome/CNPJ + filtro de status (7 opções) + botão limpar',
          'Tabela com 8 colunas: Número (código + badge de versão v2/v3), Empresa, Modelo (Merchant/Gateway/Marketplace), CNPJ, Status (badge colorido), Timeline (datas de envio/aceite/recusa), Validade (com alerta ⚠️ se ≤3 dias), Ações',
          'Ações por proposta (9 botões): Simular Rentabilidade (abre RentabilidadeDrawer), Ver Detalhes (navega PropostaDetalhes), Editar (só rascunho, navega CriarProposta?edit=ID), Nova Versão (GitBranch: cria versão v2/v3, marca anterior como isCurrentVersion=false), Link Público (abre em nova aba), Duplicar (copia taxas + dados, gera novo código), Nova Proposta com Taxas (FilePlus2: cria proposta limpa usando taxas como template), Histórico (ProposalHistoryModal), Excluir (AlertDialog)',
          'Filtro isCurrentVersion !== false: lista mostra apenas versão mais recente de cada proposta',
          'Versionamento: ao criar nova versão, incrementa version, seta previousVersionId, define rootProposalId para lineage completa',
          'Duplicação: copia todos os dados exceto id/datas/status, gera novo código/token, status = rascunho, version = 1',
          'RentabilidadeDrawer: painel lateral com simulação de receita × custo × margem',
          'ProposalHistoryModal: modal mostrando todas as versões da proposta (V1, V2, V3...) com datas e status de cada',
          'ProposalsByCompanyTab: agrupa propostas por clienteCnpj, mostra timeline por empresa',
          'Alerta visual de expiração: ícone ⚠️ e texto âmbar se validUntil ≤ 3 dias'
        ]}
        subAbas={[
          'Lista: tabela interativa com filtros, 9 ações por proposta, paginação implícita',
          'Por Empresa: visão consolidada agrupando propostas pelo mesmo CNPJ com timeline'
        ]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Criar nova proposta',
            steps: [
              { type: 'action', text: 'Clica "Nova Proposta"' },
              { type: 'result', text: 'Navega → CriarProposta' },
              { type: 'action', text: 'Preenche formulário + taxas' },
              { type: 'result', text: 'Salva como rascunho ou gera como enviada' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Criar nova versão',
            steps: [
              { type: 'action', text: 'Clica ícone GitBranch na proposta' },
              { type: 'result', text: 'Copia dados, version = anterior + 1' },
              { type: 'result', text: 'Proposta anterior → isCurrentVersion = false' },
              { type: 'result', text: 'Nova proposta → rascunho para edição' },
              { type: 'result', text: 'Toast "Versão V{n} criada!"' },
            ]
          },
          {
            titulo: 'Fluxo 3 — Simular rentabilidade',
            steps: [
              { type: 'action', text: 'Clica ícone $ na proposta' },
              { type: 'result', text: 'Abre RentabilidadeDrawer lateral' },
              { type: 'result', text: 'Calcula receita MDR + antecipação + fees' },
              { type: 'result', text: 'Compara com custo parceiro' },
              { type: 'result', text: 'Exibe margem bruta e alertas de perda' },
            ]
          },
          {
            titulo: 'Fluxo 4 — Duplicar para outro cliente',
            steps: [
              { type: 'action', text: 'Clica ícone Copiar' },
              { type: 'result', text: 'Cria proposta com mesmas taxas' },
              { type: 'result', text: 'Novo código, novo token, status = rascunho' },
              { type: 'result', text: 'Navega para edição da cópia' },
            ]
          }
        ]}
        entidadesAfetadas={['Proposal', 'Lead', 'AuditLog']}
      />

      {/* ═══════ PÁGINA 5: Criar Proposta ═══════ */}
      <PageDoc
        name="Criar / Editar Proposta"
        route="/CriarProposta"
        access="Admin"
        description="Editor completo de proposta personalizada com layout split-screen: formulário à esquerda (5 seções), preview de rentabilidade + visualização à direita. Suporte a criação nova, edição de rascunho, edição a partir de template e uso de taxas PRISCILA."
        purpose="Permitir a construção detalhada de uma proposta comercial com taxas por bandeira, parcelamento até 21x, antecipação, PIX, fees, setup, mínimo garantido — tudo com validação em tempo real contra limites do parceiro selecionado e preview simultâneo."
        funcionalidades={[
          '3 modos de entrada: ?lead=ID (nova proposta com dados do lead pré-preenchidos), ?edit=ID (editar rascunho existente), ?templateFromId=ID (nova proposta copiando taxas de outra)',
          'Parâmetro ?usePriscila=1: auto-preenche taxas sugeridas pela IA PRISCILA (priscilaAnalysisReport.taxasSugeridas)',
          'Header fixo (sticky): botão Voltar, título ("Nova Proposta" ou "Editar Proposta"), botões: "Copiar Taxas" (abre CopyRatesModal), "Salvar Rascunho", "Gerar Proposta"',
          'Layout split-screen: 60% formulário (scroll independente) + 40% preview (460px fixo, fundo escuro)',
          'Seção 1 — Dados do Cliente (CardDadosCliente): nome empresa, CNPJ (com validação 14 dígitos), MCC, contato, seletor de tipo negócio (Merchant/Gateway/Marketplace)',
          'Seção 2 — Seletor de Parceiro (PartnerSelector): grid de parceiros ativos, seleção de MCC do parceiro, recomendação IA (InvokeLLM analisa perfil e sugere parceiro ideal), exibição de taxas base do parceiro para comparação',
          'Seção 3 — Taxas de Cartão (CardTaxasCartao): 5 bandeiras (Visa, Mastercard, Elo, Amex, Outras) × 4 faixas (à vista, 2-6x, 7-12x, 13-21x), validação visual contra limites do parceiro (vermelho se abaixo do custo), botões "Sincronizar bandeiras" e "Copiar de outra bandeira"',
          'Seção 4 — Antecipação (CardAntecipacao): toggle ativar/desativar, taxa de antecipação (%), prazo de recebimento (D+1 a Fluxo), percentual do TPV a antecipar',
          'Seção 5 — Outras Taxas (CardOutrasTaxas): PIX (percentual ou fixo R$), boleto R$, antifraude R$, fee transação R$, 3DS R$, setup R$, alerta pré-chargeback R$, mínimo garantido 3 meses (mes1/mes2/mes3)',
          'Preview direito — ProfitabilityPanel: simulação completa de receita MDR + antecipação + fees × custo parceiro = margem. Alertas visuais de perda por categoria',
          'Preview direito — PropostaPreview: tabela de 21 parcelas mostrando taxa efetiva com antecipação acumulada, seletor de bandeira, footer com PIX/3DS/setup/mínimos',
          'CopyRatesModal: modal que lista propostas existentes para copiar taxas de outra proposta',
          'Validação obrigatória antes de gerar: nome, CNPJ (14 dígitos), MCC, contato, tipo negócio, pelo menos 1 taxa de cartão preenchida',
          'Ao gerar: cria/atualiza Proposal com status "enviada", cria AuditLog, atualiza Lead (currentProposalId + status proposta_enviada + LeadActivity)',
          'Código auto-gerado: PROP-YYYY-NNNNN (5 dígitos aleatórios)',
          'Token público auto-gerado: 64 caracteres alfanuméricos para link público',
          'parseTaxa(): converte strings com vírgula brasileira para números (1.234,56 → 1234.56)'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Nova proposta a partir de lead',
            steps: [
              { type: 'action', text: 'URL: ?lead=ID' },
              { type: 'result', text: 'Carrega dados do Lead' },
              { type: 'result', text: 'Pré-preenche nome, CNPJ, MCC, contato, tipo negócio' },
              { type: 'action', text: 'Seleciona parceiro' },
              { type: 'action', text: 'Preenche taxas por bandeira' },
              { type: 'action', text: 'Configura antecipação + outras taxas' },
              { type: 'decision', text: 'Validação OK?' },
              { type: 'action', text: 'Clica "Gerar Proposta"' },
              { type: 'result', text: 'Proposal criada status=enviada' },
              { type: 'result', text: 'AuditLog + LeadActivity criados' },
              { type: 'result', text: 'Lead.status → proposta_enviada' },
              { type: 'result', text: 'Navega → PropostaDetalhes' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Salvar como rascunho',
            steps: [
              { type: 'action', text: 'Preenche parcialmente' },
              { type: 'action', text: 'Clica "Salvar Rascunho"' },
              { type: 'result', text: 'Proposal criada/atualizada status=rascunho' },
              { type: 'result', text: 'Navega → GestaoPropostas' },
            ]
          },
          {
            titulo: 'Fluxo 3 — Copiar taxas de outra proposta',
            steps: [
              { type: 'action', text: 'Clica "Copiar Taxas"' },
              { type: 'result', text: 'Abre CopyRatesModal' },
              { type: 'action', text: 'Seleciona proposta fonte' },
              { type: 'result', text: 'Todas as taxas preenchidas automaticamente' },
              { type: 'result', text: 'Toast "Taxas copiadas!"' },
            ]
          }
        ]}
        entidadesAfetadas={['Proposal', 'Lead', 'LeadActivity', 'AuditLog', 'Partner', 'PartnerCost']}
      />

      {/* ═══════ PÁGINA 6: Propostas Padrão ═══════ */}
      <PageDoc
        name="Gestão de Propostas Padrão por Segmento"
        route="/GestaoPropostasPadrao"
        access="Admin"
        description="Gerencia propostas padrão (templates) com taxas oficiais por segmento. Inclui 6 SegmentQuickLinks para compartilhar propostas com um clique. Tabela com métricas, filtros e ações CRUD."
        purpose="Manter propostas padrão com taxas oficiais Pin Bank para cada segmento, permitindo compartilhar rapidamente uma proposta sem precisar criar uma personalizada. Ideal para primeiros contatos ou envios em massa."
        funcionalidades={[
          'SegmentQuickLinks: 6 cards (Educação, Infoprodutos, E-commerce, SaaS, Gateway, Marketplace) com botão "Copiar Link" que copia link público da proposta padrão do segmento (filtrada por isDefaultForSegment=true)',
          'ProposalMetrics: 4 KPIs (Total, Rascunho, Ativas, Inativas)',
          'Tabela: código, nome template, segmento (badge), tipo negócio, status (ativa/inativa), data criação, ações',
          'Ações: Ver detalhes, Editar, Duplicar, Copiar link público, Excluir',
          'Botão "Nova Proposta Padrão" → navega para CriarPropostaPadrao',
          'Filtros: busca + status + segmento'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Compartilhar proposta padrão',
            steps: [
              { type: 'action', text: 'Localiza card do segmento em QuickLinks' },
              { type: 'action', text: 'Clica "Copiar Link"' },
              { type: 'result', text: 'Link público copiado' },
              { type: 'action', text: 'Envia ao cliente' },
              { type: 'result', text: 'Cliente vê página premium com taxas' },
            ]
          }
        ]}
        entidadesAfetadas={['StandardProposal']}
      />

      {/* ═══════ PÁGINA 7: Propostas PIX ═══════ */}
      <PageDoc
        name="Gestão de Propostas PIX"
        route="/GestaoPropostasPix"
        access="Admin"
        description="Lista e gerencia propostas exclusivas para operação PIX. Mais simples que proposta personalizada — apenas taxa PIX + mínimo garantido."
        purpose="Permitir criar e gerenciar propostas rápidas focadas apenas em PIX, ideal para clientes que não precisam de cartão/boleto."
        funcionalidades={[
          '4 KPIs: Total, Ativas, Aceitas, Recusadas',
          'Tabela: código, cliente, taxa PIX (tipo + valor), status, data, ações',
          'Versionamento V1, V2, V3 com lineage',
          'Link público com aceite/recusa digital',
          'Seleção rápida de lead (últimos 6)',
          'Duplicação e nova versão',
          'Alerta de propostas próximas da expiração (≤3 dias)'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Nova proposta PIX',
            steps: [
              { type: 'action', text: 'Clica "Nova Proposta PIX"' },
              { type: 'result', text: 'Navega → CriarPropostaPix' },
              { type: 'action', text: 'Seleciona lead ou preenche dados' },
              { type: 'action', text: 'Define taxa PIX (% ou R$) + mínimo garantido' },
              { type: 'action', text: 'Clica "Gerar"' },
              { type: 'result', text: 'PixProposal criada com token público' },
            ]
          }
        ]}
        entidadesAfetadas={['PixProposal', 'Lead', 'LeadActivity']}
      />

      {/* ═══════ PÁGINA 8: Gestão de Introducers ═══════ */}
      <PageDoc
        name="Gestão de Introducers"
        route="/GestaoIntroducers"
        access="Admin"
        description="CRUD completo de parceiros de indicação (Introducers), com métricas de leads gerados, comissão e landing pages personalizadas."
        purpose="Cadastrar e gerenciar parceiros que indicam clientes (agências, consultores, afiliados), definir comissões, gerar links rastreáveis e ativar landing pages personalizadas para cada parceiro."
        funcionalidades={[
          'IntroducerKPIs: total ativos, leads gerados, conversão média, receita estimada',
          'IntroducerTable: tabela com nome, tipo (individual/company), referralCode, e-mail, status (ativo/inativo), leads count, landing page ativa',
          'IntroducerFormModal: formulário completo — nome, tipo, CPF/CNPJ, referralCode (único), contato, comissão %, logo empresa, slug landing page',
          'StandardRatesEditor: editor de taxas padrão por segmento para exibição na landing page do parceiro',
          'InviteIntroducerButton: convida parceiro para criar conta no portal',
          'Toggle landingPageActive: ativa/desativa landing page do parceiro',
          'uniqueLandingPageSlug: URL personalizada /parceiro/{slug}',
          'Campos de empresa: companyName, companyLogoUrl, CNPJ, contatos corporativos'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Cadastrar novo Introducer',
            steps: [
              { type: 'action', text: 'Clica "Novo Introducer"' },
              { type: 'result', text: 'Abre IntroducerFormModal' },
              { type: 'action', text: 'Preenche dados + referralCode' },
              { type: 'action', text: 'Define taxas padrão por segmento' },
              { type: 'action', text: 'Salva' },
              { type: 'result', text: 'Introducer criado' },
              { type: 'result', text: 'Landing page disponível em /parceiro/{slug}' },
            ]
          }
        ]}
        entidadesAfetadas={['Introducer', 'User']}
      />

      {/* ═══════ PÁGINA 9: Landing Pages ═══════ */}
      <PageDoc
        name="Gestão de Landing Pages"
        route="/GestaoLandingPages"
        access="Admin"
        description="Painel para gerenciar e visualizar landing pages de Introducers."
        purpose="Visualizar quais landing pages estão ativas, pré-visualizar o design e gerenciar configurações de cada página de parceiro."
        funcionalidades={[
          'Lista de Introducers com landing page ativa',
          'Preview do link da landing page',
          'Toggle para ativar/desativar',
          'Link para editar o Introducer correspondente'
        ]}
        subAbas={[]}
        fluxo={[]}
        entidadesAfetadas={['Introducer']}
      />

      {/* ═══════ PÁGINA 10-11: Questionários de Reunião ═══════ */}
      <PageDoc
        name="Questionário de Reunião (Completo + PIX)"
        route="/QuestionarioReuniao + /QuestionarioReuniaoPix"
        access="Admin"
        description="Formulários internos para o comercial preencher durante ou após reuniões presenciais/calls com clientes. Versão completa (5 abas) e versão PIX (3 abas)."
        purpose="Capturar dados estruturados de leads obtidos em reuniões, sem depender de o cliente preencher um questionário público. O comercial preenche internamente."
        funcionalidades={[
          'QuestionarioReuniao — 5 abas: Dados Básicos (MeetingFormBasicInfo), Detalhes do Negócio (MeetingFormBusinessDetails), Volume (MeetingFormVolume), Taxas Atuais (MeetingFormCurrentRates), Desafios (MeetingFormChallenges)',
          'MeetingFormBasicInfo: nome empresa, CNPJ, contato, e-mail, telefone, tipo negócio (botões), MCC',
          'MeetingFormCurrentRates: taxas atuais por bandeira (botões, não dropdowns), PIX, boleto, antecipação',
          'MeetingFormVolume: TPV mensal, ticket médio, transações/mês, expectativa de crescimento',
          'Ao salvar: cria InternalCommercialQuestionnaire + Lead vinculado + LeadActivity',
          'QuestionarioReuniaoPix — 3 abas: Dados Básicos (PixFormBasicInfo), Negócio (PixFormBusiness), Competidores (PixFormCompetitors)',
          'Ambos formulários usam botões em vez de dropdowns para seleção rápida'
        ]}
        subAbas={[
          'Dados Básicos: informações da empresa e contato principal',
          'Detalhes do Negócio: tipo de negócio, MCC, modelo operacional',
          'Volume: métricas financeiras (TPV, ticket, transações)',
          'Taxas Atuais: taxas que o cliente paga atualmente (para negociação)',
          'Desafios: dores e desafios operacionais do cliente'
        ]}
        fluxo={[
          {
            titulo: 'Fluxo — Preenchimento pós-reunião',
            steps: [
              { type: 'action', text: 'Comercial abre questionário' },
              { type: 'action', text: 'Preenche 5 abas com dados da reunião' },
              { type: 'action', text: 'Clica "Salvar"' },
              { type: 'result', text: 'Cria InternalCommercialQuestionnaire' },
              { type: 'result', text: 'Cria Lead com dados extraídos' },
              { type: 'result', text: 'Cria LeadActivity "questionário_reunião"' },
              { type: 'result', text: 'Lead aparece no Pipeline e Questionários Recebidos' },
            ]
          }
        ]}
        entidadesAfetadas={['InternalCommercialQuestionnaire', 'Lead', 'LeadActivity']}
      />

      {/* ═══════ PÁGINA 12: Robô IA ═══════ */}
      <PageDoc
        name="Questionário com Robô IA (ProcessMeetingNotes)"
        route="/ProcessMeetingNotes"
        access="Admin"
        description="IA que transforma texto livre (notas de reunião, e-mails, mensagens) em dados estruturados de lead automaticamente."
        purpose="Eliminar o trabalho manual de transcrever informações de reuniões. O comercial cola o texto bruto e a IA extrai todos os dados estruturados, pré-preenchendo o formulário do questionário de reunião."
        funcionalidades={[
          'Área de texto livre para colar notas de reunião, transcrições, e-mails ou mensagens WhatsApp',
          'Aceita texto desestruturado, informal, com abreviações — a IA interpreta contexto',
          'Backend function processMeetingNotes() usa InvokeLLM com response_json_schema',
          'Dados extraídos: nome empresa, CNPJ, contato, e-mail, telefone, tipo de negócio, TPV, ticket médio, taxas atuais (MDR por bandeira, PIX, boleto), antecipação, provedor antifraude, desafios, timeline, notas',
          'Resultado exibido em formulário editável para revisão antes de salvar',
          'Ao salvar: cria InternalCommercialQuestionnaire (origemIA=true) + Lead vinculado',
          'Lead aparece na aba "IA/Robô" do QuestionariosLeads com badge 🤖'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo — Processar notas com IA',
            steps: [
              { type: 'action', text: 'Cola texto da reunião' },
              { type: 'action', text: 'Clica "Processar com IA"' },
              { type: 'result', text: 'InvokeLLM extrai dados estruturados' },
              { type: 'result', text: 'Formulário pré-preenchido exibido' },
              { type: 'action', text: 'Revisa e corrige se necessário' },
              { type: 'action', text: 'Clica "Salvar"' },
              { type: 'result', text: 'Cria questionnaire + Lead (origemIA=true)' },
            ]
          }
        ]}
        entidadesAfetadas={['InternalCommercialQuestionnaire', 'Lead', 'LeadActivity']}
      />

      {/* ═══════ PÁGINAS PÚBLICAS DO MÓDULO ═══════ */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-4 text-white">
        <h4 className="font-bold text-sm mb-1">📖 Páginas Públicas (acesso do cliente)</h4>
        <p className="text-white/70 text-xs">Páginas que o cliente final acessa via link público — sem autenticação.</p>
      </div>

      <PageDoc
        name="Proposta Pública (Personalizada)"
        route="/PropostaPublica?token=TOKEN"
        access="Público"
        description="Página premium que o cliente acessa para visualizar, aceitar, recusar ou contrapropor a proposta personalizada."
        purpose="Apresentar a proposta de forma profissional ao cliente, permitindo aceite digital, recusa com motivo ou contraproposta com sugestão de novas taxas."
        funcionalidades={[
          'Carrega proposta pelo tokenPublico (URL param)',
          'Registra visualização: atualiza status para "visualizada" + notifica via Slack (notifyProposalViewed)',
          'Tabela de taxas por bandeira × parcelas (até 21x) com taxa efetiva incluindo antecipação',
          'Seletor de bandeira para visualizar taxas específicas',
          'Seção de PIX, boleto, antifraude, 3DS, setup',
          'Mínimo garantido em 3 meses',
          'Validade da proposta com countdown',
          'Botão "Aceitar Proposta" (AceiteModal): aceite digital com termos, atualiza status + acceptedDate + notifica Slack',
          'Botão "Recusar" (RecusaModal): motivo obrigatório, atualiza status + rejectedDate + rejectedReason',
          'Botão "Contraproposta" (ContrapropostaModal): cliente sugere taxas alternativas, status → contraproposta',
          'ExportButtons: imprimir e gerar PDF',
          'Design responsivo e premium com gradientes e animações'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo — Cliente recebe e decide',
            steps: [
              { type: 'action', text: 'Cliente abre link' },
              { type: 'result', text: 'Status → visualizada + Notificação Slack' },
              { type: 'action', text: 'Analisa taxas e condições' },
              { type: 'decision', text: 'Aceita? Recusa? Contrapropõe?' },
              { type: 'result', text: 'Aceitar → status=aceita + notifica' },
              { type: 'result', text: 'Recusar → status=recusada + motivo' },
              { type: 'result', text: 'Contrapropor → status=contraproposta + sugestão' },
            ]
          }
        ]}
        entidadesAfetadas={['Proposal', 'Lead', 'AuditLog']}
      />

      <PageDoc
        name="Proposta Padrão Pública + Proposta PIX Pública"
        route="/PropostaPadraoPublica + /PropostaPixPublica"
        access="Público"
        description="Versões públicas das propostas padrão (por segmento) e propostas PIX. Mesmo layout premium, com opção de aceite/recusa."
        purpose="Permitir que clientes visualizem e aceitem propostas padrão ou PIX sem necessidade de login."
        funcionalidades={[
          'Proposta Padrão: taxas oficiais do segmento, sem dados de cliente específico, CTA para entrar em contato',
          'Proposta PIX: taxa PIX (% ou R$), mínimo garantido, aceite/recusa digital',
          'Ambas com ExportButtons (PDF/Print)',
          'Design premium responsivo',
          'Ambas registram visualização'
        ]}
        subAbas={[]}
        fluxo={[]}
        entidadesAfetadas={['StandardProposal', 'PixProposal']}
      />

      <PageDoc
        name="Questionário de Lead (Público)"
        route="/LeadQuestionnaire + /LeadQuestionnairePix + /QuestionarioSimplificadoPublico"
        access="Público"
        description="3 variantes de questionário público que o cliente preenche para se tornar lead: completo (10 etapas), PIX only e simplificado."
        purpose="Capturar dados do cliente potencial de forma estruturada, criar Lead no sistema e disparar análise automática por IA."
        funcionalidades={[
          'LeadQuestionnaire (v2 Autocomplete): 10 etapas com autocomplete CNPJ (brasilApiCnpj), validação de campos em tempo real, stepper visual de progresso',
          'Etapas: Identificação → Tipo Empresa → Endereço → Atividade → Modelo Negócio → Volume → Taxas Atuais → Produtos Desejados → Upload Docs → Confirmação',
          'LeadQuestionnairePix: versão reduzida focada em PIX, menos etapas',
          'QuestionarioSimplificadoPublico: versão rápida para pós-reunião, dados básicos + taxas',
          'Ao submeter: cria Lead, dispara analyzePriscila e analyzeLeadQualifier automaticamente',
          'Suporte a UTM params (source, medium, campaign) para rastreamento',
          'Parâmetro ?ref=CODIGO vincula lead ao OnboardingLink para métricas',
          'Design público sem necessidade de autenticação'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo — Cliente preenche questionário',
            steps: [
              { type: 'action', text: 'Cliente acessa link público' },
              { type: 'action', text: 'Preenche etapas do formulário' },
              { type: 'action', text: 'Submete' },
              { type: 'result', text: 'Lead criado no banco' },
              { type: 'result', text: 'OnboardingLink.submissionCount++' },
              { type: 'result', text: 'IA PRISCILA analisa automaticamente' },
              { type: 'result', text: 'Lead Qualifier classifica maturidade' },
              { type: 'result', text: 'Lead aparece no Pipeline + Questionários Recebidos' },
            ]
          }
        ]}
        entidadesAfetadas={['Lead', 'OnboardingLink', 'LeadActivity']}
      />

      {/* Entidades do módulo */}
      <div className="bg-[#0A0A0A]/5 rounded-xl p-4 border border-[#0A0A0A]/10">
        <h5 className="text-xs font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2">Entidades do Módulo Leads & Propostas</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { name: 'Lead', desc: '30+ campos: e-mail, nome, CNPJ, telefone, status (11 valores), tipo negócio, scores PRISCILA/Lead Qualifier/Risco, TPV, ticket médio, protocolo, origem, introducer, expectedRates' },
            { name: 'LeadActivity', desc: 'Timeline de atividades: contato_iniciado, status_alterado, proposta_criada, follow_up, nota_adicionada' },
            { name: 'Proposal', desc: 'Proposta personalizada: leadId, taxas por bandeira × 4 faixas, antecipação, PIX, status (8), versionamento, tokenPublico, rentabilidade' },
            { name: 'StandardProposal', desc: 'Proposta padrão: templateName, segment (6), isDefaultForSegment, taxas oficiais, tokenPublico' },
            { name: 'PixProposal', desc: 'Proposta PIX: leadId, taxa PIX (% ou R$), mínimo garantido (3 meses), versionamento, tokenPublico' },
            { name: 'OnboardingLink', desc: 'Link rastreável: código único, linkType, UTMs, commercialAgentName, métricas (clicks, submissions, completions)' },
            { name: 'QuestionarioSimplificado', desc: 'Questionário rápido pós-reunião: dados empresa, taxas atuais, distribuição bandeira' },
            { name: 'InternalCommercialQuestionnaire', desc: 'Questionário interno de reunião: dados empresa, negócio, volume, desafios, taxas, origemIA flag' },
            { name: 'Introducer', desc: 'Parceiro de indicação: nome, tipo, referralCode, comissão, landing page slug, standardRates por segmento, logo' },
          ].map((e, i) => (
            <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
              <Badge className="bg-[#0A0A0A] text-white font-mono text-[10px] border-0 mb-1">{e.name}</Badge>
              <p className="text-[10px] text-[#0A0A0A]/60 leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}