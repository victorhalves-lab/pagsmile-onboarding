import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Zap, Clock, AlertTriangle, XCircle, Send, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function CommercialAlerts({ stats }) {
  const insights = [
    {
      icon: Clock,
      message: `${stats.staleLeads} leads sem contato há +7 dias`,
      link: 'PipelineComercial',
      show: stats.staleLeads > 0,
    },
    {
      icon: AlertTriangle,
      message: `${stats.proposalsExpiring} propostas expirando nos próximos 3 dias`,
      link: 'GestaoPropostas',
      show: stats.proposalsExpiring > 0,
    },
    {
      icon: XCircle,
      message: `${stats.proposalsRejectedNoFollowup} propostas recusadas sem follow-up`,
      link: 'GestaoPropostas',
      show: stats.proposalsRejectedNoFollowup > 0,
    },
    {
      icon: Send,
      message: `${stats.urgentLeadsNoProp} leads urgentes (IA) sem proposta`,
      link: 'PipelineComercial',
      show: stats.urgentLeadsNoProp > 0,
    },
    {
      icon: CheckCircle2,
      message: `${stats.leadsReadyForProposal} leads prontos para receber proposta`,
      link: 'PipelineComercial',
      show: stats.leadsReadyForProposal > 0,
    },
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
            <p className="text-xs text-[#002443]/50">Nenhum alerta pendente no funil comercial.</p>
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
          <p className="text-[11px] text-white/50">{visible.length} item(s) requerem atenção</p>
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