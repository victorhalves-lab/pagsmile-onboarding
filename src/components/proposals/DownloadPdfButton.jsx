import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Button that downloads a beautifully formatted PDF of the proposal.
 *
 * Modes:
 *  - Authenticated admin (default): pass `proposalId` — uses the SDK + bearer token.
 *  - Public/anonymous: pass `publicMode` and either `token` or `slug` — uses the
 *    no-auth fetch wrapper (same one already used by other public-proposal pages).
 *
 * Calls the `generateProposalPdf` backend function which returns a binary PDF.
 * Never breaks existing UI — it's a self-contained additive button.
 */
export default function DownloadPdfButton({
  type,           // 'proposal' | 'standard_proposal' | 'pix_proposal'
  proposalId,
  token,
  slug,
  codigo,
  publicMode = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  label = 'Baixar PDF',
}) {
  const [isLoading, setIsLoading] = useState(false);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const filename = `Pagsmile-${(codigo || 'proposta').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;

      if (publicMode) {
        // Anonymous request: cannot use the SDK because it requires auth on a
        // private app. Use raw fetch against the same backend endpoint.
        const res = await fetch('/functions/generateProposalPdf', {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, token, slug }),
        });
        if (!res.ok) throw new Error(`Falha ao gerar PDF (${res.status})`);
        const blob = await res.blob();
        downloadBlob(blob, filename);
      } else {
        // Authenticated admin: SDK call (axios under the hood). We need the raw
        // bytes, so we ask the SDK for a Blob response.
        const { base44 } = await import('@/api/base44Client');
        const res = await base44.functions.invoke('generateProposalPdf', {
          type,
          proposalId,
        }, { responseType: 'blob' });
        // Some SDK versions wrap response under .data, others return the body
        // directly when responseType is 'blob'.
        const blob = res?.data instanceof Blob ? res.data
                  : res instanceof Blob ? res
                  : new Blob([res?.data ?? res], { type: 'application/pdf' });
        downloadBlob(blob, filename);
      }
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error('Download PDF error:', err);
      toast.error('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isLoading}
      className={`gap-2 ${className}`}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isLoading ? 'Gerando...' : label}
    </Button>
  );
}