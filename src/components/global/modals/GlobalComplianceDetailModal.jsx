import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Modal de detalhe de GlobalComplianceQuestionnaire.
 */
export default function GlobalComplianceDetailModal({ complianceId, onClose }) {
  const { data: c, isLoading } = useQuery({
    queryKey: ['globalCompliance', complianceId],
    queryFn: async () => {
      const list = await base44.entities.GlobalComplianceQuestionnaire.filter({ id: complianceId });
      return list[0] || null;
    },
    enabled: !!complianceId,
  });

  return (
    <Dialog open={!!complianceId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg text-[#002443]">
            {isLoading ? 'Carregando...' : (c?.legal_business_name || 'KYC')}
          </DialogTitle>
        </DialogHeader>

        {c && (
          <div className="space-y-4 text-sm">
            <Section title="Identificação">
              <Field label="Razão social" value={c.legal_business_name} />
              <Field label="Trade name / DBA" value={c.trade_name_dba} />
              <Field label="País de registro" value={c.registered_country} />
              <Field label="Endereço registrado" value={c.registered_business_address} />
              <Field label="Endereço físico" value={c.physical_office_address} />
              <Field label="Tipo empresa" value={c.company_type} />
              <Field label="Tax ID" value={c.tax_registration_number} />
              <Field label="Anos no mercado" value={c.years_in_business} />
              <Field label="Website" value={c.corporate_website} />
              <Field label="Aplicando para" value={c.applying_for} />
              <Field label="Direção de pagamento" value={c.payment_direction} />
            </Section>

            <Section title="Volumetria & Operação">
              <Field label="TPV mensal estimado (USD)" value={c.estimated_monthly_volume_usd} />
              <Field label="Ticket médio estimado" value={c.estimated_avg_transaction_usd} />
              <Field label="Países de operação" value={c.countries_of_operation} />
              <Field label="Natureza do negócio" value={c.business_nature} className="md:col-span-2" />
              <Field label="Licenças regulatórias" value={c.regulatory_licenses} className="md:col-span-2" />
            </Section>

            <Section title="UBOs">
              <div className="md:col-span-2 space-y-2">
                {(c.ubos || []).length === 0
                  ? <span className="text-[#002443]/50">—</span>
                  : (c.ubos || []).map((u, i) => (
                      <div key={i} className="bg-white rounded-lg p-2 border border-[#002443]/5">
                        <div className="font-medium text-[#002443]">{u.name} <span className="text-[#002443]/50 text-xs">({u.nationality})</span></div>
                        <div className="text-xs text-[#002443]/60">{u.address}</div>
                        <div className="text-xs text-[#2bc196] mt-1">{u.ownership_percentage}% ownership</div>
                      </div>
                  ))}
              </div>
            </Section>

            <Section title="Diretores">
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {(c.directors || []).length === 0
                  ? <span className="text-[#002443]/50">—</span>
                  : (c.directors || []).map((d, i) => (
                      <span key={i} className="text-xs bg-[#002443]/5 text-[#002443] px-2 py-1 rounded-md">
                        {d.first_name} {d.last_name} <span className="text-[#002443]/50">· {d.job_title}</span>
                      </span>
                  ))}
              </div>
            </Section>

            <Section title="Sanctions / Compliance">
              <Field label="Lista de sanções" value={c.q_sanctions_list ? '✅ Sim' : '❌ Não'} />
              <Field label="PEP" value={c.q_pep ? '✅ Sim' : '❌ Não'} />
              <Field label="País sancionado" value={c.q_sanctioned_country ? '✅ Sim' : '❌ Não'} />
              <Field label="Propriedade sancionada" value={c.q_sanctioned_ownership ? '✅ Sim' : '❌ Não'} />
              <Field label="Tratativas Pagsmile" value={c.q_pagsmile_dealings ? '✅ Sim' : '❌ Não'} />
              <Field label="Value Exchange" value={c.q_value_exchange ? '✅ Sim' : '❌ Não'} />
            </Section>

            <Section title="Documentos">
              <DocLink label="Corp. Documents" url={c.doc_corp_documents_url} />
              <DocLink label="Bank Statement" url={c.doc_bank_statement_url} />
              <DocLink label="Address Proof" url={c.doc_company_address_proof_url} />
              <DocLink label="License" url={c.doc_license_url} />
              <DocLink label="Ownership Chart" url={c.doc_ownership_chart_url} />
              <DocLink label="Pilot LLC" url={c.doc_pilot_llc_url} />
            </Section>

            <Section title="Certificação">
              <Field label="Nome" value={c.certifier_name} />
              <Field label="Cargo" value={c.certifier_job_title} />
              <Field label="Email" value={c.certifier_email} />
              <Field label="Data" value={c.certification_date} />
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50 mb-2">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#f4f4f4]/40 rounded-xl p-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-[#002443]/50">{label}</div>
      <div className="text-[#002443] mt-0.5 break-words">{value || '—'}</div>
    </div>
  );
}

function DocLink({ label, url }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#002443]/50">{label}</div>
      {url
        ? <a href={url} target="_blank" rel="noreferrer" className="text-[#2bc196] underline text-xs">Abrir</a>
        : <span className="text-[#002443]/30 text-xs">—</span>}
    </div>
  );
}