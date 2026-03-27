import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Phone, FileText, Clock, RefreshCw, CalendarClock, FileCheck2, Send } from 'lucide-react';
import moment from 'moment';
import LeadSLAIndicator from '../leads/LeadSLAIndicator';
import StatusUpdateModal from './StatusUpdateModal';
import FollowUpModal from './FollowUpModal';

const RISK_CONFIG = {
  BAIXO: { label: 'Baixo', color: 'bg-green-100 text-green-700' },
  MEDIO: { label: 'Médio', color: 'bg-amber-100 text-amber-700' },
  ALTO: { label: 'Alto', color: 'bg-orange-100 text-orange-700' },
  CRITICO: { label: 'Crítico', color: 'bg-red-100 text-red-700' },
};

const getScoreBg = (score) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function LeadKanbanCard({ lead, onAction, contract, proposal }) {
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const riskCfg = RISK_CONFIG[lead.priscilaRiskLevel];
  const daysSinceUpdate = lead.lastInteractionDate
    ? moment().diff(moment(lead.lastInteractionDate), 'days')
    : lead.created_date ? moment().diff(moment(lead.created_date), 'days') : null;
  const isStale = daysSinceUpdate !== null && daysSinceUpdate > 5;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--pagsmile-blue)] truncate">
        {lead.companyName || lead.fullName}
      </p>
      <p className="text-[10px] text-[var(--pagsmile-blue)]/50 truncate">
        {lead.contactName || lead.email}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {lead.priscilaQualityScore != null && (
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getScoreBg(lead.priscilaQualityScore)}`} />
            <span className="text-xs font-bold text-[var(--pagsmile-blue)]">
              {lead.priscilaQualityScore}
            </span>
          </div>
        )}
        {riskCfg && (
          <Badge className={`text-[9px] px-1.5 py-0 ${riskCfg.color}`}>
            {riskCfg.label}
          </Badge>
        )}
        {isStale && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {daysSinceUpdate}d
          </Badge>
        )}
      </div>

      {/* Proposal & Contract indicators */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {proposal && (
          <Badge className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 gap-0.5">
            <Send className="w-2.5 h-2.5" />
            {proposal.status === 'aceita' ? 'Prop. Aceita' : proposal.status === 'enviada' || proposal.status === 'visualizada' ? 'Prop. Enviada' : proposal.codigo?.slice(-5) || 'Proposta'}
          </Badge>
        )}
        {contract && (
          <Badge className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5">
            <FileCheck2 className="w-2.5 h-2.5" />
            Contrato
          </Badge>
        )}
      </div>

      {lead.tpvMensal > 0 && (
        <p className="text-xs font-mono text-[var(--pagsmile-green)]">
          R$ {lead.tpvMensal.toLocaleString('pt-BR')}/mês
        </p>
      )}

      <LeadSLAIndicator lead={lead} />

      {lead.lastInteractionDate && (
        <p className="text-[9px] text-[var(--pagsmile-blue)]/40">
          Último contato: {moment(lead.lastInteractionDate).fromNow()}
        </p>
      )}

      <div className="flex gap-1 pt-1 flex-wrap">
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
          onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('LeadDetails') + `?id=${lead.id}`); }}
        >
          <Eye className="w-3 h-3 mr-0.5" /> Ver
        </Button>
        {['questionario_preenchido', 'analisado_priscila'].includes(lead.status) && (
          <Button
            variant="default" size="sm"
            className="h-6 px-2 text-[10px] bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
            onClick={(e) => { e.stopPropagation(); onAction('contact', lead); }}
          >
            <Phone className="w-3 h-3 mr-0.5" /> Contato
          </Button>
        )}
        {['em_contato_comercial', 'analisado_priscila'].includes(lead.status) && lead.priscilaRiskLevel !== 'CRITICO' && (
          <Button
            variant="outline" size="sm" className="h-6 px-2 text-[10px]"
            onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('CriarProposta') + `?lead=${lead.id}`); }}
          >
            <FileText className="w-3 h-3 mr-0.5" /> Proposta
          </Button>
        )}
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
          onClick={(e) => { e.stopPropagation(); setShowStatusModal(true); }}
        >
          <RefreshCw className="w-3 h-3 mr-0.5" /> Status
        </Button>
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
          onClick={(e) => { e.stopPropagation(); setShowFollowUpModal(true); }}
        >
          <CalendarClock className="w-3 h-3 mr-0.5" /> Follow-up
        </Button>
      </div>

      <StatusUpdateModal open={showStatusModal} onClose={() => setShowStatusModal(false)} lead={lead} />
      <FollowUpModal open={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} lead={lead} />
    </div>
  );
}