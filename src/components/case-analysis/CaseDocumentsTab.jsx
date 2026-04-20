import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Eye, Archive } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CafDocsSection from './CafDocsSection';

export default function CaseDocumentsTab({ documents, caseId, merchantName, integrationLogs = [] }) {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const handleDownloadAllDocuments = async () => {
    const docsWithUrl = documents.filter(d => d.fileUrl);
    if (docsWithUrl.length === 0) {
      toast.info('Nenhum documento com arquivo disponível para baixar.');
      return;
    }

    setIsDownloadingZip(true);
    setDownloadProgress(`0 / ${docsWithUrl.length}`);

    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < docsWithUrl.length; i++) {
      const doc = docsWithUrl[i];
      setDownloadProgress(`${i + 1} / ${docsWithUrl.length}`);
      try {
        const response = await fetch(doc.fileUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const fileName = doc.fileName || doc.documentName || `documento_${i + 1}`;
        zip.file(fileName, blob);
        successCount++;
      } catch (err) {
        console.warn(`Falha ao baixar ${doc.fileName || doc.documentName}:`, err);
        failCount++;
      }
    }

    if (successCount === 0) {
      toast.error('Não foi possível baixar nenhum documento.');
      setIsDownloadingZip(false);
      setDownloadProgress('');
      return;
    }

    setDownloadProgress('Gerando ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `documentos_${merchantName || caseId}.zip`);

    if (failCount > 0) {
      toast.warning(`ZIP gerado! ${successCount} baixados, ${failCount} falharam.`);
    } else {
      toast.success(`ZIP com ${successCount} documentos baixado com sucesso!`);
    }

    setIsDownloadingZip(false);
    setDownloadProgress('');
  };

  return (
    <div className="space-y-0">
      {/* Seção Docs CAF (imagens + metadados da última tentativa) */}
      <CafDocsSection documents={documents} integrationLogs={integrationLogs} />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">Documentos Enviados pelo Cliente</h3>
        {documents.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleDownloadAllDocuments} disabled={isDownloadingZip}>
            {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
            {isDownloadingZip ? `Baixando ${downloadProgress}` : 'Baixar Todos (ZIP)'}
          </Button>
        )}
      </div>
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum documento enviado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-6 h-6 text-[var(--pagsmile-blue)]/70" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--pagsmile-blue)]">{doc.documentName || doc.fileName}</p>
                  <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">
                    {doc.fileType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                  </p>
                  {doc.uploadDate && (
                    <p className="text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-1">
                      Enviado em {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={
                  doc.validationStatus === 'Validado' ? 'bg-green-100 text-green-800' :
                  doc.validationStatus === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {doc.validationStatus || 'Pendente'}
                </Badge>
                {doc.fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-1" /> Ver</a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}