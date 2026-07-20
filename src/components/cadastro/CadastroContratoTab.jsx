import React, { useState } from 'react';
import { Stamp, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'pre_generated': 'bg-gray-100 text-gray-700',
  'under_review': 'bg-blue-100 text-blue-700',
  'ready': 'bg-indigo-100 text-indigo-700',
  'sent': 'bg-amber-100 text-amber-700',
  'signed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  'pre_generated': 'Pré-gerado',
  'under_review': 'Em Revisão',
  'ready': 'Pronto',
  'sent': 'Enviado',
  'signed': 'Assinado',
  'cancelled': 'Cancelado',
};

function ContractCard({ contract, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sc = STATUS_COLORS[contract.status] || STATUS_COLORS['pre_generated'];
  const label = STATUS_LABELS[contract.status] || contract.status;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Stamp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[var(--pinbank-blue)]">{contract.codigo || 'Contrato'}</span>
              <Badge className={`text-[10px] ${sc}`}>{label}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--pinbank-blue)]/50 mt-0.5">
              <span>{contract.clientName || '—'}</span>
              {contract.created_date && <span>• {new Date(contract.created_date).toLocaleDateString('pt-BR')}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {contract.publicLinkCode && (
            <Link to={`/ContratoPublico?code=${contract.publicLinkCode}`} target="_blank" onClick={e => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ExternalLink className="w-3 h-3" /> Ver
              </Button>
            </Link>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--pinbank-blue)]/30" /> : <ChevronDown className="w-4 h-4 text-[var(--pinbank-blue)]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--pinbank-blue)]/5 pt-4">
          {/* Dates & Duration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4 p-3 bg-gray-50 rounded-lg">
            {contract.contractDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Data do Contrato</p><p className="font-semibold">{new Date(contract.contractDate).toLocaleDateString('pt-BR')}</p></div>
            )}
            {contract.contractDurationMonths && (
              <div><p className="text-[var(--pinbank-blue)]/50">Duração</p><p className="font-semibold">{contract.contractDurationMonths} meses</p></div>
            )}
            {contract.sentDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Enviado em</p><p className="font-semibold">{new Date(contract.sentDate).toLocaleDateString('pt-BR')}</p></div>
            )}
            {contract.signedDate && (
              <div><p className="text-[var(--pinbank-blue)]/50">Assinado em</p><p className="font-semibold text-green-700">{new Date(contract.signedDate).toLocaleDateString('pt-BR')}</p></div>
            )}
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4">
            {contract.clientDocument && <div><p className="text-[var(--pinbank-blue)]/50">CNPJ</p><p className="font-semibold">{contract.clientDocument}</p></div>}
            {contract.clientEmail && <div><p className="text-[var(--pinbank-blue)]/50">E-mail</p><p className="font-semibold">{contract.clientEmail}</p></div>}
            {contract.clientPhone && <div><p className="text-[var(--pinbank-blue)]/50">Telefone</p><p className="font-semibold">{contract.clientPhone}</p></div>}
            {contract.clientAddress && <div><p className="text-[var(--pinbank-blue)]/50">Endereço</p><p className="font-semibold">{contract.clientAddress}{contract.clientCity ? `, ${contract.clientCity}` : ''}{contract.clientState ? ` - ${contract.clientState}` : ''}</p></div>}
            {contract.clientRepresentativeName && <div><p className="text-[var(--pinbank-blue)]/50">Representante</p><p className="font-semibold">{contract.clientRepresentativeName} {contract.clientRepresentativeRole ? `(${contract.clientRepresentativeRole})` : ''}</p></div>}
            {contract.responsavelNome && <div><p className="text-[var(--pinbank-blue)]/50">Responsável Interno</p><p className="font-semibold">{contract.responsavelNome}</p></div>}
          </div>

          {/* Modules */}
          {contract.modules && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--pinbank-blue)]/70 mb-2">Módulos Contratados</p>
              <div className="flex flex-wrap gap-2">
                {contract.modules.contaPagamento && <Badge variant="outline" className="text-[10px]">Conta Pagamento</Badge>}
                {contract.modules.subadquirenciaCartao && <Badge variant="outline" className="text-[10px]">Subadquirência Cartão</Badge>}
                {contract.modules.pixRecebimentos && <Badge variant="outline" className="text-[10px]">PIX Recebimentos</Badge>}
                {contract.modules.pixPagamentos && <Badge variant="outline" className="text-[10px]">PIX Pagamentos</Badge>}
                {contract.modules.boleto && <Badge variant="outline" className="text-[10px]">Boleto</Badge>}
                {contract.modules.gateway && <Badge variant="outline" className="text-[10px]">Gateway</Badge>}
              </div>
            </div>
          )}

          {/* Rates (if present) */}
          {contract.rates && (
            <div className="p-3 bg-blue-50 rounded-lg text-xs mb-4">
              <p className="font-semibold text-[var(--pinbank-blue)]/70 mb-2">Taxas do Contrato</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {contract.rates.pix?.valor && (
                  <div><span className="text-[var(--pinbank-blue)]/50">PIX: </span><span className="font-semibold">{contract.rates.pix.tipo === 'percentual' ? `${contract.rates.pix.valor}%` : `R$ ${contract.rates.pix.valor}`}</span></div>
                )}
                {contract.rates.antifraude && <div><span className="text-[var(--pinbank-blue)]/50">Antifraude: </span><span className="font-semibold">R$ {contract.rates.antifraude}</span></div>}
                {contract.rates.feeTransacao && <div><span className="text-[var(--pinbank-blue)]/50">Fee: </span><span className="font-semibold">R$ {contract.rates.feeTransacao}</span></div>}
                {contract.rates.percentualAntecipacao && <div><span className="text-[var(--pinbank-blue)]/50">Antecipação: </span><span className="font-semibold">{contract.rates.percentualAntecipacao}%</span></div>}
                {contract.rates.boleto && <div><span className="text-[var(--pinbank-blue)]/50">Boleto: </span><span className="font-semibold">R$ {contract.rates.boleto}</span></div>}
              </div>
            </div>
          )}

          {/* Risk Reserve */}
          {(contract.pixRiskReservePercentage || contract.cardRiskReservePercentage) && (
            <div className="p-3 bg-amber-50 rounded-lg text-xs mb-4">
              <p className="font-semibold text-[var(--pinbank-blue)]/70 mb-2">Reserva de Risco</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {contract.pixRiskReservePercentage && <div><span className="text-[var(--pinbank-blue)]/50">PIX: </span><span className="font-semibold">{contract.pixRiskReservePercentage}% ({contract.pixRiskReserveDays || '—'} dias)</span></div>}
                {contract.cardRiskReservePercentage && <div><span className="text-[var(--pinbank-blue)]/50">Cartão: </span><span className="font-semibold">{contract.cardRiskReservePercentage}% ({contract.cardRiskReserveDays || '—'} dias)</span></div>}
              </div>
            </div>
          )}

          {/* Setup, TPV, Banking */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {contract.setupFee && <div><p className="text-[var(--pinbank-blue)]/50">Taxa Setup</p><p className="font-semibold">R$ {contract.setupFee}</p></div>}
            {contract.paymentTerm && <div><p className="text-[var(--pinbank-blue)]/50">Prazo Liquidação</p><p className="font-semibold">{contract.paymentTerm}</p></div>}
            {contract.projectedTpvMonth1 && <div><p className="text-[var(--pinbank-blue)]/50">TPV Mín. M1</p><p className="font-semibold">R$ {contract.projectedTpvMonth1?.toLocaleString('pt-BR')}</p></div>}
            {contract.chargebackFee && <div><p className="text-[var(--pinbank-blue)]/50">Taxa Chargeback</p><p className="font-semibold">R$ {contract.chargebackFee}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CadastroContratoTab({ contracts = [] }) {
  // Support both old (single contract) and new (array) API
  const contractList = Array.isArray(contracts) ? contracts : (contracts ? [contracts] : []);

  if (!contractList.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <Stamp className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum contrato encontrado para este cliente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <p className="text-sm text-[var(--pinbank-blue)]/60">
        {contractList.length} contrato(s) encontrado(s)
      </p>
      {contractList.map((c, i) => (
        <ContractCard key={c.id} contract={c} defaultExpanded={i === 0} />
      ))}
    </div>
  );
}