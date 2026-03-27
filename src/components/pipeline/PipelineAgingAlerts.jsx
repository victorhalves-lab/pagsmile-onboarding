import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, ArrowRight, Phone, FileText, Eye } from 'lucide-react';
import moment from 'moment';

export default function PipelineAgingAlerts({ leads }) {
  const staleLeads = useMemo(() => {
    return leads
      .filter(l => {
        if (['ativado', 'perdido', 'proposta_recusada'].includes(l.status)) return false;
        const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
        return moment().diff(moment(lastDate), 'days') >= 5;
      })
      .map(l => {
        const lastDate = l.lastInteractionDate || l.updated_date || l.created_date;
        const days = moment().diff(moment(lastDate), 'days');
        return { ...l, staleDays: days };
      })
      .sort((a, b) => b.staleDays - a.staleDays)
      .slice(0, 8);
  }, [leads]);

  if (staleLeads.length === 0) return null;

  const urgencyColor = (days) => {
    if (days >= 14) return 'text-red-600 bg-red-50 border-red-200';
    if (days >= 7) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const statusLabel = (status) => {
    const map = {
      questionario_preenchido: 'Lead Novo',
      analisado_priscila: 'Analisado',
      em_contato_comercial: 'Em Contato',
      proposta_enviada: 'Proposta Enviada',
      proposta_aceita: 'Proposta Aceita',
      kyc_iniciado: 'Em Compliance',
      kyc_aprovado: 'Compliance OK',
      kyc_revisao_manual: 'Revisão Manual',
    };
    return map[status] || status;
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">
          Leads Parados ({staleLeads.length})
        </h3>
        <span className="text-[10px] text-[var(--pagsmile-blue)]/50">Sem interação há 5+ dias</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {staleLeads.map(lead => (
          <div key={lead.id} className={`flex items-center gap-3 p-2 rounded-lg border ${urgencyColor(lead.staleDays)}`}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{lead.companyName || lead.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] h-4 px-1">{statusLabel(lead.status)}</Badge>
                <span className="text-[10px] flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />{lead.staleDays}d parado
                </span>
              </div>
            </div>
            <Link to={createPageUrl('LeadDetails') + `?id=${lead.id}`}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}