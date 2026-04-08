import React from 'react';
import { Stamp, ExternalLink } from 'lucide-react';
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

export default function CadastroContratoTab({ contract }) {
  if (!contract) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Stamp className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum contrato encontrado para este cliente</p>
      </div>
    );
  }

  const sc = STATUS_COLORS[contract.status] || STATUS_COLORS['pre_generated'];
  const label = STATUS_LABELS[contract.status] || contract.status;

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">{contract.codigo || 'Contrato'}</h3>
              <Badge className={`text-[10px] ${sc}`}>{label}</Badge>
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/50 mt-1">{contract.clientName}</p>
          </div>
          {contract.publicLinkCode && (
            <Link to={`/ContratoPublico?code=${contract.publicLinkCode}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="w-3 h-3" /> Ver Contrato
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {contract.contractDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Data do Contrato</p>
              <p className="font-semibold">{new Date(contract.contractDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {contract.contractDurationMonths && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Duração</p>
              <p className="font-semibold">{contract.contractDurationMonths} meses</p>
            </div>
          )}
          {contract.sentDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Enviado em</p>
              <p className="font-semibold">{new Date(contract.sentDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          {contract.signedDate && (
            <div>
              <p className="text-[var(--pagsmile-blue)]/50">Assinado em</p>
              <p className="font-semibold text-green-700">{new Date(contract.signedDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>

        {/* Modules */}
        {contract.modules && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-[var(--pagsmile-blue)]/70 mb-2">Módulos Contratados</p>
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
      </div>
    </div>
  );
}