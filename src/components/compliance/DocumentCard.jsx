import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, AlertCircle, Trash2, Lock, Loader2, Upload,
  File, HelpCircle, MessageSquareWarning, Plus, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import FileThumbnail from './FileThumbnail';

/**
 * Individual document upload card.
 * - Supports MULTIPLE files per document (PDF / JPG / PNG / DOC / DOCX)
 * - Supports "Não tenho este documento" with written justification
 * - Shows per-file remove, file icon by type, size
 *
 * Expected `uploadedFile` shape (backward compatible):
 *   Legacy:   { url, name, size, type, uploadedAt }
 *   New:      { files: [{ url, name, size, type, uploadedAt }, ...] }
 *   NotAvail: { notAvailable: true, notAvailableReason: "..." }
 */

// Valid mime-types per extension — guards against renamed malicious files
const ALLOWED_MIME_BY_EXT = {
  PDF: ['application/pdf'],
  JPG: ['image/jpeg', 'image/jpg'],
  JPEG: ['image/jpeg', 'image/jpg'],
  PNG: ['image/png'],
  DOC: ['application/msword'],
  DOCX: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Documents that CANNOT be marked as "not available" — essential for KYC/identity
const MANDATORY_NO_SKIP = new Set([
  'doc_base_rg_cnh_frente',
  'doc_base_rg_cnh_verso',
  'doc_base_selfie_liveness',
  'doc_selfie_segurando_documento',
  'doc_base_contrato_social',
  'doc_base_comprovante_endereco',
]);

const DEFAULT_ALLOWED = ['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX'];

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name = '') {
  const ext = name.split('.').pop()?.toUpperCase();
  if (ext === 'PDF') return <FileText className="w-4 h-4 text-red-500" />;
  if (['DOC', 'DOCX'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

export default function DocumentCard({ doc, uploadedFile, onUpload, onRemoveAll, onRemoveSingle, onMarkNotAvailable, isUploading }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const docKey = doc._docKey || doc.documentTypeId || doc.id;

  // Normalize to files[] shape
  const files = Array.isArray(uploadedFile?.files)
    ? uploadedFile.files
    : uploadedFile?.url
    ? [{ url: uploadedFile.url, uri: uploadedFile.uri, isPrivate: uploadedFile.isPrivate, name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type, uploadedAt: uploadedFile.uploadedAt }]
    : [];

  const isNotAvailable = uploadedFile?.notAvailable === true;
  const hasAny = files.length > 0 || isNotAvailable;
  const canSkip = !MANDATORY_NO_SKIP.has(docKey);
  const allowedFormats = doc.allowedFormats || DEFAULT_ALLOWED;
  // IMPORTANT: Must align with MAX_FILE_SIZE_MB in lib/directUpload.js (hard cap=7MB due to
  // base64 overhead on JSON payload). Images >5MB are auto-compressed by the uploader,
  // but PDFs/DOCX cannot be compressed client-side — so the hard cap here protects the user
  // from selecting a file that will fail at upload time. 7MB is generous for KYC docs.
  const maxSizeMB = Math.min(doc.maxSizeMB || 7, 7);

  const validateAndUpload = (selected) => {
    if (selected.length === 0) return;

    const validFiles = [];
    for (const file of selected) {
      if (file.size < 1024) {
        toast.error(`${file.name}: arquivo vazio ou corrompido.`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const isPdf = /\.pdf$/i.test(file.name);
        const isDoc = /\.docx?$/i.test(file.name);
        const hint = isPdf
          ? ' Reduza o PDF (ex: smallpdf.com/compress-pdf) ou envie como foto JPG/PNG.'
          : isDoc
          ? ' Converta o arquivo para PDF e reduza o tamanho, ou envie como imagem.'
          : ' Use uma foto/imagem menor — imagens grandes são comprimidas automaticamente.';
        toast.error(`${file.name} (${sizeMB}MB) ultrapassa o limite de ${maxSizeMB}MB.${hint}`, { duration: 10000 });
        continue;
      }
      const fileExt = file.name.split('.').pop()?.toUpperCase();
      if (!allowedFormats.includes(fileExt)) {
        toast.error(`${file.name}: formato não permitido. Use: ${allowedFormats.join(', ')}`);
        continue;
      }
      const expectedMimes = ALLOWED_MIME_BY_EXT[fileExt] || [];
      if (expectedMimes.length > 0 && file.type && !expectedMimes.includes(file.type)) {
        toast.error(`${file.name}: extensão .${fileExt.toLowerCase()} mas conteúdo é ${file.type}.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onUpload(docKey, validFiles);
    }
  };

  const handleFilesSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    validateAndUpload(selected);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading || isNotAvailable) return;
    const dropped = Array.from(e.dataTransfer?.files || []);
    validateAndUpload(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading && !isNotAvailable) setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  // Border style
  const borderClass = isDragging
    ? 'border-[#2bc196] bg-[#2bc196]/5 ring-2 ring-[#2bc196]/20'
    : files.length > 0
    ? 'border-green-200 bg-green-50/50'
    : isNotAvailable
    ? 'border-amber-300 bg-amber-50/60'
    : doc.required
    ? 'border-amber-200 bg-amber-50/30'
    : 'border-slate-200 hover:border-slate-300';

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 ${borderClass}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {files.length > 0 ? (
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
        {files.length > 0 && (
          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
            {files.length} arquivo{files.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed">
        {doc.description || doc.instructions || 'Envie o documento solicitado'}
      </p>

      {/* ── State: files uploaded ── */}
      {files.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {files.map((f, idx) => (
            <div key={`${f.url}_${idx}`} className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-1.5">
              <FileThumbnail name={f.name} type={f.type} localFile={f._localFile} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#002443] truncate">{f.name}</p>
                <p className="text-[10px] text-slate-500">{formatSize(f.size)}</p>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => onRemoveSingle(docKey, idx)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Drag & drop hint ── */}
      {isDragging && (
        <div className="mb-3 py-3 border-2 border-dashed border-[#2bc196] rounded-lg bg-[#2bc196]/5 text-center">
          <Upload className="w-5 h-5 mx-auto text-[#2bc196] mb-1" />
          <p className="text-xs font-semibold text-[#2bc196]">Solte para enviar</p>
        </div>
      )}

      {/* ── State: not available ── */}
      {isNotAvailable && (
        <div className="space-y-2 mb-3">
          <div className="bg-white border border-amber-300 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Justificativa enviada:</p>
            <p className="text-xs text-[#002443]/80 leading-relaxed italic">"{uploadedFile.notAvailableReason}"</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Aguardando análise
            </span>
            <Button
              variant="ghost" size="sm"
              onClick={() => onRemoveAll(docKey)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-[11px]"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remover
            </Button>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFilesSelect}
        accept={allowedFormats.map(f => `.${f.toLowerCase()}`).join(',')}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        {!isNotAvailable && (
          <Button
            variant={files.length > 0 ? 'ghost' : 'outline'}
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="h-8 text-xs"
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : files.length > 0 ? (
              <Plus className="w-3 h-3 mr-1.5" />
            ) : (
              <Upload className="w-3 h-3 mr-2" />
            )}
            {files.length > 0 ? 'Adicionar mais' : 'Selecionar arquivo(s)'}
          </Button>
        )}

        {!hasAny && canSkip && doc.required && (
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

      {!canSkip && doc.required && !hasAny && (
        <p className="text-[10px] text-red-600/80 flex items-center gap-1 mt-2">
          <Lock className="w-2.5 h-2.5" /> Documento de identidade — envio obrigatório
        </p>
      )}

      {allowedFormats.length > 0 && !hasAny && (
        <p className="text-[10px] text-slate-400 mt-2">
          Aceita: {allowedFormats.join(', ')} · até {maxSizeMB}MB cada · imagens grandes são comprimidas automaticamente
        </p>
      )}
    </div>
  );
}