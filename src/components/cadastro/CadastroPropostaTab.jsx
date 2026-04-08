import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
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

function RateRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--pagsmile-blue)]/5 last:border-0">
      <span className="text-xs text-[var(--pagsmile-blue)]/50">{label}</span>
      <span className="text-sm font-semibold text-[var(--pagsmile-blue)]">{typeof value === 'number' ? `${value}%` : value}</span>
    </div>
  );
}

export default function CadastroPropostaTab({ proposal, lead }) {
  if (!proposal) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhuma proposta encontrada para este cliente</p>
      </div>
    );
  }

  const sc = STATUS_COLORS[proposal.status] || STATUS_COLORS['rascunho'];
  const rates = proposal.rates || {};
  const visa = rates.cartao?.visa || {};

  return (
    <div className="space-y-4 mt-4">
      {/* Proposal Header */}
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">{proposal.codigo || 'Proposta'}</h3>
              <Badge className={`text-[10px] ${sc}`}>{proposal.status}</Badge>
              {proposal.version > 1 && <Badge variant="outline" className="text-[10px]">v{proposal.version}</Badge>}
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/50 mt-1">
              {proposal.clienteNome || lead?.fullName}
            </p>
          </div>
          {proposal.tokenPublico && (
            <Link to={`/PropostaPublica?token=${proposal.tokenPublico}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="w-3 h-3" /> Ver Proposta
              </Button>
            </Link>
          )}
        </div>

        {/* Key Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-[var(--pagsmile-blue)]/70 mb-2">Taxas de Cartão (Visa)</h4>
            <RateRow label="Crédito à Vista" value={visa.avista} />
            <RateRow label="2-6x" value={visa.de2a6x} />
            <RateRow label="7-12x" value={visa.de7a12x} />
            <RateRow label="13-21x" value={visa.de13a21x} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--pagsmile-blue)]/70 mb-2">Outras Taxas</h4>
            <RateRow label="PIX" value={rates.pix?.tipo === 'percentual' ? `${rates.pix.valor}%` : rates.pix?.valor ? `R$ ${rates.pix.valor}` : null} />
            <RateRow label="Antifraude" value={rates.antifraude ? `R$ ${rates.antifraude}` : null} />
            <RateRow label="Fee/Transação" value={rates.feeTransacao ? `R$ ${rates.feeTransacao}` : null} />
            <RateRow label="Antecipação" value={rates.percentualAntecipacao} />
            {rates.boleto && <RateRow label="Boleto" value={`R$ ${rates.boleto}`} />}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {proposal.sentDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Enviada em</p>
              <p className="font-semibold">{new Date(proposal.sentDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {proposal.validUntil && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Válida até</p>
              <p className="font-semibold">{new Date(proposal.validUntil).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {proposal.acceptedDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Aceita em</p>
              <p className="font-semibold text-green-700">{new Date(proposal.acceptedDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {proposal.rejectedDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Recusada em</p>
              <p className="font-semibold text-red-700">{new Date(proposal.rejectedDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}