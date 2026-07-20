import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, History, ArrowLeft, ShieldCheck, Layers, FlaskConical } from 'lucide-react';
import AuditTimelineEvent from '@/components/v5_2/audit/AuditTimelineEvent';
import SnapshotDiffViewer from '@/components/v5_2/audit/SnapshotDiffViewer';
import GlossaryDrawer from '@/components/v5_2/glossary/GlossaryDrawer';
import DossieV5_2Button from '@/components/v5_2/dossie/DossieV5_2Button';
import { diffSnapshots } from '@/lib/v5_2/snapshotDiff';

/**
 * [V5.2 Fase 6.5.6] P\u00e1gina /V5_2_AuditTrail?caseId=<id>
 *
 * Timeline visual de TODA a evolu\u00e7\u00e3o do caso V5.2:
 *   - Lista cronol\u00f3gica de Snapshots imut\u00e1veis
 *   - Diff autom\u00e1tico entre snapshots consecutivos
 *   - Replay capability (clique em qualquer evento para ver o diff vs anterior)
 *   - Export do dossi\u00ea + gloss\u00e1rio inline
 *
 * Garante rastreabilidade regulat\u00f3ria (Circ. BCB 3.978 Art. 17).
 */
export default function V5_2_AuditTrail() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');

  const [selectedIdx, setSelectedIdx] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['v5_2-audit-trail', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const [onboardingCase] = await base44.entities.OnboardingCase.filter({ id: caseId });
      if (!onboardingCase) throw new Error('Caso n\u00e3o encontrado');

      const [merchant] = onboardingCase.merchantId
        ? await base44.entities.Merchant.filter({ id: onboardingCase.merchantId })
        : [null];

      // Snapshots em ordem cronol\u00f3gica ASC (mais antigo primeiro)
      const snapshots = await base44.entities.Snapshot.filter(
        { onboarding_case_id: caseId },
        'created_date',
        200
      );

      return { onboardingCase, merchant, snapshots };
    },
    enabled: !!caseId,
  });

  // Calcula diffs entre snapshots consecutivos (memoizado)
  const diffs = useMemo(() => {
    if (!data?.snapshots) return [];
    return data.snapshots.map((snap, idx) => {
      const prev = idx === 0 ? null : data.snapshots[idx - 1];
      return diffSnapshots(prev, snap);
    });
  }, [data?.snapshots]);

  // Auto-seleciona o evento mais recente que tem mudan\u00e7as
  useEffect(() => {
    if (selectedIdx !== null || !diffs.length) return;
    for (let i = diffs.length - 1; i >= 0; i--) {
      if (!diffs[i].isInitial && diffs[i].changes.length > 0) {
        setSelectedIdx(i);
        return;
      }
    }
  }, [diffs, selectedIdx]);

  if (!caseId) {
    return <ErrorState title="Caso n\u00e3o especificado" description="Informe ?caseId=<id> na URL." />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
        <span className="ml-3 text-[#0A0A0A]/70">Carregando trilha de auditoria…</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Erro" description={error.message} />;
  }

  const { onboardingCase, merchant, snapshots } = data || {};

  if (onboardingCase && onboardingCase.framework_version !== 'v5.2') {
    return (
      <ErrorState
        title="Caso n\u00e3o-V5.2"
        description={`Este caso usa framework ${onboardingCase.framework_version || 'v4.0'}. A trilha de auditoria \u00e9 exclusiva para casos V5.2.`}
      />
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <ErrorState
        title="Sem snapshots"
        description="Este caso V5.2 ainda n\u00e3o gerou snapshots auditáveis. Snapshots s\u00e3o criados automaticamente em cada execu\u00e7\u00e3o do pipeline V5.2."
      />
    );
  }

  const selectedSnapshot = selectedIdx != null ? snapshots[selectedIdx] : null;
  const selectedPrevSnapshot = selectedIdx != null && selectedIdx > 0 ? snapshots[selectedIdx - 1] : null;
  const selectedDiff = selectedIdx != null ? diffs[selectedIdx] : null;

  // Reverso para exibi\u00e7\u00e3o (mais recente em cima)
  const reversedSnapshots = [...snapshots].reverse();
  const reversedDiffs = [...diffs].reverse();

  const totalMudancas = diffs.reduce((acc, d) => acc + (d.isInitial ? 0 : d.changes.length), 0);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to={`/CadastroDetalhe?merchantId=${onboardingCase?.merchantId}`}>
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <History className="w-5 h-5 text-[#1356E2]" />
              <h1 className="text-lg font-bold text-[#0A0A0A]">Trilha de Auditoria V5.2</h1>
              <Badge className="bg-[#1356E2]/15 text-[#E84B1C] border-0">v5.2</Badge>
            </div>
            <p className="text-xs text-[#0A0A0A]/55 mt-0.5">
              {merchant?.fullName || merchant?.companyName || onboardingCase?.merchantId} \u00b7
              <span className="font-mono ml-1">{onboardingCase?.id?.substring(0, 12)}…</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/V5_2_ReplayStudio?caseId=${caseId}`}>
              <FlaskConical className="w-4 h-4 text-[#1356E2]" />
              Replay Studio
            </Link>
          </Button>
          <DossieV5_2Button caseId={caseId} merchantName={merchant?.fullName} />
          <GlossaryDrawer variant="icon" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total de snapshots" value={snapshots.length} icon={Layers} />
        <KPI label="Mudan\u00e7as registradas" value={totalMudancas} icon={History} />
        <KPI
          label="Primeira execu\u00e7\u00e3o"
          value={snapshots[0]?.created_date ? new Date(snapshots[0].created_date).toLocaleDateString('pt-BR') : '—'}
          icon={ShieldCheck}
        />
        <KPI
          label="\u00daltima execu\u00e7\u00e3o"
          value={snapshots[snapshots.length - 1]?.created_date ? new Date(snapshots[snapshots.length - 1].created_date).toLocaleDateString('pt-BR') : '—'}
          icon={ShieldCheck}
        />
      </div>

      {/* Layout: Timeline + DiffViewer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Timeline (3/5) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-[#0A0A0A]/60" />
                Timeline de Snapshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {reversedSnapshots.map((snap, revIdx) => {
                  const realIdx = snapshots.length - 1 - revIdx;
                  return (
                    <AuditTimelineEvent
                      key={snap.id}
                      snapshot={snap}
                      diff={reversedDiffs[revIdx]}
                      isFirst={revIdx === 0}
                      isLast={revIdx === reversedSnapshots.length - 1}
                      selected={selectedIdx === realIdx}
                      onSelect={() => setSelectedIdx(realIdx)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DiffViewer (2/5) */}
        <div className="lg:col-span-2">
          <SnapshotDiffViewer
            prevSnapshot={selectedPrevSnapshot}
            nextSnapshot={selectedSnapshot}
            diff={selectedDiff}
          />
        </div>
      </div>

      {/* Disclaimer regulat\u00f3rio */}
      <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
        <p className="font-semibold mb-1">\u00daSobre a trilha de auditoria</p>
        <p className="opacity-80">
          Os snapshots V5.2 s\u00e3o registros imut\u00e1veis criados automaticamente em cada execu\u00e7\u00e3o do pipeline.
          O hash SHA-256 de cada snapshot garante que o conte\u00fado n\u00e3o foi alterado desde a cria\u00e7\u00e3o.
          Esta tela permite reconstruir exatamente "o que a IA viu" em qualquer momento passado \u2014 fundamento:
          Circ. BCB 3.978 Art. 17 + DOC5 V5.2 \u00a749.
        </p>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#1356E2]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#1356E2]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/50 font-semibold truncate">{label}</div>
          <div className="text-base font-bold text-[#0A0A0A] font-mono">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ title, description }) {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
      </div>
      <h2 className="text-lg font-bold text-[#0A0A0A] mb-2">{title}</h2>
      <p className="text-sm text-[#0A0A0A]/70">{description}</p>
    </div>
  );
}