import React from 'react';
import { COUNTRIES } from '@/lib/global/countryMap';

/**
 * Layout visual da proposta usado para renderizar em PNG/PDF (html2canvas + jsPDF).
 * Render desacoplado da UI pública — usa dimensões fixas (A4 landscape ratio) com tipografia segura
 * (sem emojis Tailwind nem ícones SVG pesados — htmltocanvas tem bugs com isso).
 */
export default function ProposalDownloadContent({ proposal, lang = 'en' }) {
  const fmtUsd = v => `$${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const fmtPct = v => `${Number(v || 0).toFixed(3)}%`;

  const i18n = {
    en: {
      title: 'Pin Bank Global Payments Proposal',
      tagline: 'Tailored USD acquiring solution for your business',
      prepared_for: 'Prepared for',
      contact: 'Contact',
      final_rate: 'Final Processing Rate',
      fixed_fee: 'Fixed Fee per Transaction',
      breakdown: 'Rate Composition',
      base: 'Base Cost', interchange: 'Interchange', markup: 'Markup',
      operational: 'Operational Terms',
      settlement: 'Settlement',
      reserve: 'Rolling Reserve',
      setup: 'Setup Fee', refund: 'Refund Fee', chargeback: 'Chargeback Fee', risk: 'Risk Control',
      mccs: 'Merchant Categories', markets: 'Target Markets',
      valid_until: 'This proposal is valid until',
      footer: 'Pin Bank · Global Payments · pagsmile.com',
    },
    pt: {
      title: 'Proposta Comercial Pin Bank Global',
      tagline: 'Solução de adquirência em USD sob medida para o seu negócio',
      prepared_for: 'Preparada para',
      contact: 'Contato',
      final_rate: 'Taxa Final de Processamento',
      fixed_fee: 'Tarifa Fixa por Transação',
      breakdown: 'Composição da Taxa',
      base: 'Custo Base', interchange: 'Interchange', markup: 'Markup',
      operational: 'Termos Operacionais',
      settlement: 'Settlement',
      reserve: 'Reserva Rotativa',
      setup: 'Setup', refund: 'Refund', chargeback: 'Chargeback', risk: 'Controle de Risco',
      mccs: 'Categorias MCC', markets: 'Mercados-alvo',
      valid_until: 'Esta proposta é válida até',
      footer: 'Pin Bank · Global Payments · pagsmile.com',
    },
    zh: {
      title: 'Pin Bank Global 商户提案',
      tagline: '为您的业务量身定制的美元收单解决方案',
      prepared_for: '准备给',
      contact: '联系人',
      final_rate: '最终处理费率',
      fixed_fee: '每笔固定费用',
      breakdown: '费率构成',
      base: '基础成本', interchange: '交换费', markup: '加价',
      operational: '运营条款',
      settlement: '结算',
      reserve: '滚动准备金',
      setup: '开通费', refund: '退款费', chargeback: '拒付费', risk: '风险控制',
      mccs: 'MCC 类别', markets: '目标市场',
      valid_until: '本提案有效期至',
      footer: 'Pin Bank · Global Payments · pagsmile.com',
    },
  };
  const t = i18n[lang] || i18n.en;

  const markets = (proposal.target_markets || []).map(m => {
    const c = COUNTRIES.find(x => x.code === m || x.name.en === m);
    return c ? `${c.flag} ${c.name[lang] || c.name.en}` : m;
  });

  return (
    <div
      style={{
        width: '1080px',
        background: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#0A0A0A',
        padding: '48px',
      }}
    >
      {/* Header bar — gradient Pin Bank */}
      <div style={{
        height: 8,
        background: 'linear-gradient(90deg,#0A0A0A 0%,#1356E2 50%,#E84B1C 100%)',
        borderRadius: 4, marginBottom: 32,
      }} />

      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0A0A0A', lineHeight: 1.1 }}>{t.title}</div>
        <div style={{ fontSize: 14, color: '#0A0A0A', opacity: 0.6, marginTop: 6 }}>{t.tagline}</div>
      </div>

      {/* Client block */}
      <div style={{
        background: '#f4f4f4', borderRadius: 12, padding: 20, marginBottom: 24,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase' }}>{t.prepared_for}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', marginTop: 4 }}>{proposal.client_name || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase' }}>{t.contact}</div>
          <div style={{ fontSize: 14, color: '#0A0A0A', marginTop: 4 }}>{proposal.contact_name || '—'}</div>
          <div style={{ fontSize: 12, color: '#0A0A0A', opacity: 0.6 }}>{proposal.contact_email || '—'}</div>
        </div>
      </div>

      {/* Hero numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <HeroCell label={t.final_rate} value={fmtPct(proposal.final_rate_percentage)} highlight />
        <HeroCell label={t.fixed_fee}  value={fmtUsd(proposal.final_fixed_fee)} highlight />
      </div>

      {/* Breakdown */}
      <SectionTitle label={t.breakdown} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <Cell label={t.base}        value={fmtPct(proposal.base_cost_percentage)} />
        <Cell label={t.interchange} value={`${fmtPct(proposal.interchange_percentage)} + ${fmtUsd(proposal.interchange_fixed)}`} />
        <Cell label={t.markup}      value={fmtPct(proposal.markup_percentage)} />
      </div>

      {/* Operational terms */}
      <SectionTitle label={t.operational} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <Cell label={t.settlement} value={proposal.settlement_days || '—'} />
        <Cell label={t.reserve}    value={`${proposal.rolling_reserve_percentage || 0}% · ${proposal.rolling_reserve_days || 0}d`} />
        <Cell label={t.setup}      value={fmtUsd(proposal.setup_fee)} />
        <Cell label={t.chargeback} value={fmtUsd(proposal.chargeback_fee)} />
        <Cell label={t.refund}     value={fmtUsd(proposal.refund_fee)} />
        <Cell label={t.risk}       value={fmtUsd(proposal.risk_control_fee)} />
      </div>

      {/* MCCs & Markets */}
      {(proposal.mccs?.length > 0 || markets.length > 0) && (
        <>
          <SectionTitle label={`${t.mccs} & ${t.markets}`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{t.mccs}</div>
              <div style={{ fontSize: 12, color: '#0A0A0A', lineHeight: 1.6 }}>
                {(proposal.mccs || []).join(' · ') || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{t.markets}</div>
              <div style={{ fontSize: 12, color: '#0A0A0A', lineHeight: 1.6 }}>
                {markets.join(' · ') || '—'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,36,67,0.08)', paddingTop: 16, marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#0A0A0A', opacity: 0.6 }}>
        <div>{proposal.valid_until ? `${t.valid_until}: ${proposal.valid_until}` : ''}</div>
        <div>{t.footer}</div>
      </div>
    </div>
  );
}

function SectionTitle({ label }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#1356E2', textTransform: 'uppercase', marginBottom: 10 }}>
      {label}
    </div>
  );
}
function HeroCell({ label, value, highlight }) {
  return (
    <div style={{
      padding: 24,
      borderRadius: 16,
      background: highlight ? 'linear-gradient(135deg,rgba(43,193,150,0.08) 0%,rgba(92,247,207,0.08) 100%)' : '#ffffff',
      border: highlight ? '1px solid rgba(43,193,150,0.3)' : '1px solid rgba(0,36,67,0.08)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#0A0A0A', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{value}</div>
    </div>
  );
}
function Cell({ label, value }) {
  return (
    <div style={{ padding: 12, border: '1px solid rgba(0,36,67,0.08)', borderRadius: 10, background: '#ffffff' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}