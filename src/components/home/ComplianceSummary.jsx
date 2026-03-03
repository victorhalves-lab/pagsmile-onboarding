import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS = {
  'Pendente': '#9CA3AF',
  'Em Processamento': '#3B82F6',
  'Aprovado': '#10B981',
  'Manual': '#F59E0B',
  'Recusado': '#EF4444',
  'Docs Solicitados': '#8B5CF6',
};

export default function ComplianceSummary({ cases, helenaAnalyses }) {
  const metrics = useMemo(() => {
    const byStatus = {};
    cases.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    const pendingManual = (byStatus['Manual'] || 0) + (byStatus['Pendente'] || 0);
    const approved = byStatus['Aprovado'] || 0;
    const rejected = byStatus['Recusado'] || 0;
    const inProcess = byStatus['Em Processamento'] || 0;

    // Helena metrics
    const helenaApproved = helenaAnalyses.filter(h => h.iaDecision === 'Aprovado' || h.recomendacao_final === 'Aprovado').length;
    const helenaTotal = helenaAnalyses.length;
    const autoApprovalRate = helenaTotal > 0 ? ((helenaApproved / helenaTotal) * 100).toFixed(0) : 0;

    // Chart data
    const chartData = Object.entries(byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || '#9CA3AF'
      }));

    return { byStatus, pendingManual, approved, rejected, inProcess, autoApprovalRate, chartData, total: cases.length };
  }, [cases, helenaAnalyses]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Compliance
          </CardTitle>
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[var(--pagsmile-green)]">
              Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{metrics.total}</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{metrics.approved}</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Aprovados</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${metrics.pendingManual > 0 ? 'text-amber-600' : 'text-[var(--pagsmile-blue)]'}`}>
              {metrics.pendingManual}
            </p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Pendentes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{metrics.autoApprovalRate}%</p>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/50">IA Auto</p>
          </div>
        </div>

        {/* Mini pie chart */}
        {metrics.chartData.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={38}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {metrics.chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {metrics.chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--pagsmile-blue)]/70">{item.name}</span>
                  </div>
                  <span className="font-bold text-[var(--pagsmile-blue)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending alert */}
        {metrics.pendingManual > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700">
              {metrics.pendingManual} caso{metrics.pendingManual > 1 ? 's' : ''} aguardando análise manual
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}