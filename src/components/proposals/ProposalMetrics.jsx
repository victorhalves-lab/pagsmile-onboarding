import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import moment from 'moment';

export default function ProposalMetrics({ propostas }) {
  const metrics = useMemo(() => {
    const total = propostas.length;
    const byStatus = {};
    propostas.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });

    const aceitas = byStatus['aceita'] || 0;
    const recusadas = byStatus['recusada'] || 0;
    const enviadas = byStatus['enviada'] || 0;
    const visualizadas = byStatus['visualizada'] || 0;
    const rascunhos = byStatus['rascunho'] || 0;
    const expiradas = byStatus['expirada'] || 0;

    const sentTotal = aceitas + recusadas + enviadas + visualizadas + expiradas;
    const taxaAceite = sentTotal > 0 ? ((aceitas / sentTotal) * 100) : 0;

    // Tempo médio para aceite
    const aceitasComDatas = propostas.filter(p => p.status === 'aceita' && p.sentDate && p.acceptedDate);
    const tempoMedioAceite = aceitasComDatas.length > 0
      ? Math.round(aceitasComDatas.reduce((s, p) => s + moment(p.acceptedDate).diff(moment(p.sentDate), 'days'), 0) / aceitasComDatas.length)
      : null;

    // Revenue estimada
    const revenuePotencial = propostas
      .filter(p => !['recusada', 'expirada', 'cancelada'].includes(p.status))
      .reduce((s, p) => s + (p.estimatedRevenue || 0), 0);
    const revenueGanha = propostas
      .filter(p => p.status === 'aceita')
      .reduce((s, p) => s + (p.estimatedRevenue || 0), 0);

    // Propostas expirando (próximos 3 dias)
    const expirando = propostas.filter(p => {
      if (!p.validUntil || !['enviada', 'visualizada'].includes(p.status)) return false;
      const diff = moment(p.validUntil).diff(moment(), 'days');
      return diff >= 0 && diff <= 3;
    }).length;

    return {
      total, rascunhos, enviadas, visualizadas, aceitas, recusadas, expiradas, expirando,
      taxaAceite, tempoMedioAceite, revenuePotencial, revenueGanha
    };
  }, [propostas]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Total</span>
          </div>
          <p className="text-xl font-bold text-[var(--pagsmile-blue)] mt-1">{metrics.total}</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{metrics.rascunhos} rascunhos</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Taxa Aceite</span>
          </div>
          <p className="text-xl font-bold text-green-600 mt-1">{metrics.taxaAceite.toFixed(0)}%</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{metrics.aceitas} aceitas</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Tempo Aceite</span>
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {metrics.tempoMedioAceite != null ? `${metrics.tempoMedioAceite}d` : '-'}
          </p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">média em dias</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[var(--pagsmile-green)]" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Receita Ganha</span>
          </div>
          <p className="text-lg font-bold text-[var(--pagsmile-green)] mt-1">
            R$ {(metrics.revenueGanha / 1000).toFixed(0)}k
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Recusadas</span>
          </div>
          <p className="text-xl font-bold text-red-600 mt-1">{metrics.recusadas}</p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{metrics.expiradas} expiradas</p>
        </CardContent>
      </Card>
      <Card className={metrics.expirando > 0 ? 'border-amber-300 bg-amber-50' : ''}>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Expirando</span>
          </div>
          <p className={`text-xl font-bold mt-1 ${metrics.expirando > 0 ? 'text-amber-600' : 'text-[var(--pagsmile-blue)]'}`}>
            {metrics.expirando}
          </p>
          <p className="text-[10px] text-[var(--pagsmile-blue)]/40">próximos 3 dias</p>
        </CardContent>
      </Card>
    </div>
  );
}