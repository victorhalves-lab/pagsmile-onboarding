import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, Download, FileText, Image, Loader2 } from 'lucide-react';

export default function DocumentViewerModal({ 
  open, 
  onOpenChange, 
  document, 
  onApprove, 
  onReject, 
  isPending = false 
}) {
  const [imgError, setImgError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Reset errors when document changes
  React.useEffect(() => {
    setImgError(false);
    setPdfError(false);
  }, [document?.id]);

  if (!document) return null;

  const isImage = document.fileType?.includes('image');
  const isPdf = document.fileType?.includes('pdf');
  const canValidate = !document.validationStatus || document.validationStatus === 'Pendente';

  const handleDownload = async () => {
    if (!document.fileUrl) return;
    try {
      const response = await fetch(document.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName || 'documento';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      // Fallback: open in new tab
      window.open(document.fileUrl, '_blank');
    }
  };

  const renderFallback = () => (
    <div className="flex flex-col items-center justify-center h-64">
      <FileText className="w-12 h-12 text-[#002443]/30 mb-3" />
      <p className="text-sm text-[#282828]/50 mb-1">Pré-visualização não disponível</p>
      <p className="text-xs text-[#282828]/30 mb-4">Use os botões abaixo para abrir ou baixar o documento</p>
      {document.fileUrl && (
        <div className="flex gap-2">
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova aba
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isImage ? <Image className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-red-500" />}
              {document.documentName || 'Documento'}
            </DialogTitle>
            {document.fileUrl && (
              <div className="flex gap-2">
                <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-[#002443]/60 hover:text-[#002443]">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="text-[#002443]/60 hover:text-[#002443]">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Document Preview */}
          <div className="bg-[#f4f4f4] rounded-xl border border-[#002443]/5 overflow-hidden" style={{ minHeight: '400px', maxHeight: '60vh' }}>
            {isImage && document.fileUrl && !imgError ? (
              <img 
                src={document.fileUrl} 
                alt={document.documentName}
                className="w-full h-full object-contain max-h-[60vh]"
                onError={() => setImgError(true)}
              />
            ) : isPdf && document.fileUrl && !pdfError ? (
              <object
                data={document.fileUrl}
                type="application/pdf"
                className="w-full min-h-[400px]"
                style={{ height: '60vh' }}
              >
                {renderFallback()}
              </object>
            ) : (
              renderFallback()
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-[#282828]/50">
            <span>{document.fileName}</span>
            <span>
              {document.uploadDate 
                ? new Date(document.uploadDate).toLocaleDateString('pt-BR') 
                : document.created_date 
                  ? new Date(document.created_date).toLocaleDateString('pt-BR') 
                  : ''}
            </span>
          </div>

          {/* Actions */}
          {canValidate && (
            <div className="flex items-center gap-3 pt-2 border-t border-[#002443]/5">
              <Button
                onClick={() => onApprove(document)}
                disabled={isPending}
                className="flex-1 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Aprovar Documento
              </Button>
              <Button
                onClick={() => onReject(document)}
                disabled={isPending}
                variant="destructive"
                className="flex-1 rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar Documento
              </Button>
            </div>
          )}

          {!canValidate && document.validationNotes && (
            <div className="p-3 bg-[#f4f4f4] rounded-xl text-xs text-[#282828]/60">
              <span className="font-semibold">Observação:</span> {document.validationNotes}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}