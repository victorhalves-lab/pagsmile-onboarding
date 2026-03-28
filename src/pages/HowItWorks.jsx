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
  DollarSign, Phone, Star, Award, Handshake, UserPlus, Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section, FlowStep, FeatureCard, PageDetail } from '../components/howitworks/HowItWorksShared';
import QuestionnaireSection from '../components/howitworks/QuestionnaireSection';
import LeadsPropostasSection from '../components/howitworks/LeadsPropostasSection';
import ContratosSection from '../components/howitworks/ContratosSection';
import SidebarPagesSection from '../components/howitworks/SidebarPagesSection';
import PersonasDetailedSection from '../components/howitworks/PersonasDetailedSection';
import FlowchartsSection from '../components/howitworks/FlowchartsSection';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function HowItWorks() {
  const { t, language } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({});
  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-[#2bc196]/10 rounded-2xl">
            <BookOpen className="w-7 h-7 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#002443]">{t('hiw.title')}</h1>
            <p className="text-[#002443]/60 text-sm">{t('hiw.subtitle')}</p>
          </div>
        </div>
        {language !== 'pt' && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">{t('hiw.doc_lang_notice')}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0">12+ Módulos</Badge>
          <Badge className="bg-blue-50 text-blue-700 border-0">50+ Páginas</Badge>
          <Badge className="bg-purple-50 text-purple-700 border-0">27+ Entidades</Badge>
          <Badge className="bg-orange-50 text-orange-700 border-0">10 Fluxogramas Microscópicos</Badge>
          <Badge className="bg-pink-50 text-pink-700 border-0">3 IAs (SENTINEL, PRISCILA, Lead Qualifier)</Badge>
          <Badge className="bg-red-50 text-red-700 border-0">3 Templates Compliance</Badge>
          <Badge className="bg-cyan-50 text-cyan-700 border-0">305+ Perguntas</Badge>
          <Badge className="bg-amber-50 text-amber-700 border-0">48 Documentos</Badge>
          <Badge className="bg-emerald-50 text-emerald-700 border-0">30+ Backend Functions</Badge>
          <Badge className="bg-violet-50 text-violet-700 border-0">3 Tipos de Proposta + Links Rápidos</Badge>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. VISÃO ESTRATÉGICA */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="visao" title="1. Visão Estratégica da Solução" icon={Target} badge="Objetivo" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Objetivo Principal</h3>
            <p className="text-white/90 leading-relaxed text-sm mb-4">
              Simplificar e automatizar o ciclo completo de onboarding, compliance, gestão comercial, propostas e contratos para o setor financeiro de pagamentos,
              garantindo conformidade regulatória (Resolução 3978 BACEN, normas PLD/FT), mitigação de riscos,
              e agilidade na integração de novos merchants através de questionários digitais diferenciados por tipo de negócio,
              validações externas (CAF, BigDataCorp), verificação biométrica (Liveness + Facematch),
              análise inteligente por 3 IAs (Helena/SENTINEL para compliance, PRISCILA para qualificação de leads, Lead Qualifier para maturidade),
              gestão de propostas comerciais com 3 modalidades (Personalizada, Padrão por Segmento, PIX),
              contratos automatizados e portal de Introducers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Leads & Qualificação', desc: 'Captação via 4 tipos de questionário, qualificação por IA PRISCILA e Lead Qualifier, pipeline Kanban' },
                { label: 'Propostas (3 tipos)', desc: 'Personalizada, Padrão por Segmento (taxas fixas), PIX — com link público, aceite digital e versionamento' },
                { label: 'Compliance KYC/KYB', desc: '9 fluxos, 3 templates, 305+ perguntas, IA SENTINEL em 3 fases, validações CAF + BigDataCorp' },
                { label: 'Contratos & Introducers', desc: 'Contratos automatizados via IA, portal Introducer co-branded, subcontas/subsellers' },
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
              items={["Automação via Regras de Compliance", "IA SENTINEL 3 fases", "Fluxos 100% digitais", "Auto-preenchimento de taxas por segmento", "Pipeline Kanban drag-and-drop", "Propostas com link público + aceite", "Contratos pré-gerados por IA"]} />
            <FeatureCard title="Mitigação de Riscos" description="Identificação proativa de ameaças" icon={Shield}
              items={["CAF: Liveness, Facematch, OCR", "BigDataCorp: KYC empresa/sócios/PEP", "Scores 0-1000 em 3 fases", "Red flags e alertas automáticos", "3 templates com risk weights", "Validação de limites de taxa vs custo", "Revalidação periódica programável"]} />
            <FeatureCard title="Conformidade Regulatória" description="100% alinhado com regulações" icon={CheckCircle2}
              items={["Questionários PLD/FT (3978 BACEN)", "Auditoria 100% (AuditLog)", "Revalidações periódicas", "Identificação de UBO", "Listas restritivas (OFAC/ONU/PEP)", "Due Diligence de sub-merchants", "Cláusulas compliance em contratos"]} />
            <FeatureCard title="Visibilidade Total" description="20+ KPIs em tempo real" icon={BarChart3}
              items={["Dashboard Compliance 20+ KPIs", "Home com visão 360°", "Pipeline com métricas de receita", "Analytics por link", "Distribuição de risco", "Score Distribution 0-1000", "Exportação CSV"]} />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. MAPA COMPLETO DE TODAS AS PÁGINAS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="paginas" title="2. Mapa Completo de Todas as Páginas — Detalhe Microscópico" icon={Layers} badge="50+ Páginas" expandedSections={expandedSections} toggleSection={toggleSection}>
        <SidebarPagesSection />
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 3. MÓDULO LEADS & PROPOSTAS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="leads" title="3. Módulo: Leads & Propostas — Fluxos" icon={Inbox} badge="Jornada Completa" expandedSections={expandedSections} toggleSection={toggleSection}>
        <LeadsPropostasSection />
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. MÓDULO CONTRATOS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="contratos" title="4. Módulo: Contratos" icon={Stamp} badge="Geração Automática" expandedSections={expandedSections} toggleSection={toggleSection}>
        <ContratosSection />
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 5. QUESTIONÁRIOS DE COMPLIANCE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="questionarios" title="5. Questionários de Compliance — Raio-X Microscópico" icon={ClipboardList} badge="3 Templates" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
            <h3 className="text-lg font-bold mb-2">3 Templates Especializados</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              Cada template foi desenhado para o perfil de risco específico do tipo de negócio. Compartilham as Seções A–J (tronco comum) e se diferenciam nas seções finais.
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 6. DIAGRAMAS DE FLUXO — VISÃO MICROSCÓPICA */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="fluxogramas" title="6. Diagramas de Fluxo — Todos os Processos (Visão Microscópica)" icon={Workflow} badge="10 Fluxos Completos" expandedSections={expandedSections} toggleSection={toggleSection}>
        <FlowchartsSection />
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 7. MODELO DE DADOS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="entidades" title="7. Modelo de Dados Completo" icon={Database} badge="27+ Entidades" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="space-y-4">
          {[
            { category: "Core do Onboarding", color: "border-l-[#2bc196]", entities: [
              { name: "Merchant", desc: "PF/PJ: CNPJ, nome, e-mail, telefone, status (5), score, serviços, parentMerchantId (subseller)" },
              { name: "OnboardingCase", desc: "Caso: merchantId, templateId, status (6), scores 3 fases, decisão IA, analista, prioridade, SLA, red flags" },
              { name: "OnboardingLink", desc: "Link: uniqueCode, templateId, agente, UTMs, expiração, métricas, complianceType, linkType" },
              { name: "ComplianceSession", desc: "Sessão: token, flowType, currentPhase/Step, formData, documentsData, status" },
            ]},
            { category: "Questionários", color: "border-l-purple-500", entities: [
              { name: "QuestionnaireTemplate", desc: "Template: nome, modelo PF/PJ, categoria, subCategory, versão, requiredDocuments, riskThresholds" },
              { name: "Question", desc: "Pergunta: templateId, ordem, texto, tipo (10), opções, conditionalLogic, riskWeight, riskValues" },
              { name: "QuestionnaireResponse", desc: "Resposta: caseId, questionId, value (Text/Number/Boolean/Array)" },
              { name: "QuestionarioSimplificado", desc: "Questionário simplificado de coleta rápida de taxas" },
              { name: "InternalCommercialQuestionnaire", desc: "Questionário interno de reunião do time comercial" },
            ]},
            { category: "Documentos", color: "border-l-orange-500", entities: [
              { name: "DocumentType", desc: "Tipo: nome, formatos, tamanho max, merchantType, obrigatório, conditionalLogic" },
              { name: "DocumentUpload", desc: "Upload: caseId, typeId, fileUrl, fileName, validationStatus, notas" },
            ]},
            { category: "Análise IA", color: "border-l-pink-500", entities: [
              { name: "ComplianceScore", desc: "Score 3 fases (0-1000), bônus consistência, score geral, classificação, recomendação, confiança" },
              { name: "ComplianceFinding", desc: "Finding: severidade (6 níveis), fase, seção, evidência, dedução, recomendação" },
              { name: "QualityAssessment", desc: "Qualidade: scores 1-5 em 4 dimensões + padrões evasivos" },
              { name: "HelenaAnalysis", desc: "Análise: score, decisão, justificativa, breakdown, fatores, feedback" },
              { name: "PriscilaConfig", desc: "Configuração da IA PRISCILA para análise de leads" },
            ]},
            { category: "Validações Externas", color: "border-l-cyan-500", entities: [
              { name: "ExternalValidationResult", desc: "Resultado: provedor, tipo, resultData, score, status" },
              { name: "IntegrationConfig", desc: "Config: provedor CAF/BigDataCorp, ambiente, URLs, serviços" },
              { name: "IntegrationLog", desc: "Log: provedor, serviço (20+ tipos), request/response, duração" },
            ]},
            { category: "Leads & Propostas", color: "border-l-blue-500", entities: [
              { name: "Lead", desc: "30+ campos: dados empresa, status (11), scores PRISCILA/Qualifier/Risco Avançado, TPV, introducer, expectedRates, iaSuggestions" },
              { name: "LeadActivity", desc: "Atividades: contato, status, proposta, follow-up, nota" },
              { name: "Proposal", desc: "Proposta personalizada: leadId, taxas por bandeira × 4 faixas, antecipação, status (8), versionamento, link público" },
              { name: "StandardProposal", desc: "Proposta Padrão: templateName, segment (6), isDefaultForSegment, taxas fixas, tokenPublico, dados empresa opcionais" },
              { name: "PixProposal", desc: "Proposta PIX: leadId, taxa PIX (%/fixo), TPV mínimo (3 meses), status (8), versionamento, link público" },
              { name: "Contract", desc: "Contrato: leadId, proposalId, dados cliente, módulos, SLAs, preços, cláusulas, assinatura" },
              { name: "Partner", desc: "Parceiro adquirente: nome, modelo, taxas MDR por MCC, fees, antecipação, isPrincipal" },
              { name: "PartnerCost", desc: "Custo detalhado do parceiro por MCC/bandeira" },
            ]},
            { category: "Introducers", color: "border-l-violet-500", entities: [
              { name: "Introducer", desc: "Nome, tipo (individual/company), referralCode, comissão, landing page, taxas padrão por segmento" },
            ]},
            { category: "Gestão e Auditoria", color: "border-l-slate-500", entities: [
              { name: "ComplianceRule", desc: "Regra: tipo, condições, ações, prioridade, execuções" },
              { name: "RevalidationSchedule", desc: "Agendamento: merchantId, tipo, frequência, status" },
              { name: "AuditLog", desc: "Auditoria: entidade, ação (7 tipos), quem, quando, detalhes" },
              { name: "OnboardingAnalytics", desc: "Analytics: linkId, eventType (6), página, step, metadados" },
              { name: "MessageTemplate", desc: "Templates de mensagem para comunicação com leads/merchants" },
            ]},
          ].map((cat, i) => (
            <div key={i}>
              <h4 className="font-bold text-[#002443] text-sm mb-2 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cat.color.replace('border-l-', 'bg-')}`} />{cat.category}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 8. INTEGRAÇÕES */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="integracoes" title="8. Integrações e Tecnologias" icon={Plug} badge="5 Provedores" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { name: "CAF", color: "purple", items: ["Liveness (prova de vida)", "Facematch (1:1)", "Face Authentication", "Document OCR", "Documentoscopy", "Onboarding Web"] },
            { name: "BigDataCorp", color: "blue", items: ["Dados Empresa", "KYC Empresa/Sócios", "PEP/Sanções/OFAC", "Indicadores Atividade", "MCC/Categoria", "Biometria"] },
            { name: "Helena/SENTINEL", color: "green", items: ["3 fases automáticas", "Score 0-1000/fase", "Recomendação final", "Findings + Quality", "Feedback loop", "Confiança 0-100"] },
          ].map((p, i) => (
            <Card key={i} className={`border-${p.color}-200`}>
              <CardHeader className={`bg-${p.color}-50/50 pb-3`}>
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-1.5 text-xs text-[#002443]/70">
                  {p.items.map((s, j) => <li key={j} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{s}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200">
            <CardHeader className="bg-amber-50/50 pb-3"><CardTitle className="text-base">PRISCILA + Lead Qualifier</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["PRISCILA: score 0-100, risco (BAIXO/MEDIO/ALTO/CRITICO)", "Decisão: AUTO_APROVAR, COM_FLAG, REVISÃO, REJEITAR", "Lead Qualifier: EXCELENTE → INSUFICIENTE", "Análise de maturidade do negócio", "Sugestões para time comercial", "Análise de Risco Avançada (iaRiskScore, iaDecision)"].map((s, j) => <li key={j} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />{s}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-3"><CardTitle className="text-base">Slack + E-mail</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {["Slack Bot: notificações de novos leads, propostas aceitas/visualizadas, alertas SLA", "E-mail: follow-up automático, templates de mensagem configuráveis", "Integração via backend functions (notifyNewLead, sendFollowUpEmail, etc.)"].map((s, j) => <li key={j} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />{s}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 9. BACKEND FUNCTIONS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="backend" title="9. Backend Functions e Automações" icon={Server} badge="30+ Functions" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "analyzeOnboarding", desc: "SENTINEL: 3 fases de análise → ComplianceScore + Findings + QualityAssessments" },
            { name: "analyzePriscila", desc: "PRISCILA: score qualidade, risco, caminho de decisão para leads" },
            { name: "analyzeLeadQualifier", desc: "Lead Qualifier: classifica maturidade EXCELENTE → INSUFICIENTE" },
            { name: "analyzeLeadRiskAdvanced", desc: "Análise de risco avançada: iaRiskScore, iaDecision, sugestões" },
            { name: "analyzeCnpjEnrichment", desc: "Enriquecimento de CNPJ: dados cadastrais + análise IA" },
            { name: "verifyAdminCode", desc: "Verificação do código de acesso admin" },
            { name: "preGenerateContract", desc: "Pré-geração de contrato via IA a partir de Lead + Proposta" },
            { name: "generateQuestionnairePdf", desc: "PDF com todas as respostas do questionário" },
            { name: "generateCompliancePdf", desc: "PDF completo do caso de compliance" },
            { name: "processMeetingNotes", desc: "IA transforma notas de reunião em dados estruturados de lead" },
            { name: "notifyNewLead", desc: "Notificação Slack para novo lead" },
            { name: "notifyProposalViewed", desc: "Notificação quando proposta é visualizada" },
            { name: "notifyProposalAccepted", desc: "Notificação quando proposta é aceita" },
            { name: "sendFollowUpEmail", desc: "E-mail de follow-up para leads" },
            { name: "checkLeadSLA", desc: "Verificação de SLA de leads (tempo resposta)" },
            { name: "checkIncompleteLeads", desc: "Leads com questionário incompleto" },
            { name: "checkExpiringProposals", desc: "Propostas próximas da expiração" },
            { name: "expireProposals", desc: "Expiração automática de propostas vencidas" },
            { name: "simulateComplianceRule", desc: "Simulação de regra sem executar" },
            { name: "suggestQuestionsAI", desc: "Sugestão de perguntas via IA" },
            { name: "brasilApiCnpj", desc: "Consulta CNPJ via API Brasil (autocomplete)" },
            { name: "sanctionsScreening", desc: "Triagem de sanções/listas restritivas" },
            { name: "bdc_queryCnpjData", desc: "BigDataCorp: dados por CNPJ" },
            { name: "bdc_analyzeKycRisk", desc: "BigDataCorp: análise KYC" },
            { name: "caf_startLiveness", desc: "CAF: liveness session" },
            { name: "caf_uploadDocument", desc: "CAF: análise de documento" },
            { name: "loadComplianceProgress", desc: "Carregar progresso de compliance salvo" },
            { name: "saveComplianceProgress", desc: "Salvar progresso de compliance" },
            { name: "downloadCaseDocuments", desc: "Download de documentos de um caso" },
            { name: "getCaseDocumentUrls", desc: "URLs assinadas para documentos" },
            { name: "generateSubsellerLink", desc: "Gerar link para subseller" },
            { name: "validateLeadFields", desc: "Validação assíncrona de campos do lead (e-mail, site, etc.)" },
            { name: "complianceValidations", desc: "Validações de campos de compliance (CPF, CNPJ, CEP)" },
          ].map((fn, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Badge className="bg-[#002443] text-white font-mono text-[10px] border-0 mb-1">{fn.name}</Badge>
              <p className="text-[10px] text-[#002443]/60 leading-relaxed">{fn.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 10. PERSONAS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="personas" title="10. Personas e Jornadas" icon={Users} badge="4 Personas" expandedSections={expandedSections} toggleSection={toggleSection}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { icon: Building2, color: "bg-[#2bc196]", name: "Merchant (Cliente)", desc: "Empresa que deseja se credenciar",
              pages: ["Questionário de Lead (4 variantes)", "Proposta Pública (personalizada, padrão, PIX)", "Compliance Onboarding (9 variantes)", "Contrato Público", "Landing Page do Introducer"],
              ux: ["Mobile-first", "Auto-save", "Autocomplete CNPJ", "Feedback visual tempo real"] },
            { icon: Users, color: "bg-[#3B82F6]", name: "Time Comercial", desc: "Agentes e gestores de vendas",
              pages: ["Home: visão 360° + quick actions", "Links Questionários: 4 tipos + Introducer", "Questionários Recebidos: 6 sub-abas", "Pipeline Kanban: 7 colunas", "Propostas: 3 tipos (Personalizada, Padrão, PIX)", "Contratos: pré-gerado por IA", "Questionário Reunião + Robô IA"],
              ux: ["Pipeline com drag-and-drop", "Qualificação IA automática", "3 tipos de proposta", "Versionamento de propostas"] },
            { icon: Shield, color: "bg-[#002443]", name: "Time Compliance (Admin)", desc: "Analistas e auditores",
              pages: ["Dashboard 20+ KPIs + gráficos", "Links Compliance: 9 tipos", "Casos de Compliance: análise detalhada", "Gestão Documentos + Revalidação", "Templates + Regras + Integrações", "Helena IA + Auditoria + Configurações"],
              ux: ["IA SENTINEL 3 fases", "Regras automáticas", "Auditoria 100%", "Revalidação programável"] },
            { icon: UserPlus, color: "bg-purple-600", name: "Introducer (Parceiro)", desc: "Parceiro de indicação de clientes",
              pages: ["IntroducerDashboard: KPIs, leads, performance", "Landing Page personalizada (/parceiro/slug)", "Visualização de leads indicados e status"],
              ux: ["Portal exclusivo", "Landing page co-branded", "Acompanhamento de leads", "Taxas padrão por segmento"] },
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
                  {persona.pages.map((p, j) => <p key={j} className="text-[10px] text-[#002443]/60 flex items-start gap-1"><ArrowRight className="w-2.5 h-2.5 text-[#2bc196] mt-0.5 shrink-0" />{p}</p>)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#002443]/40 uppercase mb-1">UX</p>
                  {persona.ux.map((u, j) => <p key={j} className="text-[10px] text-[#002443]/60 flex items-start gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-[#2bc196] mt-0.5 shrink-0" />{u}</p>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 11. JORNADAS DETALHADAS POR PERSONA */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section id="jornadas" title="11. Jornadas Detalhadas por Persona — Atividades, Benefícios e Valor" icon={Award} badge="5 Personas × Atividades Completas" expandedSections={expandedSections} toggleSection={toggleSection}>
        <PersonasDetailedSection />
      </Section>

      {/* Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl text-center">
        <p className="text-sm text-white/70">
          {t('hiw.footer_version')} • {new Date().toLocaleDateString()}
        </p>
        <p className="text-xs text-white/40 mt-1">
          {t('hiw.footer_stats')}
        </p>
      </div>
    </div>
  );
}