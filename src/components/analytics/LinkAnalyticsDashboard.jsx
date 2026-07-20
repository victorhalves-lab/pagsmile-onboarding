import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer, Eye, CheckCircle, XCircle, TrendingUp, 
  ArrowRight, Users, Loader2 
} from 'lucide-react';

export default function LinkAnalyticsDashboard({ linkId, linkCode }) {
  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ['linkAnalytics', linkId || linkCode],
    queryFn: async () => {
      if (linkId) {
        return base44.entities.OnboardingAnalytics.filter({ onboardingLinkId: linkId });
      } else if (linkCode) {
        return base44.entities.OnboardingAnalytics.filter({ onboardingLinkCode: linkCode });
      }
      return [];
    },
    enabled: !!(linkId || linkCode)
  });

  const stats = useMemo(() => {
    if (!analytics.length) return null;

    // Agrupa por sessão
    const sessions = {};
    analytics.forEach(event => {
      if (!event.sessionId) return;
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = {
          events: [],
          maxStep: 0,
          totalSteps: 0,
          flowType: null,
          completed: false,
          abandoned: false
        };
      }
      sessions[event.sessionId].events.push(event);
      if (event.stepNumber && event.stepNumber > sessions[event.sessionId].maxStep) {
        sessions[event.sessionId].maxStep = event.stepNumber;
      }
      if (event.totalSteps) {
        sessions[event.sessionId].totalSteps = event.totalSteps;
      }
      if (event.flowType) {
        sessions[event.sessionId].flowType = event.flowType;
      }
      if (event.eventType === 'onboarding_complete') {
        sessions[event.sessionId].completed = true;
      }
      if (event.eventType === 'onboarding_abandoned') {
        sessions[event.sessionId].abandoned = true;
      }
    });

    const sessionList = Object.values(sessions);
    const totalSessions = sessionList.length;
    const completedSessions = sessionList.filter(s => s.completed).length;
    const abandonedSessions = sessionList.filter(s => s.abandoned && !s.completed).length;

    // Contagem por evento
    const linkClicks = analytics.filter(e => e.eventType === 'link_click').length;
    const pageViews = analytics.filter(e => e.eventType === 'page_view').length;
    const formSubmits = analytics.filter(e => e.eventType === 'form_submit').length;

    // Funil por step
    const stepFunnel = {};
    sessionList.forEach(session => {
      const maxStep = session.maxStep || 1;
      for (let i = 1; i <= maxStep; i++) {
        stepFunnel[i] = (stepFunnel[i] || 0) + 1;
      }
    });

    // Páginas mais abandonadas
    const abandonmentByStep = {};
    sessionList.forEach(session => {
      if (!session.completed && session.maxStep > 0) {
        abandonmentByStep[session.maxStep] = (abandonmentByStep[session.maxStep] || 0) + 1;
      }
    });

    return {
      totalSessions,
      completedSessions,
      abandonedSessions,
      linkClicks,
      pageViews,
      formSubmits,
      conversionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0,
      stepFunnel,
      abandonmentByStep,
      avgMaxStep: totalSessions > 0 
        ? (sessionList.reduce((sum, s) => sum + (s.maxStep || 0), 0) / totalSessions).toFixed(1)
        : 0
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--pinbank-blue)]" />
      </div>
    );
  }

  if (!stats || analytics.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Eye className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>Nenhum dado de analytics ainda</p>
      </div>
    );
  }

  const funnelSteps = Object.entries(stats.stepFunnel).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxFunnelValue = Math.max(...Object.values(stats.stepFunnel));

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MousePointer className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.linkClicks}</p>
                <p className="text-xs text-slate-500">Cliques no Link</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalSessions}</p>
                <p className="text-xs text-slate-500">Sessões Únicas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.completedSessions}</p>
                <p className="text-xs text-slate-500">Completos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.conversionRate}%</p>
                <p className="text-xs text-slate-500">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Funil de Conversão por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelSteps.map(([step, count], index) => {
              const percentage = ((count / maxFunnelValue) * 100).toFixed(0);
              const dropoff = index > 0 
                ? funnelSteps[index - 1][1] - count 
                : 0;
              const abandonedAtStep = stats.abandonmentByStep[Number(step)] || 0;

              return (
                <div key={step} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Etapa {step}
                      </Badge>
                      <span className="text-slate-600">{count} usuários</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dropoff > 0 && (
                        <span className="text-xs text-red-500">
                          -{dropoff} saíram
                        </span>
                      )}
                      {abandonedAtStep > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {abandonedAtStep} abandonaram aqui
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--pinbank-blue)] to-emerald-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {Number(percentage) > 15 && (
                        <span className="text-xs text-white font-medium">{percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo do Funil */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{stats.totalSessions}</p>
                  <p className="text-xs text-slate-500">Iniciaram</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{stats.avgMaxStep}</p>
                  <p className="text-xs text-slate-500">Etapa Média</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{stats.completedSessions}</p>
                  <p className="text-xs text-slate-500">Concluíram</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-red-500">{stats.abandonedSessions}</span> abandonaram
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas com Maior Abandono */}
      {Object.keys(stats.abandonmentByStep).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Etapas com Maior Abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.abandonmentByStep)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([step, count]) => (
                  <div key={step} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm text-slate-700">Etapa {step}</span>
                    <Badge variant="destructive">{count} abandonos</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}