import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Link2, Copy, ExternalLink, Globe2, Flag, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Lista de UnifiedProposalPackage criados. Mostra status, links, e botão para criar.
 */
export default function UnifiedProposalsList() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['unifiedPackages'],
    queryFn: () => base44.entities.UnifiedProposalPackage.list('-created_date', 200),
    initialData: [],
  });

  const copyLink = (slug) => {
    const url = `${window.location.origin}/u/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">Propostas Unificadas</h2>
          <p className="text-xs text-[#0A0A0A]/60 mt-0.5">
            {packages.length} pacote(s) — combine propostas Brasil + Global em 1 link com tabs.
          </p>
        </div>
        <Link to="/CriarPropostaUnificada">
          <Button className="gap-1.5"><Plus className="w-4 h-4" /> Criar Proposta Unificada</Button>
        </Link>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        {isLoading && <div className="p-10 text-center text-[#0A0A0A]/50">Carregando...</div>}
        {!isLoading && packages.length === 0 && (
          <div className="p-12 text-center">
            <Link2 className="w-10 h-10 text-[#0A0A0A]/20 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0A0A0A]">Nenhum pacote criado ainda</h3>
            <p className="text-xs text-[#0A0A0A]/60 mt-1 max-w-md mx-auto">
              Crie propostas Brasil e Global separadamente, depois use a "Proposta Unificada" para combiná-las em um único link.
            </p>
          </div>
        )}
        {packages.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-[#f4f4f4] text-[#0A0A0A]/70 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-center px-4 py-3">Componentes</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Link</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A0A0A]/5">
              {packages.map(pkg => {
                const hasBr = !!(pkg.br_proposal_id || pkg.br_standard_proposal_id || pkg.br_pix_proposal_id);
                const hasGlobal = !!pkg.global_proposal_id;
                const url = `${window.location.origin}/u/${pkg.public_slug}`;
                return (
                  <tr key={pkg.id} className="hover:bg-[#f4f4f4]/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0A0A0A]">{pkg.client_name}</div>
                      <div className="text-xs text-[#0A0A0A]/50">{pkg.contact_email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasBr && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"><Flag className="w-3 h-3" /> BR</span>}
                        {hasGlobal && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><Globe2 className="w-3 h-3" /> Global</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={pkg.status} brAccepted={!!pkg.br_accepted_at} globalAccepted={!!pkg.global_accepted_at} />
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-[#0A0A0A]/60">/u/{pkg.public_slug}</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => copyLink(pkg.public_slug)} title="Copiar link"><Copy className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => window.open(url, '_blank')} title="Abrir"><ExternalLink className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, brAccepted, globalAccepted }) {
  if (status === 'fully_accepted') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1356E2] text-white"><CheckCircle2 className="w-3 h-3" /> Tudo aceito</span>;
  if (brAccepted || globalAccepted) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Parcial ({brAccepted ? 'BR' : 'Global'} OK)</span>;
  if (status === 'rejected') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Recusado</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Enviado</span>;
}