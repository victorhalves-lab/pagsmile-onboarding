import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, FileCheck2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TemplateCard from './templates/TemplateCard';

/* ──────────────────────────────────────────────────────────
   DocTemplatesMicroscopico — full microscopic view of every
   active compliance template: questions + documents + meta
   ────────────────────────────────────────────────────────── */
export default function DocTemplatesMicroscopico({ templates = [], questionsByTemplate = {} }) {
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('ALL'); // ALL | PJ | PF
  const [groupFilter, setGroupFilter] = useState('ALL'); // ALL | CARTAO | PIX | SUBSELLER

  const grouped = useMemo(() => classifyTemplates(templates), [templates]);

  const filtered = useMemo(() => {
    const all = [...grouped.cartao, ...grouped.pix, ...grouped.subseller, ...grouped.other];
    return all.filter(t => {
      if (merchantFilter !== 'ALL' && t.merchantType !== merchantFilter) return false;
      if (groupFilter !== 'ALL') {
        const g = classifyGroup(t);
        if (g !== groupFilter) return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        const match = (t.name || '').toLowerCase().includes(s) ||
                      (t.model || '').toLowerCase().includes(s) ||
                      (t.description || '').toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [grouped, merchantFilter, groupFilter, search]);

  const totalQuestions = templates.reduce((acc, t) => acc + (questionsByTemplate[t.id]?.length || 0), 0);
  const totalDocs = templates.reduce((acc, t) => acc + (t.requiredDocuments?.length || 0), 0);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="mb-6 pb-5 border-b-2 border-[#1356E2]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#1356E2]" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1356E2]">
            Visão Microscópica
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0A0A0A] mb-2">
          Templates de Questionários por Segmento
        </h1>
        <p className="text-[13px] text-[#1a1a1a]/70 leading-relaxed max-w-3xl">
          Descrição exaustiva de <strong>cada template ativo</strong> no sistema — com todas as perguntas,
          suas lógicas condicionais, pesos de risco, documentos base, documentos condicionais, formatos aceitos,
          tamanho máximo e integração CAF SDK. É a <strong>fonte única da verdade</strong> sobre o que é pedido
          ao cliente em cada segmento.
        </p>

        {/* Global metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <GlobalMetric label="Templates Ativos" value={templates.length} />
          <GlobalMetric label="Perguntas Totais" value={totalQuestions} />
          <GlobalMetric label="Documentos Totais" value={totalDocs} />
          <GlobalMetric label="Grupos" value={`${grouped.cartao.length}C • ${grouped.pix.length}P • ${grouped.subseller.length}S`} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8e8e8] rounded-lg p-4 mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#1a1a1a]/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, model ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#1a1a1a]/40" />
          <FilterChip label="Todos" active={groupFilter === 'ALL'} onClick={() => setGroupFilter('ALL')} />
          <FilterChip label={`Cartão (${grouped.cartao.length})`} active={groupFilter === 'CARTAO'} onClick={() => setGroupFilter('CARTAO')} />
          <FilterChip label={`PIX (${grouped.pix.length})`} active={groupFilter === 'PIX'} onClick={() => setGroupFilter('PIX')} />
          <FilterChip label={`Subsellers (${grouped.subseller.length})`} active={groupFilter === 'SUBSELLER'} onClick={() => setGroupFilter('SUBSELLER')} />

          <div className="w-px h-4 bg-[#e8e8e8] mx-1" />

          <FilterChip label="PJ & PF" active={merchantFilter === 'ALL'} onClick={() => setMerchantFilter('ALL')} />
          <FilterChip label="Só PJ" active={merchantFilter === 'PJ'} onClick={() => setMerchantFilter('PJ')} />
          <FilterChip label="Só PF" active={merchantFilter === 'PF'} onClick={() => setMerchantFilter('PF')} />
        </div>
      </div>

      {/* Grouped rendering */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#1a1a1a]/40 text-sm">
          Nenhum template encontrado para os filtros aplicados.
        </div>
      ) : (
        <>
          {renderGroup('Cartão — Sellers Diretos', filtered.filter(t => classifyGroup(t) === 'CARTAO'), questionsByTemplate)}
          {renderGroup('PIX — Merchants & Intermediários', filtered.filter(t => classifyGroup(t) === 'PIX'), questionsByTemplate)}
          {renderGroup('Subsellers (PJ e PF)', filtered.filter(t => classifyGroup(t) === 'SUBSELLER'), questionsByTemplate)}
          {renderGroup('Outros / Legados', filtered.filter(t => classifyGroup(t) === 'OTHER'), questionsByTemplate)}
        </>
      )}
    </div>
  );
}

