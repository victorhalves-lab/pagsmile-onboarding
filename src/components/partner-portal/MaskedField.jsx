import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Renderiza um valor respeitando o nível de visibilidade.
 * - full: valor completo
 * - redacted: valor mascarado (mas ainda mostra algo)
 * - summary_only: oculta completamente
 */
export default function MaskedField({
  value,
  level = 'full',
  type = 'text',
  fallback = '—',
  className = ''
}) {
  if (level === 'summary_only' && type !== 'public') {
    return (
      <span className={`inline-flex items-center gap-1 text-slate-400 ${className}`}>
        <Lock className="w-3 h-3" />
        <span className="italic text-xs">Oculto</span>
      </span>
    );
  }

  if (!value && value !== 0) return <span className={`text-slate-400 ${className}`}>{fallback}</span>;

  return <span className={className}>{value}</span>;
}