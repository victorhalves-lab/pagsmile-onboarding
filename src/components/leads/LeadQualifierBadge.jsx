import React from 'react';
import { Star, TrendingUp, Minus, TrendingDown, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LEVEL_CONFIG = {
  EXCELENTE: { label: 'Excelente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Star, emoji: '⭐' },
  BOM: { label: 'Bom', color: 'bg-green-100 text-green-700 border-green-200', icon: TrendingUp, emoji: '✅' },
  REGULAR: { label: 'Regular', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Minus, emoji: '🟡' },
  FRACO: { label: 'Fraco', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: TrendingDown, emoji: '🟠' },
  INSUFICIENTE: { label: 'Insuficiente', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, emoji: '🔴' },
  PENDENTE: { label: 'Pendente', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock, emoji: '⏳' },
};

const getScoreColor = (score) => {
  if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-300';
  if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-300';
  if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-300';
  return 'text-red-600 bg-red-50 border-red-300';
};

export default function LeadQualifierBadge({ lead, showTooltip = true, size = 'sm' }) {
  const score = lead.leadQualifierScore;
  const level = lead.leadQualifierLevel || 'PENDENTE';
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.PENDENTE;
  const Icon = cfg.icon;
  
  if (score == null && level === 'PENDENTE') {
    return (
      <span className="text-[10px] text-slate-400 italic">IA pendente</span>
    );
  }

  const badge = (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold border ${getScoreColor(score)}`}>
        {score}
      </span>
      <Badge className={`text-[10px] gap-0.5 px-1.5 py-0 h-5 ${cfg.color}`}>
        <Icon className="w-2.5 h-2.5" />
        {size !== 'xs' && cfg.label}
      </Badge>
    </div>
  );

  if (!showTooltip || !lead.leadQualifierReport?.resumoExecutivo) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs font-medium">Lead Qualifier IA</p>
          <p className="text-[11px] text-muted-foreground mt-1">{lead.leadQualifierReport.resumoExecutivo}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}