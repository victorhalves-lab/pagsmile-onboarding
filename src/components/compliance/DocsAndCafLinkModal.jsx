import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2, Copy, ExternalLink, Loader2, CheckCircle2, FileUp, ScanFace, Info } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

/**
 * Modal to generate a COMPLETE recovery link: documents + CAF identity verification.
 * Use this when the client needs to pick up from the docs step (post-questionnaire)
 * and go all the way through CAF.
 */
export default function DocsAndCafLinkModal({ open, onOpenChange, caseData, merchant }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!caseData?.id) return;
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const res = await base44.functions.invoke('generateDocsAndCafLink', {
        caseId: caseData.id,
        baseUrl,
      });
      if (res.data?.success) {
        setResult(res.data);
        toast.success('Link gerado com sucesso!');
      } else {
        toast.error(res.data?.error || 'Erro ao gerar link');
      }
    } catch (err) {
      toast.error('Erro: ' + (err?.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      toast.success('Link copiado!');
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpen = () => {
    if (result?.url) window.open(result.url, '_blank');
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  const docsDone = caseData?.docCompleted === true;
  const cafDone = caseData?.cafCompleted === true;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-indigo-100 rounded-lg">
              <Link2 className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <DialogTitle className="text-[#0A0A0A]">Gerar Link Completo (Docs + CAF)</DialogTitle>
          </div>
          <DialogDescription className="text-[#0A0A0A]/70">
            Fluxo completo: cliente faz upload dos documentos e depois faz a verificação de identidade (RG/CNH + selfie + liveness).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Case info */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#0A0A0A]/60">Cliente:</span>
              <span className="text-xs font-semibold text-[#0A0A0A] truncate max-w-[250px]">{merchant?.fullName || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#0A0A0A]/60">CPF/CNPJ:</span>
              <span className="text-xs font-mono text-[#0A0A0A]">{merchant?.cpfCnpj || '-'}</span>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-lg ${docsDone ? 'bg-green-100' : 'bg-emerald-50'}`}>
                <FileUp className={`w-4 h-4 ${docsDone ? 'text-green-600' : 'text-emerald-600'}`} />
              </div>
              <span className="text-[10px] text-[#0A0A0A]/60">Documentos</span>
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-lg ${cafDone ? 'bg-green-100' : 'bg-purple-50'}`}>
                <ScanFace className={`w-4 h-4 ${cafDone ? 'text-green-600' : 'text-purple-600'}`} />
              </div>
              <span className="text-[10px] text-[#0A0A0A]/60">Verificação</span>
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-lg bg-slate-100">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-[10px] text-[#0A0A0A]/60">Concluído</span>
            </div>
          </div>

          {/* Warning if some steps already completed */}
          {(docsDone || cafDone) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {docsDone && cafDone
                  ? 'Este cliente já concluiu documentos e verificação. O link permite reenvio.'
                  : docsDone
                  ? 'Documentos já concluídos. O link permite reenvio de ambas etapas.'
                  : 'Verificação CAF já concluída. O link permite refazer documentos + verificação.'}
              </p>
            </div>
          )}

          {/* Result */}
          {result?.url && (
            <div className="space-y-2">
              <div className="bg-gradient-to-br from-emerald-50 to-indigo-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-[#0A0A0A] mb-1.5">🔗 Link gerado:</p>
                <code className="text-[11px] text-[#0A0A0A] break-all block bg-white p-2 rounded border border-slate-200">
                  {result.url}
                </code>
                <p className="text-[10px] text-[#0A0A0A]/60 mt-1.5">
                  📋 Template: {result.templateName} · {result.requiredDocsCount} documentos
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" /> Copiar
                </Button>
                <Button onClick={handleOpen} variant="outline" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">Fechar</Button>
          {!result && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><Link2 className="w-4 h-4 mr-2" /> Gerar Link Completo</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}