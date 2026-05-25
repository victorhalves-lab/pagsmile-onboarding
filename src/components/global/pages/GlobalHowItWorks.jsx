import React from 'react';
import { BookOpen, Globe2, ClipboardList, FileText, Kanban, Calculator, Table2, ShieldCheck, Link as LinkIcon, ArrowRight, DollarSign, Languages } from 'lucide-react';

/**
 * Manual interno do módulo Propostas Global.
 * Documenta arquitetura, fluxo, taxas e papéis para a equipe comercial e compliance.
 */
export default function GlobalHowItWorks() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#2bc196]/15 to-[#5cf7cf]/15">
            <BookOpen className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002443]">Como Funciona — Propostas Global</h2>
            <p className="text-xs text-[#002443]/60 mt-1">
              Guia operacional do módulo internacional (USD · Interchange · Trilíngue EN/PT/ZH)
            </p>
          </div>
        </div>
      </div>

      {/* Visão geral */}
      <Section title="Visão Geral" icon={Globe2}>
        <p>
          O módulo Global gera propostas comerciais em <strong>USD</strong> para merchants internacionais usando a lógica de
          <strong> Interchange++ </strong>(custo base + interchange real Visa/Mastercard + markup). É isolado do trilho
          Brasil (BRL/segmentos/MCC nacional) — usa entidades próprias (<code>GlobalProposal</code>, <code>GlobalQuestionnaire</code>,
          <code> GlobalComplianceQuestionnaire</code>) e função pública dedicada (<code>publicGlobalProposal</code>).
        </p>
      </Section>

      {/* Fluxo end-to-end */}
      <Section title="Fluxo End-to-End" icon={ArrowRight}>
        <FlowStep n={1} icon={LinkIcon}      title="Captação do lead"
                  desc="Compartilhe o link público do questionário (Link Questionário). Lead preenche em EN/PT/ZH." />
        <FlowStep n={2} icon={ClipboardList} title="Análise do questionário"
                  desc="Em Questionários, revise dados (TPV, mix de cartões, mercados, parceiro atual). Filtros + exportação CSV." />
        <FlowStep n={3} icon={Calculator}    title="Simulação"
                  desc="No Simulador, calcule a receita líquida projetada com base na taxa pretendida e custos operacionais." />
        <FlowStep n={4} icon={FileText}      title="Criação da proposta"
                  desc="Em Criar Proposta, escolha MCCs, mercados, tipo de Interchange (low/avg/high por bandeira) e markup. A taxa final é calculada em tempo real." />
        <FlowStep n={5} icon={Kanban}        title="Pipeline"
                  desc="No Pipeline (Kanban), arraste questionários entre estágios: leads → proposta enviada → aceita / contraproposta / perdida." />
        <FlowStep n={6} icon={DollarSign}    title="Decisão do cliente"
                  desc="Cliente recebe link público, vê a proposta em seu idioma e aceita / recusa / envia contraproposta direto da página." />
        <FlowStep n={7} icon={ShieldCheck}   title="Onboarding KYC"
                  desc="Ao aceitar, o cliente é direcionado ao formulário KYC Global (UBOs, diretores, documentos, sanctions screening)." />
      </Section>

      {/* Composição da taxa */}
      <Section title="Composição da Taxa (Interchange++)" icon={DollarSign}>
        <div className="grid md:grid-cols-3 gap-3">
          <Card title="Custo Base" subtitle="0,5% padrão" desc="Margem fixa Pagsmile que cobre custos operacionais mínimos do processamento internacional." />
          <Card title="Interchange" subtitle="Variável" desc="Taxa real cobrada pela bandeira (Visa/Mastercard) ao emissor — depende do tipo de cartão (consumer/commercial/credit/debit) e do programa (basic/preferred/signature/world/world elite)." />
          <Card title="Markup" subtitle="A negociar" desc="Margem comercial da Pagsmile. Definida pela equipe conforme volume, risco e estratégia de aquisição." />
        </div>
        <p className="mt-3 text-xs text-[#002443]/60">
          <strong>Taxa final</strong> = Custo Base + Interchange (% + fixo) + Markup. Visualizada em tempo real na tela
          <code> Criar Proposta</code>. A tabela completa de Interchange Card Not Present é consultável em <code>Interchange</code>.
        </p>
      </Section>

      {/* Páginas */}
      <Section title="Páginas do Módulo" icon={Table2}>
        <div className="grid md:grid-cols-2 gap-2">
          <PageRow icon={LinkIcon}        label="Link Questionário"  desc="Copiar/abrir link público p/ leads internacionais." />
          <PageRow icon={ClipboardList}   label="Questionários"      desc="Lista + filtros + modal de detalhes + export CSV." />
          <PageRow icon={FileText}        label="Criar Proposta"     desc="Editor com cálculo Interchange++ em tempo real." />
          <PageRow icon={FileText}        label="Propostas"          desc="Lista de propostas + download PDF/PNG + ações." />
          <PageRow icon={Kanban}          label="Pipeline"           desc="Kanban drag-and-drop de 5 colunas." />
          <PageRow icon={Calculator}      label="Simulador"          desc="Projeção de receita líquida com sliders." />
          <PageRow icon={Table2}          label="Interchange"        desc="Tabela Visa/Mastercard com resumo low/avg/high." />
          <PageRow icon={LinkIcon}        label="Link Compliance"    desc="Copiar/abrir link público do KYC Global." />
          <PageRow icon={ShieldCheck}     label="KYC Recebidos"      desc="Lista de KYCs + revisão admin (aprovar/rejeitar)." />
        </div>
      </Section>

      {/* Trilíngue */}
      <Section title="Suporte Trilíngue" icon={Languages}>
        <p>
          Todos os fluxos públicos (questionário, proposta, KYC) têm seletor de idioma embutido. O cliente escolhe entre
          <strong> Inglês </strong>(padrão), <strong>Português</strong> e <strong>Chinês simplificado</strong>. A escolha
          persiste via URL (<code>?lang=en|pt|zh</code>) — útil para compartilhamento direto em idioma específico.
        </p>
        <p className="mt-2">
          O dicionário fica em <code>components/global/public/usePublicGlobalI18n.jsx</code> — isolado dos arquivos de
          tradução principais (<code>pt.js</code>/<code>en.js</code>/<code>zh.js</code>) para não inflar o bundle interno.
        </p>
      </Section>

      {/* Diferenças vs Brasil */}
      <Section title="Diferenças vs Trilho Brasil" icon={Globe2}>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#002443]/80">
          <li><strong>Moeda:</strong> USD (não BRL). Sem conversão automática.</li>
          <li><strong>Lógica de taxa:</strong> Interchange++ (não MDR fechado por segmento).</li>
          <li><strong>Compliance:</strong> KYC internacional com UBOs/Directors/Sanctions — sem BDC, sem CAF, sem segmentos brasileiros.</li>
          <li><strong>Entidades isoladas:</strong> Prefixo <code>Global*</code> para evitar conflito com Proposal/Questionnaire/Merchant nacionais.</li>
          <li><strong>Função pública dedicada:</strong> <code>publicGlobalProposal</code> (load/accept/reject/counter via token).</li>
          <li><strong>Fluxo:</strong> 100% digital ponta-a-ponta — sem reuniões obrigatórias, sem subseller, sem revalidação periódica (ainda).</li>
        </ul>
      </Section>

      {/* Próximos passos */}
      <Section title="Próximas Evoluções (Roadmap)" icon={ArrowRight}>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#002443]/80">
          <li>Sanctions screening automático (OFAC/UN/EU/UK) dos UBOs.</li>
          <li>Versionamento de propostas com histórico de contrapropostas.</li>
          <li>E-mail automático (envio, aceite, contraproposta) trilíngue.</li>
          <li>Cadastro 360° do cliente Global (perfil único agregando questionário + propostas + KYC).</li>
          <li>Dashboard analítico (TPV por país/MCC, win-rate por segmento, savings calculator).</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#2bc196]" />
        <h3 className="text-sm font-bold text-[#002443] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-sm text-[#002443]/80 space-y-2">{children}</div>
    </div>
  );
}

function FlowStep({ n, icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-[#2bc196] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-[#2bc196]" />
          <span className="text-sm font-semibold text-[#002443]">{title}</span>
        </div>
        <p className="text-xs text-[#002443]/60 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle, desc }) {
  return (
    <div className="bg-[#f4f4f4]/50 rounded-xl border border-[#002443]/5 p-4">
      <div className="text-sm font-bold text-[#002443]">{title}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#2bc196] font-semibold mt-0.5">{subtitle}</div>
      <p className="text-xs text-[#002443]/70 mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function PageRow({ icon: Icon, label, desc }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#f4f4f4]/40">
      <Icon className="w-3.5 h-3.5 text-[#2bc196] mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs font-semibold text-[#002443]">{label}</div>
        <div className="text-[11px] text-[#002443]/60">{desc}</div>
      </div>
    </div>
  );
}