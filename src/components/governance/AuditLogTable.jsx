import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

const actionColors = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VIEW: 'bg-slate-100 text-slate-700',
  APPROVAL: 'bg-emerald-100 text-emerald-700',
  REJECTION: 'bg-red-100 text-red-700',
  VALIDATION: 'bg-violet-100 text-violet-700',
};

export default function AuditLogTable({ logs }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const entities = useMemo(() => [...new Set(logs.map(l => l.entityName).filter(Boolean))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (actionFilter !== 'all' && l.actionType !== actionFilter) return false;
      if (entityFilter !== 'all' && l.entityName !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.changedBy || ''} ${l.entityName || ''} ${l.entityId || ''} ${l.actionDescription || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, actionFilter, entityFilter]);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#0A0A0A]/40" />
          <Input placeholder="Buscar por usuário, entidade, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="CREATE">Criação</SelectItem>
            <SelectItem value="UPDATE">Atualização</SelectItem>
            <SelectItem value="DELETE">Exclusão</SelectItem>
            <SelectItem value="APPROVAL">Aprovação</SelectItem>
            <SelectItem value="REJECTION">Rejeição</SelectItem>
            <SelectItem value="VALIDATION">Validação</SelectItem>
            <SelectItem value="VIEW">Visualização</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-[#0A0A0A]/60">
            <tr>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Usuário</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Entidade</th>
              <th className="text-left px-3 py-2">Descrição</th>
              <th className="text-left px-3 py-2">IP</th>
              <th className="text-right px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-[#0A0A0A]/50">Nenhum registro encontrado</td></tr>
            )}
            {filtered.slice(0, 200).map(l => (
              <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2 text-xs whitespace-nowrap">{l.changeDate ? format(new Date(l.changeDate), 'dd/MM/yy HH:mm') : '—'}</td>
                <td className="px-3 py-2 text-xs">{l.changedBy || '—'}</td>
                <td className="px-3 py-2"><Badge className={actionColors[l.actionType] || 'bg-slate-100'}>{l.actionType}</Badge></td>
                <td className="px-3 py-2 text-xs font-medium">{l.entityName}</td>
                <td className="px-3 py-2 text-xs max-w-md truncate">{l.actionDescription || '—'}</td>
                <td className="px-3 py-2 text-xs font-mono text-[#0A0A0A]/50">{l.ipAddress?.slice(0, 12) || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setSelected(l)} className="text-[#1356E2] hover:underline"><Eye className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && <p className="text-xs text-[#0A0A0A]/50 mt-2">Exibindo 200 de {filtered.length} registros. Refine os filtros para ver mais.</p>}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da Auditoria</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-[#0A0A0A]/50">Data</div><div>{selected.changeDate ? format(new Date(selected.changeDate), 'dd/MM/yyyy HH:mm:ss') : '—'}</div></div>
                <div><div className="text-xs text-[#0A0A0A]/50">Usuário</div><div>{selected.changedBy}</div></div>
                <div><div className="text-xs text-[#0A0A0A]/50">Ação</div><Badge className={actionColors[selected.actionType] || 'bg-slate-100'}>{selected.actionType}</Badge></div>
                <div><div className="text-xs text-[#0A0A0A]/50">Entidade</div><div>{selected.entityName}</div></div>
                <div className="col-span-2"><div className="text-xs text-[#0A0A0A]/50">ID do Registro</div><div className="font-mono text-xs">{selected.entityId}</div></div>
                <div className="col-span-2"><div className="text-xs text-[#0A0A0A]/50">Descrição</div><div>{selected.actionDescription || '—'}</div></div>
                <div><div className="text-xs text-[#0A0A0A]/50">IP</div><div className="font-mono text-xs">{selected.ipAddress || '—'}</div></div>
                <div><div className="text-xs text-[#0A0A0A]/50">User Agent</div><div className="text-xs truncate">{selected.userAgent || '—'}</div></div>
              </div>
              {selected.details && (
                <div>
                  <div className="text-xs text-[#0A0A0A]/50 mb-1">Detalhes (antes/depois)</div>
                  <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto max-h-64">{JSON.stringify(selected.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}