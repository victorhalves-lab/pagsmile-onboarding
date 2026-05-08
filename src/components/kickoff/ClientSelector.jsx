import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, FileText, Check, Search } from 'lucide-react';

const STATUS_LABELS = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-50 text-slate-600' },
  enviada: { label: 'Enviada', color: 'bg-blue-50 text-blue-600' },
  visualizada: { label: 'Visualizada', color: 'bg-violet-50 text-violet-600' },
  aceita: { label: 'Aceita', color: 'bg-green-50 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-50 text-red-600' },
  contraproposta: { label: 'Contraproposta', color: 'bg-amber-50 text-amber-600' },
  expirada: { label: 'Expirada', color: 'bg-slate-50 text-slate-500' },
  cancelada: { label: 'Cancelada', color: 'bg-slate-50 text-slate-500' },
};

export default function ClientSelector({ onSelect }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('aceita');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['proposals-for-kickoff', statusFilter],
    queryFn: async () => {
      const filter = statusFilter === 'all' ? {} : { status: statusFilter };
      const proposals = await base44.entities.Proposal.filter(filter, '-updated_date', 200);
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

  const filtered = clients.filter(({ proposal }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (proposal.clienteNome || '').toLowerCase().includes(q) ||
      (proposal.clienteCnpj || '').includes(search) ||
      (proposal.codigo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Selecione o Cliente</h1>
        <p className="text-sm text-[#002443]/50">Clique em qualquer proposta para gerar a apresentação de Kick-Off</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input
            placeholder="Buscar por nome, CNPJ ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="aceita">Aceitas</SelectItem>
            <SelectItem value="enviada">Enviadas</SelectItem>
            <SelectItem value="visualizada">Visualizadas</SelectItem>
            <SelectItem value="contraproposta">Contraproposta</SelectItem>
            <SelectItem value="rascunho">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
          <p className="text-sm text-[#002443]/40">Carregando propostas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#002443]/40 text-sm">
          {search ? 'Nenhuma proposta corresponde à busca.' : 'Nenhuma proposta encontrada para este status.'}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#002443]/50 font-medium">{filtered.length} proposta(s)</p>
          {filtered.map(({ proposal, contract }, i) => {
            const statusCfg = STATUS_LABELS[proposal.status] || STATUS_LABELS.rascunho;
            return (
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
                    <Badge className={`${statusCfg.color} text-[10px]`}>{statusCfg.label}</Badge>
                    {contract ? (
                      <Badge className="bg-green-50 text-green-600 text-[10px]">Com contrato</Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-600 text-[10px]">Sem contrato</Badge>
                    )}
                    <Check className="w-4 h-4 text-[#2bc196] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}