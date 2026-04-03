import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, FileText, Check } from 'lucide-react';

export default function ClientSelector({ onSelect }) {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['accepted-proposals-for-kickoff'],
    queryFn: async () => {
      const proposals = await base44.entities.Proposal.filter({ status: 'aceita' }, '-updated_date', 100);
      const enriched = [];
      for (const prop of proposals) {
        let contract = null;
        if (prop.id) {
          const contracts = await base44.entities.Contract.filter({ proposalId: prop.id });
          contract = contracts?.[0] || null;
        }
        if (!contract && prop.clienteCnpj) {
          const contracts = await base44.entities.Contract.filter({ clientCnpj: prop.clienteCnpj?.replace(/\D/g, '') });
          contract = contracts?.[0] || null;
        }
        enriched.push({ proposal: prop, contract });
      }
      return enriched;
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Selecione o Cliente</h1>
        <p className="text-sm text-[#002443]/50">Clientes com proposta aceita — clique para gerar a apresentação</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
          <p className="text-sm text-[#002443]/40">Carregando propostas aceitas...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-[#002443]/40 text-sm">
          Nenhuma proposta aceita encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#002443]/50 font-medium">{clients.length} proposta(s) aceita(s)</p>
          {clients.map(({ proposal, contract }, i) => (
            <button
              key={proposal.id || i}
              onClick={() => onSelect({ proposal, contract })}
              className="w-full text-left p-4 bg-white rounded-xl border border-[#002443]/8 hover:border-[#2bc196] hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#002443]/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002443]">{proposal.clienteNome || 'Sem nome'}</p>
                    <p className="text-[10px] text-[#002443]/50">
                      {proposal.clienteCnpj || '—'} • {proposal.codigo || '—'} • {proposal.businessSubCategory || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contract ? (
                    <Badge className="bg-green-50 text-green-600 text-[10px]">Com contrato</Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-600 text-[10px]">Sem contrato</Badge>
                  )}
                  <Check className="w-4 h-4 text-[#2bc196] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}