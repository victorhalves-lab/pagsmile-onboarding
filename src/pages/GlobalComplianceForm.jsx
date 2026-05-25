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
import UboList from '@/components/global/public/UboList';
import DirectorsList from '@/components/global/public/DirectorsList';
import SimpleFileUpload from '@/components/global/public/SimpleFileUpload';

/**
 * Formulário KYC público trilíngue Global. 6 etapas.
 * Grava em GlobalComplianceQuestionnaire com status=submitted.
 */
export default function GlobalComplianceForm() {
  const { lang, setLang, t } = usePublicGlobalI18n('en');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({
    applying_for: 'Merchant',
    payment_direction: 'Pay-in',
    legal_business_name: '', trade_name_dba: '',
    registered_business_address: '', physical_office_address: '',
    registered_country: '', corporate_website: '', onboarding_product_url: '',
    business_nature: '', regulatory_licenses: '',
    tax_registration_number: '', company_type: '', years_in_business: '',
    estimated_monthly_volume_usd: '', estimated_avg_transaction_usd: '',
    countries_of_operation: '',
    ubos: [],
    directors: [],
    directors_same_as_ubos: false,
    q_sanctions_list: false, q_sanctions_list_detail: '',
    q_pep: false, q_pep_detail: '',
    q_sanctioned_country: false, q_sanctioned_country_detail: '',
    q_sanctioned_ownership: false, q_sanctioned_ownership_detail: '',
    q_pagsmile_dealings: false, q_pagsmile_dealings_detail: '',
    q_value_exchange: false, q_value_exchange_detail: '',
    doc_corp_documents_url: '', doc_bank_statement_url: '',
    doc_company_address_proof_url: '', doc_license_url: '', doc_ownership_chart_url: '',
    certifier_name: '', certifier_job_title: '', certifier_email: '',
    certification_date: new Date().toISOString().slice(0, 10),
  });

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const steps = [t('kyc_s1'), t('kyc_s2'), t('kyc_s3'), t('kyc_s4'), t('kyc_s5'), t('kyc_s6')];

  const canNext = () => {
    if (step === 0) return f.legal_business_name && f.registered_country && f.business_nature;
    if (step === 5) return f.certifier_name && f.certifier_email;
    return true;
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      await base44.entities.GlobalComplianceQuestionnaire.create({
        ...f,
        language: lang,
        status: 'submitted',
        years_in_business: f.years_in_business ? Number(f.years_in_business) : undefined,
        estimated_monthly_volume_usd: f.estimated_monthly_volume_usd ? Number(f.estimated_monthly_volume_usd) : undefined,
        estimated_avg_transaction_usd: f.estimated_avg_transaction_usd ? Number(f.estimated_avg_transaction_usd) : undefined,
        ubos: (f.ubos || []).map(u => ({ ...u, ownership_percentage: Number(u.ownership_percentage) || 0 })),
      });
      setDone(true);
    } catch (e) {
      setError(e.message || t('error_desc'));
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <PublicGlobalShell title={t('kyc_title')} subtitle={t('kyc_subtitle')} lang={lang} setLang={setLang}>
        <div className="p-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">{t('success_title')}</h2>
          <p className="text-[#002443]/70">{t('success_desc')}</p>
        </div>
      </PublicGlobalShell>
    );
  }

  return (
    <PublicGlobalShell title={t('kyc_title')} subtitle={t('kyc_subtitle')} lang={lang} setLang={setLang} maxWidth="4xl">
      <StepProgress current={step} total={steps.length} labels={steps} />

      <div className="p-6 space-y-4">
        {/* Step 0: Business */}
        {step === 0 && (
          <Grid>
            <F2 wide><Label className="text-xs">{t('legal_business_name')} *</Label><Input value={f.legal_business_name} onChange={e => set('legal_business_name', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('trade_name_dba')}</Label><Input value={f.trade_name_dba} onChange={e => set('trade_name_dba', e.target.value)} /></F2>
            <F2>
              <Label className="text-xs">{t('applying_for')}</Label>
              <Select value={f.applying_for} onValueChange={v => set('applying_for', v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Merchant">Merchant</SelectItem>
                  <SelectItem value="Master Merchant (PSP License Required)">Master Merchant (PSP)</SelectItem>
                  <SelectItem value="Introducer">Introducer</SelectItem>
                </SelectContent>
              </Select>
            </F2>
            <F2>
              <Label className="text-xs">{t('payment_direction')}</Label>
              <Select value={f.payment_direction} onValueChange={v => set('payment_direction', v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pay-in">Pay-in</SelectItem>
                  <SelectItem value="Pay-out">Pay-out</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </F2>
            <F2><Label className="text-xs">{t('registered_country')} *</Label><Input value={f.registered_country} onChange={e => set('registered_country', e.target.value)} /></F2>
            <F2 wide><Label className="text-xs">{t('registered_business_address')}</Label><Input value={f.registered_business_address} onChange={e => set('registered_business_address', e.target.value)} /></F2>
            <F2 wide><Label className="text-xs">{t('physical_office_address')}</Label><Input value={f.physical_office_address} onChange={e => set('physical_office_address', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('corporate_website')}</Label><Input value={f.corporate_website} onChange={e => set('corporate_website', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('tax_registration_number')}</Label><Input value={f.tax_registration_number} onChange={e => set('tax_registration_number', e.target.value)} /></F2>
            <F2 wide><Label className="text-xs">{t('business_nature')} *</Label><Textarea rows={2} value={f.business_nature} onChange={e => set('business_nature', e.target.value)} /></F2>
            <F2 wide><Label className="text-xs">{t('regulatory_licenses')}</Label><Textarea rows={2} value={f.regulatory_licenses} onChange={e => set('regulatory_licenses', e.target.value)} /></F2>
          </Grid>
        )}

        {/* Step 1: Operations */}
        {step === 1 && (
          <Grid>
            <F2><Label className="text-xs">{t('estimated_monthly_volume_usd')}</Label><Input type="number" value={f.estimated_monthly_volume_usd} onChange={e => set('estimated_monthly_volume_usd', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('estimated_avg_transaction_usd')}</Label><Input type="number" value={f.estimated_avg_transaction_usd} onChange={e => set('estimated_avg_transaction_usd', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('years_in_business')}</Label><Input type="number" value={f.years_in_business} onChange={e => set('years_in_business', e.target.value)} /></F2>
            <F2><Label className="text-xs">Company type</Label><Input value={f.company_type} onChange={e => set('company_type', e.target.value)} /></F2>
            <F2 wide><Label className="text-xs">{t('countries_of_operation')}</Label><Textarea rows={2} value={f.countries_of_operation} onChange={e => set('countries_of_operation', e.target.value)} /></F2>
          </Grid>
        )}

        {/* Step 2: UBOs & Directors */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#002443] mb-2">{t('ubos_title')}</h3>
              <UboList value={f.ubos} onChange={(v) => set('ubos', v)} t={t} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#002443]">{t('directors_title')}</h3>
                <label className="text-xs flex items-center gap-1.5 text-[#002443]/70 cursor-pointer">
                  <input type="checkbox" checked={f.directors_same_as_ubos} onChange={(e) => set('directors_same_as_ubos', e.target.checked)} />
                  {t('directors_same_as_ubos')}
                </label>
              </div>
              {!f.directors_same_as_ubos && (
                <DirectorsList value={f.directors} onChange={(v) => set('directors', v)} t={t} />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Compliance */}
        {step === 3 && (
          <div className="space-y-3">
            <YesNoRow t={t} label={t('q_sanctions_list')}      val={f.q_sanctions_list}      detail={f.q_sanctions_list_detail}      onVal={v => set('q_sanctions_list', v)}      onDetail={v => set('q_sanctions_list_detail', v)} />
            <YesNoRow t={t} label={t('q_pep')}                  val={f.q_pep}                 detail={f.q_pep_detail}                 onVal={v => set('q_pep', v)}                  onDetail={v => set('q_pep_detail', v)} />
            <YesNoRow t={t} label={t('q_sanctioned_country')}   val={f.q_sanctioned_country}  detail={f.q_sanctioned_country_detail}  onVal={v => set('q_sanctioned_country', v)}   onDetail={v => set('q_sanctioned_country_detail', v)} />
            <YesNoRow t={t} label={t('q_sanctioned_ownership')} val={f.q_sanctioned_ownership} detail={f.q_sanctioned_ownership_detail} onVal={v => set('q_sanctioned_ownership', v)} onDetail={v => set('q_sanctioned_ownership_detail', v)} />
            <YesNoRow t={t} label={t('q_pagsmile_dealings')}    val={f.q_pagsmile_dealings}   detail={f.q_pagsmile_dealings_detail}   onVal={v => set('q_pagsmile_dealings', v)}    onDetail={v => set('q_pagsmile_dealings_detail', v)} />
            <YesNoRow t={t} label={t('q_value_exchange')}       val={f.q_value_exchange}      detail={f.q_value_exchange_detail}      onVal={v => set('q_value_exchange', v)}       onDetail={v => set('q_value_exchange_detail', v)} />
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <Grid>
            <F2><SimpleFileUpload t={t} label={t('doc_corp_documents')}   value={f.doc_corp_documents_url}        onChange={(u) => set('doc_corp_documents_url', u)} /></F2>
            <F2><SimpleFileUpload t={t} label={t('doc_bank_statement')}   value={f.doc_bank_statement_url}        onChange={(u) => set('doc_bank_statement_url', u)} /></F2>
            <F2><SimpleFileUpload t={t} label={t('doc_address_proof')}    value={f.doc_company_address_proof_url} onChange={(u) => set('doc_company_address_proof_url', u)} /></F2>
            <F2><SimpleFileUpload t={t} label={t('doc_license')}          value={f.doc_license_url}               onChange={(u) => set('doc_license_url', u)} /></F2>
            <F2><SimpleFileUpload t={t} label={t('doc_ownership_chart')}  value={f.doc_ownership_chart_url}       onChange={(u) => set('doc_ownership_chart_url', u)} /></F2>
          </Grid>
        )}

        {/* Step 5: Certification */}
        {step === 5 && (
          <Grid>
            <F2><Label className="text-xs">{t('certifier_name')} *</Label><Input value={f.certifier_name} onChange={e => set('certifier_name', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('certifier_role')}</Label><Input value={f.certifier_job_title} onChange={e => set('certifier_job_title', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('certifier_email')} *</Label><Input type="email" value={f.certifier_email} onChange={e => set('certifier_email', e.target.value)} /></F2>
            <F2><Label className="text-xs">{t('certification_date')}</Label><Input type="date" value={f.certification_date} onChange={e => set('certification_date', e.target.value)} /></F2>
          </Grid>
        )}

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>}

        <div className="flex items-center justify-between pt-4 border-t border-[#002443]/5">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              {t('next')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting || !canNext()}>
              <Send className="w-4 h-4 mr-1" /> {submitting ? t('loading') : t('submit')}
            </Button>
          )}
        </div>
      </div>
    </PublicGlobalShell>
  );
}

function Grid({ children }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function F2({ wide, children }) { return <div className={wide ? 'col-span-2' : ''}>{children}</div>; }

function YesNoRow({ label, val, onVal, detail, onDetail, t }) {
  return (
    <div className="bg-[#f4f4f4]/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[#002443] font-medium">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onVal(true)}
            className={`px-3 py-1 rounded-md text-xs ${val === true ? 'bg-[#2bc196] text-white' : 'bg-white text-[#002443]/60 border border-[#002443]/10'}`}>{t('yes')}</button>
          <button type="button" onClick={() => onVal(false)}
            className={`px-3 py-1 rounded-md text-xs ${val === false ? 'bg-[#002443] text-white' : 'bg-white text-[#002443]/60 border border-[#002443]/10'}`}>{t('no')}</button>
        </div>
      </div>
      {val === true && (
        <Textarea rows={2} placeholder={t('detail_if_yes')} value={detail} onChange={e => onDetail(e.target.value)} />
      )}
    </div>
  );
}