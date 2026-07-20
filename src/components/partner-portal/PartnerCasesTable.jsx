import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import PartnerSlaIndicator from './PartnerSlaIndicator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABEL = {
  pending: { label: 'Pendente', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  viewed: { label: 'Visualizado', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  in_review: { label: 'Em análise', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Concluído', className: 'bg-green-100 text-green-700 border-green-200' },
  expired: { label: 'Vencido', className: 'bg-red-100 text-red-700 border-red-200' },
  revoked: { label: 'Revogado', className: 'bg-slate-100 text-slate-600 border-slate-200' }
};

export default function PartnerCasesTable({ assignments }) {
  const navigate = useNavigate();

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500">Nenhum caso atribuído no momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Score V4</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Atribuído em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map(a => {
            const statusInfo = STATUS_LABEL[a.status] || STATUS_LABEL.pending;
            return (
              <TableRow key={a.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="font-medium text-[#0A0A0A]">{a.merchantName || '—'}</div>
                  <div className="text-xs text-slate-500">{a.merchantCpfCnpj || '—'}</div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{a.caseModel || '—'}</span>
                </TableCell>
                <TableCell>
                  {a.caseRiskScoreV4 != null ? (
                    <div>
                      <div className="font-semibold">{a.caseRiskScoreV4}</div>
                      <div className="text-xs text-slate-500">{a.caseSubfaixa || ''}</div>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell>
                  <PartnerSlaIndicator dueDate={a.dueDate} status={a.status} />
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {a.assignedAt ? format(new Date(a.assignedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/ComplianceParceiroDetalhe?id=${a.id}`)}>
                    <Eye className="w-3 h-3 mr-1" />
                    Analisar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}