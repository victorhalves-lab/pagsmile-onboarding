import React, { useState } from 'react';
import { FileCheck, ExternalLink, Download, Link2, Copy, Check, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const STATUS_COLORS = {
  'Pendente': 'bg-gray-100 text-gray-700',
  'Validado': 'bg-green-100 text-green-700',
  'Rejeitado': 'bg-red-100 text-red-700',
  'Erro': 'bg-red-100 text-red-700',
};

function DocRequestLink({ latestCase }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!latestCase) return null;

  const generateToken = async () => {
    setGenerating(true);
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    await base44.entities.OnboardingCase.update(latestCase.id, { docLinkToken: token });
    latestCase.docLinkToken = token;
    setGenerating(false);
    toast.success('Token gerado com sucesso!');
  };

  const docLink = latestCase.docLinkToken
    ? `${window.location.origin}/ComplianceDocOnly?caseId=${latestCase.id}&token=${latestCase.docLinkToken}`
    : null;

  const handleCopy = () => {
    if (!docLink) return;
    navigator.clipboard.writeText(docLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!latestCase.docLinkToken) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generateToken}
        disabled={generating}
        className="text-xs gap-1.5"
      >
        <Link2 className="w-3.5 h-3.5" />
        {generating ? 'Gerando...' : 'Gerar Link de Documentos'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5">
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copiado!' : 'Copiar Link Docs'}
      </Button>
      <a href={docLink} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="sm" className="text-xs gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir
        </Button>
      </a>
    </div>
  );
}

export default function CadastroDocumentosTab({ documents, latestCase }) {
  if (!documents.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <FileCheck className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50 mb-4">Nenhum documento enviado</p>
        <DocRequestLink latestCase={latestCase} />
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--pagsmile-blue)]/60">
          {documents.length} documento(s) • {documents.filter(d => d.validationStatus === 'Validado').length} validado(s)
        </p>
        <DocRequestLink latestCase={latestCase} />
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