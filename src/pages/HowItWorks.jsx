import React, { useState } from 'react';
import { 
  BookOpen, Target, Users, Workflow, FileText, 
  ChevronDown, ChevronRight, Shield, Brain, Link as LinkIcon,
  ClipboardList, Settings, History, Plug, BarChart3,
  CheckCircle2, AlertTriangle, Clock, ArrowRight, Building2,
  UserCheck, FileSearch, Sparkles, Database, Zap,
  Eye, Camera, ScanFace, Mail,
  Lock, Globe, Layers, GitBranch, Activity,
  Flag, RefreshCw, MonitorSmartphone, CircleDot, Server,
  FileUp, FileCheck, AlertCircle, PieChart, TrendingUp,
  Hash, CalendarClock, MessageSquare, Scale,
  Inbox, Search, Download, Filter, ArrowUpDown, ExternalLink,
  Stamp, CreditCard, ShoppingCart, Cpu, Network, 
  DollarSign, Phone, Star, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuestionnaireSection from '../components/howitworks/QuestionnaireSection';
import LeadsPropostasSection from '../components/howitworks/LeadsPropostasSection';
import ContratosSection from '../components/howitworks/ContratosSection';

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
            <p className="text-[#002443]/60 text-sm">Raio-X completo e microscópico de todo o sistema de Compliance, Onboarding, Leads, Propostas e Contratos da Pagsmile</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0">8 Módulos</Badge>
          <Badge className="bg-blue-50 text-blue-700 border-0">30+ Páginas</Badge>
          <Badge className="bg-purple-50 text-purple-700 border-0">22+ Entidades</Badge>
          <Badge className="bg-orange-50 text-orange-700 border-0">9 Fluxos de Compliance</Badge>
          <Badge className="bg-pink-50 text-pink-700 border-0">3 Integrações IA</Badge>
          <Badge className="bg-red-50 text-red-700 border-0">3 Templates Compliance (Merchant/Gateway/Marketplace)</Badge>
          <Badge className="bg-cyan-50 text-cyan-700 border-0">305+ Perguntas</Badge>
          <Badge className="bg-amber-50 text-amber-700 border-0">48 Documentos Obrigatórios</Badge>
        </div>
      </div>

      {/* 1. VISÃO ESTRATÉGICA */}
      <Section id="visao" title="1. Visão Estratégica da Solução" icon={Target} defaultOpen={true}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Objetivo Principal</h3>
            <p className="text-white/90 leading-relaxed text-sm mb-4">
              Simplificar e automatizar o ciclo completo de onboarding, compliance e gestão comercial para o setor financeiro de pagamentos,
              garantindo conformidade regulatória (Resolução 3978 BACEN, normas PLD/FT), mitigação de riscos,
              e agilidade na integração de novos merchants (clientes) através de questionários digitais diferenciados por tipo de negócio (Merchant, Gateway, Marketplace),
              validações externas (CAF, BigDataCorp), verificação biométrica (Liveness + Facematch),
              análise inteligente por IA (Helena/SENTINEL), gestão de propostas comerciais e contratos automatizados.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Leads & Qualificação', desc: 'Captação, questionários públicos, qualificação por IA PRISCILA e Lead Qualifier' },
                { label: 'Pipeline Comercial', desc: 'Kanban drag-and-drop com 7 estágios, métricas de receita e conversão' },
                { label: 'Propostas & Contratos', desc: 'Geração de propostas com taxas, aceite digital e contratos automatizados' },
                { label: 'Compliance KYC/KYB', desc: '9 fluxos de compliance, 3 templates especializados, 305+ perguntas' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs font-bold text-[#5cf7cf]">{item.label}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard title="Eficiência Operacional" description="Redução de 80% no tempo de análise" icon={Zap}
              items={["Automação via Regras de Compliance", "Análise automática IA SENTINEL em 3 fases", "Fluxos 100% digitais", "Templates reutilizáveis", "Links com UTM", "Pipeline Kanban com drag-and-drop", "Propostas e contratos automatizados"]} />
            <FeatureCard title="Mitigação de Riscos" description="Identificação proativa de ameaças" icon={Shield}
              items={["CAF: Liveness, Facematch, OCR", "BigDataCorp: KYC empresa, sócios, PEP, sanções", "Scores de risco 0-1000 em 3 fases", "Red flags e alertas automáticos", "Regras personalizáveis de compliance", "3 templates com risk weights diferenciados", "Limiares customizáveis por template"]} />
            <FeatureCard title="Conformidade Regulatória" description="Alinhamento total com regulações" icon={CheckCircle2}
              items={["Questionários PLD/FT completos (3978 BACEN)", "Auditoria de 100% das ações (AuditLog)", "Revalidações periódicas programáveis", "Identificação de UBO (Beneficiário Final)", "Listas restritivas (OFAC/ONU/PEP)", "Due Diligence de sub-merchants/sellers", "Cláusulas de compliance em contratos"]} />
            <FeatureCard title="Visibilidade Total" description="Controle completo para gestores" icon={BarChart3}
              items={["Dashboard com 12+ KPIs em tempo real", "Funil de conversão completo", "Pipeline com métricas de receita", "Analytics por link de onboarding", "Distribuição de risco por faixa", "Métricas de propostas e contratos", "Exportação CSV de dados"]} />
          </div>
        </div>
      </Section>

      {/* 2. MÓDULO LEADS & PROPOSTAS */}
      <Section id="leads" title="2. Módulo: Leads & Propostas" icon={Inbox} badge="6 Funcionalidades">
        <LeadsPropostasSection />
      </Section>

      {/* 3. MÓDULO CONTRATOS */}
      <Section id="contratos" title="3. Módulo: Contratos" icon={Stamp} badge="Geração Automática">
        <ContratosSection />
      </Section>

      {/* 4. QUESTIONÁRIOS DE COMPLIANCE — RAIO X MICROSCÓPICO */}
      <Section id="questionarios" title="4. Questionários de Compliance — Raio-X Microscópico" icon={ClipboardList} badge="Merchant • Gateway • Marketplace">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
            <h3 className="text-lg font-bold mb-2">3 Templates Especializados de Compliance</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              Cada template foi desenhado para o perfil de risco específico do tipo de negócio. Compartilham as Seções A–J (tronco comum)
              e se diferenciam nas seções finais: Merchant tem a Seção K de Governança/Perfil Operacional; Gateway adiciona Due Diligence de Sub-Merchants,
              Segurança de Cartão e Perfil Transacional expandido; Marketplace adiciona Onboarding de Sellers, Contratos, Monitoramento contínuo e Perfil Transacional.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-[#5cf7cf]">84</p>
                <p className="text-[10px] text-white/60">Perguntas Merchant</p>
                <p className="text-[10px] text-white/40">12 seções • 13 docs</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-red-300">111</p>
                <p className="text-[10px] text-white/60">Perguntas Gateway</p>
                <p className="text-[10px] text-white/40">12+ seções • 19 docs</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-amber-300">110</p>
                <p className="text-[10px] text-white/60">Perguntas Marketplace</p>
                <p className="text-[10px] text-white/40">12+ seções • 16 docs</p>
              </div>
            </div>
          </div>
          <QuestionnaireSection />
        </div>
      </Section>

      {/* 5. FLUXOS COMPLETOS */}
      <Section id="fluxos" title="5. Fluxos Completos da Aplicação" icon={Workflow} badge="9 Variantes">
        <Tabs defaultValue="merchant_flow" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="merchant_flow">Jornada do Merchant</TabsTrigger>
            <TabsTrigger value="interno">Jornada Interna</TabsTrigger>
            <TabsTrigger value="ia">Fluxo da IA SENTINEL</TabsTrigger>
          </TabsList>

          <TabsContent value="merchant_flow">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-bold text-[#002443] mb-1 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Jornada Completa do Merchant — Onboarding Público
                </h3>
                <p className="text-sm text-[#002443]/60 mb-6">Fluxo end-to-end desde o recebimento do link até a conclusão. Existem 9 variantes: PIX, Full KYC, Lite, E-commerce, SaaS, Genérico + 3 novos templates especializados (Merchant, Gateway, Marketplace).</p>
                
                <div className="space-y-1">
                  <FlowStep number="1" title="Recebimento do Link de Onboarding" icon={LinkIcon}
                    description="O merchant recebe um link exclusivo gerado pelo time comercial, contendo código único, tipo de compliance, template de questionário, e parâmetros UTM para rastreamento de origem."
                    details={[
                      "Formato: /ComplianceOnboardingStart?ref=<uniqueCode>",
                      "O código é armazenado em localStorage para vincular ao caso",
                      "Cada link possui métricas: cliques, submissões, conversões",
                      "Links podem ter data de expiração configurável",
                      "O campo complianceType determina qual fluxo o merchant seguirá",
                      "Tipos: PIX, FULL, LITE, ECOMMERCE, SAAS, GENERIC",
                      "Templates especializados: Merchant (venda direta), Gateway (sub-merchants), Marketplace (sellers)"
                    ]} />
                  <FlowStep number="2" title="Seleção do Fluxo — ComplianceOnboardingStart" icon={MonitorSmartphone}
                    description="Página inicial onde o merchant visualiza as opções disponíveis e é direcionado ao questionário correspondente ao seu tipo de negócio."
                    details={[
                      "PIX → CompliancePixOnly (13 steps, foco essencial)",
                      "FULL → ComplianceFullKYC (19+ steps, completo)",
                      "LITE → ComplianceLite (12 steps, intermediário)",
                      "SaaS → ComplianceSaaS (~10 steps, acelerado)",
                      "E-commerce → ComplianceEcommerce (14 steps, e-commerce)",
                      "Merchant → ComplianceMerchant (12 seções, 84 perguntas, venda direta)",
                      "Gateway → ComplianceGateway (12+ seções, 111 perguntas, sub-merchants)",
                      "Marketplace → ComplianceMarketplace (12+ seções, 110 perguntas, sellers)",
                      "GENERIC → merchant escolhe entre as opções",
                      "Analytics de 'link_click' e 'page_view' registrados automaticamente"
                    ]} />
                  <FlowStep number="3" title="Preenchimento do Questionário Dinâmico" icon={ClipboardList}
                    description="Questionário multi-step com perguntas carregadas dinamicamente do template. Cada fluxo tem seções específicas com lógica condicional, risk weights e validações. Progresso salvo automaticamente."
                    details={[
                      "Componente DynamicQuestionnaire renderiza perguntas por step/seção",
                      "10 tipos de campo: TEXT, NUMBER, DATE, SELECT, MULTI_SELECT, FILE_UPLOAD, BOOLEAN, EMAIL, PHONE, CPF_CNPJ",
                      "Lógica condicional: perguntas dependem de respostas anteriores (dependsOn + operator + value)",
                      "Risk weights por pergunta (0-50 pts) para cálculo de score",
                      "Risk values por opção SELECT para scoring granular",
                      "Seções comuns A-J: Cadastral, Atividade, UBO, Representante, PLD, Sanções, Licenças, Histórico, KYC, Monitoramento",
                      "Seções diferenciadas: K (Merchant: Governança), K (Gateway: Sub-Merchants+PCI), K/M (Marketplace: Sellers+Monitoramento)",
                      "PARTE IV: Declarações formais + dados do responsável pelo preenchimento",
                      "Progresso salvo em localStorage a cada mudança de step",
                      "Analytics de 'page_complete' registrado por step"
                    ]} />
                  <FlowStep number="4" title="Upload de Documentos" icon={FileUp}
                    description="Após o questionário, upload dos documentos obrigatórios definidos no template. Quantidade varia: Merchant (13), Gateway (19), Marketplace (16)."
                    details={[
                      "Docs definidos em 'requiredDocuments' do QuestionnaireTemplate",
                      "Obrigatórios comuns: RG/CNH, Selfie+CAF, Comprovante Endereço, CNPJ, Contrato Social, Balanço, DRE, Balancete, Política PLD, Política KYC",
                      "Gateway adiciona: PCI DSS, Contrato sub-merchants, Política onboarding sub-merchants, Amostra base, Política fraudes, Organograma",
                      "Marketplace adiciona: Contrato sellers, Política onboarding sellers, Amostra base sellers",
                      "Formatos: PDF, JPG, JPEG, PNG (10MB max por arquivo)",
                      "Upload via Core.UploadFile com barra de progresso",
                      "Ao submeter: cria Merchant + OnboardingCase + QuestionnaireResponses + DocumentUploads"
                    ]} />
                  <FlowStep number="5" title="Verificação de Identidade (Liveness + Facematch)" icon={ScanFace}
                    description="Modal de verificação biométrica com 7 estágios: welcome → instruções → scanning (3s) → selfie → documento → processing (3.5s) → completed."
                    details={[
                      "Modal IdentityVerificationModal gera link com sessionId único",
                      "LivenessSimulation com 7 stages com animações e auto-avanço",
                      "Prova de vida ativa com scan facial animado",
                      "Comparação 1:1 selfie vs. documento (Facematch)",
                      "Comunicação via window.postMessage entre janelas",
                      "Em produção: integração real com CAF /v1/liveness e /v1/facematch"
                    ]} />
                  <FlowStep number="6" title="Conclusão — OnboardingCompletion" icon={CheckCircle2}
                    description="Confirmação de envio, próximos passos e prazo estimado. O caso entra na fila de análise do time de compliance."
                    details={[
                      "Próximos Passos: Análise em Andamento, Notificação por E-mail, Prazo 3 dias úteis",
                      "Analytics de 'onboarding_complete' registrado",
                      "OnboardingCase fica com status 'Pendente' aguardando análise IA SENTINEL"
                    ]} />
                </div>
              </div>

              {/* Variantes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "PIX Only", badge: "bg-blue-100 text-blue-700", steps: "13 steps", docs: "~4 docs", desc: "Habilitação Pix. Dados básicos, atividade, PLD essencial." },
                  { name: "Full KYC", badge: "bg-purple-100 text-purple-700", steps: "19+ steps", docs: "12+ docs", desc: "KYC completo: UBO, sócios, licenciamento, marketplace, segurança cartão, PLD avançado." },
                  { name: "Lite", badge: "bg-teal-100 text-teal-700", steps: "12 steps", docs: "~6 docs", desc: "Intermediário: modelo negócio, estrutura societária, compliance, riscos." },
                  { name: "E-commerce", badge: "bg-orange-100 text-orange-700", steps: "14 steps", docs: "~8 docs", desc: "Módulos marketplace, internacional, recorrência, disputas." },
                  { name: "SaaS Fast Track", badge: "bg-violet-100 text-violet-700", steps: "~10 steps", docs: "~4 docs", desc: "Acelerado para plataformas SaaS." },
                  { name: "Genérico", badge: "bg-slate-100 text-slate-700", steps: "Variável", docs: "Variável", desc: "Merchant escolhe entre opções. Templates customizados." },
                  { name: "Merchant (Novo)", badge: "bg-blue-100 text-blue-800", steps: "12 seções", docs: "13 docs", desc: "Venda Direta. 84 perguntas. Risco BAIXO. Limiares 30/80." },
                  { name: "Gateway (Novo)", badge: "bg-red-100 text-red-800", steps: "12+ seções", docs: "19 docs", desc: "Sub-merchants. 111 perguntas. Risco ALTO. Limiares 40/85. PCI DSS." },
                  { name: "Marketplace (Novo)", badge: "bg-amber-100 text-amber-800", steps: "12+ seções", docs: "16 docs", desc: "Sellers. 110 perguntas. Risco MÉDIO. Limiares 35/80. Monitoramento contínuo." },
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
              <p className="text-sm text-[#002443]/60 mb-6">Fluxo do analista desde a geração do link até a decisão final e revalidação.</p>
              
              <div className="space-y-1">
                <FlowStep number="1" title="Geração de Links (GerarLinkOnboarding + LinksCompliance + LinksQuestionariosLeads)" icon={LinkIcon} color="bg-[#002443]"
                  description="O time gera links personalizados para cada merchant/lead com template, tipo de compliance, UTMs e agente comercial."
                  details={[
                    "3 páginas de gestão de links: Leads, Compliance e Onboarding geral",
                    "Quick links por tipo de compliance (PIX, FULL, LITE, etc.)",
                    "Quick links por template especializado (Merchant, Gateway, Marketplace)",
                    "Métricas por link: cliques, submissões, conversões, taxa",
                    "Dashboard de analytics por link individual",
                    "Histórico completo com filtros e busca"
                  ]} />
                <FlowStep number="2" title="Monitoramento via Dashboard (AdminDashboard + Home)" icon={BarChart3} color="bg-[#002443]"
                  description="Acompanhamento em tempo real de KPIs, gráficos e métricas de compliance, leads e propostas."
                  details={[
                    "Dashboard Compliance: 12+ KPI cards, Funil de Conversão, Pizza Helena, Tendência, Distribuição Score",
                    "Home: Resumo de Compliance, Pipeline Comercial, Status de Propostas, Ações Rápidas, Atividade Recente",
                    "Helena Insights: alertas e recomendações automáticas",
                    "Distribuição de Risco: Baixo/Médio/Alto/Crítico",
                    "Tabela de casos com busca, filtros, ordenação, exportação CSV"
                  ]} />
                <FlowStep number="3" title="Análise Automática IA SENTINEL" icon={Brain} color="bg-[#002443]"
                  description="Quando um questionário é submetido, o agente SENTINEL analisa automaticamente em 3 fases."
                  details={[
                    "Fase 1 — Questionário: score_questionario (0-1000), findings por seção, quality assessments",
                    "Fase 2 — Validações Externas: score_validacao_externa (0-1000), cruzamento CAF + BigDataCorp",
                    "Fase 3 — Consolidação: score_geral_composto + bônus consistência + overrides + decisão final",
                    "Recomendações: Aprovado, Aprovado com Condições, Revisão Manual, Recusado",
                    "Findings: INFO/LOW/MEDIUM/HIGH/CRITICAL/BLOQUEANTE com evidência e dedução de pontos",
                    "Quality Assessments: especificidade, coerência, profundidade, linguagem (1-5 cada)"
                  ]} />
                <FlowStep number="4" title="Revisão (QuestionariosRecebidos → AnaliseDeCasos)" icon={FileSearch} color="bg-[#002443]"
                  description="Lista filtrável de todos os casos com navegação para análise detalhada por caso."
                  details={[
                    "Tabela com 10 colunas: Merchant, Modelo, Status, Score F1/F2/Final, Tempo Fila, Analista, Data, Ações",
                    "7 filtros simultâneos + busca + ordenação + paginação (15/página)",
                    "Exportação CSV",
                    "Análise Detalhada: dados merchant, respostas, docs, painel IA, validações externas, auditoria",
                    "Botões: Aprovar, Recusar, Solicitar Docs"
                  ]} />
                <FlowStep number="5" title="Gestão Comercial (PipelineComercial + Propostas + Contratos)" icon={DollarSign} color="bg-[#002443]"
                  description="Pipeline Kanban, criação de propostas e geração de contratos integrados."
                  details={[
                    "Pipeline: 7 colunas, drag-and-drop, métricas TPV e receita por coluna",
                    "Propostas: taxas por bandeira, antecipação, validade, link público, aceite/recusa",
                    "Contratos: geração automática, cláusulas, módulos, SLAs, preços, assinatura digital"
                  ]} />
                <FlowStep number="6" title="Revalidação Periódica (GestaoRevalidacao)" icon={RefreshCw} color="bg-[#002443]"
                  description="Ciclo de recertificação de merchants aprovados com agendamento configurável."
                  details={[
                    "Tipos: periódica, baseada em risco, regulatória, manual",
                    "Frequências: mensal, trimestral, semestral, anual",
                    "Alertas de revalidações atrasadas"
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
                <p className="text-sm text-[#002443]/60 mb-6">Cada caso passa por análise automatizada em 3 fases com scores independentes e recomendação consolidada.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { phase: "1", title: "Questionário", color: "purple", border: "border-purple-200", bg: "bg-white",
                      score: "score_questionario (0-1000)", items: [
                        "Analisa todas as respostas do questionário",
                        "Avalia qualidade textual (especificidade, coerência, profundidade, linguagem)",
                        "Detecta padrões evasivos",
                        "Identifica findings por seção com severidade",
                        "Calcula dedução de pontos por finding",
                        "Gera Quality Assessments por campo textual",
                        "Considera risk weights e risk values das perguntas"
                      ]},
                    { phase: "2", title: "Validações Externas", color: "blue", border: "border-blue-200", bg: "bg-white",
                      score: "score_validacao_externa (0-1000)", items: [
                        "Cruza resultados CAF: Liveness, Facematch, OCR",
                        "Cruza resultados BigDataCorp: KYC empresa, sócios, faturamento",
                        "Compara dados declarados vs. dados externos",
                        "Verifica listas restritivas (OFAC, ONU, PEP)",
                        "Verifica processos judiciais e dívidas",
                        "Valida CNAE/MCC",
                        "Detecta divergências significativas (> 50%)"
                      ]},
                    { phase: "3", title: "Consolidação", color: "green", border: "border-green-200", bg: "bg-white",
                      score: "score_geral_composto + Decisão", items: [
                        "Combina scores das 2 fases",
                        "Aplica bônus de consistência",
                        "Aplica overrides para red flags críticos",
                        "Calcula score final consolidado",
                        "Classifica risco geral",
                        "Emite recomendação final",
                        "Gera parecer e relatório completo"
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
                  <h4 className="font-bold text-[#002443] mb-3">Entidades Geradas pela IA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { entity: "ComplianceScore", desc: "Score consolidado 3 fases, classificações, recomendação, sumário executivo, pontos +/-, red flags, análise completa, confiança" },
                      { entity: "ComplianceFinding", desc: "Cada problema: título, severidade (6 níveis), fase, seção, evidência, dedução, recomendação" },
                      { entity: "QualityAssessment", desc: "Qualidade textual: scores 1-5 em especificidade, coerência, profundidade, linguagem, padrões evasivos" },
                      { entity: "HelenaAnalysis", desc: "Execução IA: score 0-100, decisão, justificativa, breakdown, fatores, red flags, fontes, feedback analista" },
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

      {/* 6. PERSONAS */}
      <Section id="personas" title="6. Personas e Jornadas" icon={Users} badge="3 Personas">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { icon: Building2, color: "bg-[#2bc196]", name: "Merchant (Cliente Externo)", desc: "Empresa que deseja se credenciar", 
              pages: ["ComplianceOnboardingStart", "CompliancePixOnly/FullKYC/Lite/SaaS/Ecommerce", "ComplianceMerchant/Gateway/Marketplace", "DocumentUpload (5 variantes)", "LivenessSimulation", "OnboardingCompletion", "LeadQuestionnaire + LeadSuccess", "PropostaPublica", "ContratoPublico", "QuestionarioSimplificadoPublico"],
              ux: ["Processo intuitivo com barra de progresso", "Design responsivo (mobile-first)", "Auto-save do progresso", "Feedback visual em tempo real"] },
            { icon: Users, color: "bg-[#3B82F6]", name: "Time Comercial", desc: "Agentes comerciais e gestores de vendas",
              pages: ["Home — Visão geral e ações rápidas", "LinksQuestionariosLeads — Links de questionários de lead", "QuestionariosLeads — Questionários recebidos de leads", "PipelineComercial — Kanban drag-and-drop", "GestaoPropostas — Todas as propostas", "CriarProposta — Nova proposta", "GestaoContratos / CriarContrato — Contratos", "MessageTemplates — Templates de comunicação"],
              ux: ["Pipeline visual com métricas de receita", "Qualificação automática por IA", "Propostas com link público", "Contratos automatizados"] },
            { icon: Shield, color: "bg-[#002443]", name: "Time de Compliance (Admin)", desc: "Analistas, gestores e auditores",
              pages: ["AdminDashboard — KPIs e gráficos", "LinksCompliance — Links de compliance", "QuestionariosRecebidos — Casos de compliance", "AnaliseDeCasos — Análise detalhada + IA", "GestaoDocumentos — Validação de docs", "TemplatesQuestionarios + EditorQuestionario", "RegrasDeCompliance — Automação", "IntegracoesExternas — CAF + BDC", "HelenaIA — Dashboard da IA", "GestaoRevalidacao — Revalidação", "Auditoria — Logs completos", "Configuracoes — Ajustes"],
              ux: ["12+ KPIs em tempo real", "IA SENTINEL em 3 fases", "Regras automáticas", "Auditoria 100%"] },
          ].map((persona, i) => (
            <Card key={i} className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 ${persona.color} rounded-xl flex items-center justify-center`}><persona.icon className="w-5 h-5 text-white" /></div>
                  <div>
                    <CardTitle className="text-sm">{persona.name}</CardTitle>
                    <p className="text-[10px] text-[#002443]/50">{persona.desc}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-[#002443]/40 uppercase mb-1">Páginas</p>
                  <div className="space-y-0.5">
                    {persona.pages.map((p, j) => (
                      <p key={j} className="text-[10px] text-[#002443]/60 flex items-start gap-1"><ArrowRight className="w-2.5 h-2.5 text-[#2bc196] mt-0.5 shrink-0" />{p}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#002443]/40 uppercase mb-1">UX</p>
                  {persona.ux.map((u, j) => (
                    <p key={j} className="text-[10px] text-[#002443]/60 flex items-start gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-[#2bc196] mt-0.5 shrink-0" />{u}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* 7. MODELO DE DADOS */}
      <Section id="entidades" title="7. Modelo de Dados Completo" icon={Database} badge="22+ Entidades">
        <div className="space-y-4">
          {[
            { category: "Core do Onboarding", color: "border-l-[#2bc196]", entities: [
              { name: "Merchant", desc: "PF/PJ: CNPJ, nome, e-mail, telefone, status onboarding (5 opções), score, serviços" },
              { name: "OnboardingCase", desc: "Caso: merchantId, templateId, status (6 opções), scores 3 fases, decisão IA, analista, prioridade, SLA, red flags" },
              { name: "OnboardingLink", desc: "Link: uniqueCode, templateId, agente, UTMs, expiração, métricas, complianceType, linkType" },
            ]},
            { category: "Questionários", color: "border-l-purple-500", entities: [
              { name: "QuestionnaireTemplate", desc: "Template: nome, modelo, tipo merchant, subCategory (MERCHAN/GATEWAY/MARKETPLACE), versão, requiredDocuments, riskThresholds" },
              { name: "Question", desc: "Pergunta: templateId, ordem, texto, tipo (10), opções, obrigatório, conditionalLogic, riskWeight, riskValues, validationRules" },
              { name: "QuestionnaireResponse", desc: "Resposta: caseId, questionId, valueText/Number/Boolean/Array, cópia texto e tipo" },
            ]},
            { category: "Documentos", color: "border-l-orange-500", entities: [
              { name: "DocumentType", desc: "Tipo: nome, formatos, tamanho max, tipo merchant, obrigatório, conditionalLogic, instruções" },
              { name: "DocumentUpload", desc: "Upload: caseId, typeId, fileUrl, fileName, fileSize, fileType, status validação, notas" },
            ]},
            { category: "Análise IA", color: "border-l-pink-500", entities: [
              { name: "ComplianceScore", desc: "Score 3 fases (0-1000 cada), bônus, score geral, classificação, recomendação, sumário, red flags, confiança" },
              { name: "ComplianceFinding", desc: "Finding: severidade (6 níveis), fase, seção, fonte, título, evidência, dedução, recomendação" },
              { name: "QualityAssessment", desc: "Qualidade: scores 1-5 (especificidade, coerência, profundidade, linguagem), padrões evasivos" },
              { name: "HelenaAnalysis", desc: "Análise: score, decisão, justificativa, breakdown, fatores, red flags, fontes, tempo, feedback" },
            ]},
            { category: "Validações Externas", color: "border-l-cyan-500", entities: [
              { name: "ExternalValidationResult", desc: "Resultado: provedor, tipo, endpoint, resultData, score, status, erro, timestamp" },
              { name: "IntegrationConfig", desc: "Config: provedor, ativo, ambiente, URLs, webhook, template, serviços, settings" },
              { name: "IntegrationLog", desc: "Log: provedor, serviço (20+ tipos), request/response/callback, scores, red flags, duração" },
            ]},
            { category: "Leads & Propostas", color: "border-l-blue-500", entities: [
              { name: "Lead", desc: "26 campos: e-mail, nome, CNPJ, status (11 valores), tipo negócio, scores PRISCILA, Lead Qualifier, TPV, protocolo" },
              { name: "LeadActivity", desc: "Atividades: contato, status alterado, proposta enviada, follow-up, nota" },
              { name: "Proposal", desc: "Proposta: leadId, taxas por bandeira, antecipação, status, validade, link público" },
              { name: "Contract", desc: "Contrato: leadId, proposalId, dados cliente, módulos, SLAs, preços, cláusulas, assinatura" },
            ]},
            { category: "Gestão e Auditoria", color: "border-l-slate-500", entities: [
              { name: "ComplianceRule", desc: "Regra: nome, tipo (6), prioridade, condições, operador, ações, ativa, execuções" },
              { name: "RevalidationSchedule", desc: "Agendamento: merchantId, data, tipo (4), frequência (4), status, triggeredBy" },
              { name: "AuditLog", desc: "Auditoria: entidade, entityId, ação (7 tipos), quem, quando, detalhes, IP" },
              { name: "OnboardingAnalytics", desc: "Analytics: linkId, sessionId, eventType (6), página, step, flowType, metadados" },
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

      {/* 8. INTEGRAÇÕES */}
      <Section id="integracoes" title="8. Integrações e Tecnologias" icon={Plug} badge="5 Provedores">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50/50 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base text-purple-900">CAF (Combate à Fraude)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Face Liveness (prova de vida ativa/passiva)", "Facematch (comparação 1:1 selfie vs documento)", "Face Authentication", "Document OCR (extração de dados)", "Documentoscopy (autenticidade)", "Onboarding Web (fluxo hospedado)", "API: /v1/liveness, /v1/facematch, /v1/documents"].map((s, i) => (
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
                {["Dados Básicos Empresa (CNPJ, status)", "KYC Empresa (processos, dívidas, OFAC/ONU)", "KYC Sócios (PEP, mídia negativa)", "Relacionamentos (UBO)", "Indicadores Atividade", "MCC/Categoria", "Endereços, Telefones, E-mails", "Prova de Vida e Biometria"].map((s, i) => (
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
                {["Análise automática em 3 fases", "Score 0-1000 por fase", "Recomendação: Aprovado/Condições/Manual/Recusado", "Findings com severidade", "Quality Assessment textual", "Detecção de padrões evasivos", "Sumário executivo e parecer", "Feedback loop com analistas"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200">
            <CardHeader className="bg-amber-50/50 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base text-amber-900">PRISCILA (Lead Qualifier IA)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Qualificação automática de leads", "Score 0-100 com relatório detalhado", "Classificação: EXCELENTE → INSUFICIENTE", "Decisão: AUTO_APROVAR, AUTO_COM_FLAG, REVISÃO, REJEITAR", "Análise de maturidade do negócio", "Risco PLD/FT do lead"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base text-slate-900">Slack (Notificações)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Notificações automáticas de novos leads", "Alertas de propostas visualizadas/aceitas", "Alertas de SLA de leads", "Notificações de novos casos de compliance", "Integração via Slack Bot com scopes: chat:write, channels:read"].map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* 9. BACKEND FUNCTIONS */}
      <Section id="backend" title="9. Backend Functions e Automações" icon={Server} badge="15+ Functions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "analyzeOnboarding", desc: "Análise SENTINEL: recebe caseId, executa 3 fases de análise, gera ComplianceScore + Findings + QualityAssessments" },
            { name: "analyzePriscila", desc: "Análise PRISCILA de leads: gera score qualidade, nível de risco, caminho de decisão" },
            { name: "analyzeLeadQualifier", desc: "Lead Qualifier IA: classifica maturidade do lead (EXCELENTE → INSUFICIENTE)" },
            { name: "verifyAdminCode", desc: "Verificação do código de acesso admin para autenticação adicional" },
            { name: "preGenerateContract", desc: "Pré-geração de contrato via IA a partir de dados do Lead/Proposta" },
            { name: "generateQuestionnairePdf", desc: "Geração de PDF com todas as respostas do questionário" },
            { name: "notifyNewLead", desc: "Notificação Slack quando novo lead é submetido" },
            { name: "notifyProposalViewed", desc: "Notificação quando cliente visualiza proposta" },
            { name: "sendFollowUpEmail", desc: "Envio de e-mail de follow-up para leads" },
            { name: "checkLeadSLA", desc: "Verificação de SLA de leads (tempo de resposta)" },
            { name: "checkIncompleteLeads", desc: "Verificação de leads com questionário incompleto" },
            { name: "checkExpiringProposals", desc: "Verificação de propostas próximas da expiração" },
            { name: "expireProposals", desc: "Expiração automática de propostas vencidas" },
            { name: "simulateComplianceRule", desc: "Simulação de regra de compliance sem executar ações" },
            { name: "suggestQuestionsAI", desc: "Sugestão de perguntas via IA para templates de questionário" },
            { name: "bdc_queryCnpjData", desc: "Consulta BigDataCorp por CNPJ: dados cadastrais, KYC, sócios" },
            { name: "bdc_analyzeKycRisk", desc: "Análise de risco KYC via BigDataCorp" },
            { name: "bdc_startLiveness", desc: "Início de sessão liveness via BigDataCorp" },
            { name: "bdc_facematch", desc: "Facematch via BigDataCorp" },
            { name: "caf_startLiveness", desc: "Início de sessão liveness via CAF" },
            { name: "caf_uploadDocument", desc: "Upload e análise de documento via CAF" },
          ].map((fn, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Badge className="bg-[#002443] text-white font-mono text-[10px] border-0 mb-1">{fn.name}</Badge>
              <p className="text-[10px] text-[#002443]/60 leading-relaxed">{fn.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl text-center">
        <p className="text-sm text-white/70">
          Documentação Completa e Microscópica do Sistema de Compliance, Onboarding, Leads, Propostas e Contratos Pagsmile • Versão 3.0 • {new Date().toLocaleDateString('pt-BR')}
        </p>
        <p className="text-xs text-white/40 mt-1">
          8 Módulos • 30+ Páginas • 22+ Entidades • 9 Fluxos de Compliance • 3 Templates Especializados (305+ perguntas) • 5 Integrações • 15+ Backend Functions • IA SENTINEL 3 Fases
        </p>
      </div>
    </div>
  );
}