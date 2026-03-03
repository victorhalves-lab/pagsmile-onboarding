import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import moment from 'moment';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  visualizada: { label: 'Visualizada', color: 'bg-purple-100 text-purple-700' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
  contraproposta: { label: 'Contraproposta', color: 'bg-amber-100 text-amber-700' },
  expirada: { label: 'Expirada', color: 'bg-gray-100 text-gray-500' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500' },
};

export default function ProposalStatusSummary({ proposals }) {
  const metrics = useMemo(() => {
    const byStatus = {};
    Object.keys(STATUS_CONFIG).forEach(s => { byStatus[s] = 0; });
    proposals.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });

    const expiringSoon = proposals.filter(p => {
      if (!p.validUntil || ['aceita', 'recusada', 'expirada', 'cancelada'].includes(p.status)) return false;
      const daysLeft = moment(p.validUntil).diff(moment(), 'days');
      return daysLeft >= 0 && daysLeft <= 3;
    }).length;

    const acceptanceRate = proposals.length > 0
      ? ((byStatus.aceita / proposals.length) * 100).toFixed(0)
      : 0;

    return { byStatus, expiringSoon, acceptanceRate, total: proposals.length };
  }, [proposals]);

  const mainStatuses = ['rascunho', 'enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Propostas
          </CardTitle>
          <Link to={createPageUrl('GestaoPropostas')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[var(--pagsmile-green)]">
              Ver Todas <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{metrics.total}</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{metrics.acceptanceRate}%</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Aceitas</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${metrics.expiringSoon > 0 ? 'text-amber-600' : 'text-[var(--pagsmile-blue)]'}`}>
              {metrics.expiringSoon}
            </p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Vencendo</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="space-y-1.5">
          {mainStatuses.map(status => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </Badge>
              </div>
              <span className="text-sm font-bold text-[var(--pagsmile-blue)]">{metrics.byStatus[status]}</span>
            </div>
          ))}
        </div>

        {/* Expiring alert */}
        {metrics.expiringSoon > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700">
              {metrics.expiringSoon} proposta{metrics.expiringSoon > 1 ? 's' : ''} vencendo nos próximos 3 dias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}