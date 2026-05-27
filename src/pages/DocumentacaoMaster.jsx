import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, FileText, FileType, BookOpen, Layers, Database, Shield, Zap, Cpu,
  Filter, Handshake, Stamp, ChevronRight, Printer, ClipboardList, Globe2, Link2
} from 'lucide-react';
import { exportChapterToPdf, exportChapterToDocx } from '@/components/doc-master/exportUtils';

import Ch01 from '@/components/doc-master/chapters/Ch01_VisaoArquitetura';
import Ch02 from '@/components/doc-master/chapters/Ch02_Glossario';
import Ch03 from '@/components/doc-master/chapters/Ch03_Pipeline';
import Ch04 from '@/components/doc-master/chapters/Ch04_RiskScoringV4';
import Ch05 from '@/components/doc-master/chapters/Ch05_BDC';
import Ch06 from '@/components/doc-master/chapters/Ch06_CAF';
import Ch07 from '@/components/doc-master/chapters/Ch07_Sentinel';
import Ch08 from '@/components/doc-master/chapters/Ch08_FunisCaptacao';
import Ch09 from '@/components/doc-master/chapters/Ch09_ModeloDados';
import Ch10 from '@/components/doc-master/chapters/Ch10_Governanca';
import Ch11 from '@/components/doc-master/chapters/Ch11_Parceiros';
import Ch12 from '@/components/doc-master/chapters/Ch12_PropostasContratos';
import Ch13 from '@/components/doc-master/chapters/Ch13_QuestionariosLeads';
import Ch14 from '@/components/doc-master/chapters/Ch14_FrameworkV5_2';
import Ch15 from '@/components/doc-master/chapters/Ch15_EngineV5_2';
import Ch16 from '@/components/doc-master/chapters/Ch16_QuestionarioV5_2';
import Ch17 from '@/components/doc-master/chapters/Ch17_Cat5_Excecoes';
import Ch18 from '@/components/doc-master/chapters/Ch18_ColetaSubsellersGateway';
import Ch19 from '@/components/doc-master/chapters/Ch19_MundoGlobal';
import Ch20 from '@/components/doc-master/chapters/Ch20_PropostasUnificadas';

