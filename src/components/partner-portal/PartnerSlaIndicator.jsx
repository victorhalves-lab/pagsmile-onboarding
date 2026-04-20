import React from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PartnerSlaIndicator({ dueDate, status }) {
  if (!dueDate) return null;
  if (status === 'completed') {
    return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
  }
  if (status === 'revoked') {
    return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Revogado</Badge>;
  }

  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const hoursLeft = (due - now) / (3600 * 1000);

  if (hoursLeft < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Vencido há {Math.abs(Math.round(hoursLeft))}h
      </Badge>
    );
  }
  if (hoursLeft <= 24) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        {Math.round(hoursLeft)}h restantes
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
      <Clock className="w-3 h-3 mr-1" />
      {Math.round(hoursLeft / 24)}d restantes
    </Badge>
  );
}