import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MultiFileUpload({ value, onChange, questionText, helpText }) {
  const [uploading, setUploading] = useState(false);
  
  // value is a JSON string of an array, or a single URL string, or empty
  const files = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Single URL string (legacy)
    if (typeof value === 'string' && value.startsWith('http')) return [value];
    return [];
  }, [value]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...files, file_url];
    onChange(updated);
    toast.success('Arquivo enviado!');
    setUploading(false);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : '');
  };

  return (
    <div className="space-y-3">
      {/* Uploaded files */}
      {files.map((url, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl">
          <CheckCircle className="w-5 h-5 text-[#2bc196] shrink-0" />
          <span className="text-sm font-medium text-[#002443] flex-1 truncate">
            Documento {i + 1}
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2bc196] underline shrink-0">
            Ver
          </a>
          <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Upload area */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#2bc196]/50 transition-colors">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          id="multi-file-upload"
          onChange={handleUpload}
          disabled={uploading}
        />
        <label htmlFor="multi-file-upload" className="cursor-pointer space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#2bc196] mx-auto animate-spin" />
              <p className="text-sm font-medium text-[#002443]/70">Enviando...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#2bc196]/10 flex items-center justify-center mx-auto">
                <Plus className="w-5 h-5 text-[#2bc196]" />
              </div>
              <p className="text-sm font-medium text-[#002443]/70">
                {files.length === 0 ? 'Clique para enviar arquivo' : 'Adicionar outro documento'}
              </p>
              <p className="text-xs text-[#002443]/40">PDF, PNG, JPG (máx. 10MB)</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
}