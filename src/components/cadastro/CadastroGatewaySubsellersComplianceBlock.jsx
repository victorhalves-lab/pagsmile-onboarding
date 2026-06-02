import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, ExternalLink, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Bloco complementar à aba "Coletas Gateway":
 * mostra os subsellers cadastrados via o LINK INDIVIDUAL de Compliance Subseller
 * (linkType=SUBSELLER_COMPLIANCE → SubsellerQuestionnaire → Merchant{isSubseller=true}).
 *
 * Estes subsellers NÃO vêm via SubsellerInfoCollection (Gateway batch). Vêm via
 * o link compliance que o cliente recebe individualmente.
 *
 * Para cada subseller: indica quais informações já temos vs faltam, pra fechar
 * o gap "só completa o que faltar".
 */

const REQUIRED_FIELDS = [
  { key: 'cpfCnpj', label: 'Documento' },
  { key: 'companyName', label: 'Razão Social' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
];

function evaluateCompleteness(subseller, caseData, docsCount) {
  const missing = [];
  REQUIRED_FIELDS.forEach(f => {
    if (!subseller?.[f.key]) missing.push(f.label);
  });
  if (!caseData) missing.push('Questionário');
  if (!docsCount) missing.push('Documentos');
  const total = REQUIRED_FIELDS.length + 2;
  const filled = total - missing.length;
  return { missing, filled, total, pct: Math.round((filled / total) * 100) };
}

const SUBFAIXA_COLOR = {
  '1A': 'bg-green-100 text-green-700', '1B': 'bg-green-100 text-green-700',
  '2A': 'bg-emerald-100 text-emerald-700', '2B': 'bg-emerald-100 text-emerald-700',
  '3A': 'bg-amber-100 text-amber-700', '3B': 'bg-amber-100 text-amber-700',
  '4': 'bg-orange-100 text-orange-700',
  '5': 'bg-red-100 text-red-700',
};

export default function CadastroGatewaySubsellersComplianceBlock({ parentMerchantId }) {
  // Subsellers vinculados como filhos
  const { data: subsellers = [], isLoading } = useQuery({
    queryKey: ['gateway-compliance-subsellers', parentMerchantId],
    queryFn: () => base44.entities.Merchant.filter({ parentMerchantId, isSubseller: true }),
    enabled: !!parentMerchantId,
  });

  const subsellerIds = useMemo(() => subsellers.map(s => s.id), [subsellers]);

  // Casos de onboarding de cada subseller (pega o mais recente)
  const { data: subsellerCases = [] } = useQuery({
    queryKey: ['gateway-compliance-subseller-cases', subsellerIds],
    queryFn: async () => {
      if (!subsellerIds.length) return [];
      const results = await Promise.all(
        subsellerIds.map(id => base44.entities.OnboardingCase.filter({ merchantId: id }, '-created_date', 1))
      );
      return results.flat();
    },
    enabled: subsellerIds.length > 0,
  });

  // Documentos dos casos
  const caseIds = useMemo(() => subsellerCases.map(c => c.id), [subsellerCases]);
  const { data: docs = [] } = useQuery({
    queryKey: ['gateway-compliance-subseller-docs', caseIds],
    queryFn: async () => {
      if (!caseIds.length) return [];
      const results = await Promise.all(
        caseIds.map(id => base44.entities.DocumentUpload.filter({ onboardingCaseId: id }))
      );
      return results.flat();
    },
    enabled: caseIds.length > 0,
  });

  // Indexa caso + docCount por merchantId
  const enriched = useMemo(() => {
    const caseByMerchant = new Map();
    subsellerCases.forEach(c => caseByMerchant.set(c.merchantId, c));
    const docsByCase = new Map();
    docs.forEach(d => {
      docsByCase.set(d.onboardingCaseId, (docsByCase.get(d.onboardingCaseId) || 0) + 1);
    });
    return subsellers.map(s => {
      const c = caseByMerchant.get(s.id);
      const docsCount = c ? (docsByCase.get(c.id) || 0) : 0;
      const completeness = evaluateCompleteness(s, c, docsCount);
      return { merchant: s, case: c, docsCount, completeness };
    });
  }, [subsellers, subsellerCases, docs]);

  const totalComplete = enriched.filter(e => e.completeness.missing.length === 0).length;
  const totalIncomplete = enriched.length - totalComplete;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-6 text-center">
        <p className="text-xs text-[var(--pagsmile-blue)]/50">Carregando subsellers compliance...</p>
      </div>
    );
  }

  if (!enriched.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Subsellers via Compliance Individual
          <Badge className="bg-[var(--pagsmile-green)]/10 text-[var(--pagsmile-green-dark)] text-[10px] ml-1">
            {enriched.length}
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 text-[10px] gap-1">
            <CheckCircle2 className="w-3 h-3" /> {totalComplete} completos
          </Badge>
          {totalIncomplete > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1">
              <AlertTriangle className="w-3 h-3" /> {totalIncomplete} com gaps
            </Badge>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[var(--pagsmile-blue)]/60 mb-3">
        Subsellers cadastrados via o link individual de compliance (não pelo formulário batch do Gateway).
        Para cada um indicamos o que já temos e o que ainda falta — assim o cliente só precisa completar as lacunas.
      </p>

      <div className="space-y-2">
        {enriched.map(({ merchant, case: c, docsCount, completeness }) => (
          <div key={merchant.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-[10px]">{merchant.type || 'PJ'}</Badge>
                  <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">
                    {merchant.companyName || merchant.fullName || '—'}
                  </p>
                  {c?.subfaixa && (
                    <Badge className={`text-[10px] ${SUBFAIXA_COLOR[c.subfaixa] || 'bg-slate-100'}`}>
                      {c.subfaixa}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {c?.status || 'Sem caso'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--pagsmile-blue)]/60">
                  {merchant.cpfCnpj && <span>Doc: {merchant.cpfCnpj}</span>}
                  {merchant.email && <span>{merchant.email}</span>}
                  {merchant.phone && <span>{merchant.phone}</span>}
                  <span className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> {docsCount} doc(s)
                  </span>
                </div>

                {/* Gap analysis */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-[120px] max-w-[280px]">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          completeness.pct === 100 ? 'bg-green-500' :
                          completeness.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${completeness.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--pagsmile-blue)]/60">
                    {completeness.filled}/{completeness.total} ({completeness.pct}%)
                  </span>
                  {completeness.missing.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-amber-700">Falta:</span>
                      {completeness.missing.map(m => (
                        <Badge key={m} className="bg-amber-50 text-amber-700 text-[9px] border border-amber-200">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Link to={`/CadastroDetalhe?id=${merchant.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}