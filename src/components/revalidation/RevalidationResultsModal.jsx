import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Shield, X,
} from 'lucide-react';

const SUBFAIXA_COLORS = {
  '1A': 'bg-green-100 text-green-700',
  '1B': 'bg-green-50 text-green-600',
  '2A': 'bg-blue-100 text-blue-700',
  '2B': 'bg-blue-50 text-blue-600',
  '3A': 'bg-amber-100 text-amber-700',
  '3B': 'bg-orange-100 text-orange-700',
  '4': 'bg-red-100 text-red-700',
  '5': 'bg-red-200 text-red-800',
};

export default function RevalidationResultsModal({ open, onClose, data }) {
  if (!data) return null;

  const isSingle = !data.summary;
  const results = isSingle ? [data.result] : (data.results || []);
  const criticals = results.filter(r => r?.alert === 'CRITICAL');
  const warnings = results.filter(r => r?.alert === 'WARNING');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2bc196]" />
            Resultado da Revalidação
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        {data.summary && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Processados', value: data.summary.processed, color: 'text-[#002443]' },
              { label: 'Sucesso', value: data.summary.succeeded, color: 'text-green-600' },
              { label: 'Falhas', value: data.summary.failed, color: 'text-red-600' },
              { label: 'Tempo', value: `${(data.elapsed / 1000).toFixed(1)}s`, color: 'text-blue-600' },
            ].map((s, i) => (
              <div key={i} className="bg-[#f4f4f4] rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[#002443]/50">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {(criticals.length > 0 || warnings.length > 0) && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
            <h4 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Alertas de Risco
            </h4>
            {criticals.length > 0 && (
              <p className="text-xs text-red-700">🔴 {criticals.length} com piora crítica (&gt;50 pts)</p>
            )}
            {warnings.length > 0 && (
              <p className="text-xs text-amber-700">🟡 {warnings.length} com piora moderada (&gt;20 pts)</p>
            )}
          </div>
        )}

        {/* Results Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f4]">
                <TableHead>Cliente</TableHead>
                <TableHead>Score Anterior</TableHead>
                <TableHead>Score Novo</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Subfaixa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.filter(Boolean).map((r, i) => (
                <TableRow key={i} className={
                  r.alert === 'CRITICAL' ? 'bg-red-50/50' :
                  r.alert === 'WARNING' ? 'bg-amber-50/50' : ''
                }>
                  <TableCell className="font-medium text-sm">{r.merchantName || 'Cliente'}</TableCell>
                  <TableCell className="text-sm">{r.oldScore ?? '—'}</TableCell>
                  <TableCell className="text-sm font-semibold">{r.newScore ?? '—'}</TableCell>
                  <TableCell>
                    {r.scoreDelta != null ? (
                      <div className="flex items-center gap-1">
                        {r.scoreDelta > 0 ? <TrendingUp className="w-3.5 h-3.5 text-red-500" /> :
                         r.scoreDelta < 0 ? <TrendingDown className="w-3.5 h-3.5 text-green-500" /> :
                         <Minus className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={`text-xs font-mono ${
                          r.scoreDelta > 0 ? 'text-red-600' : r.scoreDelta < 0 ? 'text-green-600' : 'text-slate-500'
                        }`}>
                          {r.scoreDelta >= 0 ? '+' : ''}{r.scoreDelta}
                        </span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {r.subfaixaChanged ? (
                      <span className="text-xs">
                        <Badge className={`${SUBFAIXA_COLORS[r.oldSubfaixa] || ''} text-[10px] border-0 mr-1`}>{r.oldSubfaixa}</Badge>
                        →
                        <Badge className={`${SUBFAIXA_COLORS[r.newSubfaixa] || ''} text-[10px] border-0 ml-1`}>{r.newSubfaixa}</Badge>
                      </span>
                    ) : (
                      <Badge className={`${SUBFAIXA_COLORS[r.newSubfaixa] || 'bg-slate-100 text-slate-600'} text-[10px] border-0`}>
                        {r.newSubfaixa || '—'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" title={r.error} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onClose(false)} className="rounded-xl">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}