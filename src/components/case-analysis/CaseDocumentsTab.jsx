import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Eye, Archive } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseDocumentsTab({ documents, caseId, merchantName }) {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadAllDocuments = async () => {
    setIsDownloadingZip(true);
    try {
      const response = await base44.functions.invoke('downloadCaseDocuments', { onboardingCaseId: caseId });
      const data = response.data;
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documentos_${merchantName || caseId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download dos documentos iniciado!');
    } catch (error) {
      console.error('Erro ao baixar documentos:', error);
      toast.error('Falha ao baixar documentos. Tente novamente.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">Documentos Enviados</h3>
        {documents.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleDownloadAllDocuments} disabled={isDownloadingZip}>
            {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
            {isDownloadingZip ? 'Preparando ZIP...' : 'Baixar Todos (ZIP)'}
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
  );
}