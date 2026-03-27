import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const STATUS_COLORS = {
  'Pendente': '#002443',
  'Em Processamento': '#36706c',
  'Aprovado': '#2bc196',
  'Manual': '#F59E0B',
  'Recusado': '#EF4444',
  'Docs Solicitados': '#5cf7cf',
};

export default function ComplianceSummary({ cases, helenaAnalyses }) {
  const { t } = useTranslation();
  const metrics = useMemo(() => {
    const byStatus = {};
    cases.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    const pendingManual = (byStatus['Manual'] || 0) + (byStatus['Pendente'] || 0);
    const approved = byStatus['Aprovado'] || 0;
    const inProcess = byStatus['Em Processamento'] || 0;

    const helenaApproved = helenaAnalyses.filter(h => h.iaDecision === 'Aprovado' || h.recomendacao_final === 'Aprovado').length;
    const helenaTotal = helenaAnalyses.length;
    const autoApprovalRate = helenaTotal > 0 ? ((helenaApproved / helenaTotal) * 100).toFixed(0) : 0;

    const chartData = Object.entries(byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || '#002443'
      }));

    return { byStatus, pendingManual, approved, inProcess, autoApprovalRate, chartData, total: cases.length };
  }, [cases, helenaAnalyses]);

  return (
    <Card className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#002443]">
            <div className="p-1.5 rounded-lg bg-[#36706c]/10">
              <Shield className="w-3.5 h-3.5 text-[#36706c]" />
            </div>
            {t('compliance.title')}
          </CardTitle>
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#2bc196] hover:text-[#002443] font-semibold">
              {t('compliance.dashboard')} <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className="text-lg font-bold text-[#002443]">{metrics.total}</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('compliance.total')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#2bc196]/5">
            <p className="text-lg font-bold text-[#2bc196]">{metrics.approved}</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('compliance.approved')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#f4f4f4]">
            <p className={`text-lg font-bold ${metrics.pendingManual > 0 ? 'text-amber-600' : 'text-[#002443]'}`}>
              {metrics.pendingManual}
            </p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('compliance.pending')}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-[#36706c]/5">
            <p className="text-lg font-bold text-[#36706c]">{metrics.autoApprovalRate}%</p>
            <p className="text-[10px] text-[#282828]/40 font-medium">{t('compliance.ia_auto')}</p>
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
                    innerRadius={22}
                    outerRadius={40}
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
                    contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {metrics.chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#282828]/60 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#002443]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending alert */}
        {metrics.pendingManual > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/50">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
              {t('compliance.pending_alert', { count: metrics.pendingManual })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}