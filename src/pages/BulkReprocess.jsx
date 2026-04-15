import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Play, RotateCcw, Trash2, Search, Filter, CheckCircle2, XCircle, Pause } from 'lucide-react';
import CaseSelectionTable from '../components/bulk-reprocess/CaseSelectionTable';
import ProcessingQueue from '../components/bulk-reprocess/ProcessingQueue';

const DELAY_BETWEEN_TRIGGERS_MS = 1500;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_TIME_MS = 10 * 60 * 1000; // 10 minutes max per case

export default function BulkReprocess() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Processing state
  const [phase, setPhase] = useState('idle'); // idle | cleaning | ready | processing | paused | done
  const [cleanResult, setCleanResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);

  // Load cases
  const loadCases = useCallback(async () => {
    setLoading(true);
    const res = await base44.functions.invoke('bulkReprocessCompliance', { action: 'list' });
    setCases(res.data.cases || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  // Filtered cases
  const filteredCases = cases.filter(c => {
    const matchSearch = !search || 
      c.merchantName?.toLowerCase().includes(search.toLowerCase()) ||
      c.merchantCpfCnpj?.includes(search) ||
      c.id.includes(search);
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'pendente' && !c.validationsDone) ||
      (statusFilter === 'processado' && c.validationsDone) ||
      c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Select only pending
  const selectAllPending = () => {
    setSelectedIds(filteredCases.filter(c => !c.validationsDone).map(c => c.id));
  };

  // FASE 1: Clean selected
  const handleClean = async () => {
    if (selectedIds.length === 0) return;
    setPhase('cleaning');
    setCleanResult(null);
    const res = await base44.functions.invoke('bulkReprocessCompliance', { action: 'clean', caseIds: selectedIds });
    setCleanResult(res.data);
    setPhase('ready');
    await loadCases();
  };

  // Poll a single case until it leaves "Em Processamento" or times out
  const pollCaseCompletion = async (caseId, startTime) => {
    while (true) {
      if (abortRef.current) return { status: 'aborted' };
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_POLL_TIME_MS) return { status: 'timeout' };

      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      try {
        const [freshCase] = await base44.entities.OnboardingCase.filter({ id: caseId });
        if (!freshCase) return { status: 'error', error: 'Case not found' };
        
        // Pipeline is done when status is no longer "Em Processamento" AND validationsCompleted is true
        if (freshCase.status !== 'Em Processamento' || freshCase.validationsCompleted) {
          return { 
            status: 'success', 
            result: { 
              finalStatus: freshCase.status, 
              decision: freshCase.iaDecision,
              subfaixa: freshCase.subfaixa,
              score: freshCase.riskScoreV4
            } 
          };
        }
      } catch (e) {
        // polling error, keep trying
      }
    }
  };

  // FASE 2: Fire-and-forget + poll
  const handleReprocess = async () => {
    if (selectedIds.length === 0) return;
    setPhase('processing');
    abortRef.current = false;
    pauseRef.current = false;

    const selectedCases = cases.filter(c => selectedIds.includes(c.id));
    const initialQueue = selectedCases.map(c => ({
      caseId: c.id,
      merchantName: c.merchantName,
      status: 'pending',
      result: null,
      error: null,
      duration: null,
    }));
    setQueue(initialQueue);

    for (let i = 0; i < initialQueue.length; i++) {
      if (abortRef.current) break;

      while (pauseRef.current && !abortRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (abortRef.current) break;

      setCurrentIndex(i);
      setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'processing' } : q));

      const start = Date.now();
      try {
        // Fire-and-forget: trigger returns immediately
        await base44.functions.invoke('triggerEnrichment', { onboardingCaseId: initialQueue[i].caseId });
        
        // Now poll until pipeline finishes
        const pollResult = await pollCaseCompletion(initialQueue[i].caseId, start);
        const duration = Date.now() - start;

        if (pollResult.status === 'success') {
          setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'success', result: pollResult.result, duration } : q));
        } else if (pollResult.status === 'timeout') {
          setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error', error: 'Timeout (>10min)', duration } : q));
        } else if (pollResult.status === 'aborted') {
          break;
        } else {
          setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error', error: pollResult.error || 'Unknown error', duration } : q));
        }
      } catch (err) {
        const duration = Date.now() - start;
        setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error', error: err.message, duration } : q));
      }

      // Small delay between triggers to not overwhelm APIs
      if (i < initialQueue.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_TRIGGERS_MS));
      }
    }

    setPhase('done');
    setCurrentIndex(-1);
    await loadCases();
  };

  const handlePause = () => {
    pauseRef.current = !pauseRef.current;
    setPhase(pauseRef.current ? 'paused' : 'processing');
  };

  const handleAbort = () => {
    abortRef.current = true;
    pauseRef.current = false;
    setPhase('done');
  };

  const isProcessing = phase === 'processing' || phase === 'paused';
  const queueSuccessCount = queue.filter(q => q.status === 'success').length;
  const queueFailCount = queue.filter(q => q.status === 'error' || q.status === 'skipped').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#002443]">Reprocessamento de Compliance</h1>
        <p className="text-sm text-[#002443]/60 mt-1">
          Selecione os casos para limpar e reprocessar pelo pipeline V5 completo (BDC → CAF → SENTINEL).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: cases.length, color: 'text-[#002443]' },
          { label: 'Processados', value: cases.filter(c => c.validationsDone).length, color: 'text-green-600' },
          { label: 'Pendentes', value: cases.filter(c => !c.validationsDone).length, color: 'text-amber-600' },
          { label: 'Selecionados', value: selectedIds.length, color: 'text-[#2bc196]' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#002443]/50 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
              <Input
                placeholder="Buscar merchant, CNPJ ou case ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-[#002443]/40" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="processado">Já processados</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Processamento">Em Processamento</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={selectAllPending} disabled={isProcessing}>
              Selecionar todos pendentes
            </Button>
            <Button variant="ghost" size="sm" onClick={loadCases} disabled={isProcessing} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 items-center border-t pt-4">
            <Button
              onClick={handleClean}
              disabled={selectedIds.length === 0 || isProcessing || phase === 'cleaning'}
              variant="destructive"
              className="gap-2"
            >
              {phase === 'cleaning' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Limpar Análises ({selectedIds.length})
            </Button>

            <Button
              onClick={handleReprocess}
              disabled={selectedIds.length === 0 || isProcessing || phase === 'cleaning'}
              className="gap-2 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
            >
              <Play className="w-4 h-4" />
              Reprocessar Pipeline V5 ({selectedIds.length})
            </Button>

            {isProcessing && (
              <>
                <Button onClick={handlePause} variant="outline" size="sm" className="gap-1.5">
                  <Pause className="w-3.5 h-3.5" />
                  {phase === 'paused' ? 'Retomar' : 'Pausar'}
                </Button>
                <Button onClick={handleAbort} variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="w-3.5 h-3.5" /> Parar
                </Button>
              </>
            )}

            {cleanResult && (
              <span className="text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {cleanResult.casesReset} resetados, {cleanResult.scoresDeleted} scores deletados
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Fila de Processamento</span>
              {phase === 'done' && (
                <span className="text-sm font-normal text-[#002443]/60">
                  {queueSuccessCount} sucesso · {queueFailCount} falhas
                </span>
              )}
              {phase === 'paused' && (
                <Badge className="bg-amber-100 text-amber-700">Pausado</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessingQueue queue={queue} currentIndex={currentIndex} totalSelected={queue.length} />
          </CardContent>
        </Card>
      )}

      {/* Cases table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Casos de Compliance ({filteredCases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
            </div>
          ) : (
            <CaseSelectionTable
              cases={filteredCases}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              processing={isProcessing}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}