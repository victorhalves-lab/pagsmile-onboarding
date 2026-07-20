import React from 'react';
import { Copy, Link2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AllLinksPanel({ proposals }) {
  const activeProposals = (proposals || [])
    .filter(p => p.status === 'ativa' && p.tokenPublico)
    .sort((a, b) => (a.segment || '').localeCompare(b.segment || ''));

  if (activeProposals.length === 0) return null;

  const buildUrl = (p) => p.publicSlug
    ? `${window.location.origin}/pp/${p.publicSlug}`
    : `${window.location.origin}/PropostaPadraoPublica?token=${p.tokenPublico}`;

  const copyOne = (p) => {
    navigator.clipboard.writeText(buildUrl(p));
    toast.success(`Link de ${p.segment} copiado!`);
  };

  const copyAll = () => {
    const text = activeProposals
      .map(p => `Proposta Padrão ${p.segment}: ${buildUrl(p)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${activeProposals.length} links copiados!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#0A0A0A]/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1356E2]/10">
            <ClipboardList className="w-5 h-5 text-[#1356E2]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#0A0A0A]">Links de Todas as Propostas Padrão</h3>
            <p className="text-xs text-[#0A0A0A]/50">{activeProposals.length} propostas ativas com link público</p>
          </div>
        </div>
        <Button onClick={copyAll} size="sm" className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2 rounded-xl">
          <Copy className="w-4 h-4" />
          Copiar Todos
        </Button>
      </div>

      <div className="divide-y divide-[#0A0A0A]/5">
        {activeProposals.map((p) => (
          <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#f4f4f4] transition-colors group">
            <Link2 className="w-4 h-4 text-[#1356E2] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0A0A0A]">Proposta Padrão — {p.segment}</p>
              <p className="text-xs text-[#0A0A0A]/40 truncate font-mono">{buildUrl(p)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyOne(p)}
              className="opacity-50 group-hover:opacity-100 transition-opacity text-[#0A0A0A] hover:text-[#1356E2]"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}