import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Search, Filter, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import GlobalComplianceDetailModal from '../modals/GlobalComplianceDetailModal';

/**
 * Lista de KYC Global recebidos com filtros, modal de detalhe e ações de aprovação/rejeição.
 */
export default function GlobalComplianceReceived() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['globalCompliance'],
    queryFn: () => base44.entities.GlobalComplianceQuestionnaire.list('-created_date', 500),
    initialData: [],
  });

  const updateStatusM = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GlobalComplianceQuestionnaire.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['globalCompliance'] });
      toast.success('Status atualizado');
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!s) return true;
      return [c.legal_business_name, c.trade_name_dba, c.registered_country, c.certifier_email]
        .some(v => (v || '').toLowerCase().includes(s));
    });
  }, [items, search, statusFilter]);

  const totals = useMemo(() => ({
    total: items.length,
    pending: items.filter(c => c.status === 'pending' || c.status === 'submitted').length,
    review: items.filter(c => c.status === 'in_review').length,
    approved: items.filter(c => c.status === 'approved').length,
    rejected: items.filter(c => c.status === 'rejected').length,
  }), [items]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPI label="Total" value={totals.total} icon={ShieldCheck} accent="bg-slate-100 text-slate-700" />
        <KPI label="Pendentes" value={totals.pending} icon={Clock} accent="bg-amber-100 text-amber-700" />
        <KPI label="Em Revisão" value={totals.review} icon={Eye} accent="bg-blue-100 text-blue-700" />
        <KPI label="Aprovados" value={totals.approved} icon={CheckCircle2} accent="bg-green-100 text-green-700" />
        <KPI label="Rejeitados" value={totals.rejected} icon={XCircle} accent="bg-red-100 text-red-700" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-[#0A0A0A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Buscar por empresa, país, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0A0A0A]/40" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="submitted">Submetido</SelectItem>
              <SelectItem value="in_review">Em revisão</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f4f4] text-[#0A0A0A]/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Empresa</th>
              <th className="text-left px-4 py-3">País</th>
              <th className="text-left px-4 py-3">Aplicando para</th>
              <th className="text-left px-4 py-3">Idioma</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Data</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/5">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-[#f4f4f4]/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0A0A0A]">{c.legal_business_name}</div>
                  {c.trade_name_dba && <div className="text-xs text-[#0A0A0A]/50">{c.trade_name_dba}</div>}
                </td>
                <td className="px-4 py-3 text-[#0A0A0A]/70">{c.registered_country || '—'}</td>
                <td className="px-4 py-3 text-xs text-[#0A0A0A]/70">{c.applying_for || '—'}</td>
                <td className="px-4 py-3 text-xs uppercase font-mono text-[#0A0A0A]/60">{c.language || 'en'}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-right text-xs text-[#0A0A0A]/60">
                  {c.created_date ? format(new Date(c.created_date), 'dd/MM/yy') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailId(c.id)} title="Ver detalhes">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {c.status !== 'approved' && (
                      <Button size="icon" variant="ghost" title="Aprovar"
                        onClick={() => updateStatusM.mutate({ id: c.id, status: 'approved' })}>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    {c.status !== 'rejected' && (
                      <Button size="icon" variant="ghost" title="Rejeitar"
                        onClick={() => updateStatusM.mutate({ id: c.id, status: 'rejected' })}>
                        <XCircle className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#0A0A0A]/50">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#0A0A0A]/30" />
                Nenhum KYC recebido ainda.
              </td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#0A0A0A]/50">Carregando...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detailId && (
        <GlobalComplianceDetailModal
          complianceId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:    { label: 'Pendente',    bg: 'bg-amber-100 text-amber-700' },
    submitted:  { label: 'Submetido',   bg: 'bg-blue-100 text-blue-700' },
    in_review:  { label: 'Em revisão',  bg: 'bg-violet-100 text-violet-700' },
    approved:   { label: 'Aprovado',    bg: 'bg-green-100 text-green-700' },
    rejected:   { label: 'Rejeitado',   bg: 'bg-red-100 text-red-700' },
  };
  const it = map[status] || { label: status || '—', bg: 'bg-slate-100 text-slate-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.bg}`}>{it.label}</span>;
}

function KPI({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50">{label}</span>
        <div className={`p-1.5 rounded-lg ${accent}`}><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <div className="text-xl font-bold text-[#0A0A0A]">{value}</div>
    </div>
  );
}