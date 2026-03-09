import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Building2, CreditCard, Banknote, Clock, FileText,
  Loader2, Calendar, User, Hash, Shield, Send, CheckCircle, XCircle
} from 'lucide-react';
import moment from 'moment';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  enviada: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-700' },
  visualizada: { label: 'Visualizada', color: 'bg-orange-100 text-orange-700' },
  contraproposta: { label: 'Contraproposta', color: 'bg-blue-100 text-blue-700' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
  expirada: { label: 'Expirada', color: 'bg-slate-100 text-slate-500' },
};

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
const FAIXAS = [
  { id: 'avista', label: 'À Vista' },
  { id: 'de2a6x', label: '2-6x' },
  { id: 'de7a12x', label: '7-12x' },
  { id: 'de13a21x', label: '13-21x' },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2bc196]" />
        </div>
        <h2 className="text-base font-bold text-[#002443]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, prefix, suffix }) {
  if (value === undefined || value === null || value === '') return null;
  let display = value;
  if (typeof value === 'number') {
    display = prefix === 'R$'
      ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : suffix === '%'
        ? `${String(value).replace('.', ',')}%`
        : value;
  }
  if (prefix && typeof value !== 'number') display = `${prefix} ${display}`;
  if (suffix && typeof value !== 'number') display = `${display} ${suffix}`;
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#002443]/5 last:border-0">
      <span className="text-xs text-[#002443]/60 font-medium">{label}</span>
      <span className="text-sm font-semibold text-[#002443]">{display}</span>
    </div>
  );
}

