import React from 'react';
import { Building2, CreditCard, Banknote, Clock, FileText, Shield, Send, XCircle, TrendingUp } from 'lucide-react';
import ParcelasTableDetalhada from './ParcelasTableDetalhada';

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
  if (value === undefined || value === null || value === '' || value === 0) return null;
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

export default function PropostaRevisaoResumo({ proposta }) {
  const rates = proposta.rates || {};

  return (
    <>
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

        {/* Taxas Gerais */}
        <Section icon={Banknote} title="Taxas Gerais">
          <InfoRow label="PIX" value={rates.pix?.valor} prefix={rates.pix?.tipo === 'fixo' ? 'R$' : undefined} suffix={rates.pix?.tipo === 'percentual' ? '%' : undefined} />
          <InfoRow label="Fee por Transação" value={rates.feeTransacao} prefix="R$" />
          <InfoRow label="Boleto" value={rates.boleto} prefix="R$" />
          <InfoRow label="Antifraude" value={rates.antifraude} prefix="R$" />
          <InfoRow label="Alerta Pré-Chargeback" value={rates.alertaPreChargeback} prefix="R$" />
          <InfoRow label="Custo 3DS" value={rates.taxa3ds} prefix="R$" />
          <InfoRow label="Valor de Setup" value={rates.setup} prefix="R$" />
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

      {/* Taxas de Cartão */}
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
                  const hasValues = FAIXAS.some(f => bandData[f.id] !== undefined && bandData[f.id] !== null && bandData[f.id] !== '' && bandData[f.id] !== 0);
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

      {/* Tabela de Parcelas com Antecipação */}
      {rates.rav?.taxa && parseFloat(rates.rav.taxa) > 0 && rates.rav?.prazo !== 'FLUXO' && (
        <Section icon={TrendingUp} title="Tabela de Parcelas — CET com Antecipação">
          <ParcelasTableDetalhada taxas={rates} taxaRAV={parseFloat(rates.rav.taxa) || 0} prazo={rates.rav.prazo || 'D+1'} />
        </Section>
      )}

      {/* Débito */}
      {rates.debito && (
        <Section icon={CreditCard} title="Taxas de Débito">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BANDEIRAS.filter(b => rates.debito[b] !== undefined && rates.debito[b] !== null && rates.debito[b] !== '' && rates.debito[b] !== 0).map(b => (
              <div key={b} className="bg-[#f4f4f4] rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-[#002443]/40 uppercase mb-1 capitalize">{b}</p>
                <p className="text-lg font-bold text-[#002443]">{formatRate(rates.debito[b])}</p>
              </div>
            ))}
          </div>
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

      {/* Termos */}
      {proposta.terms && (
        <Section icon={FileText} title="Termos e Condições">
          <p className="text-sm text-[#002443]/70 whitespace-pre-wrap leading-relaxed">{proposta.terms}</p>
        </Section>
      )}
    </>
  );
}