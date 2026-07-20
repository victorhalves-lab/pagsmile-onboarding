import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, X, Loader2, FileText } from 'lucide-react';
import { callPublicFunction } from '@/lib/publicApi';
import { toast } from 'sonner';

/**
 * Slot de upload de UM documento (ou múltiplos se multiple=true).
 * Recebe `value` (array de docs já anexados ao subseller para esse doc_type),
 * `onAdd(doc)` para adicionar e `onRemove(idx)` para remover.
 *
 * Cada doc final tem forma { doc_type, doc_label, file_uri, file_name, file_size, file_type }.
 */
const MAX_MB = 10;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function DocSlot({ token, docType, label, required, multiple, value = [], onAdd, onRemove }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`${file.name}: máximo ${MAX_MB}MB.`);
          continue;
        }
        const b64 = await fileToBase64(file);
        const res = await callPublicFunction('publicSubsellerInfoUpload', {
          token,
          fileBase64: b64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
        if (res?.ok && res.fileUri) {
          onAdd({
            doc_type: docType,
            doc_label: label,
            file_uri: res.fileUri,
            file_name: res.fileName,
            file_size: res.fileSize,
            file_type: res.fileType,
            uploaded_at: new Date().toISOString(),
          });
        } else {
          toast.error(res?.error || 'Falha no upload.');
        }
      }
    } catch (e) {
      toast.error(e?.message || 'Erro no upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const done = value.length > 0;

  return (
    <div className={`rounded-xl border p-3 transition-all ${done ? 'border-[#1356E2]/40 bg-[#1356E2]/5' : 'border-dashed border-[#0A0A0A]/15 bg-white'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {done ? (
            <CheckCircle2 className="w-4 h-4 text-[#1356E2] flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-[#0A0A0A]/40 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#0A0A0A] flex items-center gap-1">
              {label}
              {required && <span className="text-red-500">*</span>}
            </div>
            {multiple && (
              <div className="text-[10px] text-[#0A0A0A]/40">Pode enviar mais de um arquivo</div>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-7 px-2 text-[11px] flex-shrink-0"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
          {uploading ? '' : (done && !multiple ? 'Trocar' : 'Enviar')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          multiple={!!multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px] bg-white/60 rounded px-2 py-1">
              <span className="truncate text-[#0A0A0A]/80">{d.file_name}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-[#0A0A0A]/30 hover:text-red-500 ml-2"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}