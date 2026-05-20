import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, FlaskConical, Play, AlertTriangle, History, Hash, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ReplayResultPanel from '@/components/v5_2/replay/ReplayResultPanel';
import GlossaryDrawer from '@/components/v5_2/glossary/GlossaryDrawer';
import { SNAPSHOT_TYPE_META } from '@/lib/v5_2/snapshotDiff';

/**
 * [V5.2 Fase 6.5.7] /V5_2_ReplayStudio?caseId=<id>&snapshotId=<id>
 *
 * Re-executa um snapshot hist\u00f3rico com as regras V5.2 ATUAIS (read-only)
 * e mostra Original vs Replay lado a lado. Useful para:
 *   - Validar impacto de mudan\u00e7as regulat\u00f3rias antes de promover regras
 *   - Auditar drift entre escalas/categorias antigas e novas
 *   - Demonstrar a sensibilidade da decis\u00e3o a novas regras
 */
export default function V5_2_ReplayStudio() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');
  const snapshotIdFromUrl = urlParams.get('snapshotId');

  const [selectedSnapshotId, setSelectedSnapshotId] = useState(snapshotIdFromUrl || null);
  const [replayResult, setReplayResult] = useState(null);
  const [replaying, setReplaying] = useState(false);

  // Carrega snapshots do caso
  const { data, isLoading, error } = useQuery({
    queryKey: ['v5_2-replay-snapshots', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const [onboardingCase] = await base44.entities.OnboardingCase.filter({ id: caseId });
      if (!onboardingCase) throw new Error('Caso n\u00e3o encontrado');

      const [merchant] = onboardingCase.merchantId
        ? await base44.entities.Merchant.filter({ id: onboardingCase.merchantId })
        : [null];

      const snapshots = await base44.entities.Snapshot.filter(
        { onboarding_case_id: caseId },
        '-created_date',
        100
      );

      return { onboardingCase, merchant, snapshots };
    },
    enabled: !!caseId,
  });

  // Auto-seleciona o snapshot mais recente se nenhum foi informado
  useEffect(() => {
    if (selectedSnapshotId) return;
    if (data?.snapshots?.length > 0) {
      setSelectedSnapshotId(data.snapshots[0].id);
    }
  }, [data, selectedSnapshotId]);

  const handleRunReplay = async () => {
    if (!selectedSnapshotId) {
      toast.error('Selecione um snapshot');
      return;
    }
    setReplaying(true);
    setReplayResult(null);
    try {
      const res = await base44.functions.invoke('replaySnapshotV5_2', {
        snapshotId: selectedSnapshotId,
      });
      if (res.data?.ok) {
        setReplayResult(res.data);
        toast.success(
          res.data.diff.tem_mudanca
            ? `Replay detectou ${res.data.diff.changed_fields.length} mudan\u00e7a(s)`
            : 'Replay convergente \u2014 sem mudan\u00e7as'
        );
      } else {
        throw new Error(res.data?.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('[ReplayStudio] erro:', err);
      toast.error('Erro ao executar replay', { description: err?.message });
    } finally {
      setReplaying(false);
    }
  };

  if (!caseId) {
    return <ErrorState title="Caso n\u00e3o especificado" description="Informe ?caseId=<id> na URL." />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
        <span className="ml-3 text-[#002443]/70">Carregando snapshots…</span>
      </div>
    );
  }

  if (error) return <ErrorState title="Erro" description={error.message} />;

  const { onboardingCase, merchant, snapshots } = data || {};

  if (onboardingCase && onboardingCase.framework_version !== 'v5.2') {
    return (
      <ErrorState
        title="Caso n\u00e3o-V5.2"
        description={`Este caso usa framework ${onboardingCase.framework_version || 'v4.0'}. O Replay Studio \u00e9 exclusivo para casos V5.2.`}
      />
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <ErrorState
        title="Sem snapshots"
        description="Este caso n\u00e3o gerou snapshots ainda. Execute o pipeline V5.2 primeiro."
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to={`/V5_2_AuditTrail?caseId=${caseId}`}>
              <ArrowLeft className="w-4 h-4" /> Voltar para Trilha
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <FlaskConical className="w-5 h-5 text-[#2bc196]" />
              <h1 className="text-lg font-bold text-[#002443]">Replay Studio V5.2</h1>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">read-only</Badge>
            </div>
            <p className="text-xs text-[#002443]/55 mt-0.5">
              {merchant?.fullName || merchant?.companyName} \u00b7 reexecuta snapshots com regras V5.2 atuais
            </p>
          </div>
        </div>
        <GlossaryDrawer variant="icon" />
      </div>

      {/* Seletor + Run */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-[#002443]/60" />
            Selecione o snapshot para reexecutar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {snapshots.map((snap) => {
              const meta = SNAPSHOT_TYPE_META[snap.tipo] || SNAPSHOT_TYPE_META.initial_analysis;
              const isSelected = selectedSnapshotId === snap.id;
              return (
                <button
                  key={snap.id}
                  onClick={() => { setSelectedSnapshotId(snap.id); setReplayResult(null); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-[#2bc196] bg-[#2bc196]/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-xs font-bold text-[#002443] truncate">{meta.label}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{snap.framework_version}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#002443]/55">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(snap.created_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </span>
                      {snap.hash_integridade && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Hash className="w-3 h-3" />
                          {snap.hash_integridade.substring(0, 10)}…
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-[#002443]/55">
              {selectedSnapshotId
                ? `Snapshot selecionado: ${selectedSnapshotId.substring(0, 16)}…`
                : 'Nenhum snapshot selecionado'}
            </p>
            <Button
              onClick={handleRunReplay}
              disabled={!selectedSnapshotId || replaying}
              className="bg-[#2bc196] hover:bg-[#36706c] text-white gap-2"
              size="sm"
            >
              {replaying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Executando…</>
              ) : (
                <><Play className="w-4 h-4" /> Executar Replay</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {replayResult && <ReplayResultPanel result={replayResult} />}
    </div>
  );
}

function ErrorState({ title, description }) {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
      </div>
      <h2 className="text-lg font-bold text-[#002443] mb-2">{title}</h2>
      <p className="text-sm text-[#002443]/70">{description}</p>
    </div>
  );
}