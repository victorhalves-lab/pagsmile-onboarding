import React, { useState } from 'react';
import { Cloud, Check, Loader2, Copy, Link2, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AutoSaveIndicator({ saving, lastSaved, resumeUrl }) {
  const [showCopied, setShowCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopyLink = () => {
    if (resumeUrl) {
      navigator.clipboard.writeText(resumeUrl);
      setShowCopied(true);
      toast.success('Link copiado! Use-o para continuar de onde parou.');
      setTimeout(() => setShowCopied(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Main bar */}
      <div className="flex items-center justify-between gap-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
        {/* Save Status */}
        <div className="flex items-center gap-2">
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-[#2bc196] animate-spin" />
              <span className="text-xs text-[#002443]/60">Salvando...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#2bc196]" />
              <span className="text-xs text-[#002443]/60">Progresso salvo automaticamente</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-[#002443]/40">Auto-save ativo</span>
            </>
          )}
        </div>

        {/* Copy Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="h-7 px-3 text-xs font-semibold text-[#2bc196] hover:text-[#2bc196] hover:bg-[#2bc196]/10 rounded-lg gap-1.5"
        >
          {showCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Salvar link
            </>
          )}
        </Button>
      </div>

      {/* Expandable hint */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-1.5 text-center text-[10px] text-[#002443]/30 hover:text-[#002443]/50 transition-colors"
        >
          Precisa parar? Clique para saber como continuar depois →
        </button>
      )}

      {expanded && (
        <div className="mt-2 bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-xl p-3.5 text-left">
          <div className="flex items-start gap-2.5">
            <BookmarkCheck className="w-4 h-4 text-[#2bc196] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#002443]/80 mb-1">
                Pode parar quando quiser — seu progresso é salvo automaticamente!
              </p>
              <p className="text-[11px] text-[#002443]/50 leading-relaxed mb-2.5">
                Clique em "<span className="font-semibold text-[#2bc196]">Salvar link</span>" acima e guarde o link. 
                Quando quiser continuar, basta abrir o link e você voltará de onde parou.
              </p>
              <Button
                onClick={handleCopyLink}
                size="sm"
                className="h-8 px-4 text-xs bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-lg gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                {showCopied ? 'Link copiado!' : 'Copiar link de retomada'}
              </Button>
            </div>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-[10px] text-[#002443]/25 hover:text-[#002443]/40 transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}