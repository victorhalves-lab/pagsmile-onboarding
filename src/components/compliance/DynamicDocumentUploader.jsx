import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileUp, CheckCircle2, AlertCircle, Trash2,
  Shield, Lock, Loader2, Upload, File, HelpCircle, MessageSquareWarning
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentNotAvailableModal from './DocumentNotAvailableModal';

// Map of valid mime-types per extension — guards against renamed malicious files
const ALLOWED_MIME_BY_EXT = {
  PDF: ['application/pdf'],
  JPG: ['image/jpeg', 'image/jpg'],
  JPEG: ['image/jpeg', 'image/jpg'],
  PNG: ['image/png'],
};

// Documents that are ESSENTIAL for KYC/identity and CANNOT be marked as "not available".
// The client MUST send these. Business/financial docs can be skipped with justification.
const MANDATORY_NO_SKIP = new Set([
  'doc_base_rg_cnh_frente',
  'doc_base_rg_cnh_verso',
  'doc_base_selfie_liveness',
  'doc_selfie_segurando_documento',
  'doc_base_contrato_social',
  'doc_base_comprovante_endereco',
]);

function DocumentCard({ doc, uploadedFile, onUpload, onRemove, onMarkNotAvailable, isUploading }) {
  const inputRef = React.useRef(null);
  const isUploaded = !!uploadedFile?.url;
  const isNotAvailable = uploadedFile?.notAvailable === true;
  const hasAnyAction = isUploaded || isNotAvailable;
  const canSkip = !MANDATORY_NO_SKIP.has(doc.documentTypeId || doc._docKey);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < 1024) {
      toast.error('Arquivo muito pequeno ou corrompido. Envie o documento completo.');
      return;
    }

    const maxSize = (doc.maxSizeMB || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${doc.maxSizeMB || 10}MB`);
      return;
    }

    const allowedFormats = doc.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'];
    const fileExt = file.name.split('.').pop().toUpperCase();
    if (!allowedFormats.includes(fileExt)) {
      toast.error(`Formato não permitido. Use: ${allowedFormats.join(', ')}`);
      return;
    }

    const expectedMimes = ALLOWED_MIME_BY_EXT[fileExt] || [];
    if (expectedMimes.length > 0 && file.type && !expectedMimes.includes(file.type)) {
      toast.error(`Tipo de arquivo inválido: extensão .${fileExt.toLowerCase()} mas conteúdo é ${file.type}. Verifique o arquivo.`);
      return;
    }

    onUpload(doc._docKey || doc.documentTypeId || doc.id, file);
    e.target.value = '';
  };

  // ── Border styling ──
  const borderClass = isUploaded
    ? 'border-green-200 bg-green-50/50'
    : isNotAvailable
    ? 'border-amber-300 bg-amber-50/60'
    : doc.required
    ? 'border-amber-200 bg-amber-50/30'
    : 'border-slate-200 hover:border-slate-300';

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 ${borderClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isUploaded ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : isNotAvailable ? (
              <MessageSquareWarning className="w-5 h-5 text-amber-600 shrink-0" />
            ) : doc.required ? (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <File className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <h4 className="font-semibold text-[#002443] text-sm truncate">
              {doc.label || doc.name}
              {doc.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
          </div>

          <p className="text-xs text-slate-500 mb-3 line-clamp-2">
            {doc.description || doc.instructions || 'Envie o documento solicitado'}
          </p>

          {/* State: uploaded */}
          {isUploaded && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full truncate max-w-[200px]">
                {uploadedFile.name}
              </span>
              <Button
                variant="ghost" size="sm"
                onClick={() => onRemove(doc._docKey || doc.documentTypeId || doc.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* State: not available (justified) */}
          {isNotAvailable && (
            <div className="space-y-2">
              <div className="bg-white border border-amber-300 rounded-lg p-2.5">
                <p className="text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Justificativa enviada:</p>
                <p className="text-xs text-[#002443]/80 leading-relaxed italic">"{uploadedFile.notAvailableReason}"</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Aguardando análise do compliance
                </span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onRemove(doc._docKey || doc.documentTypeId || doc.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* State: no action yet */}
          {!hasAnyAction && (
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="file"
                onChange={handleFileSelect}
                accept={(doc.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG']).map(f => `.${f.toLowerCase()}`).join(',')}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                  className="h-8 text-xs"
                >
                  {isUploading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Upload className="w-3 h-3 mr-2" />}
                  Selecionar Arquivo
                </Button>

                {canSkip && doc.required && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => onMarkNotAvailable(doc)}
                    disabled={isUploading}
                    className="h-8 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <HelpCircle className="w-3 h-3 mr-1.5" />
                    Não tenho este documento
                  </Button>
                )}
              </div>

              {!canSkip && doc.required && (
                <p className="text-[10px] text-red-600/80 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Documento de identidade — envio obrigatório
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
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

  // Filter conditional docs by formData
  const allDocs = (template?.requiredDocuments || []).map((doc, index) => ({
    ...doc,
    _docKey: doc.documentTypeId || doc.id || `doc_${index}_${(doc.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
  }));
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

  // Persist docs to localStorage whenever they change
  useEffect(() => {
    if (storageKey && documents && Object.keys(documents).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(documents));
    }
  }, [documents, storageKey]);

  const handleUpload = async (docId, file) => {
    setUploadingDoc(docId);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setDocuments(prev => ({
        ...prev,
        [docId]: {
          url: file_uri, uri: file_uri, isPrivate: true,
          name: file.name, size: file.size, type: file.type,
          uploadedAt: new Date().toISOString(),
          notAvailable: false,
        },
      }));
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleRemove = (docId) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  const handleOpenNotAvailable = (doc) => {
    setNotAvailableModal({ open: true, doc });
  };

  const handleConfirmNotAvailable = (reason) => {
    const doc = notAvailableModal.doc;
    if (!doc) return;
    const docId = doc._docKey || doc.documentTypeId || doc.id;
    setDocuments(prev => ({
      ...prev,
      [docId]: {
        url: '',
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

  // A mandatory doc is "satisfied" if uploaded OR marked as notAvailable (with reason)
  const isDocSatisfied = (d) => {
    const entry = documents[d._docKey || d.documentTypeId || d.id];
    if (!entry) return false;
    if (entry.url) return true;
    if (entry.notAvailable && entry.notAvailableReason) return true;
    return false;
  };

  useEffect(() => {
    if (onAllRequiredUploaded) {
      const allDone = mandatoryDocs.length === 0 || mandatoryDocs.every(isDocSatisfied);
      onAllRequiredUploaded(allDone);
    }
  }, [onAllRequiredUploaded, documents, mandatoryDocs]);

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
      <div className="bg-white rounded-xl border border-slate-200 p-4">
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

      {/* Info banner about "not available" option */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#002443] mb-1">Não tem algum documento?</p>
          <p className="text-xs text-[#002443]/70 leading-relaxed">
            Em alguns documentos, você pode clicar em <strong>"Não tenho este documento"</strong> e explicar o motivo.
            Nossa equipe de compliance analisará sua justificativa.
            <strong className="text-amber-700"> Atenção:</strong> documentos de identidade (RG/CNH, selfie, contrato social) são obrigatórios e não podem ser substituídos por justificativa.
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
                onRemove={handleRemove}
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
                onRemove={handleRemove}
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
            Todos os arquivos são criptografados e armazenados em ambiente seguro,
            acessíveis apenas pela equipe de compliance.
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
              <li>Formatos aceitos: <strong>PDF, JPG, PNG</strong></li>
              <li>Tamanho máximo: <strong>10MB</strong> por arquivo</li>
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