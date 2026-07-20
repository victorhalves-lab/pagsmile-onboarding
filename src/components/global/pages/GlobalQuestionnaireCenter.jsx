import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Eye, FileText, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import GlobalQuestionnaireDetailModal from '../modals/GlobalQuestionnaireDetailModal';

/**
 * Lista filtrável dos GlobalQuestionnaire com ações: ver detalhes, gerar proposta, exportar, excluir.
 */
export default function GlobalQuestionnaireCenter() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['globalQuestionnaires'],
    queryFn: () => base44.entities.GlobalQuestionnaire.list('-created_date', 500),
    initialData: [],
  });

  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.GlobalQuestionnaire.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['globalQuestionnaires'] });
      toast.success('Questionário excluído');
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(q => {
      if (statusFilter !== 'all' && q.pipeline_status !== statusFilter) return false;
      if (!s) return true;
      return [q.company_name, q.contact_name, q.contact_email, q.mcc].some(v => (v || '').toLowerCase().includes(s));
    });
  }, [items, search, statusFilter]);

  const exportCsv = () => {
    const rows = [
      ['Empresa', 'Contato', 'Email', 'TPV Mensal USD', 'Ticket Médio', 'Mercado-alvo', 'Status', 'Data'],
      ...filtered.map(q => [
        q.company_name, q.contact_name, q.contact_email,
        q.monthly_tpv, q.average_ticket,
        (q.target_markets || []).join('|'),
        q.pipeline_status,
        q.created_date ? format(new Date(q.created_date), 'yyyy-MM-dd') : '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `global_questionnaires_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const formatUsd = v => `$${(Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* Header + ações */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-[#0A0A0A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por empresa, contato, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0A0A0A]/40" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="leads">Lead</SelectItem>
              <SelectItem value="proposal_made">Proposta enviada</SelectItem>
              <SelectItem value="proposal_accepted">Aceita</SelectItem>
              <SelectItem value="counter_proposal">Contraproposta</SelectItem>
              <SelectItem value="proposal_lost">Perdida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="w-4 h-4 mr-2" /> CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f4f4] text-[#0A0A0A]/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Empresa</th>
              <th className="text-left px-4 py-3">Contato</th>
              <th className="text-right px-4 py-3">TPV / mês</th>
              <th className="text-right px-4 py-3">Ticket</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Data</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/5">
            {filtered.map(q => (
              <tr key={q.id} className="hover:bg-[#f4f4f4]/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0A0A0A]">{q.company_name}</div>
                  <div className="text-xs text-[#0A0A0A]/50">{q.mcc || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#0A0A0A]">{q.contact_name}</div>
                  <div className="text-xs text-[#0A0A0A]/50">{q.contact_email}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatUsd(q.monthly_tpv)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatUsd(q.average_ticket)}</td>
                <td className="px-4 py-3 text-center">
                  <PipelineBadge status={q.pipeline_status} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-[#0A0A0A]/60">
                  {q.created_date ? format(new Date(q.created_date), 'dd/MM/yy') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailId(q.id)} title="Ver detalhes">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Gerar proposta" onClick={() => {
                      window.location.href = `/HubPropostas?createGlobalFor=${q.id}`;
                    }}>
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => {
                      if (confirm(`Excluir questionário de "${q.company_name}"?`)) deleteM.mutate(q.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#0A0A0A]/50">Nenhum questionário encontrado.</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#0A0A0A]/50">Carregando...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detailId && (
        <GlobalQuestionnaireDetailModal
          questionnaireId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

function PipelineBadge({ status }) {
  const map = {
    leads:             { label: 'Lead',           bg: 'bg-slate-100 text-slate-700' },
    proposal_made:     { label: 'Proposta',       bg: 'bg-blue-100 text-blue-700' },
    proposal_accepted: { label: 'Aceita',         bg: 'bg-green-100 text-green-700' },
    counter_proposal:  { label: 'Contraproposta', bg: 'bg-amber-100 text-amber-700' },
    proposal_lost:     { label: 'Perdida',        bg: 'bg-red-100 text-red-700' },
  };
  const it = map[status] || { label: status || '—', bg: 'bg-slate-100 text-slate-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.bg}`}>{it.label}</span>;
}