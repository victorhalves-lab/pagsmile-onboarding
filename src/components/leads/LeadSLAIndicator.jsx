import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import moment from 'moment';

// SLA rules per status (max days expected in each stage)
const SLA_RULES = {
  questionario_preenchido: { maxDays: 2, label: 'Análise em até 2d' },
  analisado_priscila: { maxDays: 3, label: 'Contato em até 3d' },
  em_contato_comercial: { maxDays: 5, label: 'Proposta em até 5d' },
  proposta_enviada: { maxDays: 7, label: 'Resposta em até 7d' },
  proposta_aceita: { maxDays: 3, label: 'KYC em até 3d' },
  kyc_iniciado: { maxDays: 10, label: 'Conclusão em até 10d' },
  kyc_revisao_manual: { maxDays: 5, label: 'Revisão em até 5d' },
};

export default function LeadSLAIndicator({ lead }) {
  const rule = SLA_RULES[lead.status];
  if (!rule) return null;

  const lastDate = lead.lastInteractionDate || lead.updated_date || lead.created_date;
  const daysInStage = moment().diff(moment(lastDate), 'days');
  const percentUsed = (daysInStage / rule.maxDays) * 100;
  const isOverdue = daysInStage > rule.maxDays;
  const isWarning = percentUsed >= 70 && !isOverdue;

  if (percentUsed < 50) {
    return (
      <Badge variant="outline" className="text-[9px] gap-0.5 text-green-600 border-green-200 bg-green-50">
        <Zap className="w-2.5 h-2.5" />
        No prazo
      </Badge>
    );
  }

  if (isOverdue) {
    return (
      <Badge className="text-[9px] gap-0.5 bg-red-100 text-red-700">
        <AlertTriangle className="w-2.5 h-2.5" />
        SLA excedido ({daysInStage - rule.maxDays}d)
      </Badge>
    );
  }

  if (isWarning) {
    return (
      <Badge className="text-[9px] gap-0.5 bg-amber-100 text-amber-700">
        <Clock className="w-2.5 h-2.5" />
        {rule.maxDays - daysInStage}d restante{rule.maxDays - daysInStage !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return null;
}