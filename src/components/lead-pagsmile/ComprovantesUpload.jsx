import React, { useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callPublicFunction } from '@/lib/publicApi';
import { base44 } from '@/api/base44Client';

/**
 * Upload simples de comprovantes (propostas/extratos de outros players).
 * - Sem OCR, sem extração de dados, ZERO gasto de crédito.
 * - Apenas armazena arquivos via UploadFile e devolve URLs.
 * - Opcional. Múltiplos arquivos (até 5), 10MB cada.
 */

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ACCEPTED = '.pdf,.jpg,.jpeg,.png';

export default function ComprovantesUpload({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (files) => {
    setError(null);
    const fileList = Array.from(files || []);
    if (!fileList.length) return;

    const available = MAX_FILES - value.length;
    if (available <= 0) {
      setError(`Máximo de ${MAX_FILES} arquivos. Remova algum para enviar outro.`);
      return;
    }

    const toUpload = fileList.slice(0, available);
    const oversize = toUpload.find(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversize) {
      setError(`Arquivo "${oversize.name}" excede ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ name: file.name, url: file_url, size: file.size });
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError('Erro ao enviar arquivo. Tente novamente.');
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx) => {
    const updated = [...value];
    updated.splice(idx, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-dashed border-[#2bc196]/30 bg-[#2bc196]/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2bc196]/15 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#002443]">
              Anexar propostas ou extratos de outros players <span className="text-[#002443]/50 font-normal">(opcional)</span>
            </p>
            <p className="text-xs text-[#002443]/60 mt-1 leading-relaxed">
              Suba PDFs ou imagens com taxas que você já paga em outros processadores. Vai nos ajudar a fazer uma proposta ainda mais competitiva.
            </p>
            <p className="text-[10px] text-[#002443]/40 mt-1">
              PDF, JPG, PNG · até {MAX_FILES} arquivos · máx {MAX_SIZE_MB}MB cada
            </p>
          </div>
        </div>

        <label className="block">
          <input
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            disabled={uploading || value.length >= MAX_FILES}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading || value.length >= MAX_FILES}
            asChild
            className="w-full rounded-xl gap-2 cursor-pointer"
          >
            <span>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Enviando...' : value.length >= MAX_FILES ? 'Limite atingido' : 'Selecionar arquivos'}
            </span>
          </Button>
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Lista de arquivos enviados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#002443]/10">
              <CheckCircle className="w-4 h-4 text-[#2bc196] shrink-0" />
              <FileText className="w-4 h-4 text-[#002443]/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#002443] truncate">{f.name}</p>
                <p className="text-[10px] text-[#002443]/40">{(f.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[#002443]/30 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}