function formatRate(val) {
  if (val === undefined || val === null || val === '') return '-';
  return `${String(val).replace('.', ',')}%`;
}

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '-';
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function PropostaDetalhes() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['proposta-detalhes', proposalId],
    queryFn: () => base44.entities.Proposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;
  }

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto text-[#002443]/20 mb-4" />
        <p className="text-[#002443]/60">Proposta não encontrada</p>
        <Button variant="link" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="mt-2">
          Voltar para Gestão de Propostas
        </Button>
      </div>
    );
  }

  const rates = proposta.rates || {};
  const sCfg = STATUS_CONFIG[proposta.status] || STATUS_CONFIG.rascunho;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{proposta.codigo || 'Proposta'}</h1>
              <Badge className={sCfg.color}>{sCfg.label}</Badge>
            </div>
            <p className="text-white/50 text-sm mt-1">
              {proposta.clienteNome || 'Sem cliente'} — Visualização interna somente leitura
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-5">
        <div className="flex flex-wrap gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#002443]/40" />
            <span className="text-[#002443]/50">Criada:</span>
            <span className="font-semibold">{moment(proposta.created_date).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          {proposta.sentDate && (
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[#002443]/50">Enviada:</span>
              <span className="font-semibold">{moment(proposta.sentDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          )}
          {proposta.acceptedDate && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[#002443]/50">Aceita:</span>
              <span className="font-semibold">{moment(proposta.acceptedDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          )}
          {proposta.rejectedDate && (
            <div className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[#002443]/50">Recusada:</span>
              <span className="font-semibold">{moment(proposta.rejectedDate).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          )}
          {proposta.validUntil && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[#002443]/50">Validade:</span>
              <span className="font-semibold">{moment(proposta.validUntil).format('DD/MM/YYYY')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <Section icon={Building2} title="Dados do Cliente">
          <InfoRow label="Nome da Empresa" value={proposta.clienteNome} />
          <InfoRow label="CNPJ" value={proposta.clienteCnpj} />
          <InfoRow label="Contato" value={proposta.clienteContato} />
          <InfoRow label="MCC" value={proposta.clienteMcc} />
          <InfoRow label="Modelo de Negócio" value={
            proposta.businessSubCategory === 'MERCHAN' ? 'Merchant' :
            proposta.businessSubCategory === 'GATEWAY' ? 'Gateway' :
            proposta.businessSubCategory === 'MARKETPLACE' ? 'Marketplace' :
            proposta.businessSubCategory || '—'
          } />
          <InfoRow label="Responsável" value={proposta.responsavelNome} />
        </Section>

        {/* Outras Taxas */}
        <Section icon={Banknote} title="Taxas Gerais">
          <InfoRow label="PIX" value={rates.pix?.valor} prefix={rates.pix?.tipo === 'fixo' ? 'R$' : undefined} suffix={rates.pix?.tipo === 'percentual' ? '%' : undefined} />
          <InfoRow label="Fee por Transação" value={rates.feeTransacao} prefix="R$" />
          <InfoRow label="Boleto" value={rates.boleto} prefix="R$" />
          <InfoRow label="Antifraude" value={rates.antifraude} prefix="R$" />
          <InfoRow label="Alerta Pré-Chargeback" value={rates.alertaPreChargeback} prefix="R$" />
          <InfoRow label="Custo 3DS" value={rates.taxa3ds} prefix="R$" />
          {rates.minimoGarantido && (
            <>
              <div className="pt-2 mt-2 border-t border-[#002443]/5">
                <p className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider mb-2">TPV Mínimo Mensal Garantido</p>
              </div>
              <InfoRow label="Mês 1" value={rates.minimoGarantido.mes1} prefix="R$" />
              <InfoRow label="Mês 2" value={rates.minimoGarantido.mes2} prefix="R$" />
              <InfoRow label="Mês 3+" value={rates.minimoGarantido.mes3} prefix="R$" />
            </>
          )}
        </Section>

        {/* Antecipação */}
        <Section icon={Clock} title="Antecipação">
          <InfoRow label="Taxa RAV" value={rates.rav?.taxa} suffix="% a.m." />
          <InfoRow label="Prazo" value={rates.rav?.prazo} />
          <InfoRow label="% Antecipação" value={rates.percentualAntecipacao} suffix="%" />
        </Section>

        {/* Financeiro */}
        {(proposta.estimatedRevenue || proposta.estimatedCost || proposta.estimatedMargin) && (
          <Section icon={Shield} title="Projeção Financeira">
            <InfoRow label="Receita Mensal Estimada" value={proposta.estimatedRevenue} prefix="R$" />
            <InfoRow label="Custo Mensal Estimado" value={proposta.estimatedCost} prefix="R$" />
            <InfoRow label="Margem Mensal Estimada" value={proposta.estimatedMargin} prefix="R$" />
          </Section>
        )}
      </div>

      {/* Taxas de Cartão — Tabela completa */}
      {rates.cartao && (
        <Section icon={CreditCard} title="Taxas de Cartão — Crédito">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#002443]/10">
                  <th className="text-left py-2 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Bandeira</th>
                  {FAIXAS.map(f => (
                    <th key={f.id} className="text-center py-2 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANDEIRAS.map(b => {
                  const bandData = rates.cartao[b];
                  if (!bandData) return null;
                  const hasValues = FAIXAS.some(f => bandData[f.id] !== undefined && bandData[f.id] !== null && bandData[f.id] !== '');
                  if (!hasValues) return null;
                  return (
                    <tr key={b} className="border-b border-[#002443]/5 last:border-0">
                      <td className="py-2.5 font-semibold capitalize text-[#002443]">{b}</td>
                      {FAIXAS.map(f => (
                        <td key={f.id} className="text-center py-2.5 font-mono font-semibold text-[#002443]">
                          {formatRate(bandData[f.id])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Débito */}
      {rates.debito && (
        <Section icon={CreditCard} title="Taxas de Débito">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BANDEIRAS.filter(b => rates.debito[b] !== undefined && rates.debito[b] !== null && rates.debito[b] !== '').map(b => (
              <div key={b} className="bg-[#f4f4f4] rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-[#002443]/40 uppercase mb-1 capitalize">{b}</p>
                <p className="text-lg font-bold text-[#002443]">{formatRate(rates.debito[b])}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Termos */}
      {proposta.terms && (
        <Section icon={FileText} title="Termos e Condições">
          <p className="text-sm text-[#002443]/70 whitespace-pre-wrap leading-relaxed">{proposta.terms}</p>
        </Section>
      )}

      {/* Motivo de recusa */}
      {proposta.rejectedReason && (
        <Section icon={XCircle} title="Motivo da Recusa">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{proposta.rejectedReason}</p>
        </Section>
      )}

      {/* Mensagem de envio */}
      {proposta.mensagemEnvio && (
        <Section icon={Send} title="Mensagem de Envio">
          <p className="text-sm text-[#002443]/70 whitespace-pre-wrap">{proposta.mensagemEnvio}</p>
        </Section>
      )}

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Gestão de Propostas
        </Button>
      </div>
    </div>
  );
}