import React, { useMemo } from 'react';
import { FileQuestion, FileCheck2, Layers, Filter, Download, Sparkles, Target, Check, Minus } from 'lucide-react';

/**
 * Sub-aba "Modelo Dinâmico KYC/KYB" — Visão microscópica.
 *
 * Analisa EXATAMENTE os 9 questionários de Compliance V4:
 *   E-commerce, Gateway, Dropshipping, Educação, Merchant Link de Pagamento,
 *   MPE, SaaS, Marketplace, Plataformas Verticais.
 *
 * 4 Seções:
 *   1. Perguntas COMUNS (em todos os 9)
 *   2. Perguntas CONDICIONAIS por segmento (matriz ✓/—)
 *   3. Documentos COMUNS (em todos os 9)
 *   4. Documentos CONDICIONAIS por segmento (matriz ✓/—)
 *
 * Props:
 *   templates: QuestionnaireTemplate[] (category=COMPLIANCE, isActive=true)
 *   questionsByTemplate: { [templateId]: Question[] }
 */

// ─── Os 9 modelos V4 oficiais ──────────────────────────────────────────
// Mapeia o `model` de cada template para um label curto legível.
const V4_MODELS = {
  ComplianceEcommerceV4: 'E-commerce',
  ComplianceGatewayV4: 'Gateway',
  ComplianceDropshippingV4: 'Dropshipping',
  ComplianceEducacaoV4: 'Educação',
  ComplianceMerchantLinkV4: 'Merchant Link Pgto.',
  ComplianceLinkPagamentoV4: 'Merchant Link Pgto.',
  ComplianceMPEV4: 'MPE',
  ComplianceSaaSV4: 'SaaS',
  ComplianceMarketplaceV4: 'Marketplace',
  CompliancePlataformaVerticalV4: 'Plataformas Verticais',
};

const V4_MODEL_KEYS = new Set(Object.keys(V4_MODELS));

