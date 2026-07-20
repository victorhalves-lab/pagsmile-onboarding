import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, CheckCircle2, ScanFace, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal to generate a public "CAF only" verification link.
 * The link lets the client complete ONLY the CAF identity step (RG/CNH + selfie + liveness)
 * without redoing the compliance questionnaire or re-uploading business documents.
 *
 * Use case: client filled the questionnaire + uploaded docs, but got stuck at the CAF SDK.
 * Admin regenerates the dedicated link so client only redoes that last piece.
 */
export default function CafOnlyLinkModal({ open, onOpenChange, caseData, merchant }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmedRegenerate, setConfirmedRegenerate] = useState(false);

  const cafAlreadyCompleted = caseData?.cafCompleted === true;
  const needsConfirmation = cafAlreadyCompleted && !confirmedRegenerate;

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const baseUrl = window.location.origin;
      const res = await base44.functions.invoke('generateCafOnlyLink', {
        caseId: caseData.id,
        baseUrl,
      });
      const data = res?.data || {};
      if (!data.success) {
        toast.error(data.error || 'Falha ao gerar link.');
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro desconhecido';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  const handleClose = (newOpen) => {
    if (!newOpen) {
      setResult(null);
      setCopied(false);
      setConfirmedRegenerate(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-purple-600" />
            Gerar Link de Verificação de Identidade (CAF)
          </DialogTitle>
          <DialogDescription>
            Crie um link exclusivo para o cliente completar APENAS a verificação de identidade:
            captura de RG/CNH (frente e verso), selfie e prova de vida (liveness).
            O questionário e os documentos já enviados são preservados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Case info */}
          {caseData && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-[#0A0A0A]">{merchant?.fullName || '—'}</p>
              <p className="text-xs text-[#0A0A0A]/60 mt-0.5">{merchant?.cpfCnpj || '—'}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-1">Caso: {caseData.id}</p>
            </div>
          )}

          {/* Warning if CAF already completed — ask for explicit confirmation */}
          {cafAlreadyCompleted && !result && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1">Este caso já tem verificação CAF concluída</p>
                <p className="mb-2">
                  Ao gerar um novo link, o cliente irá refazer o processo de verificação
                  (captura de documento + selfie + liveness). A verificação anterior será
                  sobrescrita pelos novos dados.
                </p>
                {!confirmedRegenerate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmedRegenerate(true)}
                    className="border-amber-300 text-amber-800 hover:bg-amber-100 h-7 text-xs"
                  >
                    Confirmar — quero regerar mesmo assim
                  </Button>
                )}
                {confirmedRegenerate && (
                  <p className="text-emerald-700 font-medium">
                    ✓ Regeração confirmada. Clique em "Gerar Link" abaixo.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Generated link */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Link gerado com sucesso — apenas verificação CAF (RG + selfie + liveness)
              </div>
              <div className="flex gap-2">
                <Input value={result.url} readOnly className="text-xs font-mono" />
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(result.url, '_blank')}
                  className="shrink-0"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-[#0A0A0A]/50">
                Template: <strong>{result.templateName}</strong>
                {result.templateModel ? ` (${result.templateModel})` : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Fechar
          </Button>
          {!result && (
            <Button
              onClick={handleGenerate}
              disabled={loading || needsConfirmation}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><ScanFace className="w-4 h-4 mr-2" /> Gerar Link</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}