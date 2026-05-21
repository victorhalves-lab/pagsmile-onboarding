import React, { useState } from 'react';
import { FileCheck, ExternalLink, Copy, Check, Link as LinkIcon, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STATUS_COLORS = {
  'Pendente': 'bg-gray-100 text-gray-700',
  'Validado': 'bg-green-100 text-green-700',
  'Rejeitado': 'bg-red-100 text-red-700',
  'Erro': 'bg-red-100 text-red-700',
};

function DocRequestPanel({ latestCase, merchantEmail }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  // Gera link via backend `generateDocOnlyLink`: valida template + cria token seguro
  // e devolve URL no formato /PublicOnboarding?case=...&token=...&mode=docs_only
  // (fluxo "upload puro" — sem CAF, sem BDC, sem consumir créditos).
  const generateLink = async () => {
    if (!latestCase) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateDocOnlyLink', {
        caseId: latestCase.id,
        baseUrl: window.location.origin,
      });
      const data = res?.data || {};
      if (!data.success || !data.url) {
        toast.error(data.error || 'Falha ao gerar link.');
        return;
      }
      setDocUrl(data.url);
      toast.success(`Link gerado — ${data.requiredDocsCount} documento(s) requerido(s)`);
    } catch (err) {
      toast.error(err?.message || 'Erro ao gerar link.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!merchantEmail || !docUrl) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: merchantEmail,
      subject: 'Complemento de Documentos — Pagsmile',
      body: `<p>Olá,</p><p>Para dar continuidade ao seu processo de onboarding, precisamos que envie os documentos solicitados.</p><p><a href="${docUrl}" style="display:inline-block;padding:12px 24px;background:#2bc196;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Enviar Documentos</a></p><p>Se o botão não funcionar, copie e cole o link abaixo:</p><p>${docUrl}</p><p>Atenciosamente,<br/>Equipe Pagsmile</p>`,
    });
    setSending(false);
    toast.success(`E-mail enviado para ${merchantEmail}`);
  };

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">Solicitar Documentos ao Cliente</h3>
      </div>
      {!docUrl ? (
        <Button onClick={generateLink} disabled={generating || latestCase?.docCompleted} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
          {generating ? 'Gerando...' : 'Gerar Link de Documentos'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={docUrl}
              className="flex-1 text-xs bg-white border border-amber-300 rounded-lg px-3 py-2 text-[var(--pagsmile-blue)]/80 font-mono truncate"
            />
            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1 border-amber-300">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          {merchantEmail && (
            <Button onClick={handleSendEmail} disabled={sending} size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-700">
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Enviando...' : `Enviar por e-mail (${merchantEmail})`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CadastroDocumentosTab({ documents, latestCase, merchantEmail }) {
  if (!documents.length) {
    return (
      <div className="mt-4 space-y-4">
        {latestCase && (
          <DocRequestPanel latestCase={latestCase} merchantEmail={merchantEmail} />
        )}
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center">
          <FileCheck className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
          <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum documento enviado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {latestCase && !latestCase.docCompleted && (
        <DocRequestPanel latestCase={latestCase} merchantEmail={merchantEmail} />
      )}
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