export default function DocModeloDinamicoKYC({ templates = [], questionsByTemplate = {} }) {
  // Trava: somente os 9 questionários V4 oficiais.
  const v4Templates = useMemo(() => {
    return templates
      .filter(t => t.category === 'COMPLIANCE' && t.isActive !== false && V4_MODEL_KEYS.has(t.model))
      .sort((a, b) => {
        const la = V4_MODELS[a.model] || a.name || '';
        const lb = V4_MODELS[b.model] || b.name || '';
        return la.localeCompare(lb, 'pt-BR');
      });
  }, [templates]);

  const analysis = useMemo(
    () => analyzeTemplates(v4Templates, questionsByTemplate),
    [v4Templates, questionsByTemplate]
  );

  const handleDownloadPdf = () => {
    document.body.classList.add('printing-dinamico-kyc');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-dinamico-kyc'), 500);
    }, 100);
  };

  return (
    <div id="doc-dinamico-kyc" className="max-w-[1400px] mx-auto px-6 py-8 space-y-10">
      <PrintStyles />

      <Header
        activeTemplates={v4Templates}
        stats={analysis.stats}
        onDownloadPdf={handleDownloadPdf}
      />

      {v4Templates.length === 0 ? (
        <EmptyBox message="Nenhum dos 9 questionários Compliance V4 foi encontrado. Verifique se os templates oficiais estão ativos." />
      ) : (
        <>
          <Legend segmentLabels={analysis.segmentLabels} segmentIds={analysis.segmentIds} />

          {/* 1. Perguntas COMUNS */}
          <Section
            icon={Layers}
            num="1"
            title="Perguntas Comuns a Todos os Segmentos"
            subtitle={`${analysis.commonQuestions.length} perguntas aparecem nos ${v4Templates.length} questionários V4.`}
            color="#2bc196"
          >
            <CommonItemsTable items={analysis.commonQuestions} kind="question" totalSegments={v4Templates.length} />
          </Section>

          {/* 2. Perguntas CONDICIONAIS */}
          <Section
            icon={Filter}
            num="2"
            title="Perguntas Condicionais por Segmento"
            subtitle={`${analysis.conditionalQuestions.length} perguntas aparecem em alguns segmentos mas não em todos.`}
            color="#f59e0b"
          >
            <ConditionalMatrix
              items={analysis.conditionalQuestions}
              segmentIds={analysis.segmentIds}
              segmentLabels={analysis.segmentLabels}
              kind="question"
            />
            <ExclusiveItemsCard
              items={analysis.conditionalQuestions.filter(i => i.presentCount === 1)}
              segmentLabels={analysis.segmentLabels}
              kind="question"
            />
          </Section>

          {/* 3. Documentos COMUNS */}
          <Section
            icon={FileCheck2}
            num="3"
            title="Documentos Comuns a Todos os Segmentos"
            subtitle={`${analysis.commonDocs.length} documentos são solicitados em todos os ${v4Templates.length} questionários V4.`}
            color="#2bc196"
          >
            <CommonItemsTable items={analysis.commonDocs} kind="doc" totalSegments={v4Templates.length} />
          </Section>

          {/* 4. Documentos CONDICIONAIS */}
          <Section
            icon={FileQuestion}
            num="4"
            title="Documentos Condicionais por Segmento"
            subtitle={`${analysis.conditionalDocs.length} documentos são exigidos apenas em alguns segmentos.`}
            color="#f59e0b"
          >
            <ConditionalMatrix
              items={analysis.conditionalDocs}
              segmentIds={analysis.segmentIds}
              segmentLabels={analysis.segmentLabels}
              kind="doc"
            />
            <ExclusiveItemsCard
              items={analysis.conditionalDocs.filter(i => i.presentCount === 1)}
              segmentLabels={analysis.segmentLabels}
              kind="doc"
            />
          </Section>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANÁLISE — comuns vs. condicionais
   ═══════════════════════════════════════════════════════════════════════ */
function analyzeTemplates(templates, questionsByTemplate) {
  if (templates.length === 0) {
    return {
      stats: {},
      commonQuestions: [], conditionalQuestions: [],
      commonDocs: [], conditionalDocs: [],
      segmentIds: [], segmentLabels: {},
    };
  }

  const totalSegments = templates.length;
  const segmentIds = templates.map(t => t.id);
  const segmentLabels = {};
  templates.forEach(t => {
    segmentLabels[t.id] = {
      short: V4_MODELS[t.model] || t.name || t.model || '—',
      full: t.name || V4_MODELS[t.model] || t.model || 'Sem nome',
      model: t.model,
    };
  });

  // ── Perguntas ─────────────────────────────────────
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
          isRequired: !!q.isRequired,
          options: Array.isArray(q.options) ? q.options : [],
          riskWeight: q.riskWeight || 0,
          helpText: q.helpText || '',
          conditionalLogic: q.conditionalLogic || null,
          templatesPresent: new Set(),
        });
      }
      const entry = questionsMap.get(key);
      entry.templatesPresent.add(t.id);
      if (!entry.options.length && Array.isArray(q.options)) entry.options = q.options;
      if (!entry.riskWeight && q.riskWeight) entry.riskWeight = q.riskWeight;
      if (!entry.helpText && q.helpText) entry.helpText = q.helpText;
    });
  });

  const commonQuestions = [];
  const conditionalQuestions = [];

  questionsMap.forEach((entry, key) => {
    const presentCount = entry.templatesPresent.size;
    const base = {
      key, text: entry.text, type: entry.type, isRequired: entry.isRequired,
      options: entry.options, riskWeight: entry.riskWeight, helpText: entry.helpText,
      conditionalLogic: entry.conditionalLogic,
    };
    if (presentCount === totalSegments) commonQuestions.push(base);
    else conditionalQuestions.push({ ...base, presentIn: new Set(entry.templatesPresent), presentCount });
  });

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
          label: d.label || d.documentTypeId,
          documentTypeId: d.documentTypeId,
          required: !!d.required,
          conditionalLogic: d.conditionalLogic || null,
          templatesPresent: new Set(),
        });
      }
      docsMap.get(key).templatesPresent.add(t.id);
    });
  });

  const commonDocs = [];
  const conditionalDocs = [];

  docsMap.forEach((entry, key) => {
    const presentCount = entry.templatesPresent.size;
    const base = {
      key, label: entry.label, documentTypeId: entry.documentTypeId,
      required: entry.required, conditionalLogic: entry.conditionalLogic,
    };
    if (presentCount === totalSegments) commonDocs.push(base);
    else conditionalDocs.push({ ...base, presentIn: new Set(entry.templatesPresent), presentCount });
  });

  commonDocs.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  conditionalDocs.sort((a, b) => b.presentCount - a.presentCount || a.label.localeCompare(b.label, 'pt-BR'));

  const stats = {
    totalQuestions: questionsMap.size,
    totalDocs: docsMap.size,
    commonQuestionsPct: questionsMap.size ? Math.round((commonQuestions.length / questionsMap.size) * 100) : 0,
    commonDocsPct: docsMap.size ? Math.round((commonDocs.length / docsMap.size) * 100) : 0,
  };

  return { stats, commonQuestions, conditionalQuestions, commonDocs, conditionalDocs, segmentIds, segmentLabels };
}

