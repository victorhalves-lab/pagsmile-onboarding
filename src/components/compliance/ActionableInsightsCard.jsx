import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  AlertTriangle, Clock, FileText, RefreshCw, 
  ArrowRight, Zap, Shield
} from 'lucide-react';

export default function ActionableInsightsCard({ 
  manualReviewCount = 0,
  pendingDocs = 0,
  overdueRevalidations = 0,
  pendingManualOver24h = 0,
  criticalScoresToday = 0
}) {
  const insights = [
    {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
      message: `${manualReviewCount} casos aguardando Revisão Manual`,
      link: 'QuestionariosRecebidos',
      linkText: 'Ir para fila',
      show: manualReviewCount > 0
    },
    {
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      message: `${pendingManualOver24h} submissões paradas há +24h`,
      link: 'QuestionariosRecebidos',
      linkText: 'Resolver agora',
      show: pendingManualOver24h > 0
    },
    {
      icon: FileText,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      message: `${pendingDocs} documentos pendentes de validação`,
      link: 'GestaoDocumentos',
      linkText: 'Validar docs',
      show: pendingDocs > 0
    },
    {
      icon: RefreshCw,
      color: 'text-red-600',
      bg: 'bg-red-600/10 border-red-600/20',
      message: `${overdueRevalidations} revalidações atrasadas`,
      link: 'GestaoRevalidacao',
      linkText: 'Ver atrasadas',
      show: overdueRevalidations > 0
    },
    {
      icon: Shield,
      color: 'text-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      message: `${criticalScoresToday} merchants com score crítico hoje`,
      link: 'QuestionariosRecebidos',
      linkText: 'Analisar',
      show: criticalScoresToday > 0
    }
  ];

  const visible = insights.filter(i => i.show);

  if (visible.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#2bc196]/10 to-[#36706c]/10 rounded-2xl border border-[#2bc196]/20 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#2bc196]/10">
            <Zap className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="font-bold text-[#002443] text-sm">Tudo em dia!</h3>
            <p className="text-xs text-[#282828]/50">Nenhum item crítico requer atenção imediata.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/10">
          <Zap className="w-5 h-5 text-[#5cf7cf]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">Ações Necessárias</h3>
          <p className="text-[11px] text-white/50">{visible.length} item(ns) requerem sua atenção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <Link
              key={i}
              to={createPageUrl(insight.link)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/5 hover:bg-white/20 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-white/10">
                <Icon className="w-4 h-4 text-[#5cf7cf]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 font-medium truncate">{insight.message}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#5cf7cf] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}