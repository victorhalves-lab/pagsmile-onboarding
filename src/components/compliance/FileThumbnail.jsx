import React, { useState, useEffect } from 'react';
import { FileText, File, Image as ImageIcon } from 'lucide-react';

/**
 * Small thumbnail for an uploaded file.
 * - Image MIME → shows real preview from the original File (via blob URL)
 *                 or falls back to icon if file is already uploaded (no blob anymore)
 * - PDF        → red PDF icon
 * - DOC/DOCX   → blue doc icon
 * - Other      → generic file icon
 */
function extOf(name = '') {
  return (name.split('.').pop() || '').toUpperCase();
}

export default function FileThumbnail({ name, type, localFile, size = 'sm' }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const dim = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const ext = extOf(name);
  const isImage = (type && type.startsWith('image/')) || ['JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC'].includes(ext);
  const isPdf = ext === 'PDF' || type === 'application/pdf';
  const isDoc = ['DOC', 'DOCX'].includes(ext);

  useEffect(() => {
    if (isImage && localFile instanceof File) {
      const url = URL.createObjectURL(localFile);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [localFile, isImage]);

  if (isImage && blobUrl) {
    return (
      <div className={`${dim} rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0`}>
        <img src={blobUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (isImage) {
    return (
      <div className={`${dim} rounded-lg border border-slate-200 bg-blue-50 flex items-center justify-center shrink-0`}>
        <ImageIcon className="w-5 h-5 text-blue-500" />
      </div>
    );
  }
  if (isPdf) {
    return (
      <div className={`${dim} rounded-lg border border-red-200 bg-red-50 flex items-center justify-center shrink-0`}>
        <FileText className="w-5 h-5 text-red-500" />
      </div>
    );
  }
  if (isDoc) {
    return (
      <div className={`${dim} rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0`}>
        <FileText className="w-5 h-5 text-blue-600" />
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0`}>
      <File className="w-5 h-5 text-slate-400" />
    </div>
  );
}