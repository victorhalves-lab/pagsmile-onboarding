import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BookOpen, FileStack, Layers } from 'lucide-react';
import DocCapa from '@/components/kyc-doc/DocCapa';
import DocGlossario from '@/components/kyc-doc/DocGlossario';
import DocVisaoGeral from '@/components/kyc-doc/DocVisaoGeral';
import DocSegmentos from '@/components/kyc-doc/DocSegmentos';
import DocQuestionarios from '@/components/kyc-doc/DocQuestionarios';
import DocDocumentos from '@/components/kyc-doc/DocDocumentos';
import DocBDC from '@/components/kyc-doc/DocBDC';
import DocCAF from '@/components/kyc-doc/DocCAF';
import DocScoring from '@/components/kyc-doc/DocScoring';
import DocPipeline from '@/components/kyc-doc/DocPipeline';
import DocDecisao from '@/components/kyc-doc/DocDecisao';
import DocSubsellers from '@/components/kyc-doc/DocSubsellers';
import DocSentinel from '@/components/kyc-doc/DocSentinel';
import DocMonitoramento from '@/components/kyc-doc/DocMonitoramento';
import DocPainelAnalista from '@/components/kyc-doc/DocPainelAnalista';
import DocAcessos from '@/components/kyc-doc/DocAcessos';
import DocEscalacoes from '@/components/kyc-doc/DocEscalacoes';
import DocParceirosCompliance from '@/components/kyc-doc/DocParceirosCompliance';
import DocDocOnlyLink from '@/components/kyc-doc/DocDocOnlyLink';
import DocDocCompParceiros from '@/components/kyc-doc/DocDocCompParceiros';
import DocTemplatesMicroscopico from '@/components/kyc-doc/DocTemplatesMicroscopico';
import DocModeloDinamicoKYC from '@/components/kyc-doc/DocModeloDinamicoKYC';

const TOC = [
  { id: 's0', n: '0', label: 'Glossário — Termos Técnicos e Regulatórios' },
  { id: 's1', n: '1', label: 'Visão Geral — Arquitetura Completa do Pipeline KYC/KYB' },
  { id: 's2', n: '2', label: 'Segmentação por Tipo de Negócio' },
  { id: 's3', n: '3', label: 'Questionários de Compliance — Todas as Perguntas por Modelo' },
  { id: 's4', n: '4', label: 'Documentos Solicitados — Base e por Segmento' },
  { id: 's5', n: '5', label: 'Enriquecimento de Dados — BigDataCorp (BDC)' },
  { id: 's6', n: '6', label: 'Validação de Identidade — CAF (Combate à Fraude)' },
  { id: 's7', n: '7', label: 'Framework de Risk Scoring V4.0 — Fórmula Completa' },
  { id: 's8', n: '8', label: 'Pipeline Automatizado (Orquestrador)' },
  { id: 's9', n: '9', label: 'Tabela de Decisão Determinística' },
  { id: 's10', n: '10', label: 'Fluxo de Subsellers (PJ e PF) — Perguntas e Documentos' },
  { id: 's11', n: '11', label: 'Análise SENTINEL IA (Agente Relator)' },
  { id: 's12', n: '12', label: 'Monitoramento Contínuo e Revalidação' },
  { id: 's13', n: '13', label: 'Painel de Análise de Risco — Visão Completa do Analista' },
  { id: 's14', n: '14', label: 'Governança de Acesso — Perfis, 2FA e Auditoria' },
  { id: 's15', n: '15', label: 'Escalações Questionáveis — Monitoramento de Qualidade da Decisão' },
  { id: 's16', n: '16', label: 'Módulo de Parceiros de Compliance — Colaboração Externa' },
  { id: 's17', n: '17', label: 'Link de Documentos Exclusivos — Fluxo Acelerado' },
  { id: 's18', n: '18', label: 'Doc Compliance Parceiros + Coleta Bancária + Export Pré-KYC' },
];

