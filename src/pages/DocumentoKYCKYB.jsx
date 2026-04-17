import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Printer, FileText, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocCapa from '@/components/kyc-doc/DocCapa';
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

const TOC = [
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
];

export default function DocumentoKYCKYB() {
  // Fetch all compliance templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['kyc-doc-templates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ category: 'COMPLIANCE', isActive: true }),
  });

  // Fetch ALL questions for all templates
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
        <span className="text-[#002443]/60">Carregando dados completos dos questionários...</span>
      </div>
    );
  }

  // Group questions by template
  const questionsByTemplate = {};
  templates.forEach(t => {
    questionsByTemplate[t.id] = allQuestions
      .filter(q => q.questionnaireTemplateId === t.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return (
    <div id="kyc-doc" className="max-w-5xl mx-auto pb-16">
      <style>{`
        /* ═══════════════════════════════════════════════════════
           KYC DOCUMENT — PRINT STYLES
           Uses #kyc-doc ID for highest specificity to beat globals.css
           ═══════════════════════════════════════════════════════ */
        @media print {
          /* Force background colors to print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* Hide everything except the document */
          body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 10pt !important; }
          .no-print, nav, aside { display: none !important; }

          /* Container: full width, no padding */
          #kyc-doc { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }

          /* Page breaks */
          #kyc-doc .print-break { page-break-before: always !important; }

          /* ── COVER ── */
          #kyc-doc .kyc-cover {
            background-color: #002443 !important;
            border-radius: 0 !important;
            padding: 60pt 40pt !important;
            margin: 0 !important;
            page-break-after: always !important;
          }
          #kyc-doc .kyc-cover * { color: #ffffff !important; }
          #kyc-doc .kyc-cover svg { color: #2bc196 !important; }
          #kyc-doc .kyc-cover .kyc-green { color: #2bc196 !important; }
          #kyc-doc .kyc-cover h1 { font-size: 26pt !important; border: none !important; padding: 0 !important; color: #ffffff !important; }
          #kyc-doc .kyc-cover p { color: rgba(255,255,255,0.65) !important; }
          #kyc-doc .kyc-cover strong { color: #ffffff !important; }
          #kyc-doc .kyc-cover .kyc-cover-deco { display: none !important; }

          /* ── TOC ── */
          #kyc-doc .kyc-toc {
            border: none !important; border-radius: 0 !important;
            padding: 20pt !important; page-break-after: always !important;
          }
          #kyc-doc .kyc-toc h2 { font-size: 14pt !important; color: #002443 !important; margin-bottom: 12pt !important; }
          #kyc-doc .kyc-toc a { color: #333 !important; font-size: 10pt !important; text-decoration: none !important; }
          #kyc-doc .kyc-toc .kyc-toc-n {
            background-color: #002443 !important; color: #ffffff !important;
            width: 20pt !important; height: 20pt !important; font-size: 8pt !important;
          }

          /* ── SECTIONS ── */
          #kyc-doc .kyc-s {
            background: white !important; border: none !important; border-radius: 0 !important;
            box-shadow: none !important; padding: 0 16pt !important; margin: 0 !important;
          }

          /* ── H1 ── */
          #kyc-doc .kyc-s h1 {
            font-size: 15pt !important; color: #002443 !important;
            border-bottom: 2pt solid #2bc196 !important; border-left: none !important; border-right: none !important; border-top: none !important;
            padding: 0 0 4pt 0 !important; margin: 20pt 0 10pt 0 !important;
            page-break-after: avoid !important;
          }
          /* ── H2 ── */
          #kyc-doc .kyc-s h2 {
            font-size: 12pt !important; color: #002443 !important;
            border-left: 3pt solid #2bc196 !important; border-bottom: none !important; border-top: none !important; border-right: none !important;
            padding: 0 0 0 8pt !important; margin: 14pt 0 6pt 0 !important;
            page-break-after: avoid !important;
          }
          /* ── H3 ── */
          #kyc-doc .kyc-s h3 {
            font-size: 10.5pt !important; color: #002443 !important;
            border: none !important; padding: 0 !important; margin: 10pt 0 4pt 0 !important;
            page-break-after: avoid !important;
          }
          /* ── Text ── */
          #kyc-doc .kyc-s p { font-size: 9pt !important; line-height: 1.5 !important; color: #333 !important; orphans: 3 !important; widows: 3 !important; }
          #kyc-doc .kyc-s li { font-size: 9pt !important; line-height: 1.5 !important; color: #333 !important; margin-bottom: 2pt !important; }
          #kyc-doc .kyc-s strong { color: #002443 !important; }
          #kyc-doc .kyc-s code { background: #eee !important; padding: 1pt 3pt !important; font-size: 8pt !important; border-radius: 2pt !important; }
          #kyc-doc .kyc-s ul, #kyc-doc .kyc-s ol { margin: 4pt 0 4pt 16pt !important; padding: 0 !important; }

          /* ── TABLES ── */
          #kyc-doc .kyc-s table { width: 100% !important; border-collapse: collapse !important; font-size: 7.5pt !important; margin: 8pt 0 !important; page-break-inside: auto !important; }
          #kyc-doc .kyc-s thead { display: table-header-group !important; }
          #kyc-doc .kyc-s tr { page-break-inside: avoid !important; }
          #kyc-doc .kyc-s thead tr { background-color: #002443 !important; }
          #kyc-doc .kyc-s thead th { color: #ffffff !important; font-size: 7.5pt !important; padding: 4pt 5pt !important; border: 0.5pt solid #002443 !important; font-weight: 600 !important; }
          #kyc-doc .kyc-s tbody td { padding: 3pt 5pt !important; border: 0.5pt solid #ccc !important; color: #333 !important; font-size: 7.5pt !important; line-height: 1.35 !important; vertical-align: top !important; }
          #kyc-doc .kyc-s tbody tr:nth-child(even) { background-color: #f5f5f5 !important; }
          #kyc-doc .kyc-s tbody tr:nth-child(odd) { background-color: #ffffff !important; }

          /* ── INFOBOX ── */
          #kyc-doc .kyc-s .kyc-info {
            border: 0.5pt solid #bbb !important; border-left: 3pt solid #2bc196 !important;
            border-radius: 0 !important; background: #fafafa !important;
            padding: 6pt 10pt !important; margin: 8pt 0 !important;
            page-break-inside: avoid !important;
          }
          #kyc-doc .kyc-s .kyc-info p { font-size: 8pt !important; color: #333 !important; }
          #kyc-doc .kyc-s .kyc-info > p:first-child { font-weight: 700 !important; color: #002443 !important; font-size: 8.5pt !important; }

          /* ── FOOTER ── */
          #kyc-doc .kyc-foot {
            background: none !important; border-radius: 0 !important;
            border-top: 0.5pt solid #ccc !important; padding: 8pt 16pt !important; margin-top: 16pt !important;
          }
          #kyc-doc .kyc-foot * { color: #999 !important; background: none !important; }
          #kyc-doc .kyc-foot img { display: none !important; }
          #kyc-doc .kyc-foot p { font-size: 7pt !important; }
        }
      `}</style>

      <DocCapa />

      {/* TOC */}
      <div className="kyc-toc bg-white rounded-2xl border border-[#002443]/8 p-6 mb-8">
        <h2 className="text-base font-bold text-[#002443] mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2bc196] no-print" /> Índice Completo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {TOC.map(t => (
            <a key={t.id} href={`#${t.id}`} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-[#002443]/70 hover:bg-[#2bc196]/5 hover:text-[#2bc196] transition-colors">
              <span className="kyc-toc-n w-6 h-6 rounded-full bg-[#002443] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{t.n}</span>
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        <div id="s1"><DocVisaoGeral /></div>
        <div id="s2"><DocSegmentos /></div>
        <div id="s3" className="print-break"><DocQuestionarios templates={templates} questionsByTemplate={questionsByTemplate} /></div>
        <div id="s4" className="print-break"><DocDocumentos templates={templates} /></div>
        <div id="s5" className="print-break"><DocBDC /></div>
        <div id="s6" className="print-break"><DocCAF /></div>
        <div id="s7" className="print-break"><DocScoring /></div>
        <div id="s8"><DocPipeline /></div>
        <div id="s9"><DocDecisao /></div>
        <div id="s10" className="print-break"><DocSubsellers templates={templates} questionsByTemplate={questionsByTemplate} /></div>
        <div id="s11"><DocSentinel /></div>
        <div id="s12"><DocMonitoramento /></div>
        <div id="s13"><DocPainelAnalista /></div>
      </div>

      {/* Footer */}
      <div className="kyc-foot mt-8 bg-[#002443] rounded-2xl p-6 text-center">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" alt="PagSmile" className="h-6 mx-auto mb-3 opacity-60" />
        <p className="text-white/30 text-xs">PagSmile — Manual de Processos KYC/KYB — Compliance V4.0</p>
        <p className="text-white/20 text-[10px] mt-1">Documento Confidencial — {new Date().toLocaleDateString('pt-BR')} — Todos os direitos reservados</p>
      </div>
    </div>
  );
}