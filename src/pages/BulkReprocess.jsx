import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Loader2, Play, RotateCcw, Trash2 } from 'lucide-react';

const DELAY_BETWEEN_CASES_MS = 3000;

export default function BulkReprocess() {
  const [phase, setPhase] = useState('idle'); // idle | cleaning | ready | processing | done
  const [cases, setCases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const [cleanResult, setCleanResult] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  // Load current status
  const loadStatus = async () => {
    const res = await base44.functions.invoke('bulkReprocessCompliance', { action: 'status' });
    setCases(res.data.cases || []);
  };

  useEffect(() => { loadStatus(); }, []);

  // FASE 1: Clean
  const handleClean = async () => {
    setPhase('cleaning');
    setError(null);
    const res = await base44.functions.invoke('bulkReprocessCompliance', { action: 'clean' });
    setCleanResult(res.data);
    setPhase('ready');
    await loadStatus();
  };

  // FASE 2: Reprocess one by one from browser
  const handleReprocess = async () => {
    setPhase('processing');
    setResults([]);
    abortRef.current = false;

    const pendingCases = cases.filter(c => !c.validationsDone);

    for (let i = 0; i < pendingCases.length; i++) {
      if (abortRef.current) break;
      setCurrentIndex(i);
      const c = pendingCases[i];
      const start = Date.now();

      let result;
      try {
        const res = await base44.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: c.id });
        result = {
          caseId: c.id, success: !res.data?.error && !res.data?.skipped,
          decision: res.data?.decision?.finalDecision || res.data?.skipped ? 'skipped' : 'unknown',
          duration: Date.now() - start,
        };
      } catch (err) {
        result = { caseId: c.id, success: false, decision: err.message, duration: Date.now() - start };
      }

      setResults(prev => [...prev, result]);

      // Delay between cases
      if (i < pendingCases.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_CASES_MS));
      }
    }

    setPhase('done');
    setCurrentIndex(-1);
    await loadStatus();
  };

  const handleAbort = () => { abortRef.current = true; };

  const totalCases = cases.length;
  const doneCases = results.filter(r => r.success).length;
  const failedCases = results.filter(r => !r.success).length;
  const progress = totalCases > 0 ? ((results.length / totalCases) * 100) : 0;
  const pendingCount = cases.filter(c => !c.validationsDone).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#002443]">Reprocessamento Completo de Compliance</h1>
      <p className="text-sm text-[#002443]/70">
        Reset + reprocessamento de TODAS as análises usando o pipeline V5 completo (BDC + CAF + SENTINEL).
        Preserva respostas, documentos e dados do merchant.
      </p>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-[#002443]">{totalCases}</div>
              <div className="text-xs text-[#002443]/60">Total de Casos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{cases.filter(c => c.validationsDone).length}</div>
              <div className="text-xs text-[#002443]/60">Processados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-[#002443]/60">Pendentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FASE 1 */}
          <div className="flex items-center gap-3">
            <Button onClick={handleClean} disabled={phase === 'cleaning' || phase === 'processing'} variant="destructive" className="gap-2">
              {phase === 'cleaning' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              FASE 1: Limpar Análises Antigas
            </Button>
            {cleanResult && (
              <span className="text-sm text-green-600">
                ✓ {cleanResult.casesReset} casos resetados, {cleanResult.scoresDeleted} scores deletados
              </span>
            )}
          </div>

          {/* FASE 2 */}
          <div className="flex items-center gap-3">
            <Button onClick={handleReprocess} disabled={phase !== 'ready' && phase !== 'idle' && phase !== 'done'} className="gap-2 bg-[#2bc196] hover:bg-[#2bc196]/90">
              {phase === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              FASE 2: Reprocessar Pipeline V5
            </Button>
            {phase === 'processing' && (
              <Button onClick={handleAbort} variant="outline" size="sm" className="text-red-600">Parar</Button>
            )}
            <Button onClick={loadStatus} variant="ghost" size="sm" className="gap-1">
              <RotateCcw className="w-3 h-3" /> Atualizar
            </Button>
          </div>

          {/* Progress */}
          {phase === 'processing' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-[#002443]/60">
                <span>Processando caso {currentIndex + 1} de {pendingCount}...</span>
                <span>{results.length}/{pendingCount} concluídos</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Resultados — {doneCases} sucesso, {failedCases} falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f4f4f4] text-sm">
                  <div className="flex items-center gap-2">
                    {r.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-mono text-xs">...{r.caseId.slice(-8)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={r.success ? 'default' : 'destructive'} className="text-xs">
                      {r.decision}
                    </Badge>
                    <span className="text-xs text-[#002443]/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {Math.round(r.duration / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Casos ({cases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {cases.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f4f4f4] text-xs">
                <span className="font-mono">...{c.id.slice(-8)}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{c.status}</Badge>
                  {c.score != null && <span>Score: {c.score}</span>}
                  {c.subfaixa && <Badge className="text-xs">{c.subfaixa}</Badge>}
                  {c.validationsDone && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}