import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

/**
 * Modal de detalhe somente-leitura de um GlobalQuestionnaire.
 */
export default function GlobalQuestionnaireDetailModal({ questionnaireId, onClose }) {
  const { data: q, isLoading } = useQuery({
    queryKey: ['globalQuestionnaire', questionnaireId],
    queryFn: async () => {
      const list = await base44.entities.GlobalQuestionnaire.filter({ id: questionnaireId });
      return list[0] || null;
    },
    enabled: !!questionnaireId,
  });

  const formatUsd = v => `$${(Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={!!questionnaireId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg text-[#002443]">
            {isLoading ? 'Carregando...' : (q?.company_name || 'Questionário')}
          </DialogTitle>
        </DialogHeader>

        {q && (
          <div className="space-y-4 text-sm">
            <Section title="Contato">
              <Field label="Nome" value={q.contact_name} />
              <Field label="Email" value={q.contact_email} />
              <Field label="Telefone" value={`${q.contact_phone_country_code || ''} ${q.contact_phone || ''}`} />
              <Field label="Cargo" value={q.contact_role} />
            </Section>

            <Section title="Empresa">
              <Field label="Razão" value={q.company_name} />
              <Field label="Tipo" value={q.business_type} />
              <Field label="Modelo" value={q.business_model} />
              <Field label="MCC" value={q.mcc} />
              <Field label="Produtos/Serviços" value={q.products_services} className="md:col-span-2" />
            </Section>

            <Section title="Volumetria">
              <Field label="TPV Mensal" value={formatUsd(q.monthly_tpv)} />
              <Field label="Ticket Médio" value={formatUsd(q.average_ticket)} />
              <Field label="Transações/mês" value={q.monthly_transactions} />
              <Field label="Settlement" value={q.expected_settlement_days} />
            </Section>

            <Section title="Mix por Bandeira">
              <Field label="Crédito" value={q.credit_percentage != null ? `${q.credit_percentage}%` : '—'} />
              <Field label="Débito" value={q.debit_percentage != null ? `${q.debit_percentage}%` : '—'} />
              <Field label="Visa" value={q.visa_percentage != null ? `${q.visa_percentage}%` : '—'} />
              <Field label="Mastercard" value={q.mastercard_percentage != null ? `${q.mastercard_percentage}%` : '—'} />
              <Field label="Amex" value={q.amex_percentage != null ? `${q.amex_percentage}%` : '—'} />
              <Field label="Outras" value={q.other_brands_percentage != null ? `${q.other_brands_percentage}%` : '—'} />
            </Section>

            <Section title="Parceiro Atual">
              <Field label="Tem parceiro?" value={q.has_current_partner ? 'Sim' : 'Não'} />
              <Field label="Taxa atual %" value={q.current_rate_percentage != null ? `${q.current_rate_percentage}%` : '—'} />
              <Field label="Fee fixo atual" value={q.current_fixed_fee != null ? formatUsd(q.current_fixed_fee) : '—'} />
            </Section>

            <Section title="Mercados-alvo">
              <div className="md:col-span-2 flex flex-wrap gap-1">
                {(q.target_markets || []).length === 0
                  ? <span className="text-[#002443]/50">—</span>
                  : (q.target_markets || []).map(m => (
                      <span key={m} className="text-xs bg-[#2bc196]/10 text-[#2bc196] px-2 py-0.5 rounded-full">{m}</span>
                    ))}
              </div>
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