function normalizeText(s) {
  if (!s) return '';
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();
}

/* ═══════════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════════ */
function Header({ activeTemplates, stats, onDownloadPdf }) {
  return (
    <div className="bg-gradient-to-br from-[#002443] via-[#003366] to-[#002443] rounded-2xl p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2bc196]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#5cf7cf]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5cf7cf]">
                Modelo Dinâmico KYC/KYB — Visão Microscópica
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Perguntas & Documentos <span className="text-[#5cf7cf]">por Segmento V4</span>
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-3xl leading-relaxed">
              Análise comparativa dos <strong className="text-white">9 questionários oficiais V4</strong> de
              compliance. Identifica o que é <strong className="text-white">comum a todos</strong> e o que é
              <strong className="text-white"> específico</strong> de cada segmento.
            </p>
          </div>

          <button
            onClick={onDownloadPdf}
            className="no-print inline-flex items-center gap-2 px-4 py-2 bg-[#2bc196] hover:bg-[#5cf7cf] text-[#002443] rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatBox label="Questionários V4" value={activeTemplates.length} hint="dos 9 esperados" />
          <StatBox label="Perguntas únicas" value={stats.totalQuestions || 0} />
          <StatBox label="Documentos únicos" value={stats.totalDocs || 0} />
          <StatBox label="Base comum" value={`${stats.commonQuestionsPct ?? 0}% Q · ${stats.commonDocsPct ?? 0}% D`} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, hint }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
      <p className="text-[10px] uppercase tracking-wider text-[#5cf7cf] font-bold mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
      {hint && <p className="text-[10px] text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LEGENDA
   ═══════════════════════════════════════════════════════════════════════ */
function Legend({ segmentLabels, segmentIds }) {
  if (segmentIds.length === 0) return null;
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[#1a1a1a]/50 font-bold mb-2.5">
        Questionários V4 incluídos · {segmentIds.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {segmentIds.map(id => {
          const l = segmentLabels[id];
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 bg-[#f4f4f4] border border-[#e8e8e8] rounded-md px-2.5 py-1 text-[11px]"
              title={l.full}
            >
              <span className="font-bold text-[#002443]">{l.short}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION wrapper
   ═══════════════════════════════════════════════════════════════════════ */
function Section({ icon: Icon, num, title, subtitle, color, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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

/* ═══════════════════════════════════════════════════════════════════════
   TABELA de itens COMUNS
   ═══════════════════════════════════════════════════════════════════════ */
function CommonItemsTable({ items, kind, totalSegments }) {
  if (items.length === 0) {
    return <EmptyBox message={`Nenhum ${kind === 'question' ? 'pergunta' : 'documento'} é 100% comum aos ${totalSegments} segmentos V4.`} />;
  }
  const isQuestion = kind === 'question';
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-b-2 border-[#2bc196]">
          <tr>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-10">#</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider">
              {isQuestion ? 'Pergunta' : 'Documento'}
            </th>
            {isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-24">Tipo</th>}
            {!isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-56">documentTypeId</th>}
            {isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-24">Opções</th>}
            {isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-20">Peso</th>}
            <th className="text-center px-4 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-24">Obrigatório</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.key} className="border-b border-[#f0f0f0] hover:bg-[#fafdfb] align-top">
              <td className="px-4 py-3 text-xs text-[#1a1a1a]/40">{i + 1}</td>
              <td className="px-4 py-3 text-[#1a1a1a]">
                <div className="font-medium">{it.text || it.label}</div>
                {isQuestion && it.helpText && (
                  <div className="text-[11px] text-[#1a1a1a]/50 mt-0.5">{it.helpText}</div>
                )}
              </td>
              {isQuestion && (
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#002443]/5 text-[#002443]">{it.type || '—'}</span>
                </td>
              )}
              {!isQuestion && (
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono text-[#1a1a1a]/50">{it.documentTypeId || '—'}</span>
                </td>
              )}
              {isQuestion && (
                <td className="px-4 py-3">
                  {it.options && it.options.length > 0 ? (
                    <span className="text-[11px] text-[#1a1a1a]/70" title={it.options.join(' · ')}>{it.options.length}</span>
                  ) : (
                    <span className="text-[10px] text-[#1a1a1a]/30">—</span>
                  )}
                </td>
              )}
              {isQuestion && (
                <td className="px-4 py-3">
                  {it.riskWeight ? (
                    <span className="text-[10px] font-bold text-[#f59e0b]">{it.riskWeight}</span>
                  ) : (
                    <span className="text-[10px] text-[#1a1a1a]/30">—</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-center">
                {it.isRequired || it.required ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">SIM</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">Não</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MATRIZ CONDICIONAL — linhas = item, colunas = segmentos (✓/—)
   ═══════════════════════════════════════════════════════════════════════ */
function ConditionalMatrix({ items, segmentIds, segmentLabels, kind }) {
  const isQuestion = kind === 'question';
  if (items.length === 0) {
    return <EmptyBox message={`Não há ${isQuestion ? 'perguntas' : 'documentos'} condicionais entre os 9 segmentos V4.`} />;
  }

  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gradient-to-r from-[#fef3c7] to-[#fffbeb] border-b-2 border-[#f59e0b] sticky top-0">
            <tr>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-10 sticky left-0 bg-[#fef3c7] z-10">#</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider sticky left-10 bg-[#fef3c7] z-10 min-w-[280px]">
                {isQuestion ? 'Pergunta' : 'Documento'}
              </th>
              {isQuestion && (
                <th className="text-left px-3 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-24">Tipo</th>
              )}
              {segmentIds.map(id => {
                const l = segmentLabels[id];
                return (
                  <th key={id} className="text-center px-2 py-3 text-[9px] font-bold text-[#002443] uppercase w-24" title={l.full}>
                    <div className="whitespace-nowrap">{l.short}</div>
                  </th>
                );
              })}
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443] uppercase tracking-wider w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.key} className="border-b border-[#f0f0f0] hover:bg-[#fffcf5] align-top">
                <td className="px-3 py-2.5 text-xs text-[#1a1a1a]/40 sticky left-0 bg-white">{i + 1}</td>
                <td className="px-3 py-2.5 sticky left-10 bg-white">
                  <div className="text-[#1a1a1a] font-medium">{it.text || it.label}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {!isQuestion && it.documentTypeId && (
                      <span className="text-[9px] font-mono text-[#1a1a1a]/40">{it.documentTypeId}</span>
                    )}
                    {(it.isRequired || it.required) && (
                      <span className="text-[9px] px-1 py-0 rounded bg-red-100 text-red-700 font-bold">OBR</span>
                    )}
                    {it.riskWeight > 0 && (
                      <span className="text-[9px] px-1 py-0 rounded bg-amber-100 text-amber-700 font-bold" title="Peso de risco">
                        P{it.riskWeight}
                      </span>
                    )}
                    {it.conditionalLogic && (
                      <span className="text-[9px] px-1 py-0 rounded bg-blue-100 text-blue-700 font-mono" title={`Aparece se ${it.conditionalLogic.dependsOn} ${it.conditionalLogic.operator} ${it.conditionalLogic.value}`}>
                        cond.
                      </span>
                    )}
                  </div>
                </td>
                {isQuestion && (
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#002443]/5 text-[#002443]">{it.type || '—'}</span>
                  </td>
                )}
                {segmentIds.map(sid => {
                  const present = it.presentIn.has(sid);
                  return (
                    <td key={sid} className="px-2 py-2.5 text-center">
                      {present ? (
                        <Check className="w-4 h-4 text-[#2bc196] mx-auto" strokeWidth={3} />
                      ) : (
                        <Minus className="w-3 h-3 text-[#1a1a1a]/15 mx-auto" />
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center">
                  <span className="text-[11px] font-bold text-[#002443]">
                    {it.presentCount}
                    <span className="text-[#1a1a1a]/30">/{segmentIds.length}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EXCLUSIVOS — itens presentes em apenas 1 segmento
   ═══════════════════════════════════════════════════════════════════════ */
function ExclusiveItemsCard({ items, segmentLabels, kind }) {
  if (items.length === 0) return null;
  const isQuestion = kind === 'question';

  const bySeg = {};
  items.forEach(it => {
    const sid = [...it.presentIn][0];
    if (!bySeg[sid]) bySeg[sid] = [];
    bySeg[sid].push(it);
  });

  return (
    <div className="mt-5 bg-gradient-to-br from-[#fef3c7]/30 to-white border-2 border-dashed border-[#f59e0b]/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-[#f59e0b]" />
        <h3 className="text-sm font-bold text-[#002443]">
          Exclusivos por segmento · {items.length} {isQuestion ? 'perguntas' : 'documentos'} únicos
        </h3>
      </div>
      <p className="text-xs text-[#1a1a1a]/60 mb-4">
        Itens que aparecem em apenas <strong>1 segmento</strong> — caracterizam a especificidade de cada modelo de negócio.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(bySeg).map(([sid, its]) => {
          const label = segmentLabels[sid];
          return (
            <div key={sid} className="bg-white border border-[#f59e0b]/30 rounded-lg p-3">
              <p className="text-[11px] font-bold text-[#002443] mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#f59e0b]" />
                {label?.short || sid}
                <span className="text-[9px] font-mono text-[#1a1a1a]/40 font-normal">{label?.model}</span>
              </p>
              <ul className="space-y-1.5">
                {its.map(it => (
                  <li key={it.key} className="text-xs text-[#1a1a1a]/80 flex items-start gap-2">
                    <span className="text-[#f59e0b] mt-0.5">•</span>
                    <span>{it.text || it.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */
function EmptyBox({ message }) {
  return (
    <div className="bg-[#f9fafb] border border-dashed border-[#e8e8e8] rounded-xl p-8 text-center">
      <p className="text-sm text-[#1a1a1a]/50">{message}</p>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
        body > * { visibility: hidden !important; }
        body #doc-dinamico-kyc, body #doc-dinamico-kyc * { visibility: visible !important; }
        #doc-dinamico-kyc {
          position: absolute !important; left: 0 !important; top: 0 !important;
          width: 100% !important; max-width: 100% !important;
          padding: 12pt 16pt !important; margin: 0 !important;
          font-size: 9pt !important;
        }
        #doc-dinamico-kyc .no-print { display: none !important; }
        #doc-dinamico-kyc section { page-break-inside: auto !important; }
        #doc-dinamico-kyc h1 { font-size: 16pt !important; }
        #doc-dinamico-kyc h2 { font-size: 12pt !important; page-break-after: avoid !important; }
        #doc-dinamico-kyc h3 { font-size: 10pt !important; page-break-after: avoid !important; }
        #doc-dinamico-kyc table { page-break-inside: auto !important; font-size: 7.5pt !important; }
        #doc-dinamico-kyc thead { display: table-header-group !important; }
        #doc-dinamico-kyc tr { page-break-inside: avoid !important; }
        #doc-dinamico-kyc td, #doc-dinamico-kyc th { padding: 3pt 5pt !important; }
      }
    `}</style>
  );
}