import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProposalDownloadContent from './ProposalDownloadContent';
import CountryPricingPdfTemplate from './CountryPricingPdfTemplate';
import { downloadProposalAsPDF, downloadProposalAsPNG } from './proposalDownloadUtils';

/**
 * Botão de download da proposta em PNG ou PDF.
 * Renderiza o template em um div off-screen, captura via html2canvas e salva.
 */
export default function DownloadProposalButton({ proposal, variant = 'outline', size = 'default' }) {
  const targetRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const slug = (proposal.client_name || 'proposal')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const run = async (type) => {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const filename = `pagsmile-global-${slug}-${proposal.id?.slice(0, 6) || 'p'}.${type}`;
      if (type === 'pdf') await downloadProposalAsPDF(targetRef.current, filename);
      else await downloadProposalAsPNG(targetRef.current, filename);
    } finally { setBusy(false); }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => run('pdf')}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('png')}>
            <FileImage className="w-4 h-4 mr-2" /> PNG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Render off-screen do template para captura.
          Escolhe template: local_payments / hybrid => CountryPricingPdfTemplate (estilo Roblox)
          cross_border_interchange => template Interchange++ legado */}
      <div style={{ position: 'fixed', top: 0, left: '-10000px', pointerEvents: 'none' }}>
        <div ref={targetRef}>
          {(proposal.pricing_model === 'local_payments' || proposal.pricing_model === 'hybrid')
            ? <CountryPricingPdfTemplate proposal={proposal} lang={proposal.language || 'en'} />
            : <ProposalDownloadContent proposal={proposal} lang={proposal.language || 'en'} />
          }
        </div>
      </div>
    </>
  );
}