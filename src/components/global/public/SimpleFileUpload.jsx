import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Upload de arquivo simples usando integrations.Core.UploadFile.
 * Devolve a URL via onChange.
 */
export default function SimpleFileUpload({ label, value, onChange, t }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setError('');
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange(res.file_url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#0A0A0A]">{label}</span>
        {value && <CheckCircle2 className="w-4 h-4 text-green-600" />}
      </div>

      {value ? (
        <div className="flex items-center justify-between">
          <a href={value} target="_blank" rel="noreferrer" className="text-[#1356E2] text-xs underline truncate max-w-[200px]">
            {t('uploaded')}
          </a>
          <label className="text-xs cursor-pointer text-[#0A0A0A]/60 hover:text-[#0A0A0A]">
            <input type="file" className="hidden" onChange={handle} />
            ↻
          </label>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-[#0A0A0A]/15 rounded-lg text-xs text-[#0A0A0A]/60 cursor-pointer hover:border-[#1356E2] hover:text-[#1356E2] transition-colors">
          <input type="file" className="hidden" onChange={handle} disabled={busy} />
          {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('uploading')}</> : <><Upload className="w-3.5 h-3.5" /> {t('upload_file')}</>}
        </label>
      )}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}