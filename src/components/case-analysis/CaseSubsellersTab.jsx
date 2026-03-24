import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, ExternalLink } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function CaseSubsellersTab({ merchantId }) {
  // Buscar OnboardingCases de subsellers vinculados a este merchant
  const { data: subsellerCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['subsellerCases', merchantId],
    queryFn: () => base44.entities.OnboardingCase.filter({ parentMerchantId: merchantId, isSubsellerCase: true }),
    enabled: !!merchantId
  });

  // Buscar merchants dos subsellers
  const merchantIds = [...new Set(subsellerCases.map(c => c.merchantId).filter(Boolean))];
  const { data: subsellers = [] } = useQuery({
    queryKey: ['subsellerMerchants', merchantIds.join(',')],
    queryFn: async () => {
      if (merchantIds.length === 0) return [];
      const all = await base44.entities.Merchant.filter({ parentMerchantId: merchantId });
      return all;
    },
    enabled: merchantIds.length > 0
  });

  // Buscar ComplianceScores
  const caseIds = subsellerCases.map(c => c.id);
  const { data: scores = [] } = useQuery({
    queryKey: ['subsellerScores', caseIds.join(',')],
    queryFn: async () => {
      if (caseIds.length === 0) return [];
      const results = [];
      for (const caseId of caseIds) {
        const s = await base44.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
        if (s[0]) results.push(s[0]);
      }
      return results;
    },
    enabled: caseIds.length > 0
  });

  if (loadingCases) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  if (subsellerCases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-2">Nenhum subseller</h3>
        <p className="text-sm text-[var(--pagsmile-blue)]/50">
          Este merchant não possui subsellers vinculados. Gere um link de subconta para começar.
        </p>
      </div>
    );
  }

  const getSubseller = (merchantIdSub) => subsellers.find(s => s.id === merchantIdSub);
  const getScore = (caseId) => scores.find(s => s.onboarding_case_id === caseId);

  const statusColor = (status) => {
    switch (status) {
      case 'Aprovado': return 'bg-emerald-100 text-emerald-700';
      case 'Recusado': return 'bg-red-100 text-red-700';
      case 'Manual': return 'bg-amber-100 text-amber-700';
      case 'Em Processamento': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" /> Subsellers ({subsellerCases.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">Subseller</th>
              <th className="text-left text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">CNPJ</th>
              <th className="text-left text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">Status</th>
              <th className="text-left text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">Score</th>
              <th className="text-left text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">Data</th>
              <th className="text-right text-xs font-semibold text-[var(--pagsmile-blue)]/50 pb-3 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {subsellerCases.map(c => {
              const sub = getSubseller(c.merchantId);
              const score = getScore(c.id);
              return (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">
                    <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">{sub?.fullName || '—'}</p>
                    <p className="text-xs text-[var(--pagsmile-blue)]/50">{sub?.email || ''}</p>
                  </td>
                  <td className="py-3">
                    <span className="text-sm text-[var(--pagsmile-blue)]">{sub?.cpfCnpj || '—'}</span>
                  </td>
                  <td className="py-3">
                    <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="py-3">
                    {score?.score_geral_composto != null ? (
                      <span className="text-sm font-semibold">{score.score_geral_composto}</span>
                    ) : c.riskScore != null ? (
                      <span className="text-sm font-semibold">{c.riskScore}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="text-xs text-[var(--pagsmile-blue)]/50">
                      {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}