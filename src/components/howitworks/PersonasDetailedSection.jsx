import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Shield, UserPlus, TrendingUp, CheckCircle2,
  ArrowRight, CircleDot, Star, Award, Zap, DollarSign,
  BarChart3, Brain, Phone, FileText, Eye, ClipboardList,
  RefreshCw, Settings, Globe, Handshake, Target, Heart,
  Sparkles, Lock, PieChart, AlertTriangle, Clock, Scale
} from 'lucide-react';

function PersonaCard({ icon: Icon, color, gradient, name, role, description, children }) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className={`${gradient} p-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-white/70 text-sm">{role}</p>
          </div>
        </div>
        <p className="text-white/80 text-sm mt-3 leading-relaxed">{description}</p>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function ActivityBlock({ title, icon: Icon, color, items }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 ${color}`}>
        <Icon className="w-4 h-4" />
        <h5 className="text-sm font-bold">{title}</h5>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-[#0A0A0A]/80">
            <ArrowRight className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenefitBlock({ title, items }) {
  return (
    <div className="bg-gradient-to-r from-[#1356E2]/5 to-[#E84B1C]/5 rounded-xl p-4 border border-[#1356E2]/10">
      <h5 className="text-xs font-bold text-[#1356E2] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5" /> {title}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-[#0A0A0A]/70">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PersonasDetailedSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
        Abaixo, cada persona com todas as atividades que pode realizar, benefícios que obtém, e jornadas completas dentro da plataforma.
      </p>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TIME COMERCIAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <PersonaCard
        icon={DollarSign} color="bg-[#3B82F6]" gradient="bg-gradient-to-r from-[#1e40af] to-[#3b82f6]"
        name="Time Comercial" role="Vendedores, SDRs, Account Executives, Head Comercial"
        description="Responsável por todo o ciclo comercial: captação de leads, qualificação, negociação, envio de propostas e acompanhamento até o contrato assinado. Usa a plataforma diariamente como ferramenta principal de trabalho."
      >
        <ActivityBlock title="Atividades Diárias" icon={ClipboardList} color="bg-blue-50 text-blue-700" items={[
          "Gerar e enviar links de questionário para potenciais clientes (4 tipos: Completo v2.0, Completo v1, Simplificado, PIX)",
          "Gerar links rastreáveis com UTM e nome do vendedor para controle de origem",
          "Gerar links por Introducer vinculados a parceiros de indicação",
          "Consultar a Home para ver KPIs (leads ativos, propostas abertas, compliance pendente) e Quick Actions",
          "Acompanhar os Helena Insights para saber se há leads inativos ou casos manuais atrasados",
          "Verificar a lista de Questionários Recebidos nas 6 sub-abas (Completo, Simplificado, Introducers, Reunião, Reunião PIX, Robô IA)",
          "Usar filtros avançados (status, período, risco, score, introducer) e ordenação (data, score, TPV) para priorizar leads",
          "Clicar em 'Iniciar Contato' para mover lead para status 'Em Contato' e registrar atividade automaticamente",
          "Ver respostas completas do questionário do lead em modal detalhado",
          "Verificar score PRISCILA (0-100), nível de risco (BAIXO/MÉDIO/ALTO/CRÍTICO) e classificação Lead Qualifier (EXCELENTE → INSUFICIENTE)",
          "Exportar lista de leads para CSV para análise externa"
        ]} />

        <ActivityBlock title="Gestão do Pipeline" icon={BarChart3} color="bg-green-50 text-green-700" items={[
          "Arrastar leads entre as 7 colunas do Kanban (Leads, Em Contato, Proposta Enviada, Aceita, Compliance/KYC, Contrato, Perdido)",
          "Visualizar métricas por coluna: TPV/mês, TPV/ano, Receita/mês, Receita/ano estimada",
          "Filtrar pipeline por período (semana, mês, 3/6/12 meses, lifetime)",
          "Buscar leads por CNPJ, nome ou razão social",
          "Acompanhar Pipeline Metrics (leads novos, propostas enviadas, taxa de conversão, ticket médio)",
          "Consultar Gráfico de Conversão para entender gargalos no funil",
          "Receber Aging Alerts automáticos para leads parados há muito tempo em um estágio",
          "Ver se lead já tem proposta ou contrato vinculado no card do Kanban"
        ]} />

        <ActivityBlock title="Propostas Comerciais (3 Modalidades)" icon={FileText} color="bg-purple-50 text-purple-700" items={[
          "Criar Proposta Personalizada: taxas por bandeira (Visa, Master, Elo, Amex, Outras) × 4 faixas, antecipação, PIX, boleto, fees, setup, TPV mínimo",
          "Criar Proposta Padrão por Segmento: selecionar segmento e taxas são auto-preenchidas automaticamente",
          "LINKS RÁPIDOS POR SEGMENTO: na página Gestão de Propostas Padrão, 6 cards prontos com 'Copiar Link' para E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace — sem precisar criar proposta",
          "Criar Proposta PIX: taxa PIX (% ou R$ fixo) + TPV mínimo (3 meses) + seleção rápida de lead",
          "Propostas PIX com versionamento (V1, V2, V3...) e duplicação independente",
          "4 KPIs de Propostas PIX: Total, Ativas, Aceitas, Recusadas",
          "Selecionar Parceiro Adquirente para validação de limites — alertas visuais quando taxa está abaixo do custo",
          "Simular Rentabilidade (Drawer): ver receita MDR + antecipação + fees vs custo parceiro, margem",
          "Visualizar Preview em tempo real da proposta como o cliente verá",
          "Duplicar proposta existente como base para nova",
          "Criar nova versão (V2, V3...) mantendo histórico completo de versionamento",
          "Copiar link público e enviar ao cliente",
          "Receber notificação Slack quando cliente visualiza ou aceita proposta",
          "Ver alertas de propostas próximas da expiração (≤3 dias)",
          "Ver Propostas por Empresa na aba dedicada para visão consolidada"
        ]} />

        <ActivityBlock title="Contratos" icon={Scale} color="bg-amber-50 text-amber-700" items={[
          "Acompanhar contratos pré-gerados por IA após compliance aprovado",
          "Revisar e complementar campos faltantes no Editor de Contrato",
          "Enviar link público do contrato para assinatura digital pelo cliente",
          "Acompanhar status: Pré-gerado → Em Revisão → Pronto → Enviado → Assinado"
        ]} />

        <ActivityBlock title="Questionários Internos" icon={Brain} color="bg-pink-50 text-pink-700" items={[
          "Preencher Questionário Reunião com dados coletados em reunião presencial/remota",
          "Preencher Questionário Reunião PIX para clientes focados em PIX",
          "Usar o Questionário com Robô: colar notas de reunião em texto livre e a IA extrai dados estruturados automaticamente",
          "Revisar dados extraídos pela IA e salvar como lead"
        ]} />

        <ActivityBlock title="Introducers & Landing Pages" icon={UserPlus} color="bg-violet-50 text-violet-700" items={[
          "Cadastrar novos Introducers (individuais ou empresas) com código UTM único",
          "Configurar taxas padrão por segmento para a Landing Page do Introducer",
          "Configurar Landing Page co-branded com logo, slug personalizado (/parceiro/slug)",
          "Página dedicada 'Landing Pages de Parceiros' (GestaoLandingPages): 4 KPIs, tabela com logo/URL/segmentos/status/leads, toggle ativar/desativar, copiar link, preview",
          "Acompanhar KPIs por Introducer: leads gerados, taxa de conversão, receita potencial",
          "Ver leads filtrados por Introducer na aba dedicada"
        ]} />

        <BenefitBlock title="Benefícios para o Time Comercial" items={[
          "Pipeline visual com métricas de receita que mostram o valor financeiro de cada estágio",
          "Qualificação automática por 2 IAs (PRISCILA + Lead Qualifier) que prioriza os leads mais promissores",
          "3 tipos de proposta (Personalizada, Padrão, PIX) que cobrem todos os cenários de negociação",
          "Link público de proposta com aceite digital elimina troca de e-mails e PDFs",
          "Notificações Slack em tempo real quando o cliente visualiza ou aceita a proposta",
          "Aging Alerts previnem que leads esfriem por falta de follow-up",
          "Versionamento de propostas mantém histórico completo e facilita renegociação",
          "Simulador de Rentabilidade permite avaliar margem antes de enviar proposta",
          "Contratos gerados automaticamente por IA reduzem trabalho manual pós-venda",
          "Questionário com Robô transforma notas de reunião em lead estruturado em segundos",
          "Exportação CSV para análise em Excel/Google Sheets",
          "Introducers automatizam captação de leads via parceiros sem esforço manual"
        ]} />
      </PersonaCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TIME DE COMPLIANCE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <PersonaCard
        icon={Shield} color="bg-[#0A0A0A]" gradient="bg-gradient-to-r from-[#0A0A0A] to-[#003d6e]"
        name="Time de Compliance" role="Analistas de Compliance, Gestores de Risco, Compliance Officers"
        description="Responsável por garantir a conformidade regulatória de todos os merchants que passam pelo onboarding. Analisa casos, valida documentos, revisa decisões da IA e mantém a operação dentro das normas BACEN, PLD/FT e padrões internacionais."
      >
        <ActivityBlock title="Dashboard e Monitoramento" icon={BarChart3} color="bg-slate-100 text-[#0A0A0A]" items={[
          "Consultar Dashboard de Compliance com 20+ KPIs em tempo real: Total Submissões, Aprovadas Helena, Em Manual, Reprovadas",
          "Acompanhar KPIs comparativos: Tempo de Conclusão, Taxa de Conversão, Taxa de Rejeição, Aprovação Automática IA",
          "Verificar Quick Metrics: Tempo médio IA, Tempo médio Manual, Score médio carteira, Docs pendentes",
          "Consultar Compliance Scores Overview (SENTINEL): médias SQ (questionário), SVE (validações), SGC (geral composto)",
          "Receber Actionable Insights: alertas sobre revisão manual acumulada, docs pendentes, revalidações atrasadas, scores críticos",
          "Receber Helena Insights: alertas sobre tendências (leads inativos, manuais >24h, scores críticos hoje)",
          "Analisar Funil de Conversão: Submissões → Análise IA → Aprovadas IA → Manual → Aprovadas Final",
          "Consultar Pizza Helena: distribuição percentual de decisões (Aprovado/Manual/Recusado)",
          "Analisar Tendência IA vs Manual nos últimos 6 meses",
          "Consultar Top Causas de Reprovação: ranking de red flags mais frequentes",
          "Analisar Distribuição de Scores (histograma 0-199, 200-399, 400-649, 650-849, 850-1000)",
          "Ver Distribuição de Risco: cards Baixo/Médio/Alto/Crítico com contagem"
        ]} />

        <ActivityBlock title="Análise de Casos" icon={Eye} color="bg-blue-50 text-blue-700" items={[
          "Filtrar casos por 6 tabs de status (Todos, Pendentes, Processando, Manual, Aprovados, Recusados)",
          "Filtrar por tipo merchant (PF/PJ), período (Hoje, Semana, Mês) e busca por nome/CPF/CNPJ/e-mail",
          "Ordenar por merchant, score ou data de criação",
          "Abrir Análise Detalhada (AnaliseDeCasos) com 7 abas: Resumo, Merchant, Respostas, Documentos, Painel IA, Validações Externas, Histórico/Auditoria",
          "Ver dados do merchant: CNPJ, nome, e-mail, tipo, status onboarding, score de risco",
          "Ver todas as respostas do questionário de compliance organizadas por seção",
          "Validar documentos enviados: ver documento, aprovar ou rejeitar com notas",
          "Consultar Painel IA SENTINEL: score 3 fases, classificação, recomendação, sumário executivo, pontos positivos, pontos de atenção, red flags",
          "Consultar Findings da IA: cada problema identificado com severidade, evidência, dedução de pontos e recomendação",
          "Consultar Quality Assessments: análise de qualidade textual das respostas (especificidade, coerência, profundidade, linguagem)",
          "Consultar resultados CAF (Liveness, Facematch) e BigDataCorp (KYC, PEP, Sanções)",
          "Aprovar caso (muda status para Aprovado + registra AuditLog + atualiza Merchant)",
          "Recusar caso com motivo (muda status para Recusado + registra AuditLog)",
          "Solicitar documentos adicionais (muda status para Docs Solicitados + notifica merchant)",
          "Dar feedback na decisão da IA Helena (concordo/discordo) para melhorar o modelo"
        ]} />

        <ActivityBlock title="Gestão de Templates e Regras" icon={Settings} color="bg-amber-50 text-amber-700" items={[
          "Criar e editar Templates de Questionário com drag-and-drop de perguntas",
          "Configurar lógica condicional: exibir pergunta X apenas se resposta Y = Z",
          "Definir risk weights por pergunta (0-50 pts) e risk values por opção SELECT",
          "Definir riskThresholds por template: limiares de auto-aprovar/rejeitar/revisão manual",
          "Configurar documentos obrigatórios por template com lógica condicional",
          "Versionar templates (V1, V2...) mantendo histórico",
          "Criar Regras de Compliance: tipo (auto_approve, auto_reject, flag, escalate, notify, assign), condições e ações",
          "Simular regra antes de ativar (simulateComplianceRule)",
          "Acompanhar histórico de execuções por regra",
          "Usar IA para sugerir perguntas para templates (suggestQuestionsAI)"
        ]} />

        <ActivityBlock title="Integrações e Validações" icon={Lock} color="bg-cyan-50 text-cyan-700" items={[
          "Configurar integrações CAF e BigDataCorp (ambiente sandbox/production, URLs, serviços habilitados)",
          "Testar conexão com provedores externos",
          "Consultar logs de integração: request/response/score/duração/erros por chamada",
          "Acompanhar métricas da Helena IA: total análises, taxa de acerto, feedback loop",
          "Configurar revalidações periódicas: tipo (periódica, risco, regulatória, manual), frequência (mensal, trimestral, semestral, anual)",
          "Receber alertas de revalidações atrasadas"
        ]} />

        <ActivityBlock title="Auditoria e Conformidade" icon={ClipboardList} color="bg-red-50 text-red-700" items={[
          "Consultar Auditoria completa: todas as ações (CREATE/UPDATE/DELETE/VIEW/APPROVAL/REJECTION/VALIDATION)",
          "Filtrar logs por entidade, tipo de ação, período e responsável",
          "Rastrear quem fez o quê e quando em 100% das operações do sistema",
          "Gerar PDFs de questionário e compliance para evidência regulatória",
          "Baixar documentos de casos para arquivamento"
        ]} />

        <BenefitBlock title="Benefícios para o Time de Compliance" items={[
          "IA SENTINEL analisa automaticamente em 3 fases, reduzindo 80% do tempo de análise manual",
          "Score 0-1000 em 3 dimensões (Questionário, Validações Externas, Geral) dá granularidade fina de risco",
          "Findings com 6 níveis de severidade permitem priorizar problemas críticos imediatamente",
          "Quality Assessments detectam respostas evasivas ou de baixa qualidade automaticamente",
          "Dashboard com 20+ KPIs fornece visão executiva instantânea do estado de compliance",
          "Regras automatizadas reduzem decisões manuais em casos de baixo risco",
          "Auditoria 100% garante rastreabilidade total para reguladores",
          "Revalidações programáveis garantem compliance contínuo após aprovação",
          "Integração CAF + BigDataCorp cruza dados declarados vs externos automaticamente",
          "Templates versionáveis permitem evolução dos questionários sem perder histórico",
          "Feedback loop com a IA Helena melhora a precisão do modelo continuamente",
          "Actionable Insights proativos alertam sobre gargalos antes que virem problemas"
        ]} />
      </PersonaCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* C-LEVEL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <PersonaCard
        icon={TrendingUp} color="bg-gradient-to-br from-amber-500 to-orange-600" gradient="bg-gradient-to-r from-amber-600 to-orange-500"
        name="C-Level / Diretoria" role="CEO, CFO, COO, VP Compliance, VP Comercial, Head de Operações"
        description="Utiliza a plataforma para visão estratégica, tomada de decisão baseada em dados, acompanhamento de performance da operação e garantia de conformidade regulatória. Não opera no dia a dia, mas consulta dashboards e métricas para decisões estratégicas."
      >
        <ActivityBlock title="Visão Estratégica e KPIs" icon={PieChart} color="bg-amber-50 text-amber-700" items={[
          "Consultar Home para visão 360° da operação: leads ativos, propostas abertas, compliance pendente",
          "Verificar saudação personalizada com resumo do dia (leads, propostas, casos)",
          "Analisar tendência de leads e propostas ao longo do tempo",
          "Ver resumo do Pipeline Comercial com valor de TPV e receita estimada por estágio",
          "Acompanhar Status de Propostas: quantas em rascunho, enviadas, aceitas, recusadas",
          "Ver Compliance Summary: distribuição de decisões Helena e status dos casos",
          "Consultar Atividade Recente: últimas ações no sistema para auditoria rápida"
        ]} />

        <ActivityBlock title="Métricas de Compliance" icon={Shield} color="bg-blue-50 text-blue-700" items={[
          "Dashboard de Compliance: 20+ KPIs executivos em tempo real",
          "Taxa de Aprovação Automática IA: % de casos resolvidos sem intervenção humana → eficiência operacional",
          "Tempo Médio de Conclusão: tempo desde submissão até decisão final → SLA operacional",
          "Taxa de Rejeição: % de casos recusados → saúde da base de clientes",
          "Taxa de Conversão: % de visitantes que completam o onboarding → eficácia do processo",
          "Score Médio da Carteira: saúde geral do portfólio de merchants",
          "Distribuição de Risco: quantos merchants em cada faixa (Baixo/Médio/Alto/Crítico) → exposição total",
          "Tendência IA vs Manual: evolução da automação ao longo dos meses",
          "Top Causas de Reprovação: entender por que merchants são recusados para ajustar estratégia",
          "Distribuição de Scores SENTINEL por faixa: visão de qualidade do pipeline"
        ]} />

        <ActivityBlock title="Métricas Comerciais" icon={DollarSign} color="bg-green-50 text-green-700" items={[
          "Pipeline Comercial: valor total de TPV em cada estágio do funil",
          "Receita estimada por estágio: TPV × 2,5% para projeção de receita",
          "Taxa de conversão do funil: de lead até contrato assinado",
          "Métricas de propostas: total enviadas, aceitas, recusadas, expiradas",
          "Análise por Empresa: visão consolidada de todas as propostas por CNPJ/empresa",
          "Performance de Introducers: quais parceiros geram mais leads e conversões",
          "Aging Alerts: leads que estão demorando demais em um estágio → gargalos operacionais"
        ]} />

        <ActivityBlock title="Governança e Auditoria" icon={Lock} color="bg-red-50 text-red-700" items={[
          "Auditoria completa de 100% das ações realizadas no sistema por qualquer usuário",
          "Rastreabilidade total: quem aprovou, quem recusou, quem alterou, quando e por quê",
          "Logs de integração com provedores externos (CAF, BigDataCorp) com request/response",
          "Taxa de acerto da IA Helena (feedback dos analistas) para avaliar confiabilidade do modelo",
          "Revalidações programadas para garantir compliance contínuo da base aprovada",
          "Regras de compliance automatizadas para garantir consistência nas decisões"
        ]} />

        <BenefitBlock title="Benefícios para o C-Level" items={[
          "Visão 360° instantânea da operação sem precisar pedir relatórios",
          "KPIs em tempo real eliminam delay na tomada de decisão estratégica",
          "Pipeline com valor financeiro (TPV/receita) permite projeção de receita acurada",
          "Score médio da carteira e distribuição de risco mostram exposição total da empresa",
          "Taxa de automação IA mostra ROI direto da tecnologia na operação",
          "Auditoria 100% garante compliance com reguladores (BACEN, PLD/FT) em caso de inspeção",
          "Tendências históricas permitem identificar melhorias ou deteriorações antes que se tornem críticas",
          "Performance de Introducers mostra ROI dos canais de aquisição",
          "Tempo de conclusão e taxa de conversão medem eficiência operacional",
          "Top Causas de Reprovação ajudam a refinar critérios de risco e política comercial"
        ]} />
      </PersonaCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MERCHANT / CLIENTE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <PersonaCard
        icon={Building2} color="bg-[#1356E2]" gradient="bg-gradient-to-r from-[#1a8f6e] to-[#1356E2]"
        name="Merchant (Cliente)" role="Empresa que deseja se credenciar como merchant de pagamentos"
        description="O merchant é o cliente final que utiliza as páginas públicas da plataforma para preencher questionários, receber e aceitar propostas comerciais, completar o processo de compliance/KYC e assinar contratos. Toda a experiência é 100% digital, mobile-first e com auto-save."
      >
        <ActivityBlock title="Questionário de Lead" icon={ClipboardList} color="bg-green-50 text-green-700" items={[
          "Receber link de questionário (via e-mail, WhatsApp, Introducer ou site)",
          "Preencher dados da empresa com autocomplete CNPJ (versão v2.0 preenche 14 campos automaticamente)",
          "Informar tipo de negócio (Merchant, Gateway, Marketplace), volume transacional (TPV), ticket médio",
          "Informar taxas atuais da concorrência para comparação",
          "Informar dados de contato (nome, cargo, e-mail, telefone)",
          "Receber protocolo único de acompanhamento",
          "Se veio via Introducer: lead automaticamente vinculado ao parceiro"
        ]} />

        <ActivityBlock title="Proposta Comercial" icon={FileText} color="bg-blue-50 text-blue-700" items={[
          "Receber link público da proposta (via e-mail ou WhatsApp)",
          "Visualizar proposta completa: taxas por bandeira × faixa de parcelamento, PIX, boleto, fees, antecipação, TPV mínimo",
          "Consultar tabela de simulação de parcelas com valor líquido por bandeira e faixa",
          "Aceitar proposta digitalmente com um clique (inicia compliance automaticamente)",
          "Enviar contraproposta com alterações desejadas (valor, prazo, etc.)",
          "Recusar proposta com motivo justificado",
          "Imprimir/exportar proposta para análise offline"
        ]} />

        <ActivityBlock title="Compliance / KYC" icon={Shield} color="bg-purple-50 text-purple-700" items={[
          "Receber link de onboarding de compliance (direcionado ao fluxo correto: PIX, Full, Lite, etc.)",
          "Preencher questionário de compliance multi-step com barra de progresso",
          "Progresso salvo automaticamente — pode retomar de onde parou usando ComplianceResume",
          "Upload de documentos obrigatórios (RG, CNPJ, Contrato Social, Balanço, DRE, PLD, etc.)",
          "Realizar verificação biométrica (Liveness + Facematch) em 7 estágios",
          "Receber confirmação de envio com prazo estimado de análise (3 dias úteis)",
          "Receber notificação de aprovação/solicitação de documentos adicionais"
        ]} />

        <ActivityBlock title="Contrato" icon={Scale} color="bg-amber-50 text-amber-700" items={[
          "Receber link público do contrato para assinatura digital",
          "Visualizar contrato completo: dados, módulos, taxas, SLAs, cláusulas",
          "Assinar contrato digitalmente"
        ]} />

        <BenefitBlock title="Benefícios para o Merchant" items={[
          "Processo 100% digital: sem papelada, sem agências, sem burocracia presencial",
          "Autocomplete CNPJ preenche 14 campos automaticamente — menos digitação, mais agilidade",
          "Auto-save garante que nenhum dado é perdido se fechar o navegador",
          "Mobile-first: pode completar todo o processo pelo celular",
          "Barra de progresso visual mostra exatamente em que ponto do processo está",
          "Proposta transparente com todas as taxas detalhadas por bandeira e faixa",
          "Tabela de parcelas mostra valor líquido real que receberá",
          "Aceite digital elimina impressão, assinatura física e envio de PDFs",
          "Prazo definido de 3 dias úteis para análise de compliance",
          "Pode retomar de onde parou a qualquer momento (ComplianceResume)",
          "Verificação biométrica é rápida e guiada com 7 estágios claros"
        ]} />
      </PersonaCard>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* INTRODUCER / PARCEIRO */}
      {/* ═══════════════════════════════════════════════════════ */}
      <PersonaCard
        icon={Handshake} color="bg-purple-600" gradient="bg-gradient-to-r from-purple-700 to-purple-500"
        name="Introducer (Parceiro de Indicação)" role="Agências, Consultores, Revendedores, Parceiros Comerciais"
        description="O Introducer é um parceiro externo que indica novos merchants para a Pin Bank. Pode ser individual (pessoa física) ou empresa. Possui portal exclusivo, landing page co-branded e acompanhamento em tempo real dos leads indicados."
      >
        <ActivityBlock title="Portal do Introducer" icon={BarChart3} color="bg-purple-50 text-purple-700" items={[
          "Acessar IntroducerDashboard exclusivo com login vinculado ao e-mail cadastrado",
          "Visualizar KPIs de performance: total de leads indicados, taxa de conversão, receita potencial gerada",
          "Acompanhar status de cada lead indicado em tempo real (questionário → proposta → compliance → contrato)",
          "Visualizar gráficos de evolução de leads ao longo do tempo",
          "Ver detalhes de cada lead com informações públicas (empresa, status, data)",
          "Compartilhar link da Landing Page para captar novos leads"
        ]} />

        <ActivityBlock title="Landing Page Co-branded" icon={Globe} color="bg-indigo-50 text-indigo-700" items={[
          "Página pública personalizada em /parceiro/:slug (ex: /parceiro/minha-agencia)",
          "Header com logo do Introducer ao lado do logo Pin Bank",
          "Tabela de taxas por segmento configurada pelo admin da Pin Bank para cada Introducer",
          "Calculadora de taxas interativa para o merchant estimar seus custos",
          "Disclaimer de compliance para transparência regulatória",
          "Questionário integrado para captação direta do lead — vinculação automática ao Introducer via referralCode"
        ]} />

        <ActivityBlock title="Tipos de Introducer" icon={UserPlus} color="bg-pink-50 text-pink-700" items={[
          "Individual: pessoa física com CPF, e-mail pessoal, código UTM único",
          "Empresa: PJ com CNPJ, nome fantasia, logo, e-mail/telefone corporativos, slug para Landing Page",
          "Taxa de comissão configurável por Introducer (%)",
          "Status ativo/inativo para controle"
        ]} />

        <BenefitBlock title="Benefícios para o Introducer" items={[
          "Portal exclusivo para acompanhamento em tempo real dos leads indicados",
          "Landing Page co-branded transmite profissionalismo e confiança para o merchant",
          "Tabela de taxas por segmento permite ao merchant comparar e decidir na hora",
          "Calculadora de taxas dá transparência e ajuda na argumentação comercial",
          "Vinculação automática de leads via UTM — sem necessidade de informar manualmente",
          "Acompanhamento end-to-end: sabe se o lead preencheu, recebeu proposta, assinou contrato",
          "KPIs de performance permitem entender qual canal/campanha funciona melhor",
          "Comissão % configurável para monetização das indicações",
          "Zero esforço técnico: tudo pronto, basta compartilhar o link"
        ]} />
      </PersonaCard>

    </div>
  );
}