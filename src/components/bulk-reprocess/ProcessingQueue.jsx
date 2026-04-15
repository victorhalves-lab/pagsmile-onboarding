import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';

const STEP_LABELS = {
  profileCheck: 'CAF Profile',
  bdc: 'BDC V4',
  cafEnrich: 'CAF KYC/KYB',
  cafCredit: 'CAF Crédito',
  screening: 'Screening',
  sentinel: 'SENTINEL IA',
};

function QueueItem({ item, isActive }) {
  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-[#002443]/30" />,
    processing: <Loader2 className="w-4 h-4 text-[#2bc196] animate-spin" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    skipped: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#2bc196]/10 ring-1 ring-[#2bc196]/30' : 'bg-[#f4f4f4]'}`}>
      {statusIcon[item.status] || statusIcon.pending}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#002443] truncate">{item.merchantName}</span>
          <span className="text-[10px] font-mono text-[#002443]/40">...{item.caseId.slice(-8)}</span>
        </div>
        {item.status === 'processing' && item.currentStep && (
          <div className="text-[10px] text-[#2bc196] mt-0.5">Executando pipeline...</div>
        )}
        {item.status === 'success' && item.result && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {Object.entries(STEP_LABELS).map(([key, label]) => {
              const ok = item.result.pipeline?.[key + 'Success'];
              return (
                <Badge key={key} className={`text-[9px] py-0 px-1.5 ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {ok ? '✓' : '✗'} {label}
                </Badge>
              );
            })}
            {item.result.decision?.finalDecision && (
              <Badge className="text-[9px] py-0 px-1.5 bg-[#002443] text-white ml-1">
                {item.result.decision.finalDecision}
              </Badge>
            )}
          </div>
        )}
        {item.status === 'error' && (
          <div className="text-[10px] text-red-500 mt-0.5 truncate">{item.error}</div>
        )}
      </div>
      {item.duration && (
        <span className="text-[10px] text-[#002443]/40 flex-shrink-0">{Math.round(item.duration / 1000)}s</span>
      )}
    </div>
  );
}

export default function ProcessingQueue({ queue, currentIndex, totalSelected }) {
  const completed = queue.filter(q => q.status === 'success').length;
  const failed = queue.filter(q => q.status === 'error').length;
  const progress = totalSelected > 0 ? ((queue.filter(q => q.status !== 'pending').length) / totalSelected * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[#002443]/60">
          <span>Progresso: {queue.filter(q => q.status !== 'pending').length}/{totalSelected}</span>
          <span className="flex gap-3">
            <span className="text-green-600">{completed} ✓</span>
            {failed > 0 && <span className="text-red-500">{failed} ✗</span>}
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Queue list */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {queue.map((item, i) => (
          <QueueItem key={item.caseId} item={item} isActive={i === currentIndex} />
        ))}
      </div>
    </div>
  );
}