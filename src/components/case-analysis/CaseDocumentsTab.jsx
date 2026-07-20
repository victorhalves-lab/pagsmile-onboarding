import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Eye, Archive, Lock, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { base44 } from '@/api/base44Client';
import CafDocsSection from './CafDocsSection';
import RequestPendencyModal from './RequestPendencyModal';

// Resolve a readable URL based on the URI scheme (NOT the isPrivate flag, which is
// frequently incorrect in legacy records). Logic mirrors what the backend already does:
//  - "supabase://..."        → Supabase Storage, needs signed URL
//  - "mp/private/..." / "b44s://..." → Base44 legacy private, needs signed URL
//  - anything else (https://...)    → already a public absolute URL
async function resolveDocUrl(doc) {
  if (!doc) return null;
  const raw = doc.fileUri || doc.fileUrl;
  if (!raw || typeof raw !== 'string') return null;

  // Caso 1: URL HTTP(S) absoluta — abre direto, não precisa do backend.
  // Cobre os docs CAF SDK antigos salvos em https://base44.app/.../files/mp/public/...
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Caso 2: URI privada (Supabase nova OU Base44 legada) — precisa signed URL.
  try {
    const res = await base44.functions.invoke('getPrivateDocumentUrl', {
      file_uri: raw,
      documentUploadId: doc.id,
      expiresIn: 600,
    });
    return res.data?.signed_url || null;
  } catch (e) {
    console.warn('Signed URL failed:', e?.message);
    return null;
  }
}

export default function CaseDocumentsTab({ documents, caseId, merchantName, integrationLogs = [], onboardingCase, merchant, onRefetch }) {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [pendencyModalOpen, setPendencyModalOpen] = useState(false);

  // Gate: só permite solicitar pendências em casos manuais ou já com pendência ativa
  const canRequestPendency = onboardingCase &&
    ['Manual', 'Docs Solicitados'].includes(onboardingCase.status);

  // ZIP é montado no backend (downloadCaseDocuments) — único lugar que sabe resolver
  // os 3 tipos de armazenamento (Supabase, Base44 legado privado, Base44 público antigo).
  // Antes o fetch era feito no browser, o que falhava para URIs supabase:// e mp/private/.
  const handleDownloadAllDocuments = async () => {
    if (!caseId) {
      toast.error('ID do caso indisponível.');
      return;
    }
    setIsDownloadingZip(true);
    setDownloadProgress('Preparando arquivos no servidor…');
    try {
      const res = await base44.functions.invoke('downloadCaseDocuments', {
        onboardingCaseId: caseId,
      }, { responseType: 'blob' });

      // Algumas versões do SDK retornam blob direto; outras embrulham em { data }.
      let blob = res?.data instanceof Blob ? res.data : res instanceof Blob ? res : null;
      if (!blob && res?.data) {
        // Fallback: arraybuffer/uint8array
        blob = new Blob([res.data], { type: 'application/zip' });
      }
      if (!blob || blob.size === 0) {
        throw new Error('Servidor retornou ZIP vazio.');
      }
      saveAs(blob, `documentos_${merchantName || caseId}.zip`);
      toast.success('ZIP baixado com sucesso!');
    } catch (err) {
      console.error('Falha ao baixar ZIP:', err);
      toast.error(`Não foi possível baixar o ZIP: ${err?.message || 'erro desconhecido'}`);
    } finally {
      setIsDownloadingZip(false);
      setDownloadProgress('');
    }
  };

  return (
    <div className="space-y-0">
      {/* Seção Docs CAF (imagens + metadados da última tentativa) */}
      <CafDocsSection documents={documents} integrationLogs={integrationLogs} />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-[var(--pinbank-blue)]">Documentos Enviados pelo Cliente</h3>
        <div className="flex items-center gap-2">
          {canRequestPendency && (
            <Button
              size="sm"
              onClick={() => setPendencyModalOpen(true)}
              className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue-dark)] text-white gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              Solicitar Pendências
            </Button>
          )}
          {documents.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAllDocuments} disabled={isDownloadingZip}>
              {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
              {isDownloadingZip ? `Baixando ${downloadProgress}` : 'Baixar Todos (ZIP)'}
            </Button>
          )}
        </div>
      </div>
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-[var(--pinbank-blue)]/70 font-medium">Nenhum documento enviado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <FileText className="w-6 h-6 text-[var(--pinbank-blue)]/70" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--pinbank-blue)]">{doc.documentName || doc.fileName}</p>
                  <p className="text-sm text-[var(--pinbank-blue)]/70 font-medium">
                    {doc.fileType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                  </p>
                  {doc.uploadDate && (
                    <p className="text-xs text-[var(--pinbank-blue)]/60 font-medium mt-1">
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
                {(doc.fileUrl || doc.fileUri) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // FIX LGPD (2026-04-21): docs privados → signed URL on-click
                      const url = await resolveDocUrl(doc);
                      if (!url) {
                        toast.error('Não foi possível gerar o link do documento.');
                        return;
                      }
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {doc.isPrivate ? <Lock className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    Ver
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {canRequestPendency && (
        <RequestPendencyModal
          open={pendencyModalOpen}
          onClose={() => setPendencyModalOpen(false)}
          onboardingCase={onboardingCase}
          merchant={merchant}
          onSuccess={() => onRefetch?.()}
        />
      )}
    </div>
  );
}