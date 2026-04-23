import React, { useMemo, useState } from 'react';
import { FileQuestion, FileCheck2, Layers, Filter, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Sub-aba "Modelo Dinâmico KYC/KYB"
 *
 * 4 seções:
 *   1. Perguntas COMUNS a todos os segmentos (compliance V4)
 *   2. Perguntas CONDICIONANTES por segmento (quem tem, quem não tem)
 *   3. Documentos COMUNS a todos os segmentos
 *   4. Documentos CONDICIONANTES por segmento
 *
 * "Comum" = presente em TODOS os templates COMPLIANCE V4 ativos (exceto os de PIX se a
 *           pergunta não existir lá — tratamos PIX como segmento próprio também).
 * "Condicionante" = presente em pelo menos 1 segmento mas não em todos.
 *
 * Props:
 *   templates: QuestionnaireTemplate[] (category=COMPLIANCE, isActive=true)
 *   questionsByTemplate: { [templateId]: Question[] }
 */
export default function DocModeloDinamicoKYC({ templates = [], questionsByTemplate = {} }) {
  // Só templates de COMPLIANCE V4 (exclui LEAD_GENERATION)
  const complianceTemplates = useMemo(
    () => templates.filter(t => t.category === 'COMPLIANCE' && t.isActive !== false),
    [templates]
  );

  const analysis = useMemo(() => analyzeTemplates(complianceTemplates, questionsByTemplate), [complianceTemplates, questionsByTemplate]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-12">
      <Header totalTemplates={complianceTemplates.length} stats={analysis.stats} />

      {/* Seção 1 — Perguntas comuns */}
      <Section
        icon={Layers}
        num="1"
        title="Perguntas Comuns a Todos os Segmentos"
        subtitle={`${analysis.commonQuestions.length} perguntas aparecem em TODOS os ${complianceTemplates.length} segmentos de compliance V4`}
        color="#2bc196"
      >
        <CommonQuestionsTable items={analysis.commonQuestions} />
      </Section>

      {/* Seção 2 — Perguntas condicionantes */}
      <Section
        icon={Filter}
        num="2"
        title="Perguntas Condicionantes por Segmento"
        subtitle={`${analysis.conditionalQuestions.length} perguntas aparecem em alguns segmentos mas não em todos`}
        color="#f59e0b"
      >
        <ConditionalQuestionsBySegment
          bySegment={analysis.conditionalQuestionsBySegment}
          allSegmentIds={analysis.segmentIds}
          allSegmentLabels={analysis.segmentLabels}
        />
      </Section>

      {/* Seção 3 — Documentos comuns */}
      <Section
        icon={FileCheck2}
        num="3"
        title="Documentos Comuns a Todos os Segmentos"
        subtitle={`${analysis.commonDocs.length} documentos são solicitados em TODOS os segmentos`}
        color="#2bc196"
      >
        <CommonDocsTable items={analysis.commonDocs} />
      </Section>

      {/* Seção 4 — Documentos condicionantes */}
      <Section
        icon={FileQuestion}
        num="4"
        title="Documentos Condicionantes por Segmento"
        subtitle={`${analysis.conditionalDocs.length} documentos são solicitados apenas em alguns segmentos`}
        color="#f59e0b"
      >
        <ConditionalDocsBySegment
          bySegment={analysis.conditionalDocsBySegment}
          allSegmentIds={analysis.segmentIds}
          allSegmentLabels={analysis.segmentLabels}
        />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Análise — calcula o que é comum vs. condicionante
   ═══════════════════════════════════════════════ */
function analyzeTemplates(templates, questionsByTemplate) {
  if (templates.length === 0) {
    return {
      stats: {},
      commonQuestions: [],
      conditionalQuestions: [],
      conditionalQuestionsBySegment: {},
      commonDocs: [],
      conditionalDocs: [],
      conditionalDocsBySegment: {},
      segmentIds: [],
      segmentLabels: {},
    };
  }

  const totalSegments = templates.length;
  const segmentIds = templates.map(t => t.id);
  const segmentLabels = {};
  templates.forEach(t => {
    segmentLabels[t.id] = {
      name: t.name || t.model || 'Sem nome',
      model: t.model,
      subCategory: t.subCategory,
    };
  });

  // ── Perguntas ─────────────────────────────────────
  // Mapa: chave normalizada → { text, templates: Set<templateId>, exampleQuestion }
  const questionsMap = new Map();
  templates.forEach(t => {
    const qs = questionsByTemplate[t.id] || [];
    qs.forEach(q => {
      const key = normalizeText(q.text);
      if (!key) return;
      if (!questionsMap.has(key)) {
        questionsMap.set(key, {
          text: q.text,
          type: q.type,
          isRequired: q.isRequired,
          templatesPresent: new Set(),
          examples: [],
        });
      }
      const entry = questionsMap.get(key);
      entry.templatesPresent.add(t.id);
      entry.examples.push({ templateId: t.id, templateName: t.name, order: q.order, helpText: q.helpText });
    });
  });

  const commonQuestions = [];
  const conditionalQuestions = [];
  const conditionalQuestionsBySegment = {};
  segmentIds.forEach(id => { conditionalQuestionsBySegment[id] = []; });

  questionsMap.forEach((entry, key) => {
    const presentCount = entry.templatesPresent.size;
    if (presentCount === totalSegments) {
      commonQuestions.push({
        key,
        text: entry.text,
        type: entry.type,
        isRequired: entry.isRequired,
      });
    } else {
      const item = {
        key,
        text: entry.text,
        type: entry.type,
        isRequired: entry.isRequired,
        presentIn: Array.from(entry.templatesPresent),
        presentCount,
      };
      conditionalQuestions.push(item);
      // Indexar por cada segmento que tem essa pergunta
      item.presentIn.forEach(tid => {
        conditionalQuestionsBySegment[tid].push(item);
      });
    }
  });

  // Ordenar perguntas
  commonQuestions.sort((a, b) => a.text.localeCompare(b.text, 'pt-BR'));
  conditionalQuestions.sort((a, b) => b.presentCount - a.presentCount || a.text.localeCompare(b.text, 'pt-BR'));

  // ── Documentos ────────────────────────────────────
  const docsMap = new Map();
  templates.forEach(t => {
    const docs = Array.isArray(t.requiredDocuments) ? t.requiredDocuments : [];
    docs.forEach(d => {
      const key = normalizeText(d.label || d.documentTypeId);
      if (!key) return;
      if (!docsMap.has(key)) {
        docsMap.set(key, {
          label: d.label,
          documentTypeId: d.documentTypeId,
          required: d.required,
          conditionalLogic: d.conditionalLogic,
          templatesPresent: new Set(),
        });
      }
      docsMap.get(key).templatesPresent.add(t.id);
    });
  });

  const commonDocs = [];
  const conditionalDocs = [];
  const conditionalDocsBySegment = {};
  segmentIds.forEach(id => { conditionalDocsBySegment[id] = []; });

  docsMap.forEach((entry, key) => {
    const presentCount = entry.templatesPresent.size;
    if (presentCount === totalSegments) {
      commonDocs.push({
        key,
        label: entry.label,
        documentTypeId: entry.documentTypeId,
        required: entry.required,
      });
    } else {
      const item = {
        key,
        label: entry.label,
        documentTypeId: entry.documentTypeId,
        required: entry.required,
        conditionalLogic: entry.conditionalLogic,
        presentIn: Array.from(entry.templatesPresent),
        presentCount,
      };
      conditionalDocs.push(item);
      item.presentIn.forEach(tid => {
        conditionalDocsBySegment[tid].push(item);
      });
    }
  });

  commonDocs.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  conditionalDocs.sort((a, b) => b.presentCount - a.presentCount || a.label.localeCompare(b.label, 'pt-BR'));

  const stats = {
    totalQuestions: questionsMap.size,
    totalDocs: docsMap.size,
    commonQuestionsPct: questionsMap.size ? Math.round((commonQuestions.length / questionsMap.size) * 100) : 0,
    commonDocsPct: docsMap.size ? Math.round((commonDocs.length / docsMap.size) * 100) : 0,
  };

  return {
    stats,
    commonQuestions,
    conditionalQuestions,
    conditionalQuestionsBySegment,
    commonDocs,
    conditionalDocs,
    conditionalDocsBySegment,
    segmentIds,
    segmentLabels,
  };
}

function normalizeText(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/* ═══════════════════════════════════════════════
   Header
   ═══════════════════════════════════════════════ */
function Header({ totalTemplates, stats }) {
  return (
    <div className="bg-gradient-to-br from-[#002443] to-[#003366] rounded-2xl p-8 text-white">
      <div className="flex items-center gap-3 mb-2">
        <Layers className="w-6 h-6 text-[#5cf7cf]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#5cf7cf]">
          Modelo Dinâmico KYC/KYB
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Perguntas e Documentos por Segmento</h1>
      <p className="text-white/70 text-sm max-w-3xl">
        Visão comparativa dos {totalTemplates} segmentos de compliance V4 ativos. Identifica quais
        perguntas e documentos são exigidos universalmente vs. quais são condicionantes do segmento.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatBox label="Segmentos ativos" value={totalTemplates} />
        <StatBox label="Perguntas únicas" value={stats.totalQuestions || 0} />
        <StatBox label="Docs únicos" value={stats.totalDocs || 0} />
        <StatBox label="% base comum" value={`${stats.commonQuestionsPct ?? 0}% / ${stats.commonDocsPct ?? 0}%`} />
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
      <p className="text-[10px] uppercase tracking-wider text-[#5cf7cf] font-bold mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section wrapper
   ═══════════════════════════════════════════════ */
function Section({ icon: Icon, num, title, subtitle, color, children }) {
  return (
    <section>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
              {num}
            </span>
            <h2 className="text-xl font-bold text-[#002443]">{title}</h2>
          </div>
          <p className="text-sm text-[#1a1a1a]/60">{subtitle}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   Tabelas — perguntas e docs comuns
   ═══════════════════════════════════════════════ */
function CommonQuestionsTable({ items }) {
  if (items.length === 0) {
    return <EmptyBox message="Nenhuma pergunta é realmente comum a todos os segmentos." />;
  }
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#f9fafb] border-b border-[#e8e8e8]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider w-12">#</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider">Pergunta</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider w-32">Tipo</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider w-28">Obrigatória</th>
          </tr>
        </thead>
        <tbody>
          {items.map((q, i) => (
            <tr key={q.key} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
              <td className="px-4 py-3 text-xs text-[#1a1a1a]/50">{i + 1}</td>
              <td className="px-4 py-3 text-[#1a1a1a]">{q.text}</td>
              <td className="px-4 py-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#002443]/5 text-[#002443]">{q.type || '—'}</span>
              </td>
              <td className="px-4 py-3">
                {q.isRequired ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">SIM</span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">Não</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommonDocsTable({ items }) {
  if (items.length === 0) {
    return <EmptyBox message="Nenhum documento é realmente comum a todos os segmentos." />;
  }
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#f9fafb] border-b border-[#e8e8e8]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider w-12">#</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider">Documento</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider">documentTypeId</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#002443] uppercase tracking-wider w-28">Obrigatório</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, i) => (
            <tr key={d.key} className="border-b border-[#f0f0f0] hover:bg-[#f9fafb]">
              <td className="px-4 py-3 text-xs text-[#1a1a1a]/50">{i + 1}</td>
              <td className="px-4 py-3 text-[#1a1a1a]">{d.label}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-mono text-[#1a1a1a]/50">{d.documentTypeId}</span>
              </td>
              <td className="px-4 py-3">
                {d.required ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">SIM</span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">Não</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Condicionantes — expansível por segmento
   ═══════════════════════════════════════════════ */
function ConditionalQuestionsBySegment({ bySegment, allSegmentIds, allSegmentLabels }) {
  const [expanded, setExpanded] = useState(() => new Set(allSegmentIds.slice(0, 1))); // primeiro aberto

  const toggle = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const nonEmpty = allSegmentIds.filter(id => (bySegment[id] || []).length > 0);

  if (nonEmpty.length === 0) {
    return <EmptyBox message="Não há perguntas condicionantes — todos os segmentos têm as mesmas perguntas." />;
  }

  return (
    <div className="space-y-3">
      {nonEmpty.map(segId => {
        const questions = bySegment[segId];
        const label = allSegmentLabels[segId];
        const isOpen = expanded.has(segId);
        return (
          <div key={segId} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(segId)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9fafb] transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                {isOpen ? <ChevronDown className="w-4 h-4 text-[#002443]" /> : <ChevronRight className="w-4 h-4 text-[#002443]" />}
                <div>
                  <p className="font-bold text-[#002443] text-sm">{label.name}</p>
                  <p className="text-[11px] text-[#1a1a1a]/50 font-mono">{label.model} · {label.subCategory}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                {questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-[#e8e8e8] bg-[#fafbfc]">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-[#e8e8e8]">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider">Pergunta</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-28">Tipo</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-40">Compartilhado com</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, i) => (
                      <tr key={q.key} className="border-b border-[#f0f0f0] last:border-0">
                        <td className="px-4 py-2.5 text-xs text-[#1a1a1a]/40">{i + 1}</td>
                        <td className="px-4 py-2.5 text-[#1a1a1a]">{q.text}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#002443]/5 text-[#002443]">{q.type || '—'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] text-[#1a1a1a]/60">
                            {q.presentCount} de {allSegmentIds.length} segmentos
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConditionalDocsBySegment({ bySegment, allSegmentIds, allSegmentLabels }) {
  const nonEmpty = (allSegmentIds || []).filter(id => (bySegment[id] || []).length > 0);
  const [expanded, setExpanded] = useState(() => new Set(nonEmpty.slice(0, 1)));

  const toggle = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  if (nonEmpty.length === 0) {
    return <EmptyBox message="Não há documentos condicionantes — todos os segmentos têm os mesmos documentos." />;
  }

  return (
    <div className="space-y-3">
      {nonEmpty.map(segId => {
        const docs = bySegment[segId];
        const label = allSegmentLabels[segId] || { name: segId };
        const isOpen = expanded.has(segId);
        return (
          <div key={segId} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(segId)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f9fafb] transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                {isOpen ? <ChevronDown className="w-4 h-4 text-[#002443]" /> : <ChevronRight className="w-4 h-4 text-[#002443]" />}
                <div>
                  <p className="font-bold text-[#002443] text-sm">{label.name}</p>
                  <p className="text-[11px] text-[#1a1a1a]/50 font-mono">{label.model} · {label.subCategory}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                {docs.length} {docs.length === 1 ? 'documento' : 'documentos'}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-[#e8e8e8] bg-[#fafbfc]">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-[#e8e8e8]">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider">Documento</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-24">Obrigatório</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider">Lógica condicional</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-32">Outros segmentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d, i) => (
                      <tr key={d.key} className="border-b border-[#f0f0f0] last:border-0">
                        <td className="px-4 py-2.5 text-xs text-[#1a1a1a]/40">{i + 1}</td>
                        <td className="px-4 py-2.5 text-[#1a1a1a]">{d.label}</td>
                        <td className="px-4 py-2.5">
                          {d.required
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">SIM</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Não</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {d.conditionalLogic
                            ? <code className="text-[10px] text-[#1a1a1a]/70 bg-[#f0f0f0] px-1.5 py-0.5 rounded">
                                {d.conditionalLogic.dependsOn} {d.conditionalLogic.operator} {String(d.conditionalLogic.value)}
                              </code>
                            : <span className="text-[10px] text-[#1a1a1a]/30">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] text-[#1a1a1a]/60">
                            {d.presentCount - 1 > 0 ? `+${d.presentCount - 1} segmento(s)` : 'Exclusivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Helpers visuais
   ═══════════════════════════════════════════════ */
function EmptyBox({ message }) {
  return (
    <div className="bg-[#f9fafb] border border-dashed border-[#e8e8e8] rounded-xl p-8 text-center">
      <p className="text-sm text-[#1a1a1a]/50">{message}</p>
    </div>
  );
}