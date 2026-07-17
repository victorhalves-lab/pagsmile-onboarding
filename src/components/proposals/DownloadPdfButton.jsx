import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadProposalPdf } from '@/lib/proposalPdfClient';

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

  const handleDownload = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await downloadProposalPdf({ type, proposalId, token, slug, codigo, publicMode });
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