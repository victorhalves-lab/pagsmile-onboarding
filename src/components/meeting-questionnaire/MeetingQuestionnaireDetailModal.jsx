import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, CreditCard, DollarSign, Shield, Target, User } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-6">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#002443] mb-3 pb-2 border-b border-[#002443]/5">
      <Icon className="w-4 h-4 text-[#2bc196]" />
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Field = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-xs text-[#002443]/60 flex-shrink-0 mr-4">{label}</span>
      <span className="text-sm text-right font-medium">{value}</span>
    </div>
  );
};

const formatCurrency = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null;
const formatPercent = (v) => v != null ? `${v}%` : null;

export default function MeetingQuestionnaireDetailModal({ open, onClose, questionnaire }) {
  if (!questionnaire) return null;
  const q = questionnaire;

  const STATUS_MAP = {
    rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
    preenchido: { label: 'Preenchido', color: 'bg-blue-100 text-blue-700' },
    analisado: { label: 'Analisado', color: 'bg-purple-100 text-purple-700' },
    proposta_gerada: { label: 'Proposta Gerada', color: 'bg-green-100 text-green-700' },
  };

  const BIZ_MAP = { MERCHAN: 'Merchant', GATEWAY: 'Gateway', MARKETPLACE: 'Marketplace' };
  const sCfg = STATUS_MAP[q.status] || STATUS_MAP.preenchido;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{q.clientFullName}</span>
            <Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge>
          </DialogTitle>
          <p className="text-xs text-[#002443]/50">Protocolo: {q.protocolo} | Agente: {q.commercialAgentName}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <Section icon={User} title="Informações do Cliente">
            <Field label="Nome / Razão Social" value={q.clientFullName} />
            <Field label="CPF/CNPJ" value={q.clientCpfCnpj} />
            <Field label="E-mail" value={q.clientEmail} />
            <Field label="Telefone" value={q.clientPhone} />
            <Field label="Website" value={q.clientWebsite} />
            <Field label="Contato" value={q.contactName} />
            <Field label="Cargo" value={q.contactRole} />
            <Field label="Tipo de Negócio" value={BIZ_MAP[q.businessType]} />
          </Section>

          <Section icon={Target} title="Detalhamento do Negócio">
            <Field label="Descrição" value={q.businessDescription} />
            <Field label="Canais de Venda" value={q.salesChannels} />
            {q.revenueBreakdown?.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-[#002443]/60 block mb-1">Distribuição de Receita:</span>
                <div className="space-y-1">
                  {q.revenueBreakdown.map((r, i) => (
                    <div key={i} className="flex justify-between text-sm bg-[#f4f4f4] rounded px-3 py-1.5">
                      <span>{r.product}</span>
                      <span className="font-medium">{r.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section icon={DollarSign} title="Volume e Transações">
            <Field label="TPV Mensal" value={formatCurrency(q.monthlyTpv)} />
            <Field label="Ticket Médio" value={formatCurrency(q.averageTicket)} />
            <Field label="Transações/Mês" value={q.monthlyTransactions?.toLocaleString('pt-BR')} />
            <Field label="Expectativa de Crescimento" value={q.growthExpectation} />
            {q.preferredPaymentMethods?.length > 0 && (
              <div className="flex justify-between items-start py-1.5">
                <span className="text-xs text-[#002443]/60">Métodos Preferidos</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {q.preferredPaymentMethods.map(m => (
                    <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section icon={CreditCard} title="Taxas e Custos Atuais">
            <Field label="MDR 1x" value={formatPercent(q.currentMdr1x)} />
            <Field label="MDR 2-6x" value={formatPercent(q.currentMdr2to6x)} />
            <Field label="MDR 7-12x" value={formatPercent(q.currentMdr7to12x)} />
            <Field label="Taxa PIX" value={formatPercent(q.currentPixRate)} />
            <Field label="Taxa Boleto" value={formatCurrency(q.currentBoletoRate)} />
            <Field label="Antecipação" value={q.anticipationType} />
            <Field label="Taxa Antecipação" value={formatPercent(q.anticipationRate)} />
            <Field label="Fee por Transação" value={formatCurrency(q.transactionFee)} />
            <Field label="Antifraude - Provedor" value={q.antiFraudProvider} />
            <Field label="Antifraude - Custo" value={formatCurrency(q.antiFraudCost)} />
          </Section>

          <Section icon={Shield} title="Desafios e Oportunidades">
            <Field label="Desafios Atuais" value={q.currentChallenges} />
            <Field label="Funcionalidades Críticas" value={q.criticalFeatures} />
            <Field label="Prazo Implementação" value={q.implementationTimeline} />
            <Field label="Observações" value={q.notes} />
          </Section>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}