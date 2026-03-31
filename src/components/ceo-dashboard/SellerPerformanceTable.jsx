import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Users, Target, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

const formatCompact = (v) => {
  if (!v) return 'R$ 0';
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
};

export default function SellerPerformanceTable({ sellers }) {
  if (!sellers || sellers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/5 p-8 text-center">
        <Users className="w-10 h-10 text-[#002443]/15 mx-auto mb-3" />
        <p className="text-sm text-[#002443]/40">Nenhum vendedor com atividade registrada</p>
        <p className="text-[10px] text-[#002443]/25 mt-1">Quando leads forem atribuídos a vendedores, os dados aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
      <div className="p-5 border-b border-[#002443]/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#002443]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002443]">Performance por Vendedor</h3>
            <p className="text-[10px] text-[#002443]/40">{sellers.length} vendedores ativos</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f4f4f4]/50">
              <th className="text-left px-5 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Vendedor</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Leads</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Propostas</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Aceitas</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Conversão</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">TPV Pipeline</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Ativados</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider">Perdidos</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller, idx) => {
              const convRate = seller.proposalsSent > 0 ? ((seller.proposalsAccepted / seller.proposalsSent) * 100).toFixed(0) : 0;
              const lossRate = seller.totalLeads > 0 ? ((seller.leadsLost / seller.totalLeads) * 100).toFixed(0) : 0;
              return (
                <tr key={seller.id || idx} className="border-t border-[#002443]/5 hover:bg-[#2bc196]/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center text-white text-xs font-bold">
                        {(seller.name || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#002443]">{seller.name || 'Sem nome'}</p>
                        <p className="text-[10px] text-[#002443]/30">{seller.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-sm font-bold text-[#002443]">{seller.totalLeads}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-sm font-bold text-[#36706c]">{seller.proposalsSent}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-sm font-bold text-[#2bc196]">{seller.proposalsAccepted}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <Badge className={`text-xs border-0 ${
                      convRate >= 40 ? 'bg-[#2bc196]/10 text-[#2bc196]' :
                      convRate >= 20 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-50 text-red-500'
                    }`}>{convRate}%</Badge>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-xs font-bold text-[#002443]/70">{formatCompact(seller.tpvPipeline)}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-sm font-bold text-[#2bc196]">{seller.leadsActivated}</span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-xs text-red-400">{seller.leadsLost} ({lossRate}%)</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}