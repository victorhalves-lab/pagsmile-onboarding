import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ExternalLink, FileText, Image, Loader2 } from 'lucide-react';

export default function DocumentViewerModal({ 
  open, 
  onOpenChange, 
  document, 
  onApprove, 
  onReject, 
  isPending = false 
}) {
  if (!document) return null;

  const isImage = document.fileType?.includes('image');
  const isPdf = document.fileType?.includes('pdf');
  const canValidate = !document.validationStatus || document.validationStatus === 'Pendente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <Image className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-red-500" />}
            {document.documentName || 'Documento'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Document Preview */}
          <div className="bg-[#f4f4f4] rounded-xl border border-[#002443]/5 overflow-hidden" style={{ minHeight: '400px', maxHeight: '60vh' }}>
            {isImage && document.fileUrl ? (
              <img 
                src={document.fileUrl} 
                alt={document.documentName}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            ) : isPdf && document.fileUrl ? (
              <iframe 
                src={document.fileUrl} 
                className="w-full h-full min-h-[400px]"
                title={document.documentName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <FileText className="w-12 h-12 text-[#002443]/30 mb-3" />
                <p className="text-sm text-[#282828]/50">Pré-visualização não disponível</p>
                {document.fileUrl && (
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="mt-3">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir em nova aba
                    </Button>
                  </a>
                )}
              </div>
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