const CHAPTERS = [
  { id: 'ch-01', num: '01', title: 'Visão Geral da Arquitetura', icon: Layers, comp: Ch01, summary: 'Stack, camadas, princípios invioláveis, secrets, roteamento' },
  { id: 'ch-02', num: '02', title: 'Glossário Microscópico (120+ termos)', icon: BookOpen, comp: Ch02, summary: 'Siglas regulatórias, framework V4, CAF, BDC, entidades' },
  { id: 'ch-03', num: '03', title: 'Pipeline autoEnrichOnboarding', icon: Zap, comp: Ch03, summary: '11 steps linha-por-linha, decisão determinística, veto biométrico' },
  { id: 'ch-04', num: '04', title: 'Risk Scoring V4', icon: Cpu, comp: Ch04, summary: 'Cada constante, peso, threshold, bloqueio B01-B10' },
  { id: 'ch-05', num: '05', title: 'BigDataCorp — Dataset por Dataset', icon: Database, comp: Ch05, summary: '~40 datasets, lotes, retry, autorização' },
  { id: 'ch-06', num: '06', title: 'CAF — Biometria & Documentoscopia', icon: Shield, comp: Ch06, summary: 'SDK Web, Core API, Connect, webhook HMAC, veto biométrico' },
  { id: 'ch-07', num: '07', title: 'SENTINEL IA (Relator)', icon: BookOpen, comp: Ch07, summary: 'Modelo, 4 chamadas paralelas, JSON schema, anti-hallucination' },
  { id: 'ch-08', num: '08', title: 'Funis de Captação', icon: Filter, comp: Ch08, summary: 'Lead V5 (12 steps), PIX V4 (7), Landing Pages, Fechamento, Subseller' },
  { id: 'ch-09', num: '09', title: 'Modelo de Dados', icon: Database, comp: Ch09, summary: 'Schema completo das 8 entidades centrais' },
  { id: 'ch-10', num: '10', title: 'Governança & Acessos', icon: Shield, comp: Ch10, summary: 'AccessProfile granular, 2FA TOTP+PIN, auditoria 5 anos' },
  { id: 'ch-11', num: '11', title: 'Parceiros & Pré-KYC', icon: Handshake, comp: Ch11, summary: 'Bureaus externos, Doc-Only, BankDataCollection, Bulk Reprocess' },
  { id: 'ch-12', num: '12', title: 'Propostas, Contratos, Kick-Off', icon: Stamp, comp: Ch12, summary: 'Proposal/Standard/Pix, versionamento, links, IA contratos, Kick-Off' },
  { id: 'ch-13', num: '13', title: 'Questionários de Leads — Microscópico', icon: ClipboardList, comp: Ch13, summary: 'Lead V5 (12 etapas, 45+18 perguntas, 16 flags) + PIX V4 (7 etapas, 28 perguntas, 11 flags)' },
  { id: 'ch-14', num: '14', title: 'V5.2 — Framework (Tiers, Capabilities, Segmentos)', icon: Layers, comp: Ch14, summary: 'NOVO V5.2 (aditivo, V4 preservado): DNA versioning, 3 tiers + sub-tiers, 4 capabilities, 15 segmentos, morfologias' },
  { id: 'ch-15', num: '15', title: 'V5.2 — Engine (Scoring, 58 Datasets, 72 Bloqueios, Cross-Val 16)', icon: Cpu, comp: Ch15, summary: 'NOVO V5.2: 5 camadas tier-aware, 13 dimensões analíticas, Patch Financeiro 5 dim, Matriz 5 categorias, Snapshot imutável' },
  { id: 'ch-16', num: '16', title: 'V5.2 — Questionário Dinâmico (catálogo único)', icon: ClipboardList, comp: Ch16, summary: 'NOVO V5.2: catálogo 80+65 perguntas, 5 modalidades (A/B/C/D/E), real-time block engine, tier escalation banner' },
  { id: 'ch-17', num: '17', title: 'V5.2 — Cat 5 Monitoramento Intensivo + Exceções', icon: Shield, comp: Ch17, summary: 'NOVO V5.2: Categoria 5, PlanoMonitoramento, TermoAdicional aceite seller, BdcMonitoringEvent, gatilhos off-boarding, SentinelFeedback' },
  { id: 'ch-18', num: '18', title: 'Coleta de Subsellers via Gateway (Pré-KYC em Massa)', icon: Handshake, comp: Ch18, summary: 'Fluxo NOVO: links únicos por Gateway, formulário público em massa (14 campos × N subsellers), inbox de submissões, exportação XLSX — pré-triagem antes de disparar KYC individual' },
  { id: 'ch-19', num: '19', title: 'Mundo Global — USD / Multi-país / Trilíngue', icon: Globe2, comp: Ch19, summary: 'Trilho paralelo internacional: GlobalQuestionnaire, GlobalProposal (Interchange++ ou local_payments), catálogo GlobalCountryChannel (~250 país×provider×método), GlobalCountryFee (VAT/IOF/GMF), KYC tri-língue, simulador' },
  { id: 'ch-20', num: '20', title: 'Propostas Unificadas — Brasil + Global em 1 Link', icon: Link2, comp: Ch20, summary: 'UnifiedProposalPackage agregador (sem duplicar dados), link público /u/:slug com tabs BR/Global, aceite independente por lado, publicUnifiedProposal, wizard 2 modos (Linkar/Criar do zero)' },
];

