import React from 'react';
import { COUNTRIES } from '@/lib/global/countryMap';

/**
 * Template PDF estilo "Pin Bank Pricing Proposal - Roblox": SEM capa.
 * Foco em dados — uma seção por país com tabela Payment Method | Description | Price,
 * linha de impostos, restrições, depois Other Fees consolidados e International Settlement.
 */
export default function CountryPricingPdfTemplate({ proposal, lang = 'en' }) {
  const i18n = {
    en: {
      proposal_for: 'Proposal for', contact: 'Contact',
      payin_fee: 'Payin Processing Fee', payout_fee: 'Payout Processing Fee',
      payment_method: 'Payment Method', description: 'Description', price: 'Price',
      other_fees: 'Other Fees', setup: 'Setup Fee', risk: 'Risk Control Fee',
      refund: 'Refund Fee', chargeback: 'Chargeback Fee', settlement_fee: 'Settlement Fee', fx: 'FX',
      intl_settlement: 'International Settlement',
      intl_settlement_text: 'After deducting the fees from the payments processed for merchant\'s website, PIN BANK will transfer the money internationally to merchant\'s bank account. The sums received will be withheld the related fees.',
      intl_settlement_freq: 'PIN BANK will settle ONCE per each {days} calendar days in {currency} the sums received, with the related fees deducted.',
      valid_until: 'Valid until', footer: 'Pin Bank Limited · www.pagsmile.com · Unit 8B, Wing Hang Insurance Building, 11 Wing Kut Street, Central, Hong Kong',
    },
    pt: {
      proposal_for: 'Proposta para', contact: 'Contato',
      payin_fee: 'Taxa de Processamento de Payin', payout_fee: 'Taxa de Processamento de Payout',
      payment_method: 'Método de Pagamento', description: 'Descrição', price: 'Preço',
      other_fees: 'Outras Taxas', setup: 'Setup', risk: 'Controle de Risco',
      refund: 'Refund', chargeback: 'Chargeback', settlement_fee: 'Settlement', fx: 'FX',
      intl_settlement: 'Settlement Internacional',
      intl_settlement_text: 'Após deduzir as taxas dos pagamentos processados pelo site do merchant, a PIN BANK transferirá o dinheiro internacionalmente para a conta bancária do merchant. Os valores recebidos terão as taxas relacionadas deduzidas.',
      intl_settlement_freq: 'A PIN BANK liquidará UMA vez a cada {days} dias corridos em {currency} os valores recebidos, com as taxas relacionadas deduzidas.',
      valid_until: 'Válida até', footer: 'Pin Bank Limited · www.pagsmile.com · Unit 8B, Wing Hang Insurance Building, 11 Wing Kut Street, Central, Hong Kong',
    },
    zh: {
      proposal_for: '提案给', contact: '联系人',
      payin_fee: 'Payin 处理费', payout_fee: 'Payout 处理费',
      payment_method: '支付方式', description: '描述', price: '价格',
      other_fees: '其他费用', setup: '开通费', risk: '风险控制费',
      refund: '退款费', chargeback: '拒付费', settlement_fee: '结算费', fx: '汇兑',
      intl_settlement: '国际结算',
      intl_settlement_text: '从商户网站处理的付款中扣除费用后,PIN BANK 将把资金国际转账到商户的银行账户。收到的金额将扣除相关费用。',
      intl_settlement_freq: 'PIN BANK 将每 {days} 个日历日以 {currency} 结算一次收到的金额(扣除相关费用)。',
      valid_until: '有效期至', footer: 'Pin Bank Limited · www.pagsmile.com · Unit 8B, Wing Hang Insurance Building, 11 Wing Kut Street, Central, Hong Kong',
    },
  };
  const t = i18n[lang] || i18n.en;

  const countryPricing = proposal.country_pricing || [];

  // Helper para formatar preço de cada método: "3,5% + 4 MXN (Min 1 USD)"
  const fmtPrice = (m) => {
    const parts = [];
    if (m.rate_pct != null) parts.push(`${Number(m.rate_pct).toString().replace('.', ',')}%`);
    if (m.fixed && Number(m.fixed) > 0) parts.push(`+ ${Number(m.fixed)} ${m.fixed_currency || ''}`);
    let str = parts.join(' ');
    if (m.min_per_trx) str += ` (Min ${m.min_per_trx} ${m.min_per_trx_currency || m.fixed_currency || ''})`;
    return str.trim();
  };

  // Agrupa por payin/payout dentro do mesmo país
  const splitByType = (methods) => ({
    payin: methods.filter(m => (m.type || 'payin') === 'payin'),
    payout: methods.filter(m => m.type === 'payout'),
  });

  return (
    <div style={{
      width: 1080, background: '#ffffff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#0A0A0A', padding: 48,
    }}>
      {/* Cabeçalho compacto (sem capa) */}
      <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #1356E2' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Pin Bank</div>
            <div style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.6, marginTop: 2 }}>Pricing Proposal</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>{t.proposal_for}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{proposal.client_name || '—'}</div>
            <div style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.6 }}>{proposal.contact_name} · {proposal.contact_email}</div>
          </div>
        </div>
      </div>

      {/* Por país */}
      {countryPricing.map(country => {
        const meta = COUNTRIES.find(c => c.code === country.country);
        const split = splitByType(country.methods || []);

        return (
          <div key={country.country} style={{ marginBottom: 36, breakInside: 'avoid' }}>
            {/* Header país */}
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, paddingBottom: 4, borderBottom: '1px solid rgba(0,36,67,0.1)' }}>
              {meta?.flag || ''} {country.country_name?.toUpperCase() || country.country}
            </div>

            {/* Payin */}
            {split.payin.length > 0 && <>
              <div style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.7, marginBottom: 8 }}>{t.payin_fee}</div>
              <Table headers={[t.payment_method, t.description, t.price]} rows={
                split.payin.map(m => [m.method_label, m.description || '—', fmtPrice(m)])
              } />
            </>}

            {/* Taxes & restrictions */}
            {(country.taxes || []).map((tax, i) => {
              const labelByLang = lang === 'pt' ? tax.label_pt : lang === 'zh' ? tax.label_zh : tax.label_en;
              return (
                <div key={i} style={{ fontSize: 11, fontStyle: 'italic', color: '#0A0A0A', opacity: 0.7, marginTop: 8 }}>
                  {labelByLang || tax.label || `${tax.tax_type}: ${tax.percentage}%`}
                </div>
              );
            })}
            {(country.restrictions || []).map((r, i) => (
              <div key={i} style={{ fontSize: 11, fontStyle: 'italic', color: '#0A0A0A', opacity: 0.7, marginTop: 4 }}>
                *{r}
              </div>
            ))}

            {/* Payout */}
            {split.payout.length > 0 && <>
              <div style={{ fontSize: 11, color: '#0A0A0A', opacity: 0.7, marginTop: 16, marginBottom: 8 }}>{t.payout_fee}</div>
              <Table headers={[t.payment_method, 'Amount per Payout', t.price]} rows={
                split.payout.map(m => [m.method_label, m.amount_range_label || m.description || '—', fmtPrice(m)])
              } />
            </>}
          </div>
        );
      })}

      {/* Other Fees */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '2px solid #1356E2', breakInside: 'avoid' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{t.other_fees}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
          <Fee label={t.setup}          value={fmtUsdOrFree(proposal.setup_fee)} />
          <Fee label={t.risk}           value={`${proposal.risk_control_fee || 0.1} USD per successful credit card transaction`} />
          <Fee label={t.refund}         value={`${proposal.refund_fee || 1} USD per refunded transaction`} />
          <Fee label={t.chargeback}     value={`${proposal.chargeback_fee || 1} USD per chargeback`} />
          <Fee label={t.settlement_fee} value={`${proposal.settlement_fee_usd || 50} USD per international settlement transfer`} />
          <Fee label={t.fx}             value={`${proposal.fx_percentage || 3}%`} />
        </div>
      </div>

      {/* International Settlement */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: '2px solid #1356E2', breakInside: 'avoid' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{t.intl_settlement}</div>
        <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{t.intl_settlement_text}</p>
        <p style={{ fontSize: 12, lineHeight: 1.6, fontWeight: 600 }}>
          {t.intl_settlement_freq
            .replace('{days}', proposal.settlement_frequency_days || 30)
            .replace('{currency}', proposal.settlement_currency || 'USD')}
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid rgba(0,36,67,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#0A0A0A', opacity: 0.55 }}>
        <div>{proposal.valid_until ? `${t.valid_until}: ${proposal.valid_until}` : ''}</div>
        <div style={{ textAlign: 'right', maxWidth: 400 }}>{t.footer}</div>
      </div>
    </div>
  );
}

function fmtUsdOrFree(v) {
  if (!v || Number(v) === 0) return 'FREE';
  return `${Number(v)} USD`;
}

function Table({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#1356E2', color: '#ffffff' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(0,36,67,0.08)' }}>
            {r.map((cell, j) => (
              <td key={j} style={{ padding: '8px 12px', verticalAlign: 'top', fontWeight: j === 2 ? 700 : 400 }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fee({ label, value }) {
  return (
    <div style={{ padding: 10, border: '1px solid rgba(0,36,67,0.1)', borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.55, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  );
}