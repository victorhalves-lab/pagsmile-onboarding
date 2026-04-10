import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card, CardContent,
} from '@/components/ui/card';
import {
  RefreshCw, History, Zap, User as UserIcon, Building2,
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Shield
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import RevalidationSinglePanel from '../components/revalidation/RevalidationSinglePanel';
import RevalidationBulkPanel from '../components/revalidation/RevalidationBulkPanel';

export default function GestaoRevalidacao() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('single');

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['revalidationSchedules'],
    queryFn: () => base44.entities.RevalidationSchedule.list('-created_date', 200),
  });

  const { data: validations = [] } = useQuery({
    queryKey: ['revalidation-logs'],
    queryFn: async () => {
      const all = await base44.entities.ExternalValidationResult.filter(
        { provider: 'BigDataCorp', validationType: 'Revalidação BDC' },
        '-created_date',
        50
      );
      return all;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    return {
      totalSchedules: schedules.length,
      pending: schedules.filter(s => s.status === 'pending').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      overdue: schedules.filter(s => s.status === 'pending' && new Date(s.scheduledDate) < now).length,
      recentRevalidations: validations.length,
      alertsCount: validations.filter(v => {
        const delta = v.resultData?.scoreDelta;
        return delta != null && delta > 20;
      }).length,
    };
  }, [schedules, validations]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['revalidationSchedules'] });
    queryClient.invalidateQueries({ queryKey: ['revalidation-logs'] });
    queryClient.invalidateQueries({ queryKey: ['onboarding-cases-for-reval'] });
    queryClient.invalidateQueries({ queryKey: ['merchants-for-reval'] });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <History className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Revalidação de Compliance</h1>
              <p className="text-white/60 text-sm mt-1">Revalide scores de risco via BigDataCorp — unitário ou em massa</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Agendadas', value: stats.totalSchedules, icon: Clock, color: 'text-[#002443]' },
          { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600', alert: stats.overdue > 0 },
          { label: 'Revalidações', value: stats.recentRevalidations, icon: RefreshCw, color: 'text-blue-600' },
          { label: 'Alertas', value: stats.alertsCount, icon: TrendingUp, color: 'text-red-600', alert: stats.alertsCount > 0 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={`rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-all ${s.alert ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="pt-4 flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${s.color} opacity-60`} />
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-[#002443]/50">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs: Unitária / Em Massa / Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#002443]/8 rounded-xl p-1">
          <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-[#2bc196] data-[state=active]:text-white gap-2">
            <UserIcon className="w-4 h-4" /> Unitária
          </TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-lg data-[state=active]:bg-[#2bc196] data-[state=active]:text-white gap-2">
            <Zap className="w-4 h-4" /> Em Massa
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-[#2bc196] data-[state=active]:text-white gap-2">
            <History className="w-4 h-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <RevalidationSinglePanel onComplete={handleRefresh} />
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <RevalidationBulkPanel onComplete={handleRefresh} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RevalidationHistoryTab validations={validations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── History Tab ──
function RevalidationHistoryTab({ validations }) {
  if (validations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-8 text-center">
        <History className="w-10 h-10 text-[#002443]/20 mx-auto mb-3" />
        <p className="text-sm text-[#002443]/50">Nenhuma revalidação realizada ainda</p>
        <p className="text-xs text-[#002443]/30 mt-1">Execute uma revalidação unitária ou em massa para ver o histórico</p>
      </div>
    );
  }

  const getSubfaixaColor = (sf) => {
    const colors = {
      '1A': 'bg-green-100 text-green-700',
      '1B': 'bg-green-50 text-green-600',
      '2A': 'bg-blue-100 text-blue-700',
      '2B': 'bg-blue-50 text-blue-600',
      '3A': 'bg-amber-100 text-amber-700',
      '3B': 'bg-orange-100 text-orange-700',
      '4': 'bg-red-100 text-red-700',
      '5': 'bg-red-200 text-red-800',
    };
    return colors[sf] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 divide-y">
      {validations.map((v) => {
        const data = v.resultData || {};
        const delta = data.scoreDelta || 0;
        const isAlert = delta > 20;
        return (
          <div key={v.id} className={`p-4 flex items-center gap-4 ${isAlert ? 'bg-amber-50/50' : ''}`}>
            <div className={`p-2 rounded-lg ${delta > 0 ? 'bg-red-100' : delta < 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
              {delta > 0 ? <TrendingUp className="w-4 h-4 text-red-600" /> :
               delta < 0 ? <Shield className="w-4 h-4 text-green-600" /> :
               <RefreshCw className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#002443] truncate">
                Case: {v.onboardingCaseId?.substring(0, 12)}...
              </p>
              <p className="text-xs text-[#002443]/50">
                {v.timestamp ? new Date(v.timestamp).toLocaleString('pt-BR') : v.created_date ? new Date(v.created_date).toLocaleString('pt-BR') : ''}
                {' • '}{data.datasetsQueried || '?'} datasets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-[#002443]/50">Score</p>
                <p className="text-sm font-mono">
                  {data.oldScore ?? '?'} → <strong>{data.newScore ?? '?'}</strong>
                </p>
              </div>
              {data.subfaixaChanged ? (
                <div className="text-right">
                  <p className="text-xs text-[#002443]/50">Subfaixa</p>
                  <div className="flex items-center gap-1">
                    <Badge className={`${getSubfaixaColor(data.oldSubfaixa)} text-[10px] border-0`}>{data.oldSubfaixa}</Badge>
                    <span className="text-xs">→</span>
                    <Badge className={`${getSubfaixaColor(data.newSubfaixa)} text-[10px] border-0`}>{data.newSubfaixa}</Badge>
                  </div>
                </div>
              ) : (
                <Badge className={`${getSubfaixaColor(data.newSubfaixa)} text-xs border-0`}>{data.newSubfaixa || '-'}</Badge>
              )}
              <span className={`text-xs font-mono font-bold ${
                delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-slate-400'
              }`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}