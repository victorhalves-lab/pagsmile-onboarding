import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  FileUp, AlertCircle, Shield, Lock, File, HelpCircle, MessageSquareWarning
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentNotAvailableModal from './DocumentNotAvailableModal';
import DocumentCard from './DocumentCard';
import { directUploadDocument } from '@/lib/directUpload';
import { compressImageIfNeeded } from '@/lib/imageCompression';
import { logSubsellerError } from '@/lib/subsellerErrorLogger';

/**
 * BULLETPROOF Multi-file document uploader.
 *
 * KEY DIFFERENCE FROM DynamicDocumentUploader:
 *   - This uploader uses `directUploadDocument` (raw XHR → publicDirectDocUpload function).
 *   - ZERO dependency on the Base44 SDK for the upload itself — eliminates all known
 *     SDK-related failure modes on public/unauthenticated routes.
 *   - The server creates the DocumentUpload entity AND triggers CAF VerifAI as part of
 *     the upload response. There is no separate "save documents" call afterwards.
 *
 * Required props:
 *   - template      (template with requiredDocuments[])
 *   - documents     (state: { [docKey]: entry })
 *   - setDocuments  (setter)
 *   - storageKey    (localStorage key for offline persistence)
 *   - caseId        (OnboardingCase ID)
 *   - docLinkToken  (security token for the public link — required for ComplianceDocOnly)
 *   - onAllRequiredUploaded (callback invoked with boolean)
 *   - formData      (for conditional-logic doc filtering)
 *
 * Storage shape per doc (unchanged from legacy — for backward compatibility in review screens):
 *   { files: [{ url, uri, isPrivate, name, size, type, uploadedAt, documentUploadId }, ...],
 *     persisted: true }
 *   OR
 *   { notAvailable: true, notAvailableReason: "...", uploadedAt, persisted: true }
 *
 * IMPORTANT: Because the server creates DocumentUpload rows as each file lands, the
 * parent page's final submit step should SKIP re-posting via publicComplianceDocUpload.
 * Use the `persisted: true` flag to detect already-saved entries.
 */
