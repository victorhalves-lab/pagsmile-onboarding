import React from 'react';
import { FileCheck, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  'Pendente': 'bg-gray-100 text-gray-700',
  'Validado': 'bg-green-100 text-green-700',
  'Rejeitado': 'bg-red-100 text-red-700',
  'Erro': 'bg-red-100 text-red-700',
};

export default function CadastroDocumentosTab({ documents }) {
  if (!documents.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <FileCheck className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum documento enviado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--pagsmile-blue)]/60">
          {documents.length} documento(s) • {documents.filter(d => d.validationStatus === 'Validado').length} validado(s)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--pagsmile-blue)] truncate">{doc.documentName || doc.fileName || 'Documento'}</p>
              <p className="text-xs text-[var(--pagsmile-blue)]/40 truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-[10px] ${STATUS_COLORS[doc.validationStatus] || STATUS_COLORS['Pendente']}`}>
                  {doc.validationStatus}
                </Badge>
                {doc.uploadDate && (
                  <span className="text-[10px] text-[var(--pagsmile-blue)]/40">
                    {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            {doc.fileUrl && (
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}