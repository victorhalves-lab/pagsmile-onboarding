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
    <div className="max-w-5xl mx-auto pb-16 print:max-w-none print:pb-0">
      <style>{`
        @media print {
          body { font-size: 10pt !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          table { font-size: 8pt !important; }
          h1 { font-size: 16pt !important; }
          h2 { font-size: 13pt !important; }
          h3 { font-size: 11pt !important; }
        }
      `}</style>

      <DocCapa />

      {/* TOC */}
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-6 mb-8 print:break-after-page print:border-0">
        <h2 className="text-base font-bold text-[#002443] mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2bc196]" /> Índice Completo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {TOC.map(t => (
            <a key={t.id} href={`#${t.id}`} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-[#002443]/70 hover:bg-[#2bc196]/5 hover:text-[#2bc196] transition-colors print:text-xs">
              <span className="w-6 h-6 rounded-full bg-[#002443] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{t.n}</span>
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
      <div className="mt-8 bg-[#002443] rounded-2xl p-6 text-center print:rounded-none">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" alt="PagSmile" className="h-6 mx-auto mb-3 opacity-60" />
        <p className="text-white/30 text-xs">PagSmile — Manual de Processos KYC/KYB — Compliance V4.0</p>
        <p className="text-white/20 text-[10px] mt-1">Documento Confidencial — {new Date().toLocaleDateString('pt-BR')} — Todos os direitos reservados</p>
      </div>
    </div>
  );
}