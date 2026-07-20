import React from 'react';
import { AlertTriangle, X, FileX, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Modal que aparece quando o cliente clica em "Próximo" e a validação bloqueia.
 *
 * Substitui o toast.error de 10s — o toast some rápido demais, fica escondido pela
 * barra do navegador no mobile, e no desktop aparece no topo direito enquanto o
 * cliente está olhando o botão lá embaixo. Resultado: cliente clica, "nada acontece"
 * e fica trancado sem entender o motivo (caso real do Pedro Sperandio / Millions).
 *
 * Variants:
 *   - 'missing_docs'  → mostra a lista de docs faltando
 *   - 'case_missing'  → caso ainda não foi preparado (mostra tentativa de recovery)
 *   - 'recovering'    → mostra spinner enquanto recovery está acontecendo
 */
export default function BlockedSubmitDialog({
  open,
  variant = 'missing_docs',
  missingList = [],
  reason = '',
  caseId = '',
  onClose,
  onRetry,
  recovering = false,
}) {
  if (!open) return null;

  const isCaseMissing = variant === 'case_missing';
  const isRecovering = variant === 'recovering' || recovering;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-4 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100">
            {isRecovering ? (
              <Loader2 className="w-5 h-5 text-amber-700 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-amber-900">
              {isRecovering
                ? 'Preparando seu envio…'
                : isCaseMissing
                ? 'Ainda falta um passo'
                : 'Faltam documentos obrigatórios'}
            </h3>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {isRecovering
                ? 'Aguarde alguns segundos enquanto sincronizamos seus documentos.'
                : isCaseMissing
                ? 'Seus documentos foram enviados, mas o cadastro ainda precisa ser registrado.'
                : 'Veja abaixo o que ainda precisa ser enviado para você avançar.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-100"
            type="button"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-amber-700" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isRecovering && (
            <div className="text-center py-4">
              <Loader2 className="w-10 h-10 mx-auto text-[#1356E2] animate-spin mb-3" />
              <p className="text-sm text-[#0A0A0A]/70">
                Recuperando seu cadastro automaticamente…
              </p>
            </div>
          )}

          {!isRecovering && isCaseMissing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-900 leading-relaxed">
                Não se preocupe — <strong>seus arquivos já estão salvos</strong>. Vamos
                tentar concluir o registro automaticamente. Se não der certo, recarregue
                a página e seus documentos continuarão lá.
              </p>
            </div>
          )}

          {!isRecovering && !isCaseMissing && (
            <>
              {reason && (
                <p className="text-sm font-medium text-[#0A0A0A]">{reason}</p>
              )}
              {missingList.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-bold text-[#0A0A0A] mb-2 flex items-center gap-1.5">
                    <FileX className="w-3.5 h-3.5 text-amber-600" />
                    Documentos pendentes ({missingList.length}):
                  </p>
                  <ul className="space-y-1.5">
                    {missingList.slice(0, 8).map((label, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-[#0A0A0A]/80"
                      >
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{label}</span>
                      </li>
                    ))}
                    {missingList.length > 8 && (
                      <li className="text-xs text-[#0A0A0A]/50 italic pl-3">
                        + {missingList.length - 8} outro(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-900 leading-relaxed">
                  💡 <strong>Dica:</strong> role a página até o documento faltante.
                  Você pode enviar o arquivo OU clicar em{' '}
                  <em>"Não tenho este documento"</em> para justificar a ausência.
                </p>
              </div>
            </>
          )}

          {/* Technical info — useful for support to find this case quickly */}
          {caseId && !isRecovering && (
            <div className="text-[10px] text-[#0A0A0A]/40 font-mono border-t border-slate-100 pt-2">
              ID do caso: {caseId.slice(0, 8)}…
            </div>
          )}

          <div className="flex gap-2">
            {onRetry && !isRecovering && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isRecovering}
            >
              {isRecovering ? 'Aguarde…' : 'Entendi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}