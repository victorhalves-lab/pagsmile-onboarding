import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Users, MousePointer, Rocket, TrendingUp, Monitor, Smartphone, Tablet, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, parseISO, startOfDay } from 'date-fns';

const PIE_COLORS = ['#2bc196', '#002443', '#f59e0b'];

function getDeviceIcon(type) {
  if (type === 'mobile') return Smartphone;
  if (type === 'tablet') return Tablet;
  return Monitor;
}

export default function LandingAnalyticsModal({ open, onClose, introducer }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['lp-analytics', introducer?.id],
    queryFn: () => base44.entities.LandingPageEvent.filter(
      { introducerId: introducer.id },
      '-created_date',
      2000
    ),
    enabled: open && !!introducer?.id,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['lp-analytics-leads', introducer?.id],
    queryFn: () => base44.entities.Lead.filter({ introducerId: introducer.id }, '-created_date', 500),
    enabled: open && !!introducer?.id,
  });

  const stats = useMemo(() => {
    if (!events.length) return null;

    const sessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const segViews = events.filter(e => e.eventType === 'segment_view');
    const ctaContratar = events.filter(e => e.eventType === 'cta_contratar');
    const ctaProposta = events.filter(e => e.eventType === 'cta_proposta');
    const calcInteract = events.filter(e => e.eventType === 'calculator_interact');
    const segInfoClicks = events.filter(e => e.eventType === 'segment_info');

    // Unique visitors
    const uniqueVisitors = sessions.size;
    const totalPageViews = pageViews.length;
    const totalCtaClicks = ctaContratar.length + ctaProposta.length;
    const totalLeads = leads.length;
    const conversionRate = uniqueVisitors > 0 ? ((totalLeads / uniqueVisitors) * 100).toFixed(1) : 0;

    // Accesses per day (last 30 days)
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'dd/MM');
      const count = pageViews.filter(e => {
        const d = e.created_date ? format(new Date(e.created_date), 'yyyy-MM-dd') : null;
        return d === dayStr;
      }).length;
      last30.push({ day: dayLabel, acessos: count });
    }

    // Segments ranking
    const segMap = {};
    segViews.forEach(e => {
      if (e.segmentName) segMap[e.segmentName] = (segMap[e.segmentName] || 0) + 1;
    });
    const segmentRanking = Object.entries(segMap)
      .map(([name, count]) => ({ name, views: count }))
      .sort((a, b) => b.views - a.views);

    // CTA por segmento
    const ctaBySegment = {};
    ctaContratar.forEach(e => {
      if (e.segmentName) ctaBySegment[e.segmentName] = (ctaBySegment[e.segmentName] || 0) + 1;
    });
    const ctaSegmentRanking = Object.entries(ctaBySegment)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    // Devices
    const deviceMap = {};
    pageViews.forEach(e => {
      const d = e.deviceType || 'desktop';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });
    const devices = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));

    // Funnel
    const funnel = [
      { step: 'Acessos', value: uniqueVisitors },
      { step: 'Viu Segmento', value: new Set(segViews.map(e => e.sessionId).filter(Boolean)).size },
      { step: 'Clicou CTA', value: new Set([...ctaContratar, ...ctaProposta].map(e => e.sessionId).filter(Boolean)).size },
      { step: 'Lead Criado', value: totalLeads },
      { step: 'Proposta Aceita', value: leads.filter(l => l.status === 'proposta_aceita' || l.status === 'kyc_iniciado' || l.status === 'kyc_aprovado' || l.status === 'ativado').length },
    ];

    // Calculator usage
    const calcSessions = new Set(calcInteract.map(e => e.sessionId).filter(Boolean)).size;
    const calcPercentage = uniqueVisitors > 0 ? ((calcSessions / uniqueVisitors) * 100).toFixed(0) : 0;

    // Recent events
    const recent = events.slice(0, 20);

    return {
      uniqueVisitors,
      totalPageViews,
      totalCtaClicks,
      totalLeads,
      conversionRate,
      last30,
      segmentRanking,
      ctaSegmentRanking,
      devices,
      funnel,
      calcPercentage,
      calcSessions,
      segInfoClicks: segInfoClicks.length,
      ctaContratarTotal: ctaContratar.length,
      ctaPropostaTotal: ctaProposta.length,
      recent,
    };
  }, [events, leads]);

  const eventLabels = {
    page_view: 'Acesso',
    segment_view: 'Viu Segmento',
    segment_info: 'Info Segmento',
    cta_contratar: 'CTA Contratar',
    cta_proposta: 'CTA Proposta',
    calculator_interact: 'Calculadora',
    fechamento_start: 'Fechamento',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002443]">
            <BarChart3 className="w-5 h-5 text-[#2bc196]" />
            Analytics — {introducer?.companyName || introducer?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
          </div>
        ) : !stats ? (
          <div className="text-center py-16">
            <Eye className="w-10 h-10 mx-auto mb-3 text-[#002443]/15" />
            <p className="text-sm text-[#002443]/50">Nenhum dado registrado ainda para esta landing page.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard icon={Eye} label="Acessos" value={stats.totalPageViews} color="blue" />
              <KpiCard icon={Users} label="Visitantes" value={stats.uniqueVisitors} color="purple" />
              <KpiCard icon={MousePointer} label="CTAs Clicados" value={stats.totalCtaClicks} color="emerald" />
              <KpiCard icon={Rocket} label="Leads" value={stats.totalLeads} color="green" />
              <KpiCard icon={TrendingUp} label="Conversão" value={`${stats.conversionRate}%`} color="teal" />
            </div>

            {/* Acessos por dia */}
            <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
              <h4 className="text-sm font-bold text-[#002443] mb-3">Acessos nos últimos 30 dias</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.last30}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="acessos" stroke="#2bc196" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Funil */}
              <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
                <h4 className="text-sm font-bold text-[#002443] mb-3">Funil de Conversão</h4>
                <div className="space-y-2">
                  {stats.funnel.map((step, i) => {
                    const maxVal = stats.funnel[0].value || 1;
                    const pct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
                    return (
                      <div key={step.step}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[#002443]/70 font-medium">{step.step}</span>
                          <span className="font-bold text-[#002443]">{step.value}</span>
                        </div>
                        <div className="h-5 bg-[#f4f4f4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2bc196] to-[#002443] rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        {i < stats.funnel.length - 1 && stats.funnel[i].value > 0 && (
                          <p className="text-[10px] text-right text-[#002443]/30 mt-0.5">
                            {stats.funnel[i + 1].value > 0
                              ? `${((stats.funnel[i + 1].value / stats.funnel[i].value) * 100).toFixed(0)}% avançou`
                              : '—'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Segmentos mais vistos */}
              <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
                <h4 className="text-sm font-bold text-[#002443] mb-3">Segmentos mais vistos</h4>
                {stats.segmentRanking.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.segmentRanking.slice(0, 8)} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="views" fill="#2bc196" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-[#002443]/40 text-center py-8">Sem dados</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Devices */}
              <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
                <h4 className="text-sm font-bold text-[#002443] mb-3">Dispositivos</h4>
                {stats.devices.length > 0 ? (
                  <div className="h-40 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.devices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {stats.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-[#002443]/40 text-center py-8">Sem dados</p>
                )}
              </div>

              {/* CTA por segmento */}
              <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
                <h4 className="text-sm font-bold text-[#002443] mb-3">CTAs "Contratar" por Segmento</h4>
                {stats.ctaSegmentRanking.length > 0 ? (
                  <div className="space-y-2">
                    {stats.ctaSegmentRanking.slice(0, 6).map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="text-xs text-[#002443]/70 truncate flex-1">{item.name}</span>
                        <Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[10px] border-0 ml-2">{item.clicks}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#002443]/40 text-center py-8">Sem dados</p>
                )}
              </div>

              {/* Métricas extras */}
              <div className="bg-white border border-[#002443]/5 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#002443] mb-1">Engajamento</h4>
                <MiniStat label="Usaram Calculadora" value={`${stats.calcPercentage}%`} sub={`${stats.calcSessions} sessões`} />
                <MiniStat label="Cliques Info Segmento" value={stats.segInfoClicks} />
                <MiniStat label="CTA Contratar" value={stats.ctaContratarTotal} />
                <MiniStat label="CTA Proposta Custom." value={stats.ctaPropostaTotal} />
              </div>
            </div>

            {/* Eventos recentes */}
            <div className="bg-white border border-[#002443]/5 rounded-xl p-4">
              <h4 className="text-sm font-bold text-[#002443] mb-3">Eventos Recentes</h4>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#002443]/40 border-b">
                      <th className="text-left py-1.5 font-medium">Data</th>
                      <th className="text-left py-1.5 font-medium">Evento</th>
                      <th className="text-left py-1.5 font-medium">Segmento</th>
                      <th className="text-left py-1.5 font-medium">Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((ev, i) => (
                      <tr key={ev.id || i} className="border-b border-[#002443]/[0.03]">
                        <td className="py-1.5 text-[#002443]/60">{ev.created_date ? format(new Date(ev.created_date), 'dd/MM HH:mm') : '—'}</td>
                        <td className="py-1.5">
                          <Badge className="text-[10px] border-0 bg-[#002443]/5 text-[#002443]">{eventLabels[ev.eventType] || ev.eventType}</Badge>
                        </td>
                        <td className="py-1.5 text-[#002443]/60">{ev.segmentName || '—'}</td>
                        <td className="py-1.5 text-[#002443]/60 capitalize">{ev.deviceType || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  const bgMap = {
    blue: 'bg-blue-50', purple: 'bg-purple-50', emerald: 'bg-emerald-50',
    green: 'bg-green-50', teal: 'bg-teal-50',
  };
  const iconMap = {
    blue: 'text-blue-600', purple: 'text-purple-600', emerald: 'text-emerald-600',
    green: 'text-green-600', teal: 'text-teal-600',
  };
  return (
    <div className="bg-white border border-[#002443]/5 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${bgMap[color]}`}>
          <Icon className={`w-3.5 h-3.5 ${iconMap[color]}`} />
        </div>
        <div>
          <p className="text-lg font-bold text-[#002443] leading-tight">{value}</p>
          <p className="text-[10px] text-[#002443]/45">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#002443]/60">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-[#002443]">{value}</span>
        {sub && <p className="text-[10px] text-[#002443]/35">{sub}</p>}
      </div>
    </div>
  );
}