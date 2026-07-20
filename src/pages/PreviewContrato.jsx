import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Copy, Download, Send, Loader2, CheckCircle2, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';
import DownloadContractDocxButton from '@/components/contrato/DownloadContractDocxButton';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function PreviewContrato() {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contractRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const contracts = await base44.entities.Contract.filter({ id: contractId });
      return contracts?.[0] || null;
    },
    enabled: !!contractId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Contract.update(contractId, { 
        status: 'sent',
        sentDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success(t('pc.sent_success'));
    },
  });

  const buildContractLink = () => {
    if (contract?.publicSlug) return `${window.location.origin}/c/${contract.publicSlug}`;
    if (contract?.publicLinkCode) return window.location.origin + createPageUrl(`ContratoPublico?code=${contract.publicLinkCode}`);
    return null;
  };

  const copyPublicLink = () => {
    const link = buildContractLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success(t('pc.link_copied'));
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const el = contractRef.current;
      if (!el) return;

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        windowWidth: 800 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`${contract.codigo || 'contrato'}.pdf`);
      toast.success(t('pc.pdf_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('pc.pdf_error'));
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  if (!contract) {
    return <div className="text-center py-20 text-[#0A0A0A]/50">{t('pc.not_found')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl(`EditorContrato?id=${contractId}`))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#0A0A0A]">{t('pc.title')}</h1>
            <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
              {contract.codigo} • {contract.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(createPageUrl(`EditorContrato?id=${contractId}`))}>
            <Edit className="w-4 h-4 mr-2" /> {t('pc.edit')}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {t('pc.download_pdf')}
          </Button>
          <DownloadContractDocxButton contract={contract} variant="outline" label="Baixar Word" />
          <Button variant="outline" onClick={copyPublicLink}>
            <Copy className="w-4 h-4 mr-2" /> {t('pc.copy_link')}
          </Button>
          <Button 
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || contract.status === 'sent' || contract.status === 'signed'}
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {t('pc.mark_sent')}
          </Button>
        </div>
      </div>

      {/* Public Link */}
      {(contract.publicSlug || contract.publicLinkCode) && (
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-3 flex items-center gap-3">
            <LinkIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium flex-1 truncate">
              Link público: {buildContractLink()}
            </span>
            <Button size="sm" variant="ghost" onClick={copyPublicLink}>
              <Copy className="w-3.5 h-3.5 mr-1" /> {t('pc.copy')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contract Preview */}
      <Card className="bg-white border border-[#0A0A0A]/10 shadow-lg">
        <CardContent className="p-0">
          <div ref={contractRef}>
            <ConteudoContrato contract={contract} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}