import React, { useState } from 'react';
import { 
  BookOpen, 
  Target, 
  Users, 
  Workflow, 
  Layout, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Shield,
  Brain,
  Link as LinkIcon,
  ClipboardList,
  Settings,
  History,
  Plug,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Building2,
  UserCheck,
  FileSearch,
  Sparkles,
  Database,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HowItWorks() {
  const [expandedSections, setExpandedSections] = useState({
    visao: true,
    fluxos: false,
    jornadas: false,
    modulos: false,
    paginas: false,
    entidades: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const Section = ({ id, title, icon: Icon, children, badge }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-4">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2bc196]/10 rounded-lg">
            <Icon className="w-5 h-5 text-[#2bc196]" />
          </div>
          <h2 className="text-lg font-bold text-[#002443]">{title}</h2>
          {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
        </div>
        {expandedSections[id] ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="p-4 pt-0 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );

  const FlowStep = ({ number, title, description, icon: Icon }) => (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 bg-[#2bc196] text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1 pb-6 border-l-2 border-dashed border-slate-200 pl-6 -ml-5 last:border-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-[#2bc196]" />}
          <h4 className="font-semibold text-[#002443]">{title}</h4>
        </div>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );

  const FeatureCard = ({ title, description, icon: Icon, items }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#002443]/5 rounded-lg">
            <Icon className="w-5 h-5 text-[#002443]" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">{description}</CardDescription>
        {items && (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-[#2bc196]/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">How It Works</h1>
            <p className="text-slate-500">Documentação completa do sistema de Compliance & Onboarding</p>
          </div>
        </div>
      </div>

      {/* Seção 1: Visão Estratégica */}
      <Section id="visao" title="1. Visão Estratégica da Solução" icon={Target}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Objetivo Principal</h3>
            <p className="text-white/90 leading-relaxed">
              Simplificar e automatizar o processo de onboarding e compliance para o setor financeiro, 
              garantindo conformidade regulatória, mitigação de riscos e agilidade na integração de novos 
              clientes (merchants) através de questionários digitais, validações externas e análise 
              inteligente por IA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              title="Eficiência"
              description="Redução do tempo e esforço manual"
              icon={Zap}
              items={[
                "Automação de processos repetitivos",
                "Análise automática por IA",
                "Fluxos digitais sem papel"
              ]}
            />
            <FeatureCard
              title="Mitigação de Riscos"
              description="Identificação e gestão de riscos"
              icon={Shield}
              items={[
                "Validações externas (CAF, BigDataCorp)",
                "Scores de risco automatizados",
                "Red flags e alertas em tempo real"
              ]}
            />
            <FeatureCard
              title="Conformidade"
              description="Alinhamento regulatório"
              icon={CheckCircle2}
              items={[
                "Questionários PLD/FT completos",
                "Auditoria de todas as ações",
                "Revalidações periódicas"
              ]}
            />
            <FeatureCard
              title="Visibilidade"
              description="Controle total para o time"
              icon={BarChart3}
              items={[
                "Dashboard com KPIs",
                "Histórico completo de casos",
                "Relatórios e exportações"
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Seção 2: Fluxos da Aplicação */}
      <Section id="fluxos" title="2. Fluxos da Aplicação" icon={Workflow} badge="2 Fluxos">
        <Tabs defaultValue="merchant" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="merchant">Fluxo do Merchant (Público)</TabsTrigger>
            <TabsTrigger value="interno">Fluxo Interno (Admin)</TabsTrigger>
          </TabsList>

          <TabsContent value="merchant">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-[#002443] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2bc196]" />
                Jornada do Merchant - Onboarding Público
              </h3>
              <div className="space-y-2">
                <FlowStep 
                  number="1" 
                  title="Recebimento do Link"
                  description="O merchant recebe um link exclusivo de onboarding gerado pelo time comercial, contendo código único e parâmetros UTM para rastreamento."
                  icon={LinkIcon}
                />
                <FlowStep 
                  number="2" 
                  title="Início do Onboarding (ComplianceOnboardingStart)"
                  description="Acessa o link e visualiza a página inicial. Pode escolher entre fluxo PIX (simplificado) ou Full KYC (completo), dependendo das configurações do link."
                  icon={FileText}
                />
                <FlowStep 
                  number="3" 
                  title="Preenchimento do Questionário"
                  description="Navega por etapas respondendo perguntas sobre: identificação, tipo de empresa, atividade econômica, endereço, responsáveis, perfil operacional, PLD/FT, compliance legal. Perguntas podem ter lógica condicional."
                  icon={ClipboardList}
                />
                <FlowStep 
                  number="4" 
                  title="Upload de Documentos"
                  description="Envia documentos obrigatórios: Contrato Social, Cartão CNPJ, RG/CNH dos sócios, comprovantes de endereço, balanços (Full KYC), políticas internas."
                  icon={FileSearch}
                />
                <FlowStep 
                  number="5" 
                  title="Liveness & Facematch (Opcional)"
                  description="Realiza prova de vida (liveness) e comparação facial (facematch) via integração com CAF ou Big Data Corp para validação biométrica."
                  icon={UserCheck}
                />
                <FlowStep 
                  number="6" 
                  title="Conclusão"
                  description="Recebe confirmação de envio e informações sobre próximos passos. O caso entra na fila de análise do time interno."
                  icon={CheckCircle2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interno">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-[#002443] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2bc196]" />
                Jornada do Time Interno - Gestão de Compliance
              </h3>
              <div className="space-y-2">
                <FlowStep 
                  number="1" 
                  title="Geração de Links"
                  description="Comercial gera links personalizados com templates de questionário, tipo de compliance (PIX/FULL), UTMs e data de expiração."
                  icon={LinkIcon}
                />
                <FlowStep 
                  number="2" 
                  title="Monitoramento via Dashboard"
                  description="Acompanha KPIs: volume de casos, scores médios, tempo de processamento, taxa de aprovação/rejeição, alertas da IA Helena."
                  icon={BarChart3}
                />
                <FlowStep 
                  number="3" 
                  title="Análise Automática pela IA (SENTINEL)"
                  description="Quando um questionário é submetido, a IA analisa automaticamente em 3 fases: (1) Questionário → score_questionario, (2) Validações Externas → score_validacao_externa, (3) Consolidação → score_geral_composto + recomendação final."
                  icon={Brain}
                />
                <FlowStep 
                  number="4" 
                  title="Revisão dos Casos"
                  description="Analista acessa 'Questionários Recebidos', filtra por status/prioridade, e abre casos para revisão detalhada na página 'Análise de Casos'."
                  icon={FileSearch}
                />
                <FlowStep 
                  number="5" 
                  title="Decisão Final"
                  description="Com base na análise da IA e revisão manual, o analista pode: Aprovar, Recusar, ou Solicitar mais documentos/informações."
                  icon={CheckCircle2}
                />
                <FlowStep 
                  number="6" 
                  title="Auditoria e Revalidação"
                  description="Todas as ações são registradas no log de auditoria. Merchants aprovados entram no ciclo de revalidação periódica."
                  icon={History}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Diagrama do Fluxo de Análise IA */}
        <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
          <h3 className="font-bold text-[#002443] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Fluxo de Análise da IA SENTINEL (3 Fases)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h4 className="font-semibold text-[#002443]">Fase 1: Questionário</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">Análise das respostas do questionário de compliance</p>
              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block">
                → score_questionario (0-1000)
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <h4 className="font-semibold text-[#002443]">Fase 2: Validações</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">Análise dos resultados CAF e Big Data Corp</p>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
                → score_validacao_externa (0-1000)
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <h4 className="font-semibold text-[#002443]">Fase 3: Consolidação</h4>
              </div>
              <p className="text-sm text-slate-600 mb-2">Cálculo final com bônus de consistência e overrides</p>
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block">
                → score_geral_composto + Decisão Final
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Seção 3: Jornadas por Persona */}
      <Section id="jornadas" title="3. Jornadas por Persona" icon={Users} badge="2 Personas">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Persona: Merchant */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-[#2bc196]/10 p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#2bc196] rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#002443]">Merchant (Cliente)</h3>
                  <p className="text-sm text-slate-600">Empresa que deseja se tornar cliente Pagsmile</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-[#002443] mb-3">Objetivo</h4>
              <p className="text-sm text-slate-600 mb-4">Completar o processo de onboarding para se credenciar como merchant e utilizar os serviços de pagamento.</p>
              
              <h4 className="font-semibold text-[#002443] mb-3">Páginas que acessa</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge variant="outline" className="text-xs">Público</Badge>
                  ComplianceOnboardingStart
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge variant="outline" className="text-xs">Público</Badge>
                  CompliancePixOnly / ComplianceFullKYC
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge variant="outline" className="text-xs">Público</Badge>
                  DocumentUploadPix / DocumentUploadFull
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge variant="outline" className="text-xs">Público</Badge>
                  LivenessFacematchStep
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge variant="outline" className="text-xs">Público</Badge>
                  OnboardingCompletion
                </li>
              </ul>

              <h4 className="font-semibold text-[#002443] mt-4 mb-3">Expectativas</h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Processo claro e intuitivo
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Segurança dos dados enviados
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Feedback sobre o status do processo
                </li>
              </ul>
            </div>
          </div>

          {/* Persona: Time Interno */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-[#002443]/10 p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#002443] rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#002443]">Time Interno (Admin)</h3>
                  <p className="text-sm text-slate-600">Analistas de compliance e gestores</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-[#002443] mb-3">Objetivo</h4>
              <p className="text-sm text-slate-600 mb-4">Gerenciar o processo de onboarding, garantir conformidade regulatória e tomar decisões sobre aprovação de merchants.</p>
              
              <h4 className="font-semibold text-[#002443] mb-3">Páginas que acessa</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  AdminDashboard
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  QuestionariosRecebidos
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  AnaliseDeCasos
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  GerarLinkOnboarding
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  + todas as outras páginas internas
                </li>
              </ul>

              <h4 className="font-semibold text-[#002443] mt-4 mb-3">Capacidades</h4>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Visualizar e analisar todos os casos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Aprovar, recusar ou solicitar mais informações
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2bc196] mt-0.5" />
                  Configurar regras, templates e integrações
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Seção 4: Módulos */}
      <Section id="modulos" title="4. Módulos da Aplicação" icon={Layout} badge="4 Módulos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2bc196]/10 rounded-lg">
                  <Shield className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <CardTitle className="text-base">Compliance</CardTitle>
                  <CardDescription>Gestão de casos e análises</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span>Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <span>Questionários Recebidos</span>
                  <Badge variant="secondary" className="text-xs ml-auto">Principal</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Gestão de Documentos</span>
                </li>
                <li className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Revalidação</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Ferramentas</CardTitle>
                  <CardDescription>Configuração e automação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  <span>Gerar Link</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Templates de Questionários</span>
                </li>
                <li className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Regras & Workflows</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Plug className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Integrações</CardTitle>
                  <CardDescription>Conexões externas e IA</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Plug className="w-4 h-4 text-slate-400" />
                  <span>CAF & BigDataCorp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-slate-400" />
                  <span>Helena IA (SENTINEL)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Administração</CardTitle>
                  <CardDescription>Configurações e auditoria</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Configurações</span>
                </li>
                <li className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Auditoria</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Seção 5: Páginas Detalhadas */}
      <Section id="paginas" title="5. Todas as Páginas e Funcionalidades" icon={FileText} badge="20+ Páginas">
        <Tabs defaultValue="publicas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="publicas">Páginas Públicas (Merchant)</TabsTrigger>
            <TabsTrigger value="internas">Páginas Internas (Admin)</TabsTrigger>
          </TabsList>

          <TabsContent value="publicas">
            <div className="space-y-4">
              {[
                {
                  name: "ComplianceOnboardingStart",
                  description: "Página inicial do fluxo de onboarding",
                  funcionalidades: [
                    "Exibe boas-vindas e introdução ao processo",
                    "Permite escolha entre fluxo PIX ou Full KYC (se habilitado)",
                    "Valida código do link e registra analytics de acesso",
                    "Redireciona para o questionário apropriado"
                  ]
                },
                {
                  name: "CompliancePixOnly",
                  description: "Questionário simplificado para habilitação de Pix",
                  funcionalidades: [
                    "11 etapas de perguntas essenciais",
                    "Coleta dados básicos: identificação, tipo empresa, atividade, endereço",
                    "Perguntas sobre PLD básico e responsáveis",
                    "Salva progresso automaticamente no localStorage",
                    "Ao finalizar, cria Merchant, OnboardingCase e QuestionnaireResponses"
                  ]
                },
                {
                  name: "ComplianceFullKYC",
                  description: "Questionário completo para KYC full compliance",
                  funcionalidades: [
                    "19+ etapas de perguntas detalhadas",
                    "Inclui tudo do PIX + seções adicionais",
                    "UBOs (Ultimate Beneficial Owners)",
                    "Sócios e estrutura societária",
                    "Licenciamento e regulação",
                    "Marketplace e afiliados",
                    "Segurança de cartão",
                    "PLD avançado (políticas, KYC, monitoramento, governança)"
                  ]
                },
                {
                  name: "DocumentUploadPix / DocumentUploadFull",
                  description: "Upload de documentos obrigatórios",
                  funcionalidades: [
                    "Lista de documentos específicos por tipo de fluxo",
                    "PIX: 4 documentos (Contrato Social, CNPJ, RG, Comprovante)",
                    "Full: 12+ documentos (inclui balanços, DRE, políticas)",
                    "Upload com drag & drop",
                    "Validação de formato (PDF, JPG, PNG) e tamanho (10MB)",
                    "Preview do arquivo enviado",
                    "Barra de progresso"
                  ]
                },
                {
                  name: "LivenessFacematchStep",
                  description: "Prova de vida e comparação facial",
                  funcionalidades: [
                    "Integração com CAF ou Big Data Corp",
                    "Captura de selfie em tempo real",
                    "Verificação de liveness (prova de vida)",
                    "Facematch com documento enviado",
                    "Feedback visual do resultado"
                  ]
                },
                {
                  name: "OnboardingCompletion",
                  description: "Página de conclusão do processo",
                  funcionalidades: [
                    "Mensagem de confirmação de envio",
                    "Resumo do que foi enviado",
                    "Informações sobre próximos passos",
                    "Tempo estimado de análise"
                  ]
                }
              ].map((page, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#002443]">{page.name}</h4>
                      <p className="text-sm text-slate-500">{page.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Público</Badge>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Funcionalidades</h5>
                    <ul className="space-y-1.5">
                      {page.funcionalidades.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <ArrowRight className="w-3 h-3 text-[#2bc196] mt-1 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="internas">
            <div className="space-y-4">
              {[
                {
                  name: "AdminDashboard",
                  description: "Visão geral do compliance",
                  funcionalidades: [
                    "KPIs: total de casos, aprovados, pendentes, recusados",
                    "Gráfico de funil de conversão",
                    "Distribuição de risco (baixo/médio/alto/crítico)",
                    "Tendência temporal de casos",
                    "Helena Insights: alertas e recomendações da IA",
                    "Scores médios por período",
                    "Tempo médio de processamento"
                  ]
                },
                {
                  name: "QuestionariosRecebidos",
                  description: "Lista de todos os casos de onboarding",
                  funcionalidades: [
                    "Tabela com todos os OnboardingCases",
                    "Filtros: status, tipo merchant, score, data, analista, prioridade",
                    "Busca por nome/CNPJ/email",
                    "Ordenação por qualquer coluna",
                    "Paginação",
                    "Exportação de dados",
                    "Acesso rápido à análise detalhada",
                    "Cards de estatísticas rápidas"
                  ]
                },
                {
                  name: "AnaliseDeCasos",
                  description: "Análise detalhada de um caso específico",
                  funcionalidades: [
                    "Dados completos do Merchant",
                    "Todas as respostas do questionário",
                    "Documentos enviados (com download)",
                    "Resultados de validações externas (CAF, BigDataCorp)",
                    "Painel de Análise IA (IAAnalysisPanel):",
                    "  - Scores das 3 fases",
                    "  - Classificação de risco",
                    "  - Recomendação final",
                    "  - Sumário executivo",
                    "  - Pontos positivos e de atenção",
                    "  - Red flags",
                    "  - Recomendações para revisão manual",
                    "  - Perguntas sugeridas",
                    "  - Documentos adicionais sugeridos",
                    "Histórico de auditoria do caso",
                    "Ações: Aprovar, Recusar, Solicitar Mais Info"
                  ]
                },
                {
                  name: "GerarLinkOnboarding",
                  description: "Criação de links de onboarding",
                  funcionalidades: [
                    "Seleção de template de questionário",
                    "Escolha do tipo de compliance (PIX, FULL, GENERIC)",
                    "Nome do agente comercial",
                    "Parâmetros UTM (source, medium, campaign, content)",
                    "Data de expiração",
                    "Cópia rápida do link gerado",
                    "Histórico de links criados",
                    "Métricas por link (cliques, submissões, conversão)"
                  ]
                },
                {
                  name: "TemplatesQuestionarios",
                  description: "Gestão de questionários",
                  funcionalidades: [
                    "Criar/editar QuestionnaireTemplates",
                    "Definir nome, descrição, tipo merchant (PF/PJ)",
                    "Gerenciar Questions dentro do template",
                    "Configurar ordem das perguntas",
                    "Definir tipo de resposta (texto, número, select, file, etc)",
                    "Lógica condicional entre perguntas",
                    "Peso de risco por pergunta",
                    "Documentos obrigatórios associados"
                  ]
                },
                {
                  name: "RegrasDeCompliance",
                  description: "Automação de decisões",
                  funcionalidades: [
                    "Criar/editar ComplianceRules",
                    "Definir condições (campo, operador, valor)",
                    "Operadores: equals, greater_than, contains, in, etc",
                    "Ações: set_status, send_notification, assign_analyst",
                    "Prioridade de execução",
                    "Ativar/desativar regras",
                    "Histórico de execuções"
                  ]
                },
                {
                  name: "IntegracoesExternas",
                  description: "Configuração de provedores",
                  funcionalidades: [
                    "Configurar CAF (liveness, facematch, OCR)",
                    "Configurar Big Data Corp (KYC empresa, KYC pessoa)",
                    "URLs de ambiente (sandbox/produção)",
                    "API keys e secrets",
                    "Templates/IDs de transação",
                    "Serviços habilitados",
                    "Testar conexão",
                    "Logs de chamadas"
                  ]
                },
                {
                  name: "HelenaIA",
                  description: "Monitoramento do agente SENTINEL",
                  funcionalidades: [
                    "Status do agente de IA",
                    "Versão do modelo/prompt",
                    "Logs de análises realizadas (HelenaAnalysis)",
                    "Métricas de assertividade",
                    "Feedback dos analistas sobre decisões da IA"
                  ]
                },
                {
                  name: "GestaoDocumentos",
                  description: "Tipos de documentos",
                  funcionalidades: [
                    "Criar/editar DocumentTypes",
                    "Nome e descrição",
                    "Formatos aceitos (PDF, JPG, PNG)",
                    "Tamanho máximo",
                    "Obrigatoriedade",
                    "Tipo de merchant (PF, PJ, ambos)",
                    "Lógica condicional"
                  ]
                },
                {
                  name: "GestaoRevalidacao",
                  description: "Revalidações periódicas",
                  funcionalidades: [
                    "Listar RevalidationSchedules",
                    "Agendar revalidações",
                    "Frequência: mensal, trimestral, semestral, anual",
                    "Tipo: periódica, baseada em risco, regulatória",
                    "Status: pendente, em andamento, concluída",
                    "Notificações automáticas"
                  ]
                },
                {
                  name: "Auditoria",
                  description: "Log de todas as ações",
                  funcionalidades: [
                    "Listar todos os AuditLogs",
                    "Filtrar por entidade, ação, usuário, data",
                    "Detalhes: quem, o quê, quando, de onde",
                    "Valores antes/depois de alterações",
                    "Exportação para compliance"
                  ]
                },
                {
                  name: "Configuracoes",
                  description: "Ajustes gerais do sistema",
                  funcionalidades: [
                    "Gestão de usuários",
                    "Permissões e roles",
                    "Configurações de notificação",
                    "Preferências do sistema"
                  ]
                }
              ].map((page, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#002443]">{page.name}</h4>
                      <p className="text-sm text-slate-500">{page.description}</p>
                    </div>
                    <Badge className="text-xs bg-[#002443]">Admin</Badge>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Funcionalidades</h5>
                    <ul className="space-y-1.5">
                      {page.funcionalidades.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <ArrowRight className="w-3 h-3 text-[#2bc196] mt-1 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Section>

      {/* Seção 6: Entidades */}
      <Section id="entidades" title="6. Entidades do Sistema (Database)" icon={Database} badge="18 Entidades">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Merchant", desc: "Dados do cliente (PF/PJ)", color: "bg-green-100 text-green-700" },
            { name: "OnboardingCase", desc: "Caso de onboarding", color: "bg-blue-100 text-blue-700" },
            { name: "QuestionnaireTemplate", desc: "Template de questionário", color: "bg-purple-100 text-purple-700" },
            { name: "Question", desc: "Pergunta do questionário", color: "bg-purple-100 text-purple-700" },
            { name: "QuestionnaireResponse", desc: "Resposta do merchant", color: "bg-indigo-100 text-indigo-700" },
            { name: "DocumentType", desc: "Tipo de documento", color: "bg-orange-100 text-orange-700" },
            { name: "DocumentUpload", desc: "Documento enviado", color: "bg-orange-100 text-orange-700" },
            { name: "ComplianceScore", desc: "Análise completa da IA", color: "bg-pink-100 text-pink-700" },
            { name: "ComplianceFinding", desc: "Finding individual da análise", color: "bg-pink-100 text-pink-700" },
            { name: "QualityAssessment", desc: "Avaliação de qualidade", color: "bg-pink-100 text-pink-700" },
            { name: "ExternalValidationResult", desc: "Resultado de validação externa", color: "bg-cyan-100 text-cyan-700" },
            { name: "IntegrationConfig", desc: "Config de integração", color: "bg-cyan-100 text-cyan-700" },
            { name: "IntegrationLog", desc: "Log de chamada externa", color: "bg-cyan-100 text-cyan-700" },
            { name: "HelenaAnalysis", desc: "Análise da IA Helena", color: "bg-violet-100 text-violet-700" },
            { name: "OnboardingLink", desc: "Link de onboarding", color: "bg-yellow-100 text-yellow-700" },
            { name: "OnboardingAnalytics", desc: "Analytics do fluxo", color: "bg-yellow-100 text-yellow-700" },
            { name: "ComplianceRule", desc: "Regra de automação", color: "bg-red-100 text-red-700" },
            { name: "RevalidationSchedule", desc: "Agendamento de revalidação", color: "bg-gray-100 text-gray-700" },
            { name: "AuditLog", desc: "Log de auditoria", color: "bg-slate-100 text-slate-700" }
          ].map((entity, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <Badge className={`${entity.color} text-xs font-mono`}>{entity.name}</Badge>
              <span className="text-sm text-slate-600">{entity.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 p-6 bg-slate-100 rounded-xl text-center">
        <p className="text-sm text-slate-600">
          Documentação gerada automaticamente • Versão 1.0 • Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}