import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Phone, FileText, Clock, RefreshCw, CalendarClock, FileCheck2, Send } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/pt-br';
moment.locale('pt-br');
import LeadSLAIndicator from '../leads/LeadSLAIndicator';
import StatusUpdateModal from './StatusUpdateModal';
import FollowUpModal from './FollowUpModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const getScoreBg = (score) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function LeadKanbanCard({ lead, onAction, contract, proposal }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const RISK_CONFIG = {
    BAIXO: { label: t('quest_leads.risk.low'), color: 'bg-green-100 text-green-700' },
    MEDIO: { label: t('quest_leads.risk.medium'), color: 'bg-amber-100 text-amber-700' },
    ALTO: { label: t('quest_leads.risk.high'), color: 'bg-orange-100 text-orange-700' },
    CRITICO: { label: t('quest_leads.risk.critical'), color: 'bg-red-100 text-red-700' },
  };

  const riskCfg = RISK_CONFIG[lead.priscilaRiskLevel];
  const daysSinceUpdate = lead.lastInteractionDate
    ? moment().diff(moment(lead.lastInteractionDate), 'days')
    : lead.created_date ? moment().diff(moment(lead.created_date), 'days') : null;
  const isStale = daysSinceUpdate !== null && daysSinceUpdate > 5;

  const isVirtual = !!lead._isVirtual;
  const onbCase = lead._onboardingCase;

  return (
    <div className="space-y-2">
      {isVirtual && (
        <Badge className="text-[8px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 mb-0.5">
          Via Compliance
        </Badge>
      )}
      <p className="text-sm font-medium text-[var(--pinbank-blue)] truncate">
        {lead.companyName || lead.fullName}
      </p>
      <p className="text-[10px] text-[var(--pinbank-blue)]/50 truncate">
        {lead.contactName || lead.email || (isVirtual && onbCase ? `Case: ${onbCase.status}` : '')}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {lead.priscilaQualityScore != null && (
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getScoreBg(lead.priscilaQualityScore)}`} />
            <span className="text-xs font-bold text-[var(--pinbank-blue)]">
              {lead.priscilaQualityScore}
            </span>
          </div>
        )}
        {riskCfg && (
          <Badge className={`text-[9px] px-1.5 py-0 ${riskCfg.color}`}>
            {riskCfg.label}
          </Badge>
        )}
        {isVirtual && onbCase?.subfaixaNome && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-purple-600 border-purple-300 bg-purple-50">
            {onbCase.subfaixaNome}
          </Badge>
        )}
        {isStale && !isVirtual && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {t('kanban.stale_days', { days: daysSinceUpdate })}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {proposal && (
          <Badge className={`text-[9px] px-1.5 py-0 gap-0.5 ${
            proposal.status === 'aceita' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            proposal.status === 'expirada' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <Send className="w-2.5 h-2.5" />
            {proposal.status === 'aceita' ? t('kanban.prop_accepted') :
             proposal.status === 'expirada' ? 'Expirada' :
             ['enviada', 'visualizada', 'contraproposta'].includes(proposal.status) ? t('kanban.prop_sent') :
             proposal.codigo?.slice(-5) || t('kanban.proposal')}
          </Badge>
        )}
      </div>

      {lead.tpvMensal > 0 && (
        <p className="text-xs font-mono text-[var(--pinbank-blue)]">
          R$ {lead.tpvMensal.toLocaleString('pt-BR')}/mês
        </p>
      )}

      {!isVirtual && <LeadSLAIndicator lead={lead} />}

      {lead.lastInteractionDate && (
        <p className="text-[9px] text-[var(--pinbank-blue)]/40">
          {t('kanban.last_contact')} {moment(lead.lastInteractionDate).fromNow()}
        </p>
      )}

      {!isVirtual && (
        <div className="flex gap-1 pt-1 flex-wrap">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
            onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('LeadDetails') + `?id=${lead.id}`); }}>
            <Eye className="w-3 h-3 mr-0.5" /> {t('kanban.view')}
          </Button>
          {['questionario_preenchido', 'analisado_priscila'].includes(lead.status) && (
            <Button variant="default" size="sm"
              className="h-6 px-2 text-[10px] bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90 text-white"
              onClick={(e) => { e.stopPropagation(); onAction('contact', lead); }}>
              <Phone className="w-3 h-3 mr-0.5" /> {t('kanban.contact')}
            </Button>
          )}
          {['em_contato_comercial', 'analisado_priscila'].includes(lead.status) && lead.priscilaRiskLevel !== 'CRITICO' && (
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]"
              onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('CriarProposta') + `?lead=${lead.id}`); }}>
              <FileText className="w-3 h-3 mr-0.5" /> {t('kanban.proposal')}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
            onClick={(e) => { e.stopPropagation(); setShowStatusModal(true); }}>
            <RefreshCw className="w-3 h-3 mr-0.5" /> {t('kanban.status')}
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
            onClick={(e) => { e.stopPropagation(); setShowFollowUpModal(true); }}>
            <CalendarClock className="w-3 h-3 mr-0.5" /> {t('kanban.follow_up')}
          </Button>
        </div>
      )}

      {isVirtual && (
        <div className="flex gap-1 pt-1 flex-wrap">
          {onbCase && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
              onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('AnaliseDeCasos') + `?id=${onbCase.id}`); }}>
              <Eye className="w-3 h-3 mr-0.5" /> Ver Case
            </Button>
          )}
        </div>
      )}

      {!isVirtual && <StatusUpdateModal open={showStatusModal} onClose={() => setShowStatusModal(false)} lead={lead} />}
      {!isVirtual && <FollowUpModal open={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} lead={lead} />}
    </div>
  );
}