export default function DocumentoKYCKYB() {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'templates' | 'dinamico'

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['kyc-doc-templates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ category: 'COMPLIANCE', isActive: true }),
  });

  const templateIds = templates.map(t => t.id);
  const { data: allQuestions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['kyc-doc-questions', templateIds.join(',')],
    queryFn: async () => {
      if (templateIds.length === 0) return [];
      const promises = templateIds.map(id => base44.entities.Question.filter({ questionnaireTemplateId: id }, 'order'));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: templateIds.length > 0,
  });

  if (loadingTemplates || loadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mr-3" />
        <span className="text-[#1a1a1a]/50">Carregando dados dos questionários...</span>
      </div>
    );
  }

  const questionsByTemplate = {};
  templates.forEach(t => {
    questionsByTemplate[t.id] = allQuestions
      .filter(q => q.questionnaireTemplateId === t.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return (
    <div className="bg-white min-h-screen">
      {/* ═══ TAB NAVIGATION (not printed) ═══ */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-[#e8e8e8] max-w-[1200px] mx-auto">
        <div className="flex items-center gap-1 px-4 pt-4">
          <TabButton
            active={activeTab === 'manual'}
            onClick={() => setActiveTab('manual')}
            icon={BookOpen}
            label="Manual de Processos"
            sublabel="19 seções completas"
          />
          <TabButton
            active={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
            icon={FileStack}
            label="Templates Microscópico"
            sublabel={`${templates.length} templates ativos`}
          />
          <TabButton
            active={activeTab === 'dinamico'}
            onClick={() => setActiveTab('dinamico')}
            icon={Layers}
            label="Modelo Dinâmico KYC/KYB"
            sublabel="Perguntas e docs por segmento"
          />
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === 'manual' && (
        <ManualContent templates={templates} questionsByTemplate={questionsByTemplate} />
      )}
      {activeTab === 'templates' && (
        <DocTemplatesMicroscopico templates={templates} questionsByTemplate={questionsByTemplate} />
      )}
      {activeTab === 'dinamico' && (
        <DocModeloDinamicoKYC templates={templates} questionsByTemplate={questionsByTemplate} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────
   Tab 1 — Full printable manual
   ──────────────────────────────────────── */
function ManualContent({ templates, questionsByTemplate }) {
  return (
    <div id="kyc-doc" className="max-w-[900px] mx-auto">
      <style>{`
        #kyc-doc { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1a1a1a; background: white !important; }
        #kyc-doc, #kyc-doc * { color: #1a1a1a; }
        #kyc-doc h1, #kyc-doc h2 { color: #002443 !important; }
        #kyc-doc h3 { color: #2bc196 !important; }
        #kyc-doc strong { color: #002443 !important; }
        #kyc-doc div, #kyc-doc section, #kyc-doc header, #kyc-doc footer,
        #kyc-doc nav, #kyc-doc main, #kyc-doc article {
          background-color: transparent !important;
        }
        #kyc-doc { background: white !important; }
        #kyc-doc thead tr, #kyc-doc thead th { background: white !important; color: #002443 !important; }
        #kyc-doc div[class*="border-l-"] { background: white !important; }

        @media print {
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          #kyc-doc { max-width: 100% !important; margin: 0 !important; padding: 0 !important; font-size: 9.5pt !important; color: #1a1a1a !important; }
          #kyc-doc * { color: inherit !important; }
          #kyc-doc .doc-cover { page-break-after: always !important; padding: 40pt 30pt !important; }
          #kyc-doc .doc-cover h1 { font-size: 22pt !important; color: #002443 !important; }
          #kyc-doc .doc-cover span[class*="text-[#2bc196]"] { color: #2bc196 !important; }
          #kyc-doc .doc-cover svg { color: #2bc196 !important; }
          #kyc-doc .doc-toc { page-break-after: always !important; padding: 20pt !important; }
          #kyc-doc .doc-break { page-break-before: always !important; }
          #kyc-doc section { margin-bottom: 0 !important; padding: 0 12pt !important; }
          #kyc-doc h1 { font-size: 13pt !important; color: #002443 !important; margin: 16pt 0 4pt 0 !important; page-break-after: avoid !important; }
          #kyc-doc h1 + div { margin-bottom: 6pt !important; }
          #kyc-doc h2 { font-size: 10.5pt !important; color: #002443 !important; margin: 10pt 0 4pt 0 !important; page-break-after: avoid !important; }
          #kyc-doc h3 { font-size: 9.5pt !important; color: #2bc196 !important; margin: 8pt 0 3pt 0 !important; page-break-after: avoid !important; }
          #kyc-doc p { font-size: 8.5pt !important; line-height: 1.45 !important; color: #1a1a1a !important; orphans: 3 !important; widows: 3 !important; }
          #kyc-doc li { font-size: 8.5pt !important; line-height: 1.45 !important; color: #1a1a1a !important; }
          #kyc-doc strong { color: #002443 !important; }
          #kyc-doc code { background: #f0f0f0 !important; padding: 0.5pt 2pt !important; font-size: 7.5pt !important; }
          #kyc-doc ul, #kyc-doc ol { margin: 3pt 0 3pt 14pt !important; padding: 0 !important; }
          #kyc-doc table { width: 100% !important; border-collapse: collapse !important; font-size: 7pt !important; margin: 4pt 0 !important; page-break-inside: auto !important; }
          #kyc-doc thead { display: table-header-group !important; }
          #kyc-doc tr { page-break-inside: avoid !important; }
          #kyc-doc thead tr { background: white !important; border-bottom: 1.5pt solid #2bc196 !important; }
          #kyc-doc thead th { color: #002443 !important; font-size: 7pt !important; padding: 3pt 4pt !important; border: none !important; border-bottom: 1.5pt solid #2bc196 !important; font-weight: 700 !important; background: white !important; }
          #kyc-doc tbody td { padding: 2.5pt 4pt !important; border-bottom: 0.5pt solid #e8e8e8 !important; color: #1a1a1a !important; font-size: 7pt !important; line-height: 1.3 !important; }
          #kyc-doc tbody tr:nth-child(even) { background: #f9f9f9 !important; }
          #kyc-doc tbody tr:nth-child(odd) { background: white !important; }
          #kyc-doc div[class*="border-l-[3px]"] { background: white !important; padding: 4pt 8pt !important; margin: 4pt 0 !important; page-break-inside: avoid !important; }
          #kyc-doc div[class*="border-l-[3px]"] p { font-size: 7.5pt !important; color: #1a1a1a !important; }
          #kyc-doc div[class*="border-l-[3px]"] p:first-child { color: #002443 !important; }
          #kyc-doc .doc-footer p { font-size: 7pt !important; color: #999 !important; }
          #kyc-doc div[class*="bg-[#2bc196]"] { background-color: #2bc196 !important; }
        }
      `}</style>

      {/* ═══ COVER ═══ */}
      <div className="doc-cover">
        <DocCapa />
      </div>

      {/* ═══ TABLE OF CONTENTS ═══ */}
      <div className="doc-toc px-8 py-6 mb-6">
        <h2 className="text-lg font-bold text-[#002443] mb-5">Índice</h2>
        <div className="flex flex-col">
          {TOC.map(t => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="flex items-center gap-3 py-2 border-b border-[#e8e8e8] text-[13px] text-[#1a1a1a]/70 hover:text-[#2bc196] transition-colors"
            >
              <span className="text-[#2bc196] font-bold text-sm w-6 text-right flex-shrink-0">{t.n}</span>
              <span>{t.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ═══ DOCUMENT BODY ═══ */}
      <div className="px-8">
        <div id="s0"><DocGlossario /></div>
        <div id="s1" className="doc-break"><DocVisaoGeral /></div>
        <div id="s2"><DocSegmentos /></div>
        <div id="s3" className="doc-break"><DocQuestionarios templates={templates} questionsByTemplate={questionsByTemplate} /></div>
        <div id="s4" className="doc-break"><DocDocumentos templates={templates} /></div>
        <div id="s5" className="doc-break"><DocBDC /></div>
        <div id="s6" className="doc-break"><DocCAF /></div>
        <div id="s7" className="doc-break"><DocScoring /></div>
        <div id="s8"><DocPipeline /></div>
        <div id="s9"><DocDecisao /></div>
        <div id="s10" className="doc-break"><DocSubsellers templates={templates} questionsByTemplate={questionsByTemplate} /></div>
        <div id="s11"><DocSentinel /></div>
        <div id="s12"><DocMonitoramento /></div>
        <div id="s13"><DocPainelAnalista /></div>
        <div id="s14" className="doc-break"><DocAcessos /></div>
        <div id="s15"><DocEscalacoes /></div>
        <div id="s16" className="doc-break"><DocParceirosCompliance /></div>
        <div id="s17" className="doc-break"><DocDocOnlyLink /></div>
        <div id="s18" className="doc-break"><DocDocCompParceiros /></div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="doc-footer mt-10 mx-8 border-t border-[#e0e0e0] pt-4 pb-6 text-center">
        <p className="text-[11px] text-[#1a1a1a]/30">
          PagSmile — Manual de Processos KYC/KYB — Compliance V4.0
        </p>
        <p className="text-[10px] text-[#1a1a1a]/20 mt-1">
          Documento Confidencial — {new Date().toLocaleDateString('pt-BR')} — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Tab button (header)
   ──────────────────────────────────────── */
function TabButton({ active, onClick, icon: Icon, label, sublabel }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 border-b-2 transition-all ${active
        ? 'border-[#2bc196] bg-white'
        : 'border-transparent text-[#1a1a1a]/50 hover:bg-[#f9fafb]'}`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-[#2bc196]' : 'text-[#1a1a1a]/40'}`} />
      <div className="text-left">
        <p className={`text-sm font-bold ${active ? 'text-[#002443]' : 'text-[#1a1a1a]/60'}`}>{label}</p>
        <p className="text-[10px] text-[#1a1a1a]/40">{sublabel}</p>
      </div>
    </button>
  );
}