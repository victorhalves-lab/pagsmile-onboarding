import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2, Play, AlertTriangle, CheckCircle2, XCircle, TrendingUp,
  TrendingDown, Minus, Shield, Zap, Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function RevalidationBulkPanel({ onComplete }) {
  const [statusFilter, setStatusFilter] = useState('Aprovado');
  const [limit, setLimit] = useState(20);
  const [dryRun, setDryRun] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [results, setResults] = useState(null);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('revalidateBdc', {
        bulk: true,
        statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        limit,
        dryRun,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.dryRun) {
        toast.info(`Simulação concluída: ${data.summary.processed} cases analisados`);
      } else {
        toast.success(`Revalidação em massa concluída: ${data.summary.succeeded} sucesso, ${data.summary.failed} falhas`);
        onComplete?.();
      }
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const handleStart = () => {
    if (!dryRun) {
      setShowConfirm(true);
    } else {
      bulkMutation.mutate();
    }
  };

  const getAlertBadge = (alert) => {
    if (alert === 'CRITICAL') return <Badge className="bg-red-100 text-red-700 border-0">Crítico</Badge>;
    if (alert === 'WARNING') return <Badge className="bg-amber-100 text-amber-700 border-0">Atenção</Badge>;
    if (alert === 'INFO') return <Badge className="bg-blue-100 text-blue-700 border-0">Info</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-0">OK</Badge>;
  };

  const getDeltaIcon = (delta) => {
    if (delta > 0) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
    if (delta < 0) return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="space-y-5">
      {/* Configuração */}
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-50">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002443]">Revalidação em Massa</h3>
            <p className="text-xs text-[#002443]/50">Consulta a BDC para todos os cases filtrados e recalcula os scores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Status dos Cases</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (exceto Recusado)</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Em Processamento">Em Processamento</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Limite de Cases</Label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              min={1}
              max={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Modo</Label>
            <Select value={dryRun ? 'dry' : 'real'} onValueChange={(v) => setDryRun(v === 'dry')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dry">🧪 Simulação (Dry Run)</SelectItem>
                <SelectItem value="real">🚀 Executar de Verdade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleStart}
              disabled={bulkMutation.isPending}
              className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-10 rounded-xl"
            >
              {bulkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> {dryRun ? 'Simular' : 'Executar'}</>
              )}
            </Button>
          </div>
        </div>

        {!dryRun && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Atenção:</strong> O modo real vai consultar a BDC e atualizar os scores no banco. Cada consulta consome créditos BDC. Recomendamos rodar uma simulação antes.
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      {bulkMutation.isPending && (
        <div className="bg-white rounded-2xl border border-[#002443]/8 p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2bc196] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#002443]">Processando revalidação em massa...</p>
          <p className="text-xs text-[#002443]/50 mt-1">Cada case é processado com intervalo de 1.5s para respeitar rate limits da BDC</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Processados', value: results.summary.processed, color: 'text-[#002443]' },
              { label: 'Sucesso', value: results.summary.succeeded, color: 'text-green-600' },
              { label: 'Falhas', value: results.summary.failed, color: 'text-red-600' },
              { label: 'Pulados', value: results.summary.skipped, color: 'text-slate-500' },
              { label: 'Tempo Total', value: `${(results.elapsed / 1000).toFixed(1)}s`, color: 'text-blue-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#002443]/8 p-3">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[#002443]/50">{s.label}</p>
              </div>
            ))}
          </div>

          {results.dryRun && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-800"><strong>Modo Simulação:</strong> Nenhum dado foi alterado. Os resultados mostram como os scores mudariam.</p>
            </div>
          )}

          {/* Alerts summary */}
          {results.results && (() => {
            const criticals = results.results.filter(r => r.alert === 'CRITICAL');
            const warnings = results.results.filter(r => r.alert === 'WARNING');
            if (criticals.length === 0 && warnings.length === 0) return null;
            return (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Alertas de Risco
                </h4>
                {criticals.length > 0 && (
                  <p className="text-xs text-red-700">🔴 {criticals.length} case(s) com piora crítica (score subiu &gt;50 pontos)</p>
                )}
                {warnings.length > 0 && (
                  <p className="text-xs text-amber-700">🟡 {warnings.length} case(s) com piora moderada (score subiu &gt;20 pontos)</p>
                )}
              </div>
            );
          })()}

          {/* Results table */}
          <div className="bg-white rounded-2xl border border-[#002443]/8 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f4]">
                  <TableHead>Merchant</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Score Anterior</TableHead>
                  <TableHead>Score Novo</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Subfaixa</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.results?.map((r, i) => (
                  <TableRow key={i} className={r.alert === 'CRITICAL' ? 'bg-red-50/50' : r.alert === 'WARNING' ? 'bg-amber-50/50' : ''}>
                    <TableCell className="font-medium text-sm">{r.merchantName || '-'}</TableCell>
                    <TableCell className="text-xs font-mono">{r.document || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.type || '-'}</Badge></TableCell>
                    <TableCell className="text-sm">{r.oldScore ?? '-'}</TableCell>
                    <TableCell className="text-sm font-semibold">{r.newScore ?? '-'}</TableCell>
                    <TableCell>
                      {r.scoreDelta != null ? (
                        <div className="flex items-center gap-1">
                          {getDeltaIcon(r.scoreDelta)}
                          <span className={`text-xs font-mono ${r.scoreDelta > 0 ? 'text-red-600' : r.scoreDelta < 0 ? 'text-green-600' : 'text-slate-500'}`}>
                            {r.scoreDelta >= 0 ? '+' : ''}{r.scoreDelta}
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {r.subfaixaChanged ? (
                        <span className="text-xs">{r.oldSubfaixa} → <strong>{r.newSubfaixa}</strong></span>
                      ) : (
                        <span className="text-xs text-slate-500">{r.newSubfaixa || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>{r.alert ? getAlertBadge(r.alert) : <span className="text-xs text-slate-400">—</span>}</TableCell>
                    <TableCell>
                      {r.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : r.status === 'skipped' ? (
                        <Clock className="w-4 h-4 text-slate-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" title={r.error} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Revalidação em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a executar a revalidação real via BDC para até <strong>{limit} cases</strong> com status <strong>{statusFilter === 'all' ? 'todos' : statusFilter}</strong>.
              Isso vai consumir créditos na BigDataCorp e atualizar os scores no banco. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowConfirm(false); bulkMutation.mutate(); }}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90"
            >
              Confirmar e Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}