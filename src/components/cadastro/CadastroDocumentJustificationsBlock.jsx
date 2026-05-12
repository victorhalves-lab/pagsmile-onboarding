import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileQuestion, CheckCircle2, XCircle, Clock } from 'lucide-react';

const REVIEW_STATUS = {
  Pendente:  { color: 'bg-amber-100 text-amber-700', icon: Clock },
  Aceito:    { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  Rejeitado: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function CadastroDocumentJustificationsBlock({ documents = [] }) {
  const justified = documents.filter(d => d.notAvailable === true);
  if (!justified.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <FileQuestion className="w-4 h-4 text-amber-600" />
        Documentos justificados como "não disponíveis" ({justified.length})
      </h3>
      <div className="space-y-2">
        {justified.map(d => {
          const sc = REVIEW_STATUS[d.notAvailableReviewStatus || 'Pendente'];
          const Icon = sc.icon;
          return (
            <div key={d.id} className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">{d.documentName || 'Documento'}</p>
                <Badge className={`gap-1 text-[10px] flex-shrink-0 ${sc.color}`}>
                  <Icon className="w-3 h-3" />{d.notAvailableReviewStatus || 'Pendente'}
                </Badge>
              </div>
              {d.notAvailableReason && (
                <div className="mb-2">
                  <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Justificativa do cliente:</p>
                  <p className="text-xs text-[var(--pagsmile-blue)]/80 whitespace-pre-wrap">{d.notAvailableReason}</p>
                </div>
              )}
              {d.notAvailableReviewNotes && (
                <div className="p-2 bg-white rounded border border-amber-200">
                  <p className="text-[10px] text-amber-700/60">Parecer do analista ({d.notAvailableReviewedBy || '—'}):</p>
                  <p className="text-xs text-amber-800 whitespace-pre-wrap">{d.notAvailableReviewNotes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}