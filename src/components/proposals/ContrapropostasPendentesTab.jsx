import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquareWarning, TrendingDown, TrendingUp, Clock, Building2 } from 'lucide-react';
import moment from 'moment';

/**
 * Renderiza uma linha de comparação taxa atual vs. taxa solicitada.
 */
function RateCompareRow({ label, current, requested }) {
  const cur = parseFloat(current);
  const req = parseFloat(requested);
  if (isNaN(req)) return null;
  const diff = !isNaN(cur) ? req - cur : null;
  const isDown = diff !== null && diff < 0;
  const isUp = diff !== null && diff > 0;

  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-b-0">
      <span className="text-[#002443]/60 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {!isNaN(cur) && <span className="text-slate-400 line-through">{cur.toFixed(2)}%</span>}
        <span className={`font-bold ${isDown ? 'text-red-600' : isUp ? 'text-green-600' : 'text-[#002443]'}`}>
          {req.toFixed(2)}%
        </span>
        {diff !== null && diff !== 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] ${isDown ? 'text-red-500' : 'text-green-500'}`}>
            {isDown ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(diff).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Card de uma contraproposta recebida.
 */
function ContrapropostaCard({ proposta }) {
  const navigate = useNavigate();
  const details = proposta.counterProposalDetails || {};
  const taxas = details.taxas_solicitadas || {};
  const justificativa = details.justificativa || '';

  // Taxas atuais (da proposta original, para comparar)
  const current = {
    credito_1x: proposta.rates?.cartao?.visa?.avista,
    credito_2_6x: proposta.rates?.cartao?.visa?.de2a6x,
    credito_7_12x: proposta.rates?.cartao?.visa?.de7a12x,
    rav: proposta.rates?.rav?.taxa,
  };

  const diasDesde = moment().diff(moment(proposta.updated_date || proposta.created_date), 'days');
  const isUrgent = diasDesde >= 3;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-[#002443]">{proposta.clienteNome || '—'}</span>
          <Badge className="text-[10px] bg-white/80 text-blue-700 border-0">{proposta.codigo}</Badge>
          {proposta.version > 1 && (
            <Badge className="text-[9px] bg-[#2bc196]/10 text-[#2bc196] border-0">v{proposta.version}</Badge>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-[#002443]/60'}`}>
          <Clock className="w-3 h-3" />
          {diasDesde === 0 ? 'hoje' : `há ${diasDesde}d`}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 grid md:grid-cols-2 gap-5">
        {/* Taxas solicitadas */}
        <div>
          <h4 className="text-xs font-bold text-[#002443]/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            Taxas Solicitadas pelo Cliente
          </h4>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <RateCompareRow label="Crédito 1x" current={current.credito_1x} requested={taxas.credito_1x} />
            <RateCompareRow label="Crédito 2-6x" current={current.credito_2_6x} requested={taxas.credito_2_6x} />
            <RateCompareRow label="Crédito 7-12x" current={current.credito_7_12x} requested={taxas.credito_7_12x} />
            <RateCompareRow label="RAV" current={current.rav} requested={taxas.rav} />
          </div>
        </div>

        {/* Justificativa */}
        <div>
          <h4 className="text-xs font-bold text-[#002443]/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500" />
            Justificativa
          </h4>
          <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xs text-[#002443]/80 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {justificativa || <span className="italic text-slate-400">Sem justificativa informada</span>}
          </div>
        </div>
      </div>

      {/* Footer — quem é responsável + ação */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#002443]/60">
          <span>CNPJ: <span className="font-mono">{proposta.clienteCnpj || '—'}</span></span>
          {proposta.responsavelNome && proposta.responsavelNome !== 'sistema' && (
            <>
              <span>•</span>
              <span>Responsável: <span className="font-medium text-[#002443]">{proposta.responsavelNome}</span></span>
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => navigate(createPageUrl('PropostaDetalhes') + `?id=${proposta.id}`)}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2"
        >
          <Eye className="w-4 h-4" /> Analisar e Responder
        </Button>
      </div>
    </div>
  );
}

export default function ContrapropostasPendentesTab({ propostas }) {
  const contrapropostas = React.useMemo(
    () => propostas
      .filter(p => p.status === 'contraproposta' && p._entityType !== 'PixProposal')
      .sort((a, b) => new Date(a.updated_date || a.created_date) - new Date(b.updated_date || b.created_date)), // mais antigas primeiro (urgência)
    [propostas]
  );

  if (contrapropostas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
        <MessageSquareWarning className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-[#002443]/60 font-medium">Nenhuma contraproposta pendente</p>
        <p className="text-xs text-[#002443]/40 mt-1">Quando um cliente solicitar revisão de taxas, aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <MessageSquareWarning className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#002443]">
            {contrapropostas.length} contraproposta{contrapropostas.length > 1 ? 's' : ''} aguardando resposta
          </p>
          <p className="text-xs text-[#002443]/60">
            Analise as taxas solicitadas e crie uma nova versão com ajustes ou entre em contato com o cliente.
          </p>
        </div>
      </div>

      {contrapropostas.map(p => (
        <ContrapropostaCard key={p.id} proposta={p} />
      ))}
    </div>
  );
}