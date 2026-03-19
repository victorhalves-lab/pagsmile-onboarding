import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, FolderArchive, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function CaseActionButtons({ caseId, merchantName, documentsCount }) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const handleDownloadAllDocs = async () => {
    if (documentsCount === 0) {
      toast.error('Nenhum documento disponível para download.');
      return;
    }
    setDownloadingZip(true);
    setDownloadProgress({ current: 0, total: 0 });

    try {
      // Get signed URLs from backend
      const response = await base44.functions.invoke('getCaseDocumentUrls', {
        onboardingCaseId: caseId
      });

      const docs = response.data?.documents;
      if (!docs || docs.length === 0) {
        toast.error('Nenhum documento encontrado.');
        return;
      }

      setDownloadProgress({ current: 0, total: docs.length });

      // Download each file directly via browser
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        try {
          const a = document.createElement('a');
          a.href = doc.url;
          a.download = doc.fileName;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setDownloadProgress({ current: i + 1, total: docs.length });

          // Small delay between downloads to avoid browser blocking
          if (i < docs.length - 1) {
            await new Promise(r => setTimeout(r, 800));
          }
        } catch (err) {
          console.error(`Error downloading ${doc.fileName}:`, err);
        }
      }

      toast.success(`${docs.length} documento(s) baixado(s) com sucesso!`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Erro ao preparar downloads. Tente novamente.');
    } finally {
      setDownloadingZip(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await base44.functions.fetch('generateCompliancePdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCaseId: caseId })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || 'Erro ao gerar PDF');
      }
      const blob = await response.blob();
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
        onClick={handleDownloadAllDocs}
        disabled={downloadingZip || documentsCount === 0}
        className="text-[#002443]/70 border-[#002443]/10 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-xs rounded-lg"
        title={documentsCount === 0 ? 'Nenhum documento enviado' : `${documentsCount} documento(s)`}
      >
        {downloadingZip ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            {downloadProgress.total > 0 ? `${downloadProgress.current}/${downloadProgress.total}` : 'Preparando...'}
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Baixar Docs {documentsCount > 0 && `(${documentsCount})`}
          </>
        )}
      </Button>
    </div>
  );
}