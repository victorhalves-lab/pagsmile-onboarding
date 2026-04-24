import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2, Clock } from 'lucide-react';

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora há pouco';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return 'ontem';
}

export default function DraftRecoveryBanner({ savedAt, onRestore, onDiscard }) {
  return (
    <div className="mb-6 rounded-2xl border-2 border-[#2bc196]/30 bg-[#2bc196]/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2bc196]/20 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-[#2bc196]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#002443]">Encontramos um rascunho seu</h3>
          <p className="text-xs text-[#002443]/60 mt-0.5">
            Salvo automaticamente {formatRelativeTime(savedAt)}. Deseja continuar de onde parou?
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              onClick={onRestore}
              size="sm"
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-lg gap-2 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Continuar rascunho
            </Button>
            <Button
              onClick={onDiscard}
              size="sm"
              variant="outline"
              className="rounded-lg gap-2 h-9 text-[#002443]/70"
            >
              <Trash2 className="w-3.5 h-3.5" /> Começar do zero
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}