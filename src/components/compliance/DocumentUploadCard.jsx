import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DocumentUploadCard({ doc, isUploaded, fileName, onUpload, onRemove }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(doc.id, file);
    }
  };

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-200 group",
        isUploaded 
          ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5" 
          : "border-slate-200 bg-white hover:border-[var(--pagsmile-blue)]/30 hover:shadow-md"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg transition-colors",
          isUploaded 
            ? "bg-[var(--pagsmile-green)] text-white" 
            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
        )}>
          {isUploaded ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm md:text-base">{doc.name}</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">{doc.description}</p>
            </div>
            {doc.required && !isUploaded && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Obrigatório
              </span>
            )}
          </div>
          
          {isUploaded ? (
            <div className="flex items-center gap-2 mt-3 p-2 bg-white/50 rounded-lg border border-[var(--pagsmile-green)]/20">
              <span className="text-xs text-slate-600 truncate flex-1 font-medium">
                {fileName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(doc.id);
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="mt-3 w-full border-dashed border-slate-300 text-slate-600 hover:text-[var(--pagsmile-blue)] hover:border-[var(--pagsmile-blue)] hover:bg-slate-50"
            >
              <Upload className="w-3 h-3 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}