import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Check, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AutoSaveIndicator({ saving, lastSaved, resumeUrl }) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyLink = () => {
    if (resumeUrl) {
      navigator.clipboard.writeText(resumeUrl);
      setShowCopied(true);
      toast.success('Link copiado! Salve-o para retomar depois.');
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
      {/* Save Status */}
      <div className="flex items-center gap-1.5">
        {saving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 text-[var(--pagsmile-green)] animate-spin" />
            <span className="text-[#002443]/60">Salvando...</span>
          </>
        ) : lastSaved ? (
          <>
            <Check className="w-3.5 h-3.5 text-[var(--pagsmile-green)]" />
            <span className="text-[#002443]/60">Progresso salvo</span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#002443]/40">Auto-save ativo</span>
          </>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-slate-200" />

      {/* Resume Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="h-6 px-2 text-xs text-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10"
      >
        {showCopied ? (
          <>
            <Check className="w-3 h-3 mr-1" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 mr-1" />
            Copiar link para retomar
          </>
        )}
      </Button>
    </div>
  );
}