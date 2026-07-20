import React, { useMemo } from 'react';
import { FileQuestion, FileCheck2, Layers, Filter, Download, Sparkles } from 'lucide-react';

/**
 * Sub-aba "Modelo Dinâmico KYC/KYB" — Visão por Segmento.
 *
 * Analisa os 9 questionários de Compliance V4 e mostra:
 *   SEÇÃO 1 — Perguntas COMUNS a todos os 9 segmentos (lista única, em ordem)
 *   SEÇÃO 2 — Perguntas CONDICIONAIS agrupadas POR SEGMENTO (um bloco por segmento)
 *   SEÇÃO 3 — Documentos COMUNS a todos os 9 segmentos
 *   SEÇÃO 4 — Documentos CONDICIONAIS agrupados POR SEGMENTO
 *
 * Dentro de cada bloco de segmento, perguntas/documentos aparecem na ordem exata
 * como constam naquele questionário (campo `order` do próprio template).
 */

// ─── Rótulos curtos para os modelos conhecidos. Modelos novos aparecem
//     automaticamente usando o `name` do próprio template como label. ───────
const MODEL_LABELS = {
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
  CompliancePixOnly: 'Pix Only',
  CompliancePix: 'Pix Only',
  subseller_pj_lite_v4: 'Subseller PJ (V4)',
  subseller_pf_v4_simplificado: 'Subseller PF (V4)',
  subseller_pf: 'Subseller PF (legado)',
  subseller_v2: 'Subseller PJ (legado)',
};

// Ordem visual: sellers principais primeiro (Gateway → MPE), depois Pix, depois Subsellers.
const SEGMENT_ORDER = [
  'ComplianceGatewayV4',
  'ComplianceMarketplaceV4',
  'CompliancePlataformaVerticalV4',
  'ComplianceEcommerceV4',
  'ComplianceDropshippingV4',
  'ComplianceEducacaoV4',
  'ComplianceMerchantLinkV4',
  'ComplianceLinkPagamentoV4',
  'ComplianceMPEV4',
  'ComplianceSaaSV4',
  'CompliancePixOnly',
  'CompliancePix',
  'subseller_pj_lite_v4',
  'subseller_v2',
  'subseller_pf_v4_simplificado',
  'subseller_pf',
];

