import React, { useState } from 'react';
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'rascunho': 'bg-gray-100 text-gray-700',
  'enviada': 'bg-blue-100 text-blue-700',
  'visualizada': 'bg-indigo-100 text-indigo-700',
  'aceita': 'bg-green-100 text-green-700',
  'recusada': 'bg-red-100 text-red-700',
  'contraproposta': 'bg-amber-100 text-amber-700',
  'expirada': 'bg-gray-100 text-gray-500',
  'cancelada': 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  'rascunho': 'Rascunho',
  'enviada': 'Enviada',
  'visualizada': 'Visualizada',
  'aceita': 'Aceita',
  'recusada': 'Recusada',
  'contraproposta': 'Contraproposta',
  'expirada': 'Expirada',
  'cancelada': 'Cancelada',
};

function RateRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--pinbank-blue)]/5 last:border-0">
      <span className="text-xs text-[var(--pinbank-blue)]/50">{label}</span>
      <span className="text-sm font-semibold text-[var(--pinbank-blue)]">{typeof value === 'number' ? `${value}%` : value}</span>
    </div>
  );
}

function ProposalCard({ proposal, lead, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sc = STATUS_COLORS[proposal.status] || STATUS_COLORS['rascunho'];
  const rates = proposal.rates || {};
  const visa = rates.cartao?.visa || {};
  const master = rates.cartao?.mastercard || {};
  const elo = rates.cartao?.elo || {};
  const amex = rates.cartao?.amex || {};
  const debito = rates.debito || {};

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[var(--pinbank-blue)]">{proposal.codigo || proposal.proposalName || 'Proposta'}</span>
              <Badge className={`text-[10px] ${sc}`}>{STATUS_LABELS[proposal.status] || proposal.status}</Badge>
              {proposal.version > 1 && <Badge variant="outline" className="text-[10px]">v{proposal.version}</Badge>}
              {proposal.isCurrentVersion && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Atual</Badge>}
              {proposal.origem && proposal.origem !== 'manual' && (
                <Badge variant="outline" className="text-[10px] capitalize">{proposal.origem.replace(/_/g, ' ')}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--pinbank-blue)]/50 mt-0.5">
              <span>{proposal.clienteNome || lead?.fullName || '—'}</span>
              {proposal.created_date && <span>• {new Date(proposal.created_date).toLocaleDateString('pt-BR')}</span>}
              {proposal.businessSubCategory && <span className="capitalize">• {proposal.businessSubCategory}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {proposal.tokenPublico && (
            <Link to={`/PropostaPublica?token=${proposal.tokenPublico}`} target="_blank" onClick={e => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ExternalLink className="w-3 h-3" /> Ver
              </Button>
            </Link>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--pinbank-blue)]/30" /> : <ChevronDown className="w-4 h-4 text-[var(--pinbank-blue)]/30" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--pinbank-blue)]/5">
          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mt-4 mb-4 p-3 bg-gray-50 rounded-lg">
            {proposal.sentDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Enviada</p><p className="font-semibold">{new Date(proposal.sentDate).toLocaleDateString('pt-BR')}</p></div>
            )}
            {proposal.validUntil && (
              <div><p className="text-[var(--pinbank-blue)]/50">Válida até</p><p className="font-semibold">{new Date(proposal.validUntil).toLocaleDateString('pt-BR')}</p></div>
            )}
            {proposal.acceptedDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Aceita em</p><p className="font-semibold text-green-700">{new Date(proposal.acceptedDate).toLocaleDateString('pt-BR')}</p></div>
            )}
            {proposal.rejectedDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Recusada em</p><p className="font-semibold text-red-700">{new Date(proposal.rejectedDate).toLocaleDateString('pt-BR')}</p></div>
            )}
            {proposal.responsavelNome && (
              <div><p className="text-[var(--pinbank-blue)]/50">Responsável</p><p className="font-semibold">{proposal.responsavelNome}</p></div>
            )}
          </div>

          {/* Rentabilidade */}
          {(proposal.estimatedRevenue || proposal.estimatedMargin) && (
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-emerald-50 rounded-lg text-center text-xs">
              {proposal.estimatedRevenue != null && (
                <div><p className="text-[var(--pinbank-blue)]/50">Receita Estimada</p><p className="font-bold text-emerald-700">R$ {Number(proposal.estimatedRevenue).toLocaleString('pt-BR')}</p></div>
              )}
              {proposal.estimatedCost != null && (
                <div><p className="text-[var(--pinbank-blue)]/50">Custo Estimado</p><p className="font-bold text-red-600">R$ {Number(proposal.estimatedCost).toLocaleString('pt-BR')}</p></div>
              )}
              {proposal.estimatedMargin != null && (
                <div><p className="text-[var(--pinbank-blue)]/50">Margem</p><p className="font-bold text-[var(--pinbank-blue)]">R$ {Number(proposal.estimatedMargin).toLocaleString('pt-BR')}</p></div>
              )}
            </div>
          )}

          {/* Partner info */}
          {proposal.chosenPartnerName && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs">
              <span className="text-[var(--pinbank-blue)]/50">Parceiro: </span>
              <span className="font-semibold">{proposal.chosenPartnerName}</span>
            </div>
          )}

          {/* Rates - All Brands */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Visa */}
            {(visa.avista || visa.de2a6x || visa.de7a12x) && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Visa</h4>
                <RateRow label="À Vista" value={visa.avista} />
                <RateRow label="2-6x" value={visa.de2a6x} />
                <RateRow label="7-12x" value={visa.de7a12x} />
                <RateRow label="13-21x" value={visa.de13a21x} />
              </div>
            )}
            {/* Mastercard */}
            {(master.avista || master.de2a6x || master.de7a12x) && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Mastercard</h4>
                <RateRow label="À Vista" value={master.avista} />
                <RateRow label="2-6x" value={master.de2a6x} />
                <RateRow label="7-12x" value={master.de7a12x} />
                <RateRow label="13-21x" value={master.de13a21x} />
              </div>
            )}
            {/* Elo */}
            {(elo.avista || elo.de2a6x || elo.de7a12x) && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Elo</h4>
                <RateRow label="À Vista" value={elo.avista} />
                <RateRow label="2-6x" value={elo.de2a6x} />
                <RateRow label="7-12x" value={elo.de7a12x} />
                <RateRow label="13-21x" value={elo.de13a21x} />
              </div>
            )}
            {/* Amex */}
            {(amex.avista || amex.de2a6x || amex.de7a12x) && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Amex</h4>
                <RateRow label="À Vista" value={amex.avista} />
                <RateRow label="2-6x" value={amex.de2a6x} />
                <RateRow label="7-12x" value={amex.de7a12x} />
                <RateRow label="13-21x" value={amex.de13a21x} />
              </div>
            )}
            {/* Débito */}
            {(debito.visa || debito.mastercard || debito.elo) && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Débito</h4>
                <RateRow label="Visa" value={debito.visa} />
                <RateRow label="Mastercard" value={debito.mastercard} />
                <RateRow label="Elo" value={debito.elo} />
                {debito.outras && <RateRow label="Outras" value={debito.outras} />}
              </div>
            )}
            {/* Other */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Outras Taxas</h4>
              <RateRow label="PIX" value={rates.pix?.tipo === 'percentual' ? `${rates.pix.valor}%` : rates.pix?.valor ? `R$ ${rates.pix.valor}` : null} />
              <RateRow label="Antifraude" value={rates.antifraude ? `R$ ${rates.antifraude}` : null} />
              <RateRow label="Fee/Transação" value={rates.feeTransacao ? `R$ ${rates.feeTransacao}` : null} />
              <RateRow label="Antecipação" value={rates.percentualAntecipacao} />
              <RateRow label="Boleto" value={rates.boleto ? `R$ ${rates.boleto}` : null} />
              <RateRow label="3DS" value={rates.taxa3ds ? `R$ ${rates.taxa3ds}` : null} />
              <RateRow label="Setup" value={rates.setup ? `R$ ${rates.setup}` : null} />
              <RateRow label="Forex" value={rates.forex} />
              {rates.rav?.taxa && <RateRow label={`RAV (${rates.rav.prazo || '—'})`} value={rates.rav.taxa} />}
              {rates.alertaPreChargeback && <RateRow label="Alerta Pré-Chargeback" value={`R$ ${rates.alertaPreChargeback}`} />}
            </div>
          </div>

          {/* Mínimo Garantido */}
          {rates.minimoGarantido && (rates.minimoGarantido.mes1 || rates.minimoGarantido.mes2 || rates.minimoGarantido.mes3) && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <h4 className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Mínimo Garantido</h4>
              <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <div><p className="text-[var(--pinbank-blue)]/50">Mês 1</p><p className="font-semibold">R$ {rates.minimoGarantido.mes1?.toLocaleString('pt-BR') || '—'}</p></div>
                <div><p className="text-[var(--pinbank-blue)]/50">Mês 2</p><p className="font-semibold">R$ {rates.minimoGarantido.mes2?.toLocaleString('pt-BR') || '—'}</p></div>
                <div><p className="text-[var(--pinbank-blue)]/50">Mês 3+</p><p className="font-semibold">R$ {rates.minimoGarantido.mes3?.toLocaleString('pt-BR') || '—'}</p></div>
              </div>
            </div>
          )}

          {/* Rejected Reason */}
          {proposal.rejectedReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-xs">
              <span className="text-red-700/50 font-semibold">Motivo da recusa: </span>
              <span className="text-red-700">{proposal.rejectedReason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CadastroPropostaTab({ proposals = [], lead }) {
  if (!proposals.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhuma proposta encontrada para este cliente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--pinbank-blue)]/60">
          {proposals.length} proposta(s) encontrada(s)
        </p>
        <div className="flex gap-2">
          {['aceita', 'enviada', 'visualizada', 'rascunho', 'recusada'].map(s => {
            const count = proposals.filter(p => p.status === s).length;
            if (!count) return null;
            return (
              <Badge key={s} className={`text-[10px] ${STATUS_COLORS[s] || 'bg-gray-100'}`}>
                {count} {STATUS_LABELS[s] || s}
              </Badge>
            );
          })}
        </div>
      </div>
      {proposals.map((p, i) => (
        <ProposalCard key={p.id} proposal={p} lead={lead} defaultExpanded={i === 0} />
      ))}
    </div>
  );
}