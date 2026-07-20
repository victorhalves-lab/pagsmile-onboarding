import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Building2, User, Loader2 } from 'lucide-react';

const SUBFAIXA_COLORS = {
  '1A': 'bg-green-100 text-green-700',
  '1B': 'bg-green-50 text-green-600',
  '2A': 'bg-blue-100 text-blue-700',
  '2B': 'bg-blue-50 text-blue-600',
  '3A': 'bg-amber-100 text-amber-700',
  '3B': 'bg-orange-100 text-orange-700',
  '4': 'bg-red-100 text-red-700',
  '5': 'bg-red-200 text-red-800',
};

const STATUS_COLORS = {
  'Aprovado': 'bg-green-100 text-green-700',
  'Manual': 'bg-amber-100 text-amber-700',
  'Em Processamento': 'bg-blue-100 text-blue-700',
  'Pendente': 'bg-slate-100 text-slate-600',
  'Recusado': 'bg-red-100 text-red-700',
  'Docs Solicitados': 'bg-purple-100 text-purple-700',
};

export default function RevalidationClientsTable({
  clients,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  lastRevalidationMap,
}) {
  const allSelected = clients.length > 0 && selectedIds.size === clients.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < clients.length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2] mx-auto mb-3" />
        <p className="text-sm text-[#0A0A0A]/50">Carregando clientes...</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 p-12 text-center">
        <Building2 className="w-10 h-10 text-[#0A0A0A]/15 mx-auto mb-3" />
        <p className="text-sm text-[#0A0A0A]/50">Nenhum cliente encontrado com os filtros aplicados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f4f4f4]">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.dataset.indeterminate = someSelected;
                }}
                onCheckedChange={() => onToggleAll()}
              />
            </TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score V4</TableHead>
            <TableHead>Subfaixa</TableHead>
            <TableHead>Última Revalidação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => {
            const isSelected = selectedIds.has(c.caseId);
            const lastReval = lastRevalidationMap[c.caseId];
            return (
              <TableRow
                key={c.caseId}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#1356E2]/5' : 'hover:bg-[#f4f4f4]/60'}`}
                onClick={() => onToggleSelect(c.caseId)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(c.caseId)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${c.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      {c.type === 'PF'
                        ? <User className="w-3.5 h-3.5 text-blue-600" />
                        : <Building2 className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A] truncate max-w-[200px]">{c.fullName}</p>
                      {c.companyName && c.companyName !== c.fullName && (
                        <p className="text-[10px] text-[#0A0A0A]/40 truncate max-w-[200px]">{c.companyName}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-[#0A0A0A]/70">{c.cpfCnpj}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'} text-[10px] border-0`}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono font-bold text-[#0A0A0A]">
                    {c.riskScoreV4 != null ? c.riskScoreV4 : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  {c.subfaixa ? (
                    <Badge className={`${SUBFAIXA_COLORS[c.subfaixa] || 'bg-slate-100 text-slate-700'} text-[10px] border-0`}>
                      {c.subfaixaNome || c.subfaixa}
                    </Badge>
                  ) : (
                    <span className="text-xs text-[#0A0A0A]/30">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {lastReval ? (
                    <div>
                      <p className="text-xs text-[#0A0A0A]/70">{new Date(lastReval.created_date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] text-[#0A0A0A]/40">{new Date(lastReval.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#0A0A0A]/30">Nunca</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}