export default function DocModeloDinamicoKYC({ templates = [], questionsByTemplate = {} }) {
  // Inclui TODOS os templates de compliance ativos (V4 + subseller + Pix),
  // não apenas os 9 modelos hard-coded. Tudo o que está em produção entra aqui.
  const v4Templates = useMemo(() => {
    const filtered = templates.filter(t =>
      t.category === 'COMPLIANCE' && t.isActive !== false && t.isArchived !== true && t.model
    );
    return filtered.sort((a, b) => {
      const ia = SEGMENT_ORDER.indexOf(a.model);
      const ib = SEGMENT_ORDER.indexOf(b.model);
      const ra = ia === -1 ? 999 : ia;
      const rb = ib === -1 ? 999 : ib;
      if (ra !== rb) return ra - rb;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
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
    <div id="doc-dinamico-kyc" className="max-w-[1200px] mx-auto px-6 py-8 space-y-10">
      <PrintStyles />

      <Header
        activeTemplates={v4Templates}
        stats={analysis.stats}
        onDownloadPdf={handleDownloadPdf}
      />

      {v4Templates.length === 0 ? (
        <EmptyBox message="Nenhum questionário de Compliance ativo foi encontrado no momento." />
      ) : (
        <>
          <Legend segmentLabels={analysis.segmentLabels} segmentIds={analysis.segmentIds} />

          {/* 1. Perguntas COMUNS */}
          <Section
            icon={Layers}
            num="1"
            title="Perguntas Comuns a Todos os Segmentos"
            subtitle={`${analysis.commonQuestions.length} perguntas aparecem nos ${v4Templates.length} questionários V4, em ordem do questionário.`}
            color="#1356E2"
          >
            <CommonItemsList items={analysis.commonQuestions} kind="question" />
          </Section>

          {/* 2. Perguntas CONDICIONAIS por segmento */}
          <Section
            icon={Filter}
            num="2"
            title="Perguntas Condicionais por Segmento"
            subtitle="Perguntas específicas de cada segmento — que não aparecem em todos os 9 questionários. Cada bloco abaixo é um segmento."
            color="#f59e0b"
          >
            <BySegmentBlocks
              perSegment={analysis.conditionalQuestionsBySegment}
              segmentIds={analysis.segmentIds}
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
            color="#1356E2"
          >
            <CommonItemsList items={analysis.commonDocs} kind="doc" />
          </Section>

          {/* 4. Documentos CONDICIONAIS por segmento */}
          <Section
            icon={FileQuestion}
            num="4"
            title="Documentos Condicionais por Segmento"
            subtitle="Documentos específicos exigidos por cada segmento — não são comuns a todos."
            color="#f59e0b"
          >
            <BySegmentBlocks
              perSegment={analysis.conditionalDocsBySegment}
              segmentIds={analysis.segmentIds}
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
   ANÁLISE — comuns + condicionais agrupadas por segmento
   ═══════════════════════════════════════════════════════════════════════ */
function analyzeTemplates(templates, questionsByTemplate) {
  if (templates.length === 0) {
    return {
      stats: {},
      commonQuestions: [], commonDocs: [],
      conditionalQuestionsBySegment: {}, conditionalDocsBySegment: {},
      segmentIds: [], segmentLabels: {},
    };
  }

  const totalSegments = templates.length;
  const segmentIds = templates.map(t => t.id);
  const segmentLabels = {};
  templates.forEach(t => {
    segmentLabels[t.id] = {
      short: MODEL_LABELS[t.model] || t.name || t.model || '—',
      full: t.name || MODEL_LABELS[t.model] || t.model || 'Sem nome',
      model: t.model,
    };
  });

  // ── Perguntas: descobrir quais são comuns (aparecem em TODOS os templates) ──
  const qPresence = new Map(); // key → { text, type, ..., templatesPresent: Set, minOrder }
  templates.forEach(t => {
    const qs = questionsByTemplate[t.id] || [];
    qs.forEach(q => {
      const key = normalizeText(q.text);
      if (!key) return;
      if (!qPresence.has(key)) {
        qPresence.set(key, {
          text: q.text, type: q.type,
          isRequired: !!q.isRequired,
          options: Array.isArray(q.options) ? q.options : [],
          riskWeight: q.riskWeight || 0,
          helpText: q.helpText || '',
          templatesPresent: new Set(),
          minOrder: Number.isFinite(q.order) ? q.order : Infinity,
        });
      }
      const e = qPresence.get(key);
      e.templatesPresent.add(t.id);
      if (!e.options.length && Array.isArray(q.options)) e.options = q.options;
      if (!e.riskWeight && q.riskWeight) e.riskWeight = q.riskWeight;
      if (!e.helpText && q.helpText) e.helpText = q.helpText;
      if (Number.isFinite(q.order) && q.order < e.minOrder) e.minOrder = q.order;
    });
  });

  const commonKeysQ = new Set();
  qPresence.forEach((e, key) => {
    if (e.templatesPresent.size === totalSegments) commonKeysQ.add(key);
  });

  const commonQuestions = [...qPresence.entries()]
    .filter(([k]) => commonKeysQ.has(k))
    .map(([k, e]) => ({
      key: k, text: e.text, type: e.type, isRequired: e.isRequired,
      options: e.options, riskWeight: e.riskWeight, helpText: e.helpText,
      minOrder: e.minOrder,
    }))
    .sort((a, b) => (a.minOrder - b.minOrder) || a.text.localeCompare(b.text, 'pt-BR'));

  // ── Perguntas condicionais agrupadas POR SEGMENTO ─────────────────────
  // Para cada template, pegamos suas perguntas que NÃO estão no conjunto comum.
  // Ordem preservada pelo `order` do próprio template.
  const conditionalQuestionsBySegment = {};
  templates.forEach(t => {
    const qs = (questionsByTemplate[t.id] || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const conds = [];
    qs.forEach(q => {
      const key = normalizeText(q.text);
      if (!key || commonKeysQ.has(key)) return;
      const presence = qPresence.get(key);
      const sharedWith = presence
        ? [...presence.templatesPresent].filter(id => id !== t.id)
        : [];
      conds.push({
        key,
        text: q.text, type: q.type, isRequired: !!q.isRequired,
        options: Array.isArray(q.options) ? q.options : [],
        riskWeight: q.riskWeight || 0,
        helpText: q.helpText || '',
        conditionalLogic: q.conditionalLogic || null,
        order: q.order ?? 0,
        sharedWith,
        isExclusive: sharedWith.length === 0,
      });
    });
    conditionalQuestionsBySegment[t.id] = conds;
  });

  // ── Documentos: mesma lógica ─────────────────────────────────────────
  const dPresence = new Map();
  templates.forEach(t => {
    const docs = Array.isArray(t.requiredDocuments) ? t.requiredDocuments : [];
    docs.forEach((d, idx) => {
      const key = normalizeText(d.label || d.documentTypeId);
      if (!key) return;
      if (!dPresence.has(key)) {
        dPresence.set(key, {
          label: d.label || d.documentTypeId,
          documentTypeId: d.documentTypeId,
          required: !!d.required,
          description: d.description || '',
          templatesPresent: new Set(),
          minOrder: idx,
        });
      }
      const e = dPresence.get(key);
      e.templatesPresent.add(t.id);
      if (!e.description && d.description) e.description = d.description;
      if (idx < e.minOrder) e.minOrder = idx;
    });
  });

  const commonKeysD = new Set();
  dPresence.forEach((e, key) => {
    if (e.templatesPresent.size === totalSegments) commonKeysD.add(key);
  });

  const commonDocs = [...dPresence.entries()]
    .filter(([k]) => commonKeysD.has(k))
    .map(([k, e]) => ({
      key: k, label: e.label, documentTypeId: e.documentTypeId,
      required: e.required, description: e.description, minOrder: e.minOrder,
    }))
    .sort((a, b) => (a.minOrder - b.minOrder) || a.label.localeCompare(b.label, 'pt-BR'));

  const conditionalDocsBySegment = {};
  templates.forEach(t => {
    const docs = Array.isArray(t.requiredDocuments) ? t.requiredDocuments : [];
    const conds = [];
    docs.forEach((d, idx) => {
      const key = normalizeText(d.label || d.documentTypeId);
      if (!key || commonKeysD.has(key)) return;
      const presence = dPresence.get(key);
      const sharedWith = presence
        ? [...presence.templatesPresent].filter(id => id !== t.id)
        : [];
      conds.push({
        key,
        label: d.label || d.documentTypeId,
        documentTypeId: d.documentTypeId,
        required: !!d.required,
        description: d.description || '',
        conditionalLogic: d.conditionalLogic || null,
        order: idx,
        sharedWith,
        isExclusive: sharedWith.length === 0,
      });
    });
    conditionalDocsBySegment[t.id] = conds;
  });

  const stats = {
    totalQuestions: qPresence.size,
    totalDocs: dPresence.size,
    commonQuestionsPct: qPresence.size ? Math.round((commonQuestions.length / qPresence.size) * 100) : 0,
    commonDocsPct: dPresence.size ? Math.round((commonDocs.length / dPresence.size) * 100) : 0,
  };

  return {
    stats,
    commonQuestions, commonDocs,
    conditionalQuestionsBySegment, conditionalDocsBySegment,
    segmentIds, segmentLabels,
  };
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
    <div className="bg-gradient-to-br from-[#0A0A0A] via-[#003366] to-[#0A0A0A] rounded-2xl p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#1356E2]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#E84B1C]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E84B1C]">
                Modelo Dinâmico KYC/KYB — Visão por Segmento
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Perguntas & Documentos <span className="text-[#E84B1C]">por Questionário</span>
            </h1>
            <p className="text-white/70 text-sm mt-2 max-w-3xl leading-relaxed">
              Análise de <strong className="text-white">todos os questionários de Compliance ativos</strong> hoje
              (sellers V4 por segmento, Pix Only e Subsellers PJ/PF). Primeiro o que é
              <strong className="text-white"> comum a todos</strong>, depois as
              <strong className="text-white"> perguntas e documentos específicos</strong> de cada um.
            </p>
          </div>

          <button
            onClick={onDownloadPdf}
            className="no-print inline-flex items-center gap-2 px-4 py-2 bg-[#1356E2] hover:bg-[#E84B1C] text-[#0A0A0A] rounded-lg text-sm font-bold transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatBox label="Questionários ativos" value={activeTemplates.length} hint="sellers + pix + subsellers" />
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
      <p className="text-[10px] uppercase tracking-wider text-[#E84B1C] font-bold mb-1">{label}</p>
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
        Questionários incluídos · {segmentIds.length}
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
              <span className="font-bold text-[#0A0A0A]">{l.short}</span>
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
function Section({ icon: IconCmp, num, title, subtitle, color, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <IconCmp className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
              {num}
            </span>
            <h2 className="text-xl font-bold text-[#0A0A0A]">{title}</h2>
          </div>
          <p className="text-sm text-[#1a1a1a]/60">{subtitle}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LISTA de itens COMUNS — tabela simples em ordem do questionário
   ═══════════════════════════════════════════════════════════════════════ */
function CommonItemsList({ items, kind }) {
  if (items.length === 0) {
    return <EmptyBox message={`Nenhum ${kind === 'question' ? 'pergunta' : 'documento'} é 100% comum aos 9 segmentos V4.`} />;
  }
  const isQuestion = kind === 'question';
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-b-2 border-[#1356E2]">
          <tr>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider w-10">#</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider">
              {isQuestion ? 'Pergunta' : 'Documento'}
            </th>
            {isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider w-24">Tipo</th>}
            {!isQuestion && <th className="text-left px-4 py-3 text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider w-56">documentTypeId</th>}
            <th className="text-center px-4 py-3 text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider w-24">Obrigatório</th>
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
                {!isQuestion && it.description && (
                  <div className="text-[11px] text-[#1a1a1a]/50 mt-0.5">{it.description}</div>
                )}
                {isQuestion && it.options?.length > 0 && (
                  <div className="text-[10px] text-[#1a1a1a]/40 mt-1" title={it.options.join(' · ')}>
                    {it.options.length} opções
                  </div>
                )}
              </td>
              {isQuestion && (
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]">{it.type || '—'}</span>
                </td>
              )}
              {!isQuestion && (
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono text-[#1a1a1a]/50">{it.documentTypeId || '—'}</span>
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
   BLOCOS por segmento — um card por segmento com seus itens condicionais
   ═══════════════════════════════════════════════════════════════════════ */
function BySegmentBlocks({ perSegment, segmentIds, segmentLabels, kind }) {
  const isQuestion = kind === 'question';

  const blocks = segmentIds
    .map(sid => ({
      sid,
      label: segmentLabels[sid],
      items: perSegment[sid] || [],
    }));

  const hasAny = blocks.some(b => b.items.length > 0);
  if (!hasAny) {
    return <EmptyBox message={`Nenhum ${isQuestion ? 'pergunta' : 'documento'} condicional encontrado.`} />;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => (
        <SegmentBlock
          key={block.sid}
          index={idx + 1}
          label={block.label}
          items={block.items}
          segmentLabels={segmentLabels}
          kind={kind}
        />
      ))}
    </div>
  );
}

function SegmentBlock({ index, label, items, segmentLabels, kind }) {
  const isQuestion = kind === 'question';

  return (
    <div className="bg-white border-2 border-[#f59e0b]/30 rounded-xl overflow-hidden shadow-sm">
      {/* Header do segmento */}
      <div className="bg-gradient-to-r from-[#fef3c7] to-[#fffbeb] px-5 py-3.5 border-b-2 border-[#f59e0b]/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-white font-black text-sm flex items-center justify-center">
            {index}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0A0A0A]">{label?.short || '—'}</h3>
            <p className="text-[10px] font-mono text-[#1a1a1a]/40">{label?.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0A0A0A]/70">
            {items.length} {isQuestion ? 'pergunta' : 'documento'}{items.length !== 1 ? 's' : ''} condicionai{items.length !== 1 ? 's' : 'l'}
          </span>
        </div>
      </div>

      {/* Lista de itens */}
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-[#1a1a1a]/50">
            Este segmento não tem {isQuestion ? 'perguntas' : 'documentos'} condicionais — só usa os itens comuns.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-[#f0f0f0]">
          {items.map((it, i) => (
            <li key={it.key} className="px-5 py-3 hover:bg-[#fffcf5] transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-mono text-[#1a1a1a]/30 mt-0.5 w-6 text-right flex-shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1a1a1a] font-medium">
                    {it.text || it.label}
                  </div>

                  {/* Help text / descrição */}
                  {isQuestion && it.helpText && (
                    <div className="text-[11px] text-[#1a1a1a]/50 mt-1">{it.helpText}</div>
                  )}
                  {!isQuestion && it.description && (
                    <div className="text-[11px] text-[#1a1a1a]/50 mt-1">{it.description}</div>
                  )}

                  {/* Tags: tipo, documentTypeId, obrigatório, peso, conditional, opções */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {isQuestion && it.type && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]">
                        {it.type}
                      </span>
                    )}
                    {!isQuestion && it.documentTypeId && (
                      <span className="text-[9px] font-mono text-[#1a1a1a]/40">
                        {it.documentTypeId}
                      </span>
                    )}
                    {(it.isRequired || it.required) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">OBR</span>
                    )}
                    {it.riskWeight > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                        P{it.riskWeight}
                      </span>
                    )}
                    {it.conditionalLogic && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono" title={`Aparece se ${it.conditionalLogic.dependsOn} ${it.conditionalLogic.operator} ${it.conditionalLogic.value}`}>
                        condicional
                      </span>
                    )}
                    {isQuestion && it.options?.length > 0 && (
                      <span className="text-[9px] text-[#1a1a1a]/50" title={it.options.join(' · ')}>
                        {it.options.length} opções
                      </span>
                    )}
                  </div>

                  {/* Compartilhamento com outros segmentos */}
                  {it.isExclusive ? (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] text-[#f59e0b] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                      Exclusivo deste segmento
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-[#1a1a1a]/50">
                      <span className="text-[#1a1a1a]/40">Também em: </span>
                      {it.sharedWith
                        .map(sid => segmentLabels[sid]?.short || '—')
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
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
        #doc-dinamico-kyc tr, #doc-dinamico-kyc li { page-break-inside: avoid !important; }
        #doc-dinamico-kyc td, #doc-dinamico-kyc th { padding: 3pt 5pt !important; }
      }
    `}</style>
  );
}