export default function DocumentacaoMaster() {
  const [activeChapter, setActiveChapter] = useState(null);
  const [search, setSearch] = useState('');

  const filteredChapters = useMemo(() => {
    if (!search.trim()) return CHAPTERS;
    const q = search.toLowerCase();
    return CHAPTERS.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.num.includes(q)
    );
  }, [search]);

  const ActiveComp = activeChapter ? CHAPTERS.find(c => c.id === activeChapter)?.comp : null;
  const activeMeta = activeChapter ? CHAPTERS.find(c => c.id === activeChapter) : null;

  const handleExportPdfAll = async () => {
    await exportChapterToPdf('doc-master-root', 'Documentação Master Completa');
  };
  const handleExportPdfChapter = async () => {
    if (!activeMeta) return;
    await exportChapterToPdf(activeMeta.id, activeMeta.title);
  };
  const handleExportDocxChapter = async () => {
    if (!activeMeta) return;
    await exportChapterToDocx(activeMeta.id, activeMeta.title);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f4f4f4]">
        <style>{`
          @media print {
            body.printing-doc-master * { visibility: hidden; }
            body.printing-doc-master .doc-master-printable,
            body.printing-doc-master .doc-master-printable * { visibility: visible; }
            body.printing-doc-master .doc-master-printable { position: absolute; left: 0; top: 0; width: 100%; }
            body.printing-doc-master .no-print { display: none !important; }
            body.printing-doc-master .print-section { page-break-inside: avoid; }
            body.printing-doc-master .print-h1 { page-break-before: always; }
            body.printing-doc-master .print-h1:first-child { page-break-before: avoid; }
            body.printing-doc-master .print-table { page-break-inside: avoid; }
            body.printing-doc-master .print-code { page-break-inside: avoid; }
            @page { margin: 1.5cm 1.2cm; size: A4; }
          }
        `}</style>

        {/* Header */}
        <div className="no-print bg-gradient-to-r from-[#002443] to-[#003366] text-white py-6 px-6 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#5cf7cf] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Documentação Master</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black">PagSmile — Documentação Microscópica Completa</h1>
              <p className="text-[12.5px] text-white/70 mt-1 max-w-3xl">
                12 capítulos. Cada constante, threshold, peso, regex, endpoint e fluxo extraído do código fonte real.
                Exportável em PDF (impressão otimizada) e DOCX (editável) por capítulo ou completo.
              </p>
            </div>
            <div className="flex gap-2">
              {!activeChapter ? (
                <Button onClick={handleExportPdfAll} className="bg-[#2bc196] hover:bg-[#36706c] text-white">
                  <Printer className="w-4 h-4 mr-1.5" /> Exportar Tudo (PDF)
                </Button>
              ) : (
                <>
                  <Button onClick={() => setActiveChapter(null)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    ← Voltar ao Sumário
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleExportPdfChapter} className="bg-[#2bc196] hover:bg-[#36706c] text-white">
                        <Printer className="w-4 h-4 mr-1.5" /> PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Imprimir/salvar como PDF (otimizado)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleExportDocxChapter} className="bg-white text-[#002443] hover:bg-white/90">
                        <FileType className="w-4 h-4 mr-1.5" /> DOCX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Baixar capítulo em Word editável</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {!activeChapter ? (
            <>
              <div className="no-print mb-5 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar capítulos por título, resumo ou número..."
                    className="pl-9 bg-white border-[#e8e8e8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredChapters.map(c => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setActiveChapter(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="group flex items-start gap-3 p-4 bg-white rounded-lg border border-[#e8e8e8] hover:border-[#2bc196] hover:shadow-md transition-all text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[#2bc196]/10 flex items-center justify-center group-hover:bg-[#2bc196]/20 transition-colors">
                        <Icon className="w-5 h-5 text-[#2bc196]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-[#2bc196] uppercase tracking-wider">Cap. {c.num}</span>
                        </div>
                        <h3 className="text-[14px] font-bold text-[#002443] leading-tight mb-1">{c.title}</h3>
                        <p className="text-[12px] text-[#1a1a1a]/70 leading-snug">{c.summary}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#002443]/30 group-hover:text-[#2bc196] flex-shrink-0 mt-1 transition-colors" />
                    </button>
                  );
                })}
                {filteredChapters.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-[#1a1a1a]/50 text-sm">
                    Nenhum capítulo encontrado para "{search}"
                  </div>
                )}
              </div>

              <div className="no-print mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Capítulos', value: '20', sub: 'V4 + V5.2 + Coleta + Global + Unificado' },
                  { label: 'Termos no Glossário', value: '120+', sub: 'Definidos' },
                  { label: 'Bloqueios', value: '10 + 72', sub: 'V4 + V5.2' },
                  { label: 'Funções Backend', value: '175+', sub: 'Documentadas' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-md border border-[#e8e8e8] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#1a1a1a]/50 font-semibold">{s.label}</div>
                    <div className="text-2xl font-black text-[#002443] mt-0.5">{s.value}</div>
                    <div className="text-[11px] text-[#2bc196]">{s.sub}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div id="doc-master-root" className="doc-master-printable">
              <div className="bg-white rounded-lg border border-[#e8e8e8] p-6 md:p-8 shadow-sm">
                <ActiveComp />
              </div>

              {(() => {
                const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                const next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
                if (!next) return null;
                return (
                  <div className="no-print mt-4">
                    <button
                      onClick={() => { setActiveChapter(next.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-full p-4 bg-white rounded-lg border border-[#e8e8e8] hover:border-[#2bc196] hover:shadow-md transition-all flex items-center gap-3 text-left"
                    >
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-[#2bc196] font-bold">Próximo capítulo →</div>
                        <div className="text-[14px] font-bold text-[#002443]">Cap. {next.num} — {next.title}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#2bc196]" />
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Hidden printable root para "Exportar Tudo" */}
        {!activeChapter && (
          <div id="doc-master-root" className="doc-master-printable" style={{ display: 'none' }}>
            <style>{`body.printing-doc-master #doc-master-root { display: block !important; }`}</style>
            <div className="p-6">
              {CHAPTERS.map(c => {
                const Comp = c.comp;
                return <Comp key={c.id} />;
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}