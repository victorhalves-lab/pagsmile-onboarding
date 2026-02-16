import React, { useState } from 'react';
import { 
  BookOpen, Target, Users, Workflow, Layout, FileText, 
  ChevronDown, ChevronRight, Shield, Brain, Link as LinkIcon,
  ClipboardList, Settings, History, Plug, BarChart3,
  CheckCircle2, AlertTriangle, Clock, ArrowRight, Building2,
  UserCheck, FileSearch, Sparkles, Database, Zap,
  Eye, Camera, Scan, ScanFace, Fingerprint, Mail,
  Lock, Globe, Layers, GitBranch, Activity,
  Flag, RefreshCw, MonitorSmartphone, CircleDot, Server,
  FileUp, FileCheck, AlertCircle, PieChart, TrendingUp,
  Hash, CalendarClock, MessageSquare, Scale,
  Inbox, Search, Download, Filter, ArrowUpDown, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HowItWorks() {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({ id, title, icon: Icon, children, badge, defaultOpen = false }) => {
    const isOpen = expandedSections[id] ?? defaultOpen;
    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mb-4 shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2bc196]/10 rounded-xl">
              <Icon className="w-5 h-5 text-[#2bc196]" />
            </div>
            <h2 className="text-lg font-bold text-[#002443]">{title}</h2>
            {badge && <Badge variant="secondary" className="ml-2 text-xs">{badge}</Badge>}
          </div>
          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </button>
        {isOpen && <div className="px-5 pb-5 pt-0 border-t border-slate-100">{children}</div>}
      </div>
    );
  };

  const FlowStep = ({ number, title, description, icon: Icon, details, color = "bg-[#2bc196]" }) => (
    <div className="flex gap-4 items-start relative">
      <div className={`flex-shrink-0 w-10 h-10 ${color} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10`}>
        {number}
      </div>
      <div className="flex-1 pb-8 border-l-2 border-dashed border-slate-200 pl-6 -ml-5 last:border-0 last:pb-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-[#2bc196]" />}
          <h4 className="font-bold text-[#002443]">{title}</h4>
        </div>
        <p className="text-sm text-[#002443]/70 leading-relaxed">{description}</p>
        {details && (
          <div className="mt-2 pl-4 border-l-2 border-[#2bc196]/20 space-y-1">
            {details.map((d, i) => (
              <p key={i} className="text-xs text-[#002443]/60 flex items-start gap-1.5">
                <CircleDot className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />
                {d}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const FeatureCard = ({ title, description, icon: Icon, items, color = "bg-[#002443]/5" }) => (
    <Card className="h-full border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-xl`}><Icon className="w-5 h-5 text-[#002443]" /></div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">{description}</CardDescription>
        {items && (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#002443]/80">
                <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const PageDetail = ({ name, description, access, funcionalidades, techDetails }) => (
    <div className="border border-slate-200 rounded-xl p-5 hover:border-[#2bc196]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-[#002443] text-base">{name}</h4>
          <p className="text-sm text-[#002443]/60 mt-0.5">{description}</p>
        </div>
        <Badge className={access === 'Público' ? 'bg-blue-100 text-blue-700 border-0' : 'bg-[#002443] text-white border-0'} >
          {access}
        </Badge>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 mb-3">
        <h5 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2.5">Funcionalidades Detalhadas</h5>
        <ul className="space-y-2">
          {funcionalidades.map((f, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-[#002443]/80">
              <ArrowRight className="w-3.5 h-3.5 text-[#2bc196] mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      {techDetails && (
        <div className="bg-[#002443]/5 rounded-xl p-4">
          <h5 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2.5">Detalhes Técnicos</h5>
          <ul className="space-y-1.5">
            {techDetails.map((t, i) => (
              <li key={i} className="text-xs text-[#002443]/60 flex items-start gap-1.5">
                <Hash className="w-3 h-3 text-[#002443]/30 mt-0.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-[#2bc196]/10 rounded-2xl">
            <BookOpen className="w-7 h-7 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#002443]">How It Works</h1>
            <p className="text-[#002443]/60 text-sm">Documentação completa, detalhada e microscópica de todo o sistema de Compliance & Onboarding Pagsmile</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0">6 Módulos</Badge>
          <Badge className="bg-blue-50 text-blue-700 border-0">20+ Páginas</Badge>
          <Badge className="bg-purple-50 text-purple-700 border-0">18 Entidades</Badge>
          <Badge className="bg-orange-50 text-orange-700 border-0">6 Fluxos de Compliance</Badge>
          <Badge className="bg-pink-50 text-pink-700 border-0">3 Integrações IA</Badge>
        </div>
      </div>

      {/* 1. VISÃO ESTRATÉGICA */}
      <Section id="visao" title="1. Visão Estratégica da Solução" icon={Target} defaultOpen={true}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Objetivo Principal</h3>
            <p className="text-white/90 leading-relaxed text-sm">
              Simplificar e automatizar o processo de onboarding e compliance para o setor financeiro de pagamentos,
              garantindo conformidade regulatória (Resolução 3978 BACEN, normas PLD/FT), mitigação de riscos,
              e agilidade na integração de novos merchants (clientes) através de questionários digitais, 
              validações externas (CAF, BigDataCorp), verificação biométrica (Liveness + Facematch),
              e análise inteligente por IA (Helena/SENTINEL).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard title="Eficiência Operacional" description="Redução de 80% no tempo de análise" icon={Zap}
              items={["Automação de processos repetitivos via Regras de Compliance", "Análise automática por IA SENTINEL em 3 fases", "Fluxos 100% digitais sem papel", "Templates reutilizáveis de questionários", "Links de onboarding personalizados com UTM"]} />
            <FeatureCard title="Mitigação de Riscos" description="Identificação proativa de ameaças" icon={Shield}
              items={["Validações externas CAF (Liveness, Facematch, OCR)", "BigDataCorp (KYC empresa, sócios, PEP, sanções)", "Scores de risco em 3 fases (0-1000 cada)", "Red flags e alertas automáticos", "Regras personalizáveis de compliance"]} />
            <FeatureCard title="Conformidade Regulatória" description="Alinhamento total com regulações" icon={CheckCircle2}
              items={["Questionários PLD/FT completos (3978 BACEN)", "Auditoria de 100% das ações (AuditLog)", "Revalidações periódicas programáveis", "Identificação de UBO (Beneficiário Final)", "Listas restritivas (OFAC/ONU/PEP)"]} />
            <FeatureCard title="Visibilidade Total" description="Controle completo para gestores" icon={BarChart3}
              items={["Dashboard com 12+ KPIs em tempo real", "Funil de conversão (link → submissão → aprovação)", "Distribuição de risco por faixa", "Analytics por link de onboarding com UTM", "Exportação CSV de dados"]} />
          </div>
        </div>
      </Section>

      {/* 2. ARQUITETURA DOS FLUXOS */}
      <Section id="fluxos" title="2. Fluxos Completos da Aplicação" icon={Workflow} badge="6 Variantes">
        <Tabs defaultValue="merchant" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="merchant">Jornada do Merchant</TabsTrigger>
            <TabsTrigger value="interno">Jornada Interna</TabsTrigger>
            <TabsTrigger value="ia">Fluxo da IA SENTINEL</TabsTrigger>
          </TabsList>

          <TabsContent value="merchant">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-bold text-[#002443] mb-1 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Jornada Completa do Merchant — Onboarding Público
                </h3>
                <p className="text-sm text-[#002443]/60 mb-6">Fluxo end-to-end desde o recebimento do link até a conclusão. Existem 6 variantes de fluxo: PIX, Full KYC, Lite, E-commerce, SaaS e Genérico.</p>
                
                <div className="space-y-1">
                  <FlowStep number="1" title="Recebimento do Link de Onboarding" icon={LinkIcon}
                    description="O merchant recebe um link exclusivo gerado pelo time comercial, contendo código único, tipo de compliance (PIX/FULL/LITE/SAAS/ECOMMERCE), template de questionário, e parâmetros UTM para rastreamento de origem."
                    details={[
                      "Formato: /ComplianceOnboardingStart?ref=<uniqueCode>",
                      "O código é armazenado em localStorage para vincular ao caso",
                      "Cada link possui métricas: cliques, submissões, conversões",
                      "Links podem ter data de expiração configurável",
                      "O campo complianceType determina qual fluxo o merchant seguirá"
                    ]} />
                  <FlowStep number="2" title="Página Inicial — ComplianceOnboardingStart" icon={MonitorSmartphone}
                    description="O merchant acessa a página inicial e visualiza as opções de operação disponíveis, determinadas pelo tipo de compliance do link. Cada opção leva a um questionário diferente com profundidade variável."
                    details={[
                      "Se complianceType=PIX → redireciona para CompliancePixOnly",
                      "Se complianceType=FULL → redireciona para ComplianceFullKYC",
                      "Se complianceType=LITE → redireciona para ComplianceLite",
                      "Se complianceType=SAAS → redireciona para ComplianceSaaS",
                      "Se complianceType=ECOMMERCE → redireciona para ComplianceEcommerce",
                      "Se GENERIC → merchant escolhe entre as opções disponíveis",
                      "Analytics de 'link_click' e 'page_view' são registrados automaticamente"
                    ]} />
                  <FlowStep number="3" title="Preenchimento do Questionário Dinâmico" icon={ClipboardList}
                    description="Questionário multi-step com perguntas carregadas dinamicamente do template. Cada fluxo tem perguntas específicas e lógica condicional entre elas. O progresso é salvo automaticamente."
                    details={[
                      "PIX: ~13 steps (identificação, CNPJ, tipo empresa, endereço, atividade, volume, clientes, responsável, SAC, compliance, PLD sanções, PLD riscos, confirmação)",
                      "Full KYC: ~19+ steps (tudo do PIX + UBO, sócios, licenciamento, marketplace, segurança cartão, PLD avançado com políticas/KYC/monitoramento/governança)",
                      "Lite: ~12 steps (identificação, endereço, descrição, modelo negócio, entrega, estrutura societária, UBO, atividade, PEP, riscos, exterior, declarações)",
                      "E-commerce: ~14 steps (identificação, sócios/governança, representante, PEP/sanções, perfil transacional, flags de modelo, PLD/FT, declarações, módulos extras)",
                      "SaaS: Perguntas customizadas para plataformas SaaS",
                      "Tipos de pergunta: TEXT, NUMBER, DATE, SELECT, MULTI_SELECT, FILE_UPLOAD, BOOLEAN, EMAIL, PHONE, CPF_CNPJ",
                      "Perguntas podem ter lógica condicional (dependsOn: questionId, operator, value)",
                      "Progresso salvo em localStorage a cada mudança de step",
                      "Analytics de 'page_complete' registrado a cada step finalizado"
                    ]} />
                  <FlowStep number="4" title="Upload de Documentos" icon={FileUp}
                    description="Após concluir o questionário, o merchant é direcionado para a página de upload de documentos. Os documentos obrigatórios variam conforme o template de questionário e suas configurações."
                    details={[
                      "Documentos são definidos no campo 'requiredDocuments' do QuestionnaireTemplate",
                      "Cada documento tem: label, documentTypeId, required (obrigatório/opcional), conditionalLogic",
                      "Formatos aceitos: PDF, JPG, JPEG, PNG (configurável por tipo)",
                      "Tamanho máximo: 10MB por arquivo (configurável)",
                      "Upload via integração Core.UploadFile com barra de progresso",
                      "Documentos são opcionais para fins de simulação (fluxo não bloqueia)",
                      "Documentos salvos em localStorage durante o preenchimento",
                      "Ao submeter: cria Merchant + OnboardingCase + QuestionnaireResponses + DocumentUploads"
                    ]} />
                  <FlowStep number="5" title="Verificação de Identidade (Liveness + Facematch)" icon={ScanFace}
                    description="Após submeter os documentos, um modal de Verificação de Identidade aparece automaticamente com um link para a simulação externa de Liveness e Facematch. Este é o passo mais crítico da jornada."
                    details={[
                      "Modal (IdentityVerificationModal) exibe 3 etapas: Prova de Vida, Selfie, Foto do Documento",
                      "Um link de verificação é gerado com sessionId único",
                      "O link pode ser copiado ou aberto diretamente em nova janela",
                      "Ao clicar 'Iniciar Verificação', abre LivenessSimulation em nova aba",
                      "LivenessSimulation tem 7 stages: welcome → liveness_instructions → liveness_scanning (3s auto) → facematch_selfie → facematch_document → processing (3.5s auto) → completed",
                      "Stage 'liveness_scanning': animação de scan facial com círculo tracejado rotativo",
                      "Stage 'processing': checklist progressivo (Prova de vida ✓, Selfie ✓, Comparando faces...)",
                      "Ao completar, envia postMessage para janela pai: {type: 'LIVENESS_COMPLETED', sessionId}",
                      "Modal detecta conclusão via window.addEventListener('message') e atualiza UI",
                      "UI final mostra: Prova de vida validada ✓, Comparação facial aprovada ✓, Documento verificado ✓",
                      "Em produção real: integraria com CAF /v1/liveness/sessions e /v1/facematch"
                    ]} />
                  <FlowStep number="6" title="Conclusão do Onboarding — OnboardingCompletion" icon={CheckCircle2}
                    description="Página final com confirmação de envio, informações sobre próximos passos, e tempo estimado de análise. O caso entra automaticamente na fila do time de compliance."
                    details={[
                      "Exibe mensagem de sucesso com ícone animado",
                      "3 cards de 'Próximos Passos': Análise em Andamento, Notificação por E-mail, Prazo Estimado (3 dias úteis)",
                      "Botão para voltar ao Dashboard (admin)",
                      "Analytics de 'onboarding_complete' registrado",
                      "Sessão de onboarding limpa do sessionStorage",
                      "O OnboardingCase fica com status 'Pendente' aguardando análise"
                    ]} />
                </div>
              </div>

              {/* Variantes de Fluxo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "PIX Only", badge: "bg-blue-100 text-blue-700", steps: "13 steps", docs: "~4 docs", desc: "Fluxo simplificado para habilitação apenas de Pix. Foco em dados básicos, atividade e PLD essencial." },
                  { name: "Full KYC", badge: "bg-purple-100 text-purple-700", steps: "19+ steps", docs: "12+ docs", desc: "KYC completo com UBO, sócios, licenciamento, marketplace, segurança de cartão, PLD avançado." },
                  { name: "Lite", badge: "bg-teal-100 text-teal-700", steps: "12 steps", docs: "~6 docs", desc: "Versão intermediária com modelo de negócio, estrutura societária, compliance e riscos." },
                  { name: "E-commerce", badge: "bg-orange-100 text-orange-700", steps: "14 steps", docs: "~8 docs", desc: "Especializado para e-commerce com módulos de marketplace, internacional, recorrência, disputas." },
                  { name: "SaaS Fast Track", badge: "bg-violet-100 text-violet-700", steps: "~10 steps", docs: "~4 docs", desc: "Fluxo acelerado para plataformas SaaS com perguntas customizadas." },
                  { name: "Genérico", badge: "bg-slate-100 text-slate-700", steps: "Variável", docs: "Variável", desc: "Merchant escolhe entre opções disponíveis. Flexível para templates customizados." },
                ].map((v, i) => (
                  <Card key={i} className="border-slate-200">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${v.badge} border-0`}>{v.name}</Badge>
                        <span className="text-xs text-[#002443]/50">{v.steps} • {v.docs}</span>
                      </div>
                      <p className="text-xs text-[#002443]/70 leading-relaxed">{v.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interno">
            <div className="bg-[#002443]/5 rounded-2xl p-6 border border-[#002443]/10">
              <h3 className="font-bold text-[#002443] mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#002443]" />
                Jornada Completa do Time Interno — Gestão de Compliance
              </h3>
              <p className="text-sm text-[#002443]/60 mb-6">Fluxo de trabalho do analista de compliance desde a geração do link até a decisão final e revalidação.</p>
              
              <div className="space-y-1">
                <FlowStep number="1" title="Geração de Links (GerarLinkOnboarding)" icon={LinkIcon} color="bg-[#002443]"
                  description="O time comercial ou compliance gera links personalizados para cada merchant potencial."
                  details={[
                    "Seleção de template de questionário existente (PIX, Full, Lite, etc.)",
                    "Escolha do tipo de compliance: PIX, FULL, LITE, ECOMMERCE, SAAS, GENERIC",
                    "Nome do agente comercial para rastreamento",
                    "Parâmetros UTM completos (source, medium, campaign, content)",
                    "Data de expiração opcional",
                    "Código único gerado automaticamente",
                    "Link copiável com um clique",
                    "Histórico completo de links com métricas (cliques, submissões, conversões, taxa de conversão)",
                    "Dashboard de analytics por link individual"
                  ]} />
                <FlowStep number="2" title="Monitoramento via Dashboard (AdminDashboard)" icon={BarChart3} color="bg-[#002443]"
                  description="Acompanhamento em tempo real de todos os KPIs e métricas de compliance."
                  details={[
                    "12+ KPI cards: total de casos, pendentes, em processamento, manual, aprovados, recusados",
                    "Gráfico de Funil de Conversão (Link → Início → Questionário → Docs → Verificação → Aprovação)",
                    "Pizza Helena IA: distribuição Aprovados/Manual/Recusados",
                    "Gráfico de Tendência: evolução temporal de casos",
                    "Distribuição de Score: histograma de scores",
                    "Helena Insights: alertas e recomendações automáticas da IA",
                    "Scores médios da carteira, tempo médio de processamento",
                    "Distribuição de risco: Baixo/Médio/Alto/Crítico",
                    "Tabela de casos recente com busca, filtros e ordenação",
                    "Filtros por: status, tipo merchant, período, score"
                  ]} />
                <FlowStep number="3" title="Análise Automática IA SENTINEL" icon={Brain} color="bg-[#002443]"
                  description="Quando um questionário é submetido, o agente SENTINEL analisa automaticamente o caso em 3 fases sequenciais."
                  details={[
                    "Fase 1 — Questionário: analisa todas as respostas, gera score_questionario (0-1000), classificação, findings e quality assessments",
                    "Fase 2 — Validações Externas: cruza dados CAF + BigDataCorp, gera score_validacao_externa (0-1000)",
                    "Fase 3 — Consolidação: calcula score_geral_composto com bônus de consistência, aplica overrides, gera recomendação final",
                    "Recomendações: Aprovado, Aprovado com Condições, Revisão Manual, Recusado",
                    "Gera: sumário executivo, pontos positivos/atenção, red flags, perguntas sugeridas, docs adicionais",
                    "Nível de confiança da IA (0-100%) indicado em cada análise",
                    "Cada Finding tem: severidade (INFO/LOW/MEDIUM/HIGH/CRITICAL/BLOQUEANTE), evidência, dedução de pontos",
                    "Quality Assessments avaliam: especificidade, coerência, profundidade, linguagem das respostas textuais"
                  ]} />
                <FlowStep number="4" title="Revisão dos Casos (QuestionariosRecebidos)" icon={FileSearch} color="bg-[#002443]"
                  description="O analista acessa a lista completa de questionários recebidos, com filtros avançados e busca."
                  details={[
                    "Tabela com todas as colunas: Merchant, Modelo, Status, Score Fase 1 (SQ), Score Fase 2 (SVE), Score Final (SGC), Tempo na Fila, Analista, Data Submissão",
                    "6 filtros simultâneos: Modelo (Lite/Pix/Full), Tipo Merchant (PF/PJ), Score Helena, Período, Analista, Prioridade",
                    "Busca por nome, CPF/CNPJ, e-mail ou ID",
                    "Ordenação por Merchant, Score, Data",
                    "6 cards de status clicáveis (Total, Pendentes, Processando, Manual, Aprovados, Recusados)",
                    "Paginação com 15 itens por página",
                    "Exportação CSV de todos os dados filtrados",
                    "Cada caso tem botão 'Analisar' que abre a página de Análise de Casos",
                    "Dropdown com opções: Ver Detalhes, Ver Respostas, Enviar E-mail"
                  ]} />
                <FlowStep number="5" title="Análise Detalhada (AnaliseDeCasos)" icon={Eye} color="bg-[#002443]"
                  description="Página completa de análise de um caso específico com todas as informações consolidadas."
                  details={[
                    "Dados completos do Merchant: nome, CNPJ, tipo, e-mail, telefone, data nascimento, status",
                    "Todas as respostas do questionário organizadas por seção",
                    "Documentos enviados com preview e download direto",
                    "Painel de Análise IA (IAAnalysisPanel) com:",
                    "  — Scores das 3 fases com barras visuais",
                    "  — Classificação de risco com cores",
                    "  — Recomendação final destacada",
                    "  — Sumário executivo da IA",
                    "  — Lista de pontos positivos e de atenção",
                    "  — Red flags identificados",
                    "  — Recomendações para revisão manual",
                    "  — Perguntas sugeridas pela IA para investigar",
                    "  — Documentos adicionais sugeridos",
                    "Resultados de validações externas (CAF, BigDataCorp)",
                    "Histórico de auditoria do caso (todas as ações)",
                    "Botões de ação: Aprovar, Recusar, Solicitar Mais Informações"
                  ]} />
                <FlowStep number="6" title="Decisão Final e Pós-Decisão" icon={CheckCircle2} color="bg-[#002443]"
                  description="O analista toma a decisão final com base na análise da IA e sua própria avaliação, desencadeando ações automáticas."
                  details={[
                    "Aprovar: status → 'Aprovado', merchant habilitado, notificação por e-mail, entra no ciclo de revalidação",
                    "Recusar: status → 'Recusado', motivo registrado, notificação por e-mail, AuditLog criado",
                    "Solicitar Docs: status → 'Docs Solicitados', lista de documentos adicionais, notificação",
                    "Todas as ações geram AuditLog automático com: quem, o quê, quando, dados antes/depois",
                    "Feedback do analista sobre a decisão da IA (agree/disagree/partial) para treinamento",
                    "Merchants aprovados entram automaticamente no ciclo de revalidação periódica"
                  ]} />
                <FlowStep number="7" title="Revalidação Periódica (GestaoRevalidacao)" icon={RefreshCw} color="bg-[#002443]"
                  description="Gestão do ciclo de recertificação de merchants já aprovados."
                  details={[
                    "Agendamento de revalidações: periódica, baseada em risco, regulatória, manual",
                    "Frequências: mensal, trimestral, semestral, anual",
                    "Status: pendente, em andamento, concluída, cancelada",
                    "Alerta de revalidações atrasadas",
                    "Tabela com filtros, busca e paginação",
                    "Ações: Iniciar, Concluir, Cancelar revalidação"
                  ]} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ia">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                <h3 className="font-bold text-[#002443] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Fluxo de Análise da IA SENTINEL — 3 Fases
                </h3>
                <p className="text-sm text-[#002443]/60 mb-6">Cada caso de onboarding passa por uma análise automatizada em 3 fases sequenciais que geram scores independentes e uma recomendação final consolidada.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { phase: "1", title: "Questionário", color: "purple", border: "border-purple-200", bg: "bg-white",
                      score: "score_questionario (0-1000)", items: [
                        "Analisa todas as respostas do questionário",
                        "Avalia qualidade textual (especificidade, coerência, profundidade, linguagem)",
                        "Detecta padrões evasivos em respostas",
                        "Identifica findings por seção",
                        "Classifica severidade: INFO → BLOQUEANTE",
                        "Calcula dedução de pontos por finding",
                        "Gera Quality Assessments por campo textual"
                      ]},
                    { phase: "2", title: "Validações Externas", color: "blue", border: "border-blue-200", bg: "bg-white",
                      score: "score_validacao_externa (0-1000)", items: [
                        "Cruza resultados CAF: Liveness score, Facematch similarity, OCR data",
                        "Cruza resultados BigDataCorp: KYC empresa, KYC sócios, faturamento",
                        "Compara dados declarados vs. dados externos",
                        "Verifica listas restritivas (OFAC, ONU, PEP)",
                        "Verifica processos judiciais e dívidas",
                        "Valida endereço e atividade econômica (CNAE/MCC)",
                        "Detecta divergências significativas (> 50%)"
                      ]},
                    { phase: "3", title: "Consolidação", color: "green", border: "border-green-200", bg: "bg-white",
                      score: "score_geral_composto + Decisão", items: [
                        "Combina score_questionario + score_validacao_externa",
                        "Aplica bônus de consistência quando dados convergem",
                        "Aplica overrides para red flags críticos",
                        "Calcula score_geral_composto final",
                        "Gera classificação geral de risco",
                        "Emite recomendação: Aprovado, Aprovado c/ Condições, Revisão Manual, Recusado",
                        "Gera parecer final e relatório completo"
                      ]}
                  ].map((phase, i) => (
                    <div key={i} className={`${phase.bg} rounded-xl p-5 ${phase.border} border`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 bg-${phase.color}-500 text-white rounded-full flex items-center justify-center font-bold text-sm`}>{phase.phase}</div>
                        <h4 className="font-bold text-[#002443]">Fase {phase.phase}: {phase.title}</h4>
                      </div>
                      <div className={`text-xs bg-${phase.color}-100 text-${phase.color}-700 px-3 py-1.5 rounded-lg inline-block mb-3 font-mono`}>
                        → {phase.score}
                      </div>
                      <ul className="space-y-1.5">
                        {phase.items.map((item, j) => (
                          <li key={j} className="text-xs text-[#002443]/70 flex items-start gap-1.5">
                            <CircleDot className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <h4 className="font-bold text-[#002443] mb-3">Entidades Geradas pela IA SENTINEL</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { entity: "ComplianceScore", desc: "Score consolidado com todas as fases, classificações, recomendação final, sumário, pontos positivos/atenção, red flags, análise completa" },
                      { entity: "ComplianceFinding", desc: "Cada problema identificado: título, severidade, evidência, dedução de pontos, recomendação, fase, seção" },
                      { entity: "QualityAssessment", desc: "Avaliação de qualidade de respostas textuais: scores 1-5 em especificidade, coerência, profundidade, linguagem" },
                      { entity: "HelenaAnalysis", desc: "Registro de cada execução da IA: score, decisão, justificativa, fatores, red flags, tempo de processamento, feedback do analista" },
                    ].map((e, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Badge className="bg-purple-100 text-purple-700 font-mono text-xs border-0 shrink-0">{e.entity}</Badge>
                        <p className="text-xs text-[#002443]/70">{e.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Section>

      {/* 3. PERSONAS */}
      <Section id="personas" title="3. Personas e Jornadas" icon={Users} badge="2 Personas">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-[#2bc196]/10 p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#2bc196] rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-[#002443]">Merchant (Cliente Externo)</h3>
                  <p className="text-sm text-[#002443]/60">Empresa que deseja se credenciar na Pagsmile</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-[#002443] text-sm mb-2">Objetivo</h4>
                <p className="text-sm text-[#002443]/70">Completar o processo de onboarding para utilizar serviços de pagamento (Pix, Cartão, etc).</p>
              </div>
              <div>
                <h4 className="font-bold text-[#002443] text-sm mb-2">Páginas Acessadas (Públicas)</h4>
                <div className="space-y-1.5">
                  {["ComplianceOnboardingStart — Escolha do fluxo", "CompliancePixOnly / ComplianceFullKYC / ComplianceLite / ComplianceSaaS / ComplianceEcommerce — Questionários", "DocumentUploadPix / DocumentUploadFull / DocumentUploadLite / DocumentUploadSaaS / DocumentUploadEcommerce — Upload de docs", "LivenessFacematchStep — Geração de link de verificação", "LivenessSimulation — Simulação de Liveness + Facematch", "OnboardingCompletion — Conclusão do processo"].map((p, i) => (
                    <p key={i} className="text-xs text-[#002443]/70 flex items-start gap-2"><Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">Público</Badge>{p}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#002443] text-sm mb-2">Experiência do Usuário</h4>
                <ul className="space-y-1">
                  {["Processo claro e intuitivo com barra de progresso", "Design responsivo (mobile-first)", "Salvamento automático do progresso", "Feedback visual em tempo real", "Documentos opcionais para facilitar simulação"].map((e, i) => (
                    <li key={i} className="text-xs text-[#002443]/60 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-[#002443]/10 p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#002443] rounded-xl flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-[#002443]">Time Interno (Admin/Analista)</h3>
                  <p className="text-sm text-[#002443]/60">Analistas de compliance, gestores e comercial</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-[#002443] text-sm mb-2">Objetivo</h4>
                <p className="text-sm text-[#002443]/70">Gerenciar o pipeline de onboarding, garantir conformidade regulatória, tomar decisões sobre merchants.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#002443] text-sm mb-2">Páginas Acessadas (Admin)</h4>
                <div className="space-y-1.5">
                  {["AdminDashboard — KPIs, gráficos, visão geral", "QuestionariosRecebidos — Lista e filtros de todos os casos", "AnaliseDeCasos — Análise detalhada com painel IA", "GerarLinkOnboarding — Criação de links de onboarding", "TemplatesQuestionarios / EditorQuestionario — Gestão de templates e perguntas", "RegrasDeCompliance — Automação de decisões", "IntegracoesExternas — CAF e BigDataCorp", "HelenaIA — Dashboard da IA com config, histórico, treinamento, logs", "GestaoDocumentos — Validação de documentos por merchant", "GestaoRevalidacao — Revalidação periódica de merchants", "Auditoria — Log completo de todas as ações", "Configuracoes — Ajustes gerais"].map((p, i) => (
                    <p key={i} className="text-xs text-[#002443]/70 flex items-start gap-2"><Badge className="text-[10px] bg-[#002443] text-white border-0 shrink-0 mt-0.5">Admin</Badge>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. TODAS AS PÁGINAS */}
      <Section id="paginas" title="4. Todas as Páginas — Funcionalidades Microscópicas" icon={Layers} badge="25+ Páginas">
        <Tabs defaultValue="publicas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="publicas">Páginas Públicas (Merchant)</TabsTrigger>
            <TabsTrigger value="internas">Páginas Internas (Admin)</TabsTrigger>
          </TabsList>

          <TabsContent value="publicas" className="space-y-4">
            <PageDetail name="ComplianceOnboardingStart" description="Página inicial que direciona o merchant para o fluxo correto" access="Público"
              funcionalidades={[
                "Exibe boas-vindas com logo Pagsmile e gradiente visual",
                "Lê parâmetro ?ref= da URL para identificar o link de onboarding",
                "Armazena o código do link em localStorage ('onboarding_link_code')",
                "Apresenta botões de seleção de método de operação (Pix, Full, Lite, SaaS, E-commerce)",
                "Cada botão tem ícone, título, descrição e badge de tipo",
                "Redireciona para a página de questionário correspondente",
                "Se o link tem complianceType definido, pode pré-selecionar automaticamente",
                "Registra analytics: 'link_click' com metadados (referrer, userAgent, UTMs)"
              ]}
              techDetails={[
                "Componente: SelectionButton para cada opção",
                "Hook: useOnboardingAnalytics para tracking",
                "localStorage keys: 'onboarding_link_code', 'payment_method_type'",
                "Navigate via react-router createPageUrl()"
              ]} />
            
            <PageDetail name="CompliancePixOnly / ComplianceFullKYC / ComplianceLite / ComplianceSaaS / ComplianceEcommerce" description="5 variantes de questionário dinâmico, cada uma com configurações específicas" access="Público"
              funcionalidades={[
                "Cada variante é um wrapper fino que renderiza o componente DynamicQuestionnaire com props específicas",
                "DynamicQuestionnaire busca o template e perguntas via API (QuestionnaireTemplate + Question)",
                "Organiza perguntas em steps lógicos baseados na ordem e agrupamento",
                "Cada step tem título, ícone (mapeado por keywords no texto da pergunta), e lista de perguntas",
                "Tipos de campo renderizados por DynamicQuestionRenderer: Text, Number, Date, Select, Multi_Select, File_Upload, Boolean, Email, Phone, CPF_CNPJ",
                "Lógica condicional: perguntas aparecem/desaparecem baseado em respostas anteriores (dependsOn, operator, value)",
                "Barra de progresso visual com número do step atual e total",
                "Navegação: Anterior / Próximo / Concluir",
                "Salva progresso em localStorage a cada mudança de step",
                "Ao concluir último step, redireciona para página de upload de documentos correspondente",
                "Analytics: 'page_view' e 'page_complete' registrados por step"
              ]}
              techDetails={[
                "Componente principal: components/compliance/DynamicQuestionnaire",
                "Renderer: components/compliance/DynamicQuestionRenderer",
                "Barra: components/compliance/ProgressBar + StepNavigation",
                "localStorage key: configurable (ex: 'compliance_data_pix')",
                "Queries: QuestionnaireTemplate.filter({model, isActive}) + Question.filter({templateId}, 'order')"
              ]} />

            <PageDetail name="DocumentUploadPix / Full / Lite / SaaS / Ecommerce" description="5 variantes de upload de documentos, cada uma vinculada ao seu questionário" access="Público"
              funcionalidades={[
                "Cada variante é um wrapper que renderiza DynamicDocumentUploadPage com props específicas",
                "Carrega lista de documentos obrigatórios do template (requiredDocuments)",
                "Divide documentos em obrigatórios e opcionais",
                "Cada documento mostra: nome, formatos aceitos, tamanho máximo, instruções",
                "Upload com drag & drop e seleção de arquivo via diálogo",
                "Validação de formato (PDF/JPG/PNG) e tamanho (10MB) no frontend",
                "Upload via Core.UploadFile com barra de progresso",
                "Preview do arquivo enviado com botão de remover",
                "Botão 'Concluir Submissão' cria: Merchant, OnboardingCase, QuestionnaireResponses, DocumentUploads",
                "Após submissão bem-sucedida, abre automaticamente o modal de Verificação de Identidade",
                "Modal (IdentityVerificationModal) permite gerar link de verificação, copiar, ou abrir simulação",
                "Documentos são opcionais para facilitar simulação end-to-end"
              ]}
              techDetails={[
                "Componente: components/compliance/DynamicDocumentUploadPage",
                "Uploader: components/compliance/DynamicDocumentUploader",
                "Modal: components/compliance/IdentityVerificationModal",
                "Cria entidades: Merchant.create(), OnboardingCase.create(), QuestionnaireResponse.bulkCreate(), DocumentUpload.bulkCreate()",
                "limpa localStorage após submissão bem-sucedida"
              ]} />

            <PageDetail name="LivenessSimulation" description="Simulação completa do fluxo de verificação biométrica em 7 estágios" access="Público"
              funcionalidades={[
                "Stage 1 — Welcome: Ícone shield verde, título 'Verificação de Identidade', 3 itens (Prova de Vida, Selfie, Foto do Documento), botão 'Iniciar Verificação'",
                "Stage 2 — Liveness Instructions: Ícone user azul, instruções (Sorria, Mova a cabeça), dica de iluminação, botão 'Iniciar Captura'",
                "Stage 3 — Liveness Scanning: Círculo tracejado verde rotativo com ícone scan, 'Escaneando...' + 'Mantenha o rosto centralizado', spinner verde, AUTO-AVANÇA em 3s",
                "Stage 4 — Facematch Selfie: Ícone câmera roxo, área de captura tracejada com ícone user, 'Posicione seu rosto no centro', botão 'Capturar Selfie'",
                "Stage 5 — Facematch Document: Ícone document amber, área tracejada com ícone file, 'Fotografe a frente do seu RG ou CNH', botão 'Capturar Documento'",
                "Stage 6 — Processing: Spinner grande verde, checklist progressivo (Prova de vida ✓, Selfie ✓, Comparando faces... ⟳), AUTO-AVANÇA em 3.5s",
                "Stage 7 — Completed: Ícone check verde, 'Verificação Concluída!', 3 itens verdes (Prova de vida validada, Comparação facial aprovada, Documento verificado), botão 'Fechar Janela'",
                "Barra de progresso no topo com porcentagem por stage",
                "Card branco com cantos arredondados sobre fundo escuro",
                "Ao completar: envia postMessage({type: 'LIVENESS_COMPLETED', sessionId}) para janela pai"
              ]}
              techDetails={[
                "Recebe ?sessionId= via URL params",
                "useEffect com setTimeout para auto-avanço dos stages de loading",
                "window.opener.postMessage para comunicação com janela pai",
                "window.close() ao clicar 'Fechar Janela'",
                "7 STAGES constantes com id, progress, title"
              ]} />

            <PageDetail name="OnboardingCompletion" description="Página final de conclusão com próximos passos" access="Público"
              funcionalidades={[
                "Fundo gradient escuro (002443 → 001020) para destaque",
                "Ícone de sucesso grande (CheckCircle2) com glow verde",
                "Título: 'Onboarding Concluído!' em branco",
                "Card translúcido com 3 próximos passos:",
                "  — Análise em Andamento (ícone Clock)",
                "  — Notificação por E-mail (ícone Mail)",
                "  — Prazo Estimado: 3 dias úteis (ícone Shield)",
                "Botão 'Ir para o Dashboard'",
                "Registra analytics 'onboarding_complete'",
                "Limpa sessionStorage de sessão"
              ]}
              techDetails={[
                "Hook: useOnboardingAnalytics({pageName, flowType, linkCode})",
                "localStorage keys lidos: 'onboarding_link_code', 'payment_method_type'",
                "sessionStorage limpa: 'onboarding_session_id'"
              ]} />
          </TabsContent>

          <TabsContent value="internas" className="space-y-4">
            <PageDetail name="AdminDashboard" description="Dashboard principal de compliance com KPIs, gráficos e tabela de casos" access="Admin"
              funcionalidades={[
                "Busca 6 tipos de dados: OnboardingCase, ComplianceScore, Merchant, HelenaAnalysis, DocumentUpload, OnboardingAnalytics",
                "KPI Cards: Total de Casos, Pendentes, Processando, Revisão Manual, Aprovados, Recusados",
                "Comparison Cards: Taxa de Aprovação, Taxa de Rejeição, Score Médio, Tempo Médio",
                "Gráfico de Funil: Link → Início → Questionário → Docs → Verificação → Aprovação",
                "Pizza Helena IA: Aprovados vs Manual vs Recusados",
                "Linha de Tendência: casos por período",
                "Distribuição de Score: histograma por faixa",
                "Helena Insights: alertas e recomendações",
                "Score Overview: scores médios por fase",
                "Distribuição de Risco: cards Baixo/Médio/Alto/Crítico",
                "Tabela de casos com filtros (status, tipo, período), busca, ordenação, links de ação"
              ]}
              techDetails={[
                "6 queries React Query em paralelo",
                "~250 linhas de cálculo de métricas",
                "Componentes de gráficos: KPICard, ComplianceFunnelChart, HelenaStatusPieChart, TrendLineChart, ScoreDistributionChart, HelenaInsightsAlerts, ComplianceScoresOverview, RiskDistributionCards",
                "Recharts: PieChart, BarChart, LineChart, AreaChart"
              ]} />

            <PageDetail name="QuestionariosRecebidos" description="Lista completa e filtrável de todos os casos de onboarding" access="Admin"
              funcionalidades={[
                "Busca 5 entidades: OnboardingCase, ComplianceScore, Merchant, User, QuestionnaireTemplate, OnboardingLink",
                "6 cards de status clicáveis que funcionam como filtros rápidos (Total, Pendentes, Processando, Manual, Aprovados, Recusados)",
                "7 filtros simultâneos: Modelo (Lite/Pix/Full), Tipo Merchant (PF/PJ), Score Helena (Baixo/Médio/Alto), Período (Hoje/Semana/Mês), Analista, Prioridade (Crítica/Alta/Média/Baixa), + busca textual",
                "Tabela com 10 colunas: Merchant, Modelo, Status, Fase 1 (SQ), Fase 2 (SVE), Final (SGC), Tempo na Fila, Analista, Submissão, Ações",
                "Ordenação por Merchant, Score Final, Data de Submissão",
                "Paginação com 15 itens/página",
                "Exportação CSV completa dos dados filtrados",
                "Botão 'Analisar' → navega para AnaliseDeCasos?id=caseId",
                "Dropdown de ações: Ver Detalhes, Ver Respostas, Enviar E-mail",
                "Tempo na Fila calculado em tempo real (colore em laranja se > 1 dia)"
              ]}
              techDetails={[
                "Mapeamento com useMemo: merchantMap, scoresMap, templatesMap, linksMap",
                "Função getCaseModel() determina modelo por link ou template",
                "Função getTimeInQueue() calcula diff entre now e created_date",
                "CSV gerado no frontend com Blob + download automático"
              ]} />

            <PageDetail name="GerarLinkOnboarding" description="Criação e gestão de links de onboarding com analytics" access="Admin"
              funcionalidades={[
                "Formulário de criação com: Template de questionário (select), Tipo de compliance (PIX/FULL/LITE/ECOMMERCE/SAAS/GENERIC), Nome do agente comercial, UTM Source/Medium/Campaign/Content, Data de expiração",
                "Links genéricos rápidos: botões para cada tipo de compliance",
                "Link personalizado com código único (nanoid-like)",
                "Cópia do link com um clique + feedback visual",
                "Histórico de todos os links criados com métricas por link:",
                "  — Cliques, Submissões, Completados, Taxa de conversão",
                "Dashboard de analytics expandível por link individual",
                "Botão de abrir link em nova aba",
                "Botão de excluir link"
              ]}
              techDetails={[
                "OnboardingLink.create() com uniqueCode gerado",
                "Função getCompliancePageRoute() mapeia tipo → página",
                "Componente LinkAnalyticsDashboard para analytics detalhado",
                "Estatísticas agregadas: totalLinks, totalClicks, totalSubmissions, totalCompleted, avgConversionRate"
              ]} />

            <PageDetail name="TemplatesQuestionarios + EditorQuestionario" description="Gestão completa de templates de questionários e suas perguntas" access="Admin"
              funcionalidades={[
                "Lista de todos os QuestionnaireTemplates com cards visuais",
                "Criação/edição de template: nome, descrição, tipo merchant (PF/PJ), modelo, versão, ativo/inativo",
                "Definição de documentos obrigatórios por template (requiredDocuments)",
                "Editor de perguntas (Question): texto, tipo, ordem, opções, obrigatório, placeholder, helpText",
                "Lógica condicional entre perguntas (dependsOn, operator, value)",
                "Peso de risco por pergunta (riskWeight 0-100)",
                "Mapeamento de valores de risco (riskValues: {opção: impacto})",
                "Regras de validação (minLength, maxLength, minValue, maxValue, pattern)",
                "Reordenação de perguntas via drag & drop",
                "Preview do questionário"
              ]}
              techDetails={[
                "Componentes: QuestionList, QuestionFormDialog, TemplateDocumentsList, DocumentFormDialog",
                "Entidades: QuestionnaireTemplate, Question, DocumentType",
                "Biblioteca @hello-pangea/dnd para drag & drop"
              ]} />

            <PageDetail name="GestaoDocumentos" description="Validação de documentos organizados por merchant" access="Admin"
              funcionalidades={[
                "Agrupa todos os DocumentUploads por Merchant",
                "5 cards de estatísticas: Merchants, Total Docs, Pendentes, Validados, Rejeitados",
                "Accordion expandível por merchant com indicador de status (borda colorida)",
                "Cada merchant mostra: nome, CNPJ, tipo, contagem de docs e badges de status",
                "Cada documento mostra: nome do tipo, arquivo original, data, ícone por formato, status",
                "Ações por documento: Visualizar (link externo), Aprovar (CheckCircle), Rejeitar (XCircle)",
                "Dialog de rejeição com campo obrigatório de motivo",
                "Filtro por status (Pendentes/Validados/Rejeitados) + busca por nome/CNPJ"
              ]}
              techDetails={[
                "Mutation: DocumentUpload.update(id, {validationStatus, validationNotes})",
                "Agrupamento com reduce por merchantId via caseMap",
                "Componente Accordion do Radix UI"
              ]} />

            <PageDetail name="IntegracoesExternas" description="Configuração e monitoramento de CAF e BigDataCorp" access="Admin"
              funcionalidades={[
                "5 abas: Visão Geral, CAF, BigDataCorp, Webhooks, Logs",
                "Visão Geral: 2 cards (CAF + BDC) com status ativo/inativo, ambiente, último teste, botão de testar conexão",
                "CAF: Configuração de API Token, Template ID, Ambiente (sandbox/prod)",
                "  — 6 serviços togglable: Face Liveness, Facematch, Face Auth, Document OCR, Documentoscopy, Onboarding Web",
                "  — Tabela de mapeamento microscópico: documento → endpoint → o que valida",
                "BigDataCorp: Access Token, Webhook Key, Ambiente",
                "  — 8 datasets togglable: Dados Básicos, KYC Empresa, KYC Sócios, Relacionamentos, Indicadores, MCC, Prova de Vida, Biometria",
                "  — Tabela de mapeamento: pergunta do questionário → endpoint BDC → ação e resultado",
                "Webhooks: URLs configuráveis para CAF e BDC, webhook secret, eventos suportados",
                "Logs: Tabela de todas as chamadas com: data, provedor, serviço, status, resultado, duração"
              ]}
              techDetails={[
                "Entidades: IntegrationConfig, IntegrationLog",
                "cafConfig e bdcConfig via filter por provider",
                "Simulação de teste de conexão com setTimeout"
              ]} />

            <PageDetail name="HelenaIA" description="Dashboard completo da IA com 5 abas de funcionalidades" access="Admin"
              funcionalidades={[
                "Aba Dashboard: 8 KPI cards (Volume, Taxa Aprovação/Rejeição/Manual, Taxa Acerto, Score Médio, Tempo Resposta, Pendentes)",
                "  — Gráfico Pizza: Distribuição por Status Helena",
                "  — Gráfico Barras: Distribuição de Scores",
                "  — Gráfico Linhas: Tendência IA vs Manual",
                "  — Gráfico: Top Causas de Reprovação",
                "  — Cards: Distribuição de Risco (Baixo/Médio/Alto/Crítico)",
                "  — Barra visual de limiares de decisão (Recusar < X < Manual < Y < Aprovar)",
                "Aba Configuração: Sliders para limiares de aprovação/rejeição automática",
                "  — Pesos dos fatores: Cadastral, Financeiro, PLD, Documentos, Externas (devem somar 100%)",
                "Aba Histórico: Tabela com últimas 20 análises (Data, Caso, Score, Decisão, Tempo, Feedback)",
                "Aba Treinamento: 4 cards de feedback (Concordâncias, Discordâncias, Comentários, Taxa Acerto)",
                "  — Textarea editável com prompt base da Helena (instruções, matriz de risco, fontes, output)",
                "Aba Logs: Cards expandíveis de cada análise com: justificativa, fatores positivos/risco, red flags, tempo"
              ]}
              techDetails={[
                "Entidades: HelenaAnalysis, OnboardingCase",
                "Recharts: PieChart, BarChart, LineChart, AreaChart",
                "Componentes reutilizáveis: KPICard, TrendLineChart, TopRejectionReasonsChart, RiskDistributionCards",
                "Cálculos complexos com useMemo para performance"
              ]} />

            <PageDetail name="RegrasDeCompliance" description="Motor de regras para automação de decisões de compliance" access="Admin"
              funcionalidades={[
                "4 cards de estatísticas: Total, Ativas, Inativas, Execuções Total",
                "Lista de regras como cards com: nome, tipo (badge colorido), prioridade, descrição",
                "  — Condições resumidas em badges mono (campo operador valor)",
                "  — Estatísticas por regra: nº de execuções, última execução",
                "  — Toggle ativar/desativar inline",
                "  — Botões Editar e Excluir",
                "6 tipos de ação: Auto-aprovar, Auto-rejeitar, Revisão Manual, Solicitar Docs, Notificação, Adicionar Flag",
                "Dialog de edição com: nome, tipo, descrição, prioridade (1-100), operador lógico (AND/OR)",
                "Condições dinâmicas: campo (Score, Tipo Merchant, Status, Decisão IA, etc.) + operador (8 opções) + valor",
                "Adicionar/remover condições",
                "Dialog de confirmação de exclusão"
              ]}
              techDetails={[
                "Entidade: ComplianceRule",
                "Mutations: create, update, delete, toggle (isActive)",
                "7 campos de condição: riskScore, merchant.type, status, iaDecision, validationsCompleted, bigDataCorpCompleted, cafCompleted",
                "8 operadores: equals, not_equals, greater_than, less_than, gte, lte, contains, in"
              ]} />

            <PageDetail name="GestaoRevalidacao" description="Agendamento e gestão de revalidações periódicas de merchants aprovados" access="Admin"
              funcionalidades={[
                "6 cards: Total, Pendentes, Em Andamento, Concluídas, Este Mês, Atrasadas",
                "Tabela: Merchant, Data Programada, Tipo, Frequência, Status, Ações",
                "Destaque visual de revalidações atrasadas (fundo vermelho, badge 'Atrasada')",
                "Dialog de agendamento: select de merchant aprovado, data, tipo (periódica/risco/regulatória/manual), frequência (mensal/trimestral/semestral/anual), observações",
                "Ações: Iniciar (→ in_progress), Concluir (→ completed), Cancelar (→ cancelled)",
                "Filtro por status + busca por merchant",
                "Paginação com 15 itens/página"
              ]}
              techDetails={[
                "Entidade: RevalidationSchedule",
                "Apenas merchants com onboardingStatus='Aprovado' aparecem no select",
                "Cálculo de overdue: status=pending + scheduledDate < now"
              ]} />

            <PageDetail name="Auditoria" description="Log completo de todas as ações do sistema" access="Admin"
              funcionalidades={[
                "Lista todos os AuditLogs ordenados por data",
                "Filtros: entidade, tipo de ação, usuário, período",
                "Detalhes: quem realizou, o quê fez, quando, valores antes/depois",
                "Tipos de ação: CREATE, UPDATE, DELETE, VIEW, APPROVAL, REJECTION, VALIDATION",
                "Exportação para compliance",
                "IP e User-Agent registrados quando disponíveis"
              ]}
              techDetails={["Entidade: AuditLog", "Campos: entityName, entityId, actionType, actionDescription, changedBy, changeDate, details, ipAddress, userAgent"]} />

            <PageDetail name="Configuracoes" description="Ajustes gerais do sistema" access="Admin"
              funcionalidades={["Gestão de usuários e convites", "Permissões e roles (admin/user)", "Configurações de notificação", "Preferências do sistema"]}
              techDetails={["Entidade User com roles: admin, user"]} />
          </TabsContent>
        </Tabs>
      </Section>

      {/* 5. ENTIDADES */}
      <Section id="entidades" title="5. Modelo de Dados — 18 Entidades" icon={Database} badge="18 Entidades">
        <div className="space-y-4">
          {[
            { category: "Core do Onboarding", color: "border-l-[#2bc196]", entities: [
              { name: "Merchant", desc: "Dados do cliente (PF/PJ): CNPJ, nome, e-mail, telefone, status onboarding, score de risco, serviços de pagamento" },
              { name: "OnboardingCase", desc: "Caso de onboarding: merchantId, templateId, status (6 opções), scores, decisão IA, analista, prioridade, SLA, red flags, linkId" },
              { name: "OnboardingLink", desc: "Link gerado: uniqueCode, templateId, agente comercial, UTMs, expiração, ativo, métricas (cliques/submissões/completados), complianceType" },
            ]},
            { category: "Questionários", color: "border-l-purple-500", entities: [
              { name: "QuestionnaireTemplate", desc: "Template: nome, modelo (pix/full/lite/ecommerce/saas), tipo merchant, versão, documentos obrigatórios, limiares de risco" },
              { name: "Question", desc: "Pergunta: templateId, ordem, texto, tipo (10 tipos), opções, obrigatório, lógica condicional, peso de risco, regras de validação" },
              { name: "QuestionnaireResponse", desc: "Resposta: caseId, questionId, valueText/Number/Boolean/Array, cópia do texto e tipo da pergunta" },
            ]},
            { category: "Documentos", color: "border-l-orange-500", entities: [
              { name: "DocumentType", desc: "Tipo de documento: nome, formatos aceitos, tamanho máximo, tipo merchant, obrigatório, lógica condicional, instruções" },
              { name: "DocumentUpload", desc: "Documento enviado: caseId, typeId, nome, fileUrl, fileName, fileSize, fileType, data, status validação, notas" },
            ]},
            { category: "Análise IA (SENTINEL)", color: "border-l-pink-500", entities: [
              { name: "ComplianceScore", desc: "Score consolidado: caseId, versão agente, scores 3 fases (0-1000 cada), bônus consistência, score geral, classificação, recomendação, sumário, red flags, análise completa, nível confiança" },
              { name: "ComplianceFinding", desc: "Finding individual: scoreId, caseId, fase, seção, fonte externa, severidade (6 níveis), título, descrição, evidência, dedução, recomendação" },
              { name: "QualityAssessment", desc: "Qualidade de resposta: scoreId, caseId, campo avaliado, texto mascarado, scores 1-5 (especificidade, coerência, profundidade, linguagem), classificação total, padrões evasivos" },
              { name: "HelenaAnalysis", desc: "Execução da IA: caseId, merchantId, tipo análise, status, score 0-100, decisão, justificativa, breakdown por categoria, fatores +/-, red flags, fontes, tempo, feedback analista" },
            ]},
            { category: "Validações Externas", color: "border-l-cyan-500", entities: [
              { name: "ExternalValidationResult", desc: "Resultado: caseId, provedor (CAF/BigDataCorp/Doc), tipo validação, endpoint, resultData JSON, score, status, erro, timestamp, tempo resposta" },
              { name: "IntegrationConfig", desc: "Configuração: provedor, nome, ativo, ambiente (sandbox/prod), URLs, webhook, template ID, serviços habilitados, settings, último teste" },
              { name: "IntegrationLog", desc: "Log de chamada: caseId, merchantId, provedor, serviço (20+ tipos), request/response/callback payloads, scores, red flags, duração, status" },
            ]},
            { category: "Gestão e Auditoria", color: "border-l-slate-500", entities: [
              { name: "ComplianceRule", desc: "Regra de automação: nome, tipo (6 tipos), prioridade, condições dinâmicas, operador lógico, ações, ativa, execuções" },
              { name: "RevalidationSchedule", desc: "Agendamento: merchantId, data, tipo (4 tipos), frequência (4 opções), status, notas, triggeredBy" },
              { name: "AuditLog", desc: "Log de auditoria: entidade, entityId, ação (7 tipos), descrição, quem, quando, detalhes (antes/depois), IP, userAgent" },
              { name: "OnboardingAnalytics", desc: "Analytics: linkId, sessionId, eventType (6 tipos), página, step, totalSteps, flowType, merchantId, caseId, metadados (UTM, referrer, tempo)" },
            ]},
          ].map((cat, i) => (
            <div key={i}>
              <h4 className="font-bold text-[#002443] text-sm mb-2 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cat.color.replace('border-l-', 'bg-')}`} />
                {cat.category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {cat.entities.map((e, j) => (
                  <div key={j} className={`p-3 border-l-4 ${cat.color} bg-slate-50 rounded-r-lg`}>
                    <Badge className="bg-[#002443] text-white font-mono text-xs border-0 mb-1.5">{e.name}</Badge>
                    <p className="text-xs text-[#002443]/70 leading-relaxed">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. INTEGRAÇÕES */}
      <Section id="integracoes" title="6. Integrações e Tecnologias" icon={Plug} badge="3 Provedores">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50/50 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base text-purple-900">CAF (Combate à Fraude)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Face Liveness (prova de vida ativa/passiva)", "Facematch (comparação 1:1 selfie vs documento)", "Face Authentication (autenticação com registro prévio)", "Document OCR (extração de dados de documentos)", "Documentoscopy (validação de autenticidade)", "Onboarding Web (fluxo hospedado completo)", "API: /v1/liveness/sessions, /v1/facematch, /v1/documents/analyze"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/50 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base text-blue-900">BigDataCorp</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Dados Básicos Empresa (CNPJ, status, abertura)", "KYC Empresa (processos, dívidas, OFAC/ONU)", "KYC Sócios (PEP, mídia negativa, antecedentes)", "Relacionamentos (quadro societário, UBO)", "Indicadores de Atividade (faturamento estimado)", "MCC/Categoria (merchant category code)", "Endereços, Telefones, E-mails, Domínios", "Prova de Vida e Biometria Facial via SDK"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardHeader className="bg-green-50/50 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base text-green-900">Helena IA (SENTINEL)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Análise automática em 3 fases", "Score de risco 0-1000 por fase", "Recomendação: Aprovado/Condições/Manual/Recusado", "Findings com severidade e evidência", "Quality Assessment de respostas textuais", "Detecção de padrões evasivos", "Sumário executivo e parecer final", "Feedback loop com analistas para melhoria contínua"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl text-center">
        <p className="text-sm text-white/70">
          Documentação Completa do Sistema de Compliance & Onboarding Pagsmile • Versão 2.0 • {new Date().toLocaleDateString('pt-BR')}
        </p>
        <p className="text-xs text-white/40 mt-1">
          6 Módulos • 25+ Páginas • 18 Entidades • 6 Fluxos de Compliance • 3 Integrações Externas • IA SENTINEL em 3 Fases
        </p>
      </div>
    </div>
  );
}