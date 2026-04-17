import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Loader2 } from 'lucide-react';
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
        <span className="text-[#002443]/60">Carregando dados dos questionários...</span>
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
    <div id="kyc-doc" className="bg-white max-w-[900px] mx-auto">
      {/* ── Print Styles ── */}
      <style>{`
        /* On screen: document on white background with padding from layout */
        #kyc-doc { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }

        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything non-document */
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          nav, aside, .no-print { display: none !important; }

          /* Container */
          #kyc-doc {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9.5pt !important;
          }

          /* Cover page */
          #kyc-doc > div:first-child {
            background-color: #002443 !important;
            padding: 50pt 36pt !important;
            margin: 0 !important;
            page-break-after: always !important;
          }
          #kyc-doc > div:first-child * { color: #fff !important; }
          #kyc-doc > div:first-child svg { color: #2bc196 !important; }
          #kyc-doc > div:first-child span[class*="text-[#2bc196]"],
          #kyc-doc > div:first-child .text-\\[\\#2bc196\\] { color: #2bc196 !important; }
          #kyc-doc > div:first-child strong { color: rgba(255,255,255,0.85) !important; }
          #kyc-doc > div:first-child p { color: rgba(255,255,255,0.6) !important; }
          #kyc-doc > div:first-child h1 { font-size: 24pt !important; color: #fff !important; border: none !important; padding: 0 !important; margin: 0 0 8pt 0 !important; }

          /* TOC page */
          #kyc-doc .doc-toc { page-break-after: always !important; padding: 16pt !important; }
          #kyc-doc .doc-toc h2 { font-size: 13pt !important; }
          #kyc-doc .doc-toc a { font-size: 9pt !important; color: #333 !important; text-decoration: none !important; }

          /* Page breaks on major sections */
          #kyc-doc .doc-break { page-break-before: always !important; }

          /* Section content */
          #kyc-doc section { margin-bottom: 0 !important; padding: 0 10pt !important; }

          /* H1 */
          #kyc-doc h1 {
            font-size: 14pt !important; color: #002443 !important;
            border-bottom: 2pt solid #2bc196 !important; border-left: none !important;
            padding: 0 0 3pt 0 !important; margin: 18pt 0 8pt 0 !important;
            page-break-after: avoid !important;
          }
          /* H2 */
          #kyc-doc h2 {
            font-size: 11pt !important; color: #002443 !important;
            border-left: 2.5pt solid #2bc196 !important; border-bottom: none !important;
            padding: 0 0 0 6pt !important; margin: 12pt 0 5pt 0 !important;
            page-break-after: avoid !important;
          }
          /* H3 */
          #kyc-doc h3 {
            font-size: 10pt !important; color: #002443 !important;
            border: none !important; padding: 0 !important; margin: 8pt 0 3pt 0 !important;
            page-break-after: avoid !important;
          }
          /* Text */
          #kyc-doc p { font-size: 9pt !important; line-height: 1.45 !important; color: #333 !important; orphans: 3 !important; widows: 3 !important; }
          #kyc-doc li { font-size: 9pt !important; line-height: 1.45 !important; color: #333 !important; }
          #kyc-doc strong { color: #002443 !important; }
          #kyc-doc code { background: #eee !important; padding: 0.5pt 2pt !important; font-size: 8pt !important; }
          #kyc-doc ul, #kyc-doc ol { margin: 3pt 0 3pt 14pt !important; padding: 0 !important; }

          /* Tables */
          #kyc-doc table { width: 100% !important; border-collapse: collapse !important; font-size: 7pt !important; margin: 5pt 0 !important; page-break-inside: auto !important; }
          #kyc-doc thead { display: table-header-group !important; }
          #kyc-doc tr { page-break-inside: avoid !important; }
          #kyc-doc thead tr { background-color: #002443 !important; }
          #kyc-doc thead th { color: #fff !important; font-size: 7pt !important; padding: 3pt 4pt !important; border: 0.5pt solid #002443 !important; }
          #kyc-doc tbody td { padding: 2.5pt 4pt !important; border: 0.5pt solid #ccc !important; color: #333 !important; font-size: 7pt !important; line-height: 1.3 !important; }
          #kyc-doc tbody tr:nth-child(even) { background-color: #f5f5f5 !important; }
          #kyc-doc tbody tr:nth-child(odd) { background-color: #fff !important; }

          /* InfoBox */
          #kyc-doc div[class*="border-l-4"] {
            border-radius: 0 !important; background: #fafafa !important;
            padding: 5pt 8pt !important; margin: 5pt 0 !important;
            page-break-inside: avoid !important;
          }
          #kyc-doc div[class*="border-l-4"] p { font-size: 8pt !important; }

          /* Footer */
          #kyc-doc .doc-footer { border-top: 0.5pt solid #ccc !important; padding: 6pt 10pt !important; margin-top: 12pt !important; }
          #kyc-doc .doc-footer p { font-size: 7pt !important; color: #999 !important; }
        }
      `}</style>

      {/* ═══ COVER ═══ */}
      <DocCapa />

      {/* ═══ TABLE OF CONTENTS ═══ */}
      <div className="doc-toc px-8 py-6 mb-8">
        <h2 className="text-lg font-bold text-[#002443] mb-5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2bc196] no-print" />
          Índice
        </h2>
        <div className="grid grid-cols-1 gap-0.5">
          {TOC.map(t => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="flex items-center gap-3 py-2 px-2 text-[13px] text-[#002443]/70 hover:text-[#2bc196] transition-colors group"
            >
              <span className="w-6 h-6 bg-[#002443] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {t.n}
              </span>
              <span className="group-hover:underline">{t.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ═══ DOCUMENT BODY ═══ */}
      <div className="px-8">
        <div id="s1"><DocVisaoGeral /></div>
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
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="doc-footer mt-10 mx-8 border-t border-[#e0e0e0] pt-4 pb-6 text-center">
        <p className="text-[11px] text-[#002443]/30">
          PagSmile — Manual de Processos KYC/KYB — Compliance V4.0
        </p>
        <p className="text-[10px] text-[#002443]/20 mt-1">
          Documento Confidencial — {new Date().toLocaleDateString('pt-BR')} — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}