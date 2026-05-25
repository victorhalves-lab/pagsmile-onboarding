import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Copy, ExternalLink, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import DownloadProposalButton from '@/components/global/proposal-pdf/DownloadProposalButton';

/**
 * Listagem de GlobalProposal com filtros, ações de cópia de link público, abrir página pública e exclusão.
 */
export default function GlobalProposalCenter() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['globalProposals'],
    queryFn: () => base44.entities.GlobalProposal.list('-created_date', 500),
    initialData: [],
  });

  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.GlobalProposal.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['globalProposals'] });
      toast.success('Proposta excluída');
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!s) return true;
      return [p.client_name, p.contact_email, p.contact_name].some(v => (v || '').toLowerCase().includes(s));
    });
  }, [items, search, statusFilter]);

  const copyLink = (p) => {
    if (!p.public_link_token) return toast.error('Sem link público.');
    const url = `${window.location.origin}/GlobalPublicProposal?token=${p.public_link_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const openPublic = (p) => {
    if (!p.public_link_token) return toast.error('Sem link público.');
    window.open(`/GlobalPublicProposal?token=${p.public_link_token}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-[#002443]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Buscar por cliente ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#002443]/40" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="accepted">Aceitas</SelectItem>
              <SelectItem value="counter_proposal">Contraproposta</SelectItem>
              <SelectItem value="rejected">Recusadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f4f4] text-[#002443]/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Idioma</th>
              <th className="text-right px-4 py-3">Taxa Final</th>
              <th className="text-right px-4 py-3">Fixo</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Versão</th>
              <th className="text-right px-4 py-3">Data</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#002443]/5">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-[#f4f4f4]/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#002443]">{p.client_name}</div>
                  <div className="text-xs text-[#002443]/50">{p.contact_email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs uppercase font-mono text-[#002443]/70">{p.language || 'en'}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{Number(p.final_rate_percentage || 0).toFixed(3)}%</td>
                <td className="px-4 py-3 text-right font-mono">${Number(p.final_fixed_fee || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-right text-xs text-[#002443]/60">V{p.version || 1}</td>
                <td className="px-4 py-3 text-right text-xs text-[#002443]/60">
                  {p.created_date ? format(new Date(p.created_date), 'dd/MM/yy') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1 items-center">
                    <DownloadProposalButton proposal={p} variant="ghost" size="sm" />
                    <Button size="icon" variant="ghost" onClick={() => copyLink(p)} title="Copiar link público">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openPublic(p)} title="Abrir página pública">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => {
                      if (confirm(`Excluir proposta de "${p.client_name}"?`)) deleteM.mutate(p.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[#002443]/50">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#002443]/30" />
                Nenhuma proposta encontrada.
              </td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[#002443]/50">Carregando...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent:             { label: 'Enviada',        bg: 'bg-blue-100 text-blue-700' },
    accepted:         { label: 'Aceita',         bg: 'bg-green-100 text-green-700' },
    counter_proposal: { label: 'Contraproposta', bg: 'bg-amber-100 text-amber-700' },
    rejected:         { label: 'Recusada',       bg: 'bg-red-100 text-red-700' },
  };
  const it = map[status] || { label: status || '—', bg: 'bg-slate-100 text-slate-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.bg}`}>{it.label}</span>;
}