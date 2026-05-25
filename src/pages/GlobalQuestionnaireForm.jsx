import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicGlobalI18n } from '@/components/global/public/usePublicGlobalI18n';
import PublicGlobalShell from '@/components/global/public/PublicGlobalShell';
import StepProgress from '@/components/global/public/StepProgress';
import { MCC_OPTIONS, TARGET_MARKETS } from '@/lib/global/interchangeData';

/**
 * Formulário público trilíngue para o lead internacional (USD).
 * 6 etapas. Grava em GlobalQuestionnaire na conclusão.
 */
export default function GlobalQuestionnaireForm() {
  const { lang, setLang, t } = usePublicGlobalI18n('en');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({
    contact_name: '', contact_email: '', contact_phone: '', contact_phone_country_code: '+1', contact_role: '',
    company_name: '', business_type: '', business_model: '', products_services: '', mcc: '',
    monthly_tpv: '', average_ticket: '', monthly_transactions: '',
    credit_percentage: '', debit_percentage: '',
    visa_percentage: '', mastercard_percentage: '', amex_percentage: '', other_brands_percentage: '',
    has_current_partner: false, current_rate_percentage: '', current_fixed_fee: '',
    expected_settlement_days: 'D+2',
    target_markets: [],
  });

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const toggleMarket = (m) => setF(s => ({
    ...s,
    target_markets: s.target_markets.includes(m) ? s.target_markets.filter(x => x !== m) : [...s.target_markets, m],
  }));

  const steps = [t('lead_s1'), t('lead_s2'), t('lead_s3'), t('lead_s4'), t('lead_s5'), t('lead_s6')];

  const canNext = () => {
    if (step === 0) return f.contact_name && f.contact_email && f.contact_phone;
    if (step === 1) return f.company_name && f.business_type;
    if (step === 2) return f.monthly_tpv && f.average_ticket;
    return true;
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      await base44.entities.GlobalQuestionnaire.create({
        ...f,
        monthly_tpv: Number(f.monthly_tpv) || 0,
        average_ticket: Number(f.average_ticket) || 0,
        monthly_transactions: Number(f.monthly_transactions) || undefined,
        credit_percentage: Number(f.credit_percentage) || undefined,
        debit_percentage: Number(f.debit_percentage) || undefined,
        visa_percentage: Number(f.visa_percentage) || undefined,
        mastercard_percentage: Number(f.mastercard_percentage) || undefined,
        amex_percentage: Number(f.amex_percentage) || undefined,
        other_brands_percentage: Number(f.other_brands_percentage) || undefined,
        current_rate_percentage: Number(f.current_rate_percentage) || undefined,
        current_fixed_fee: Number(f.current_fixed_fee) || undefined,
        pipeline_status: 'leads',
      });
      setDone(true);
    } catch (e) {
      setError(e.message || t('error_desc'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PublicGlobalShell title={t('lead_title')} subtitle={t('lead_subtitle')} lang={lang} setLang={setLang}>
        <div className="p-10 text-center">
          <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#002443] mb-2">{t('success_title')}</h2>
          <p className="text-[#002443]/70">{t('success_desc')}</p>
        </div>
      </PublicGlobalShell>
    );
  }

  return (
    <PublicGlobalShell title={t('lead_title')} subtitle={t('lead_subtitle')} lang={lang} setLang={setLang}>
      <StepProgress current={step} total={steps.length} labels={steps} />

      <div className="p-6 space-y-4">
        {step === 0 && (
          <Section>
            <Field2><Label className="text-xs">{t('contact_name')} *</Label><Input value={f.contact_name} onChange={e => set('contact_name', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('contact_email')} *</Label><Input type="email" value={f.contact_email} onChange={e => set('contact_email', e.target.value)} /></Field2>
            <Field2>
              <Label className="text-xs">{t('contact_phone_cc')}</Label>
              <Input value={f.contact_phone_country_code} onChange={e => set('contact_phone_country_code', e.target.value)} />
            </Field2>
            <Field2><Label className="text-xs">{t('contact_phone')} *</Label><Input value={f.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></Field2>
            <Field2 wide><Label className="text-xs">{t('contact_role')}</Label><Input value={f.contact_role} onChange={e => set('contact_role', e.target.value)} /></Field2>
          </Section>
        )}

        {step === 1 && (
          <Section>
            <Field2 wide><Label className="text-xs">{t('company_name')} *</Label><Input value={f.company_name} onChange={e => set('company_name', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('business_type')} *</Label><Input value={f.business_type} onChange={e => set('business_type', e.target.value)} placeholder="e.g. LLC, S.A." /></Field2>
            <Field2><Label className="text-xs">{t('business_model')}</Label><Input value={f.business_model} onChange={e => set('business_model', e.target.value)} /></Field2>
            <Field2 wide><Label className="text-xs">{t('products_services')}</Label><Textarea value={f.products_services} onChange={e => set('products_services', e.target.value)} rows={2} /></Field2>
            <Field2 wide>
              <Label className="text-xs">{t('mcc')}</Label>
              <Select value={f.mcc} onValueChange={v => set('mcc', v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{MCC_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field2>
          </Section>
        )}

        {step === 2 && (
          <Section>
            <Field2><Label className="text-xs">{t('monthly_tpv')} *</Label><Input type="number" value={f.monthly_tpv} onChange={e => set('monthly_tpv', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('average_ticket')} *</Label><Input type="number" value={f.average_ticket} onChange={e => set('average_ticket', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('monthly_transactions')}</Label><Input type="number" value={f.monthly_transactions} onChange={e => set('monthly_transactions', e.target.value)} /></Field2>
            <Field2>
              <Label className="text-xs">{t('expected_settlement')}</Label>
              <Select value={f.expected_settlement_days} onValueChange={v => set('expected_settlement_days', v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{['D+1','D+2','D+7','D+15'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field2>
          </Section>
        )}

        {step === 3 && (
          <Section>
            <Field2><Label className="text-xs">{t('credit_percentage')}</Label><Input type="number" value={f.credit_percentage} onChange={e => set('credit_percentage', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('debit_percentage')}</Label><Input type="number" value={f.debit_percentage} onChange={e => set('debit_percentage', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('visa_percentage')}</Label><Input type="number" value={f.visa_percentage} onChange={e => set('visa_percentage', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('mastercard_percentage')}</Label><Input type="number" value={f.mastercard_percentage} onChange={e => set('mastercard_percentage', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('amex_percentage')}</Label><Input type="number" value={f.amex_percentage} onChange={e => set('amex_percentage', e.target.value)} /></Field2>
            <Field2><Label className="text-xs">{t('other_brands_percentage')}</Label><Input type="number" value={f.other_brands_percentage} onChange={e => set('other_brands_percentage', e.target.value)} /></Field2>
          </Section>
        )}

        {step === 4 && (
          <Section>
            <Field2 wide>
              <Label className="text-xs">{t('has_current_partner')}</Label>
              <div className="flex gap-2 mt-1">
                <YesNoButton active={f.has_current_partner === true} onClick={() => set('has_current_partner', true)}>{t('yes')}</YesNoButton>
                <YesNoButton active={f.has_current_partner === false} onClick={() => set('has_current_partner', false)}>{t('no')}</YesNoButton>
              </div>
            </Field2>
            {f.has_current_partner && (
              <>
                <Field2><Label className="text-xs">{t('current_rate_percentage')}</Label><Input type="number" step="0.01" value={f.current_rate_percentage} onChange={e => set('current_rate_percentage', e.target.value)} /></Field2>
                <Field2><Label className="text-xs">{t('current_fixed_fee')}</Label><Input type="number" step="0.01" value={f.current_fixed_fee} onChange={e => set('current_fixed_fee', e.target.value)} /></Field2>
              </>
            )}
          </Section>
        )}

        {step === 5 && (
          <div>
            <Label className="text-xs">{t('target_markets')}</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TARGET_MARKETS.map(m => (
                <button key={m} type="button" onClick={() => toggleMarket(m)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    f.target_markets.includes(m)
                      ? 'bg-[#2bc196] text-white border-[#2bc196]'
                      : 'bg-white text-[#002443]/70 border-[#002443]/10 hover:bg-[#2bc196]/10'
                  }`}
                >{m}</button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>}

        {/* Nav */}
        <div className="flex items-center justify-between pt-4 border-t border-[#002443]/5">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              {t('next')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              <Send className="w-4 h-4 mr-1" /> {submitting ? t('loading') : t('submit')}
            </Button>
          )}
        </div>
      </div>
    </PublicGlobalShell>
  );
}

function Section({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Field2({ wide, children }) {
  return <div className={wide ? 'col-span-2' : ''}>{children}</div>;
}
function YesNoButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm border ${active ? 'bg-[#2bc196] text-white border-[#2bc196]' : 'bg-white text-[#002443]/70 border-[#002443]/10'}`}>
      {children}
    </button>
  );
}