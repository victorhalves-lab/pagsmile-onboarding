import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, Download, FileText, Image, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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
  // Signed URL state — for private documents we need to fetch a temporary URL
  // via getPrivateDocumentUrl. Without this, document.fileUrl points to a
  // private base44 URI that the browser can't access (404/cadeado).
  const [signedUrl, setSignedUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // Resolve which URL to actually use for preview/download:
  // - If document is private (isPrivate=true) and we have fileUri → fetch signed URL
  // - Otherwise use fileUrl directly (legacy/public docs)
  useEffect(() => {
    setImgError(false);
    setPdfError(false);
    setSignedUrl(null);
    setUrlError(null);
    if (!open || !document) return;
    const isPrivate = document.isPrivate === true;
    const uri = document.fileUri || document.fileUrl;
    if (!isPrivate || !uri) return; // public doc — use fileUrl as-is
    setLoadingUrl(true);
    base44.functions.invoke('getPrivateDocumentUrl', {
      file_uri: uri,
      documentUploadId: document.id,
      expiresIn: 600,
    })
      .then((res) => {
        if (res?.data?.signed_url) setSignedUrl(res.data.signed_url);
        else setUrlError('Não foi possível gerar link de visualização.');
      })
      .catch((err) => setUrlError(err?.message || 'Falha ao obter link do documento'))
      .finally(() => setLoadingUrl(false));
  }, [open, document?.id]);

  if (!document) return null;

  // The effective URL to use for preview/download — signed URL for private docs,
  // raw fileUrl for legacy/public docs.
  const effectiveUrl = signedUrl || (document.isPrivate ? null : document.fileUrl);

  const isImage = document.fileType?.includes('image');
  const isPdf = document.fileType?.includes('pdf');
  const canValidate = !document.validationStatus || document.validationStatus === 'Pendente';

  const handleDownload = async () => {
    if (!effectiveUrl) return;
    try {
      const response = await fetch(effectiveUrl);
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
      window.open(effectiveUrl, '_blank');
    }
  };

  const renderFallback = () => (
    <div className="flex flex-col items-center justify-center h-64">
      <FileText className="w-12 h-12 text-[#0A0A0A]/30 mb-3" />
      <p className="text-sm text-[#0A0A0A]/50 mb-1">Pré-visualização não disponível</p>
      <p className="text-xs text-[#0A0A0A]/30 mb-4">Use os botões abaixo para abrir ou baixar o documento</p>
      {effectiveUrl && (
        <div className="flex gap-2">
          <a href={effectiveUrl} target="_blank" rel="noopener noreferrer">
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
            {effectiveUrl && (
              <div className="flex gap-2">
                <a href={effectiveUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-[#0A0A0A]/60 hover:text-[#0A0A0A]">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="text-[#0A0A0A]/60 hover:text-[#0A0A0A]">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Document Preview */}
          <div className="bg-[#f4f4f4] rounded-xl border border-[#0A0A0A]/5 overflow-hidden flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '60vh' }}>
            {loadingUrl ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#1356E2] animate-spin mb-3" />
                <p className="text-sm text-[#0A0A0A]/60">Carregando documento…</p>
              </div>
            ) : urlError ? (
              <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                <XCircle className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-sm font-medium text-[#0A0A0A] mb-1">Falha ao carregar o documento</p>
                <p className="text-xs text-[#0A0A0A]/50">{urlError}</p>
              </div>
            ) : isImage && effectiveUrl && !imgError ? (
              <img 
                src={effectiveUrl} 
                alt={document.documentName}
                className="w-full h-full object-contain max-h-[60vh]"
                onError={() => setImgError(true)}
              />
            ) : isPdf && effectiveUrl && !pdfError ? (
              <object
                data={effectiveUrl}
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
          <div className="flex items-center justify-between text-xs text-[#0A0A0A]/50">
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
            <div className="flex items-center gap-3 pt-2 border-t border-[#0A0A0A]/5">
              <Button
                onClick={() => onApprove(document)}
                disabled={isPending}
                className="flex-1 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl"
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
            <div className="p-3 bg-[#f4f4f4] rounded-xl text-xs text-[#0A0A0A]/60">
              <span className="font-semibold">Observação:</span> {document.validationNotes}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}