import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, CheckCircle2, FileUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal to generate a public "docs only" upload link for a compliance case.
 * The link lets the client upload required documents WITHOUT going through
 * the CAF identity SDK (RG/CNH + selfie). Uploaded docs are still analyzed by
 * CAF VerifAI on the backend (digital manipulation detection).
 */
export default function DocOnlyLinkModal({ open, onOpenChange, caseData, merchant }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const baseUrl = window.location.origin;
      const res = await base44.functions.invoke('generateDocOnlyLink', {
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
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-[#1356E2]" />
            Gerar Link de Upload de Documentos
          </DialogTitle>
          <DialogDescription>
            Crie um link exclusivo para o cliente enviar apenas os documentos requeridos. A
            verificação de identidade (RG/CNH + selfie) NÃO será solicitada neste fluxo, mas os
            documentos enviados serão analisados automaticamente pelo CAF VerifAI.
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

          {/* Warning if case already completed */}
          {caseData?.docCompleted && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                Este caso já foi marcado com documentos concluídos. Para permitir reenvio, um admin
                precisa resetar <code>docCompleted</code> antes.
              </div>
            </div>
          )}

          {/* Generated link */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Link gerado com sucesso — {result.requiredDocsCount} documento(s) requerido(s)
              </div>
              <div className="flex gap-2">
                <Input value={result.url} readOnly className="text-xs font-mono" />
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white shrink-0"
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
              disabled={loading || caseData?.docCompleted}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><FileUp className="w-4 h-4 mr-2" /> Gerar Link</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}