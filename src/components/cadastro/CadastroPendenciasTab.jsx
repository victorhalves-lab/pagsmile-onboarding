import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, FileText, HelpCircle, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Calendar, Copy } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  open:       { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Aberta' },
  fulfilled:  { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Respondida' },
  cancelled:  { color: 'bg-slate-100 text-slate-600', icon: XCircle, label: 'Cancelada' },
  expired:    { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Expirada' },
};

function ItemBadge({ item }) {
  if (item.kind === 'document') {
    if (item.isOther) return <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1"><Sparkles className="w-3 h-3" />OUTROS</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 text-[10px] gap-1"><FileText className="w-3 h-3" />Documento</Badge>;
  }
  return <Badge className="bg-violet-100 text-violet-700 text-[10px] gap-1"><HelpCircle className="w-3 h-3" />Pergunta</Badge>;
}

function PendencyCard({ pendency, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sc = STATUS_CONFIG[pendency.status] || STATUS_CONFIG.open;
  const StatusIcon = sc.icon;
  const submittedItems = (pendency.items || []).filter(i => i.status === 'submitted').length;
  const totalItems = (pendency.items || []).length;
  const publicUrl = pendency.publicToken
    ? `${window.location.origin}/CompletarPendencias?token=${pendency.publicToken}`
    : '';

  const copyLink = (e) => {
    e.stopPropagation();
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado!');
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[var(--pagsmile-blue)]">Rodada {pendency.round}</span>
              <Badge className={`text-[10px] gap-1 ${sc.color}`}>
                <StatusIcon className="w-3 h-3" />
                {sc.label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {submittedItems}/{totalItems} respondidos
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--pagsmile-blue)]/50 mt-0.5 flex-wrap">
              <span>Solicitada por {pendency.requestedBy}</span>
              {pendency.requestedAt && <span>• {new Date(pendency.requestedAt).toLocaleDateString('pt-BR')}</span>}
              {pendency.expiresAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Prazo: {new Date(pendency.expiresAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendency.status === 'open' && publicUrl && (
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1 text-xs">
              <Copy className="w-3 h-3" /> Link
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--pagsmile-blue)]/30" /> : <ChevronDown className="w-4 h-4 text-[var(--pagsmile-blue)]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--pagsmile-blue)]/5 p-4 space-y-3">
          {pendency.generalMessage && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[10px] font-semibold text-[var(--pagsmile-blue)]/50 mb-1">Mensagem ao cliente</p>
              <p className="text-xs text-[var(--pagsmile-blue)]/80 whitespace-pre-wrap">{pendency.generalMessage}</p>
            </div>
          )}

          {pendency.fulfilledAt && (
            <div className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cliente finalizou em {new Date(pendency.fulfilledAt).toLocaleString('pt-BR')}
            </div>
          )}

          <div className="space-y-2">
            {(pendency.items || []).map((item, idx) => {
              const isSubmitted = item.status === 'submitted';
              return (
                <div
                  key={item.itemId || idx}
                  className={`p-3 rounded-lg border ${isSubmitted ? 'bg-green-50/30 border-green-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-start gap-2">
                    <ItemBadge item={item} />
                    {isSubmitted ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" />Respondido
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-200 text-slate-700 text-[10px]">Pendente</Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--pagsmile-blue)] mt-2">{item.label}</p>
                  {item.description && <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-0.5">{item.description}</p>}

                  {item.kind === 'document' && (
                    <div className="text-[10px] text-[var(--pagsmile-blue)]/50 mt-1.5 flex flex-wrap gap-2">
                      <span>Tipos: {(item.acceptedFileTypes || []).join(', ').toUpperCase() || 'qualquer'}</span>
                      <span>• Mínimo: {item.requiredQuantity || 1}</span>
                      <span>• Enviados: {(item.uploadedDocIds || []).length}</span>
                    </div>
                  )}

                  {item.kind === 'question' && item.answerValue && (
                    <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                      <p className="text-[10px] text-[var(--pagsmile-blue)]/50 mb-0.5">Resposta:</p>
                      <p className="text-xs text-[var(--pagsmile-blue)] font-medium whitespace-pre-wrap">{item.answerValue}</p>
                    </div>
                  )}
                  {item.kind === 'question' && !item.answerValue && (
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mt-1.5 italic">Aguardando resposta do cliente</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CadastroPendenciasTab({ allCaseIds = [] }) {
  const { data: pendencies = [], isLoading } = useQuery({
    queryKey: ['cadastro-pendencies', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.PendencyRequest.filter({ onboardingCaseId: id })));
      return results.flat().sort((a, b) => (b.round || 0) - (a.round || 0));
    },
    enabled: allCaseIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Carregando...</p>
      </div>
    );
  }

  if (!pendencies.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhuma solicitação de pendência registrada para este cliente</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/40 mt-1">Use o botão "Solicitar Pendências" na aba Documentos quando o caso estiver em Revisão Manual.</p>
      </div>
    );
  }

  const open = pendencies.filter(p => p.status === 'open').length;
  const fulfilled = pendencies.filter(p => p.status === 'fulfilled').length;

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-[var(--pagsmile-blue)]/60">
          {pendencies.length} solicitação(ões) registrada(s)
        </p>
        <div className="flex gap-2">
          {open > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px]">{open} aberta(s)</Badge>}
          {fulfilled > 0 && <Badge className="bg-green-100 text-green-700 text-[10px]">{fulfilled} respondida(s)</Badge>}
        </div>
      </div>
      {pendencies.map((p, i) => (
        <PendencyCard key={p.id} pendency={p} defaultExpanded={i === 0} />
      ))}
    </div>
  );
}