import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AuditoriaAcessos() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.AccessAudit.list('-created_date', 200);
      setLogs(list);
    } catch { toast.error('Erro ao carregar auditoria'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (l.user_email || '').toLowerCase().includes(q)
      || (l.user_name || '').toLowerCase().includes(q)
      || (l.target_page || '').toLowerCase().includes(q)
      || (l.target_action || '').toLowerCase().includes(q);
  });

  const exportCsv = () => {
    const rows = [['Data', 'Usuário', 'Email', 'Perfil', 'Ação', 'Página', 'Aba', 'Sub-aba', 'Ação alvo', 'Permitido']];
    for (const l of filtered) {
      rows.push([
        l.created_date || '', l.user_name || '', l.user_email || '', l.profile_slug || '',
        l.action || '', l.target_page || '', l.target_tab || '', l.target_subtab || '',
        l.target_action || '', l.allowed ? 'sim' : 'não'
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `auditoria_acessos_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const ACTION_COLORS = {
    page_view: 'bg-slate-100 text-slate-700',
    action_executed: 'bg-blue-100 text-blue-700',
    access_denied: 'bg-red-100 text-red-700',
    profile_changed: 'bg-purple-100 text-purple-700',
    profile_created: 'bg-green-100 text-green-700',
    profile_deleted: 'bg-red-100 text-red-700',
    user_assigned: 'bg-amber-100 text-amber-700',
    login: 'bg-green-100 text-green-700',
    logout: 'bg-slate-100 text-slate-500'
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#1356E2]" /> Auditoria de Acessos
          </h1>
          <p className="text-sm text-[#0A0A0A]/60 mt-1">Log completo de ações e acessos na plataforma.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário, página, ação..." className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="page_view">Page View</SelectItem>
            <SelectItem value="action_executed">Action Executed</SelectItem>
            <SelectItem value="access_denied">Access Denied</SelectItem>
            <SelectItem value="profile_changed">Profile Changed</SelectItem>
            <SelectItem value="profile_created">Profile Created</SelectItem>
            <SelectItem value="profile_deleted">Profile Deleted</SelectItem>
            <SelectItem value="user_assigned">User Assigned</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Alvo</th>
              <th className="px-4 py-3">Permitido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhum log encontrado.</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} className="hover:bg-slate-50 text-sm">
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                  {l.created_date ? format(new Date(l.created_date), 'dd/MM/yy HH:mm:ss') : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-[#0A0A0A]">{l.user_name || '—'}</div>
                  <div className="text-[11px] text-slate-400">{l.user_email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={`text-[10px] ${ACTION_COLORS[l.action] || 'bg-slate-100 text-slate-700'}`}>
                    {l.action}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  {l.target_page && <span className="font-medium">{l.target_page}</span>}
                  {l.target_tab && <span className="text-slate-400"> › {l.target_tab}</span>}
                  {l.target_subtab && <span className="text-slate-400"> › {l.target_subtab}</span>}
                  {l.target_action && <span className="text-[#1356E2] ml-1">[{l.target_action}]</span>}
                  {l.details?.target_email && <div className="text-[11px] text-slate-400 mt-0.5">→ {l.details.target_email}</div>}
                </td>
                <td className="px-4 py-2.5">
                  {l.allowed ? (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">✓ Sim</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 text-[10px]">✗ Não</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}