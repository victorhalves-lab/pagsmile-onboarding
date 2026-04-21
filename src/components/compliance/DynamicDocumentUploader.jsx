import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';
import {
  FileUp, AlertCircle, Shield, Lock, File, HelpCircle, MessageSquareWarning
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentNotAvailableModal from './DocumentNotAvailableModal';
import DocumentCard from './DocumentCard';

/**
 * Multi-file document uploader with per-document actions:
 * - Upload multiple files (PDF, JPG, PNG, DOC, DOCX)
 * - Mark as "not available" with written justification
 * - Auto-save progress to localStorage + server (via parent)
 *
 * Storage shape per doc:
 *   { files: [{ url, uri, isPrivate, name, size, type, uploadedAt }, ...] }
 *   OR
 *   { notAvailable: true, notAvailableReason: "...", uploadedAt }
 */
export default function DynamicDocumentUploader({
  template,
  documents,
  setDocuments,
  storageKey,
  onAllRequiredUploaded,
  formData,
}) {
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [notAvailableModal, setNotAvailableModal] = useState({ open: false, doc: null });

  // Expand template docs with a stable key
  const allDocs = (template?.requiredDocuments || []).map((doc, index) => ({
    ...doc,
    _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
  }));

  // Filter by conditional logic
  const requiredDocs = allDocs.filter(doc => {
    if (!doc.conditionalLogic) return true;
    const { dependsOn, value, operator } = doc.conditionalLogic;
    if (!dependsOn || !formData) return true;
    const fieldValue = formData[dependsOn];
    if (operator === 'equals') return fieldValue === value;
    if (operator === 'contains') return String(fieldValue || '').includes(value);
    return true;
  });

  // Load saved docs from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        try { setDocuments(JSON.parse(savedDocs)); } catch (e) { console.error('Erro ao carregar documentos salvos:', e); }
      }
    }
  }, [storageKey, setDocuments]);

  // Persist to localStorage whenever docs change
  useEffect(() => {
    if (storageKey && documents && Object.keys(documents).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(documents));
    }
  }, [documents, storageKey]);

  // ── Upload multiple files at once ──
  const handleUpload = async (docId, filesList) => {
    const fileArray = Array.isArray(filesList) ? filesList : [filesList];
    setUploadingDoc(docId);
    try {
      const uploadedFiles = [];
      for (const file of fileArray) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uploadedFiles.push({
          url: file_uri,
          uri: file_uri,
          isPrivate: true,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        });
      }
      setDocuments(prev => {
        const existing = prev[docId];
        const existingFiles = Array.isArray(existing?.files)
          ? existing.files
          : existing?.url
          ? [{ url: existing.url, uri: existing.uri, isPrivate: existing.isPrivate, name: existing.name, size: existing.size, type: existing.type, uploadedAt: existing.uploadedAt }]
          : [];
        return {
          ...prev,
          [docId]: {
            files: [...existingFiles, ...uploadedFiles],
            // Keep backward-compat fields pointing to the FIRST file
            url: existingFiles[0]?.url || uploadedFiles[0]?.url,
            uri: existingFiles[0]?.uri || uploadedFiles[0]?.uri,
            isPrivate: true,
            name: existingFiles[0]?.name || uploadedFiles[0]?.name,
            size: existingFiles[0]?.size || uploadedFiles[0]?.size,
            type: existingFiles[0]?.type || uploadedFiles[0]?.type,
            uploadedAt: existingFiles[0]?.uploadedAt || uploadedFiles[0]?.uploadedAt,
            notAvailable: false,
          },
        };
      });
      toast.success(`${uploadedFiles.length} arquivo${uploadedFiles.length > 1 ? 's' : ''} enviado${uploadedFiles.length > 1 ? 's' : ''}!`);
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Remove all files / entire entry
  const handleRemoveAll = (docId) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  // Remove a single file from the files[] array
  const handleRemoveSingle = (docId, fileIndex) => {
    setDocuments(prev => {
      const entry = prev[docId];
      if (!entry) return prev;
      const files = Array.isArray(entry.files)
        ? entry.files
        : entry.url
        ? [{ url: entry.url, uri: entry.uri, isPrivate: entry.isPrivate, name: entry.name, size: entry.size, type: entry.type, uploadedAt: entry.uploadedAt }]
        : [];
      const nextFiles = files.filter((_, i) => i !== fileIndex);
      if (nextFiles.length === 0) {
        const copy = { ...prev };
        delete copy[docId];
        return copy;
      }
      return {
        ...prev,
        [docId]: {
          files: nextFiles,
          url: nextFiles[0].url,
          uri: nextFiles[0].uri,
          isPrivate: true,
          name: nextFiles[0].name,
          size: nextFiles[0].size,
          type: nextFiles[0].type,
          uploadedAt: nextFiles[0].uploadedAt,
        },
      };
    });
  };

  const handleOpenNotAvailable = (doc) => setNotAvailableModal({ open: true, doc });

  const handleConfirmNotAvailable = (reason) => {
    const doc = notAvailableModal.doc;
    if (!doc) return;
    const docId = doc._docKey || doc.documentTypeId || doc.id;
    setDocuments(prev => ({
      ...prev,
      [docId]: {
        url: '',
        files: [],
        notAvailable: true,
        notAvailableReason: reason,
        uploadedAt: new Date().toISOString(),
      },
    }));
    setNotAvailableModal({ open: false, doc: null });
    toast.success('Justificativa registrada. Nossa equipe irá analisar.');
  };

  const mandatoryDocs = requiredDocs.filter(d => d.required);
  const optionalDocs = requiredDocs.filter(d => !d.required);

  // A doc is "satisfied" if it has files OR is marked notAvailable with reason
  const isDocSatisfied = (d) => {
    const entry = documents[d._docKey || d.documentTypeId || d.id];
    if (!entry) return false;
    const hasFiles = Array.isArray(entry.files) ? entry.files.length > 0 : !!entry.url;
    if (hasFiles) return true;
    if (entry.notAvailable && entry.notAvailableReason) return true;
    return false;
  };

  useEffect(() => {
    if (onAllRequiredUploaded) {
      const allDone = mandatoryDocs.length === 0 || mandatoryDocs.every(isDocSatisfied);
      onAllRequiredUploaded(allDone);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, mandatoryDocs.length]);

  const totalRequired = mandatoryDocs.length;
  const mandatorySatisfied = mandatoryDocs.filter(isDocSatisfied).length;
  const mandatoryJustified = mandatoryDocs.filter(d => {
    const e = documents[d._docKey || d.documentTypeId || d.id];
    return e?.notAvailable === true;
  }).length;
  const progress = totalRequired === 0 ? 100 : Math.round((mandatorySatisfied / totalRequired) * 100);

  if (requiredDocs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p>Nenhum documento configurado para este questionário.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-2 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#002443]">Progresso do Envio</span>
          <span className="text-sm font-semibold text-[#2bc196]">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>{mandatorySatisfied} de {totalRequired} documentos obrigatórios resolvidos</span>
          {mandatoryJustified > 0 && (
            <span className="text-amber-700 font-medium flex items-center gap-1">
              <MessageSquareWarning className="w-3 h-3" /> {mandatoryJustified} com justificativa
            </span>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#002443] mb-1">Não tem algum documento?</p>
          <p className="text-xs text-[#002443]/70 leading-relaxed">
            Em alguns documentos você pode clicar em <strong>"Não tenho este documento"</strong> e escrever uma justificativa.
            Nossa equipe de compliance analisará seu caso.
            <strong className="text-amber-700"> Importante:</strong> RG/CNH, selfie, contrato social e comprovante de endereço são obrigatórios e não podem ser substituídos por justificativa.
          </p>
        </div>
      </div>

      {mandatoryDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Documentos Obrigatórios ({mandatoryDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mandatoryDocs.map((doc) => (
              <DocumentCard
                key={doc._docKey}
                doc={doc}
                uploadedFile={documents[doc._docKey]}
                onUpload={handleUpload}
                onRemoveAll={handleRemoveAll}
                onRemoveSingle={handleRemoveSingle}
                onMarkNotAvailable={handleOpenNotAvailable}
                isUploading={uploadingDoc === doc._docKey}
              />
            ))}
          </div>
        </div>
      )}

      {optionalDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
            <File className="w-4 h-4 text-slate-400" />
            Documentos Opcionais ({optionalDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalDocs.map((doc) => (
              <DocumentCard
                key={doc._docKey}
                doc={doc}
                uploadedFile={documents[doc._docKey]}
                onUpload={handleUpload}
                onRemoveAll={handleRemoveAll}
                onRemoveSingle={handleRemoveSingle}
                onMarkNotAvailable={handleOpenNotAvailable}
                isUploading={uploadingDoc === doc._docKey}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#002443]/60 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#002443]">Seus documentos estão seguros</p>
          <p className="text-xs text-[#002443]/60 mt-1">
            Todos os arquivos são criptografados e armazenados em ambiente seguro, acessíveis apenas pela equipe de compliance.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h4 className="font-medium text-[#002443] text-sm">Requisitos dos Arquivos</h4>
            <ul className="text-sm text-slate-500 mt-1 space-y-1 list-disc pl-4">
              <li>Formatos aceitos: <strong>PDF, JPG, PNG, DOC, DOCX</strong></li>
              <li>Tamanho máximo: <strong>15MB</strong> por arquivo</li>
              <li>Você pode enviar <strong>vários arquivos</strong> por tipo de documento</li>
              <li>Documentos devem estar legíveis e dentro da validade</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Not Available justification modal */}
      <DocumentNotAvailableModal
        open={notAvailableModal.open}
        onOpenChange={(o) => setNotAvailableModal({ open: o, doc: o ? notAvailableModal.doc : null })}
        doc={notAvailableModal.doc}
        onConfirm={handleConfirmNotAvailable}
      />
    </div>
  );
}