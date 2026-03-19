import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, FolderArchive } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseActionButtons({ caseId, merchantName, documentsCount }) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadZip = async () => {
    if (documentsCount === 0) {
      toast.error('Nenhum documento disponível para download.');
      return;
    }
    setDownloadingZip(true);
    try {
      const response = await base44.functions.invoke('downloadCaseDocuments', { 
        onboardingCaseId: caseId 
      }, { responseType: 'arraybuffer' });
      
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (merchantName || 'documentos').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      a.download = `documentos_${safeName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (err) {
      console.error('ZIP download error:', err);
      toast.error('Erro ao baixar documentos. Tente novamente.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await base44.functions.invoke('generateCompliancePdf', {
        onboardingCaseId: caseId
      }, { responseType: 'arraybuffer' });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (merchantName || 'compliance').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      a.download = `compliance_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={downloadingPdf}
        className="text-[#002443]/70 border-[#002443]/10 hover:bg-[#2bc196]/5 hover:border-[#2bc196]/30 hover:text-[#2bc196] text-xs rounded-lg"
      >
        {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
        PDF Respostas
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadZip}
        disabled={downloadingZip || documentsCount === 0}
        className="text-[#002443]/70 border-[#002443]/10 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-xs rounded-lg"
        title={documentsCount === 0 ? 'Nenhum documento enviado' : `${documentsCount} documento(s)`}
      >
        {downloadingZip ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FolderArchive className="w-3.5 h-3.5 mr-1.5" />}
        ZIP Documentos {documentsCount > 0 && `(${documentsCount})`}
      </Button>
    </div>
  );
}