/* ─── Rendering helpers ─── */

function renderGroup(title, templates, questionsByTemplate) {
  if (templates.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FileCheck2 className="w-4 h-4 text-[#1356E2]" />
        <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">{title}</h2>
        <span className="text-[11px] text-[#1a1a1a]/40">({templates.length})</span>
        <div className="flex-1 h-px bg-[#e8e8e8]" />
      </div>
      {templates.map(t => (
        <TemplateCard
          key={t.id}
          template={t}
          questions={questionsByTemplate[t.id] || []}
        />
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-7 text-[11px] px-2.5 rounded-full border ${active
        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] hover:bg-[#0A0A0A]/90 hover:text-white'
        : 'bg-white text-[#1a1a1a]/60 border-[#e8e8e8] hover:bg-[#f4f4f4]'}`}
    >
      {label}
    </Button>
  );
}

function GlobalMetric({ label, value }) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-lg px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-[#1a1a1a]/50 font-semibold">{label}</p>
      <p className="text-lg font-black text-[#0A0A0A]">{value}</p>
    </div>
  );
}

/* ─── Classification logic ─── */

const CARTAO_MODELS = new Set([
  'ComplianceGatewayV4','ComplianceMarketplaceV4','CompliancePlataformaVerticalV4',
  'ComplianceEcommerceV4','ComplianceSaaSV4','ComplianceInfoprodutosV4',
  'ComplianceDropshippingV4','ComplianceEducacaoV4','ComplianceLinkPagamentoV4',
  'ComplianceMerchantLinkV4','ComplianceMPEV4',
]);
const PIX_MODELS = new Set([
  'CompliancePixIntermediarioV4','pix_intermediario_v4',
  'CompliancePixMerchantV4','pix_merchant_v4',
  'pix_api_enterprise',
]);
const SUBSELLER_MODELS = new Set(['subseller_v2','subseller_pf','subseller']);

function classifyGroup(t) {
  if (CARTAO_MODELS.has(t.model)) return 'CARTAO';
  if (PIX_MODELS.has(t.model)) return 'PIX';
  if (SUBSELLER_MODELS.has(t.model)) return 'SUBSELLER';
  return 'OTHER';
}

function classifyTemplates(templates) {
  const out = { cartao: [], pix: [], subseller: [], other: [] };
  templates.forEach(t => {
    const g = classifyGroup(t);
    if (g === 'CARTAO') out.cartao.push(t);
    else if (g === 'PIX') out.pix.push(t);
    else if (g === 'SUBSELLER') out.subseller.push(t);
    else out.other.push(t);
  });

  // Sort each group by a priority order
  const cartaoOrder = [
    'ComplianceGatewayV4','ComplianceMarketplaceV4','CompliancePlataformaVerticalV4',
    'ComplianceDropshippingV4','ComplianceInfoprodutosV4','ComplianceEcommerceV4',
    'ComplianceSaaSV4','ComplianceLinkPagamentoV4','ComplianceEducacaoV4',
    'ComplianceMerchantLinkV4','ComplianceMPEV4',
  ];
  const pixOrder = ['CompliancePixIntermediarioV4','pix_intermediario_v4','pix_api_enterprise','CompliancePixMerchantV4','pix_merchant_v4'];
  const subsellerOrder = ['subseller_pf','subseller_v2','subseller'];

  const sortBy = (arr, order) => arr.sort((a, b) => {
    const ia = order.indexOf(a.model);
    const ib = order.indexOf(b.model);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  sortBy(out.cartao, cartaoOrder);
  sortBy(out.pix, pixOrder);
  sortBy(out.subseller, subsellerOrder);

  return out;
}