export default function BulletproofDocumentUploader(props = {}) {
  const {
    template,
    documents = {},
    setDocuments = () => {},
    storageKey,
    caseId,
    docLinkToken,
    onAllRequiredUploaded,
    formData = {},
  } = props || {};
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [notAvailableModal, setNotAvailableModal] = useState({ open: false, doc: null });

  // Validate template/caseId BEFORE anything else — if invalid, don't even try to render docs.
  const isTemplateValid = !!(template && typeof template === 'object' && Array.isArray(template.requiredDocuments));
  const isCaseValid = !!caseId;

  // CRITICAL: memoize doc lists so each DocumentCard receives a STABLE `doc` prop
  // reference across renders. Without this, `allDocs.map` on every render creates
  // fresh objects, defeating React.memo on DocumentCard — so every keystroke /
  // upload re-renders all 12 cards. That is what made the page "pesada e trava".
  const allDocs = useMemo(() => (
    (template?.requiredDocuments || []).map((doc, index) => ({
      ...doc,
      _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
    }))
  ), [template]);

  const requiredDocs = useMemo(() => allDocs.filter(doc => {
    if (!doc.conditionalLogic) return true;
    const { dependsOn, value, operator } = doc.conditionalLogic;
    if (!dependsOn || !formData) return true;
    const fieldValue = formData[dependsOn];
    if (operator === 'equals') return fieldValue === value;
    if (operator === 'contains') return String(fieldValue || '').includes(value);
    return true;
  }), [allDocs, formData]);

  // ── Load from localStorage ONCE on mount only ──
  // CRITICAL BUG FIX (2026-04-22): This useEffect used to depend on [storageKey, setDocuments].
  // `setDocuments` changes reference on every parent render, causing this effect to re-run
  // MID-UPLOAD and overwrite fresh in-memory state with stale localStorage data — making
  // successfully uploaded files appear to vanish from the UI. Clients then re-uploaded the
  // same doc 3-4 times (see Omega Pay case 69e65d61f5e31d7556f62ebc — 7 uploads across 5h).
  // The ref-based guard ensures this runs exactly once per storageKey.
  const hasLoadedRef = React.useRef(null);
  useEffect(() => {
    if (!storageKey) return;
    if (hasLoadedRef.current === storageKey) return; // already loaded for this key
    hasLoadedRef.current = storageKey;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if current state is empty — never overwrite in-flight uploads
        setDocuments(prev => (prev && Object.keys(prev).length > 0) ? prev : parsed);
      }
    } catch (e) {
      console.warn('[BulletproofUploader] load from localStorage failed:', e?.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced localStorage write — previously ran synchronously on every `documents`
  // mutation, which stacks up and blocks the main thread after 6-8 uploads
  // (JSON.stringify of the whole documents map on every keystroke in any sibling field).
  const saveTimerRef = React.useRef(null);
  useEffect(() => {
    if (!storageKey || !documents || Object.keys(documents).length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(documents));
      } catch (e) {
        console.warn('[BulletproofUploader] localStorage.setItem failed:', e?.message);
      }
    }, 400);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [documents, storageKey]);

  // ── Upload handler: processes each file independently; one failure never aborts others ──
  const handleUpload = React.useCallback(async (docId, filesList) => {
    const fileArray = Array.isArray(filesList) ? filesList : [filesList];
    if (fileArray.length === 0) return;
    if (!caseId) {
      logSubsellerError({
        stage: 'upload_no_case_id',
        message: 'Tentativa de upload sem caseId disponível',
        context: { documentTypeId: docId, fileCount: fileArray.length },
      });
      toast.error(
        'Seu cadastro ainda não foi preparado para receber documentos. ' +
        'Recarregue a página e tente novamente — seus dados estão salvos.',
        { duration: 10000 }
      );
      return;
    }

    const docDef = allDocs.find(d => d._docKey === docId);
    const documentName = docDef?.label || docDef?.name || docId;

    setUploadingDoc(docId);
    const uploadedFiles = [];
    const failedFiles = [];

    for (const original of fileArray) {
      try {
        // Compress images >5MB to stay within the 7MB JSON payload limit
        let toUpload = original;
        try {
          toUpload = await compressImageIfNeeded(original, 5);
        } catch (compressErr) {
          console.warn('[BulletproofUploader] compression failed, using original:', compressErr?.message);
          toUpload = original;
        }

        const result = await directUploadDocument({
          file: toUpload,
          caseId,
          documentTypeId: docId,
          documentName,
          docLinkToken,
        });
        if (!result?.ok) throw new Error(result?.error || 'resposta inválida do servidor');

        // IMPORTANT: do NOT keep the raw File object in state.
        // It gets serialized to localStorage and sent in the autosave payload,
        // which freezes the main thread ("Página sem resposta") after a few
        // uploads because JSON.stringify on large File references is O(n) huge.
        uploadedFiles.push({
          url: result.fileUri,
          uri: result.fileUri,
          isPrivate: true,
          name: toUpload.name || original.name,
          size: toUpload.size || original.size,
          type: toUpload.type || original.type,
          uploadedAt: new Date().toISOString(),
          documentUploadId: result.documentUploadId,
          persisted: true,
        });
      } catch (err) {
        console.error('[BulletproofUploader] upload failed for', original?.name, err);
        const errMsg = err?.message || 'falha desconhecida';
        failedFiles.push({
          name: original?.name || 'arquivo',
          error: errMsg,
        });
        // Logger centralizado — substitui o fetch manual que estava duplicado
        logSubsellerError({
          stage: 'upload_file_failed',
          message: errMsg,
          context: {
            documentTypeId: docId,
            documentName,
            fileName: original?.name || null,
            fileSize: typeof original?.size === 'number' ? original.size : null,
            fileType: original?.type || null,
            caseId,
          },
        });
      }
    }

    if (uploadedFiles.length > 0) {
      setDocuments(prev => {
        const existing = prev[docId];
        const existingFiles = Array.isArray(existing?.files)
          ? existing.files
          : existing?.url
          ? [{ url: existing.url, uri: existing.uri, isPrivate: existing.isPrivate, name: existing.name, size: existing.size, type: existing.type, uploadedAt: existing.uploadedAt, documentUploadId: existing.documentUploadId, persisted: existing.persisted }]
          : [];
        return {
          ...prev,
          [docId]: {
            files: [...existingFiles, ...uploadedFiles],
            url: existingFiles[0]?.url || uploadedFiles[0]?.url,
            uri: existingFiles[0]?.uri || uploadedFiles[0]?.uri,
            isPrivate: true,
            name: existingFiles[0]?.name || uploadedFiles[0]?.name,
            size: existingFiles[0]?.size || uploadedFiles[0]?.size,
            type: existingFiles[0]?.type || uploadedFiles[0]?.type,
            uploadedAt: existingFiles[0]?.uploadedAt || uploadedFiles[0]?.uploadedAt,
            notAvailable: false,
            persisted: true,
          },
        };
      });
      toast.success(`${uploadedFiles.length} arquivo${uploadedFiles.length > 1 ? 's' : ''} enviado${uploadedFiles.length > 1 ? 's' : ''} com sucesso!`);
    }

    if (failedFiles.length > 0) {
      const names = failedFiles.map(f => f.name).join(', ');
      const firstError = failedFiles[0].error;
      // Mensagem específica baseada no tipo de erro detectado
      let friendlyHint = 'Tente novamente. Se persistir, use outro navegador ou verifique sua conexão.';
      const lowerErr = firstError.toLowerCase();
      if (lowerErr.includes('muito grande') || lowerErr.includes('too large')) {
        friendlyHint = 'O arquivo está acima do limite de 7MB. Comprima a imagem ou divida o PDF antes de enviar.';
      } else if (lowerErr.includes('network') || lowerErr.includes('failed to fetch') || lowerErr.includes('timeout')) {
        friendlyHint = 'Falha de conexão. Verifique sua internet (Wi-Fi/4G) e tente novamente.';
      } else if (lowerErr.includes('tipo') || lowerErr.includes('invalid file')) {
        friendlyHint = 'Tipo de arquivo não aceito. Envie apenas PDF, JPG ou PNG.';
      }
      toast.error(
        `❌ Falha no envio de ${failedFiles.length} arquivo(s): ${names}.\n\n` +
        `Motivo: ${firstError}\n\n` +
        `${friendlyHint}`,
        { duration: 15000 }
      );
    }

    setUploadingDoc(null);
  }, [caseId, docLinkToken, allDocs, setDocuments]);

  const handleRemoveAll = React.useCallback((docId) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  }, [setDocuments]);

  const handleRemoveSingle = React.useCallback((docId, fileIndex) => {
    setDocuments(prev => {
      const entry = prev[docId];
      if (!entry) return prev;
      const files = Array.isArray(entry.files) ? entry.files : [];
      const nextFiles = files.filter((_, i) => i !== fileIndex);
      if (nextFiles.length === 0) {
        const copy = { ...prev };
        delete copy[docId];
        return copy;
      }
      return {
        ...prev,
        [docId]: {
          ...entry,
          files: nextFiles,
          url: nextFiles[0].url,
          uri: nextFiles[0].uri,
          name: nextFiles[0].name,
          size: nextFiles[0].size,
          type: nextFiles[0].type,
          uploadedAt: nextFiles[0].uploadedAt,
          documentUploadId: nextFiles[0].documentUploadId,
        },
      };
    });
  }, [setDocuments]);

  const handleOpenNotAvailable = React.useCallback((doc) => setNotAvailableModal({ open: true, doc }), []);

  const handleConfirmNotAvailable = React.useCallback(async (reason) => {
    const doc = notAvailableModal.doc;
    if (!doc) return;
    const docId = doc._docKey || doc.documentTypeId || doc.id;
    const documentName = doc.label || doc.name || docId;

    setNotAvailableModal({ open: false, doc: null });
    setUploadingDoc(docId);

    try {
      const result = await directUploadDocument({
        file: null,
        caseId,
        documentTypeId: docId,
        documentName,
        docLinkToken,
        notAvailable: true,
        notAvailableReason: reason,
      });
      if (!result?.ok) throw new Error(result?.error || 'resposta inválida do servidor');

      setDocuments(prev => ({
        ...prev,
        [docId]: {
          url: '',
          files: [],
          notAvailable: true,
          notAvailableReason: reason,
          uploadedAt: new Date().toISOString(),
          documentUploadId: result.documentUploadId,
          persisted: true,
        },
      }));
      toast.success('Justificativa registrada. Nossa equipe irá analisar.');
    } catch (err) {
      const errMsg = err?.message || 'erro desconhecido';
      logSubsellerError({
        stage: 'not_available_register_failed',
        message: errMsg,
        context: { documentTypeId: docId, documentName, caseId, reasonLength: (reason || '').length },
      });
      toast.error(
        `Não conseguimos registrar sua justificativa.\n\nMotivo: ${errMsg}\n\nTente de novo em alguns segundos. Se persistir, recarregue a página.`,
        { duration: 12000 }
      );
    } finally {
      setUploadingDoc(null);
    }
  }, [notAvailableModal.doc, caseId, docLinkToken, setDocuments]);

  const mandatoryDocs = useMemo(() => requiredDocs.filter(d => d.required), [requiredDocs]);
  const optionalDocs = useMemo(() => requiredDocs.filter(d => !d.required), [requiredDocs]);

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

  // Guard: template missing or malformed — show a clear message instead of trying to render.
  if (!isTemplateValid || !isCaseValid) {
    return (
      <div className="text-center py-8 text-slate-500">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
        <p className="font-medium text-[#002443]">Aguardando configuração do caso…</p>
        <p className="text-xs mt-2 text-slate-400">
          Se esta mensagem persistir, recarregue a página ou solicite um novo link ao seu consultor.
        </p>
      </div>
    );
  }

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
              <li>Formatos aceitos: <strong>PDF, JPG e PNG</strong> <span className="text-amber-700">(Word/DOCX não é aceito)</span></li>
              <li>Tamanho máximo: <strong>7MB</strong> por arquivo</li>
              <li>Você pode enviar <strong>vários arquivos</strong> por tipo de documento</li>
              <li>Documentos devem estar legíveis e dentro da validade</li>
              <li className="text-[11px] text-slate-400">Se tiver um arquivo em Word, exporte como PDF antes de enviar</li>
            </ul>
          </div>
        </div>
      </div>

      <DocumentNotAvailableModal
        open={notAvailableModal.open}
        onOpenChange={(o) => setNotAvailableModal({ open: o, doc: o ? notAvailableModal.doc : null })}
        doc={notAvailableModal.doc}
        onConfirm={handleConfirmNotAvailable}
      />
    </div>
  );
}