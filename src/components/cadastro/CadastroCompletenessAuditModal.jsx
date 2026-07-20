import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, MinusCircle, Loader2, Search, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  ok: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'OK' },
  gap: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'GAP' },
  empty: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Vazio' },
};

export default function CadastroCompletenessAuditModal({ merchantId, merchantName }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('auditCadastroCompleteness', { merchantId });
      setReport(res.data);
    } catch (e) {
      setError(e?.message || 'Falha ao auditar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !report) {
      runAudit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50">
          <Search className="w-3.5 h-3.5" /> Auditar Cadastro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Auditoria de Completude — {merchantName}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <span className="ml-3 text-sm text-slate-600">Verificando todas as entidades...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>Erro:</strong> {error}
            <Button onClick={runAudit} size="sm" variant="outline" className="ml-3">Tentar novamente</Button>
          </div>
        )}

        {!loading && !error && report && (
          <>
            {/* Summary card */}
            <div className="bg-white border border-[var(--pinbank-blue)]/10 rounded-xl p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--pinbank-blue)]">{report.summary.percentComplete}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Completude</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{report.summary.ok}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">OK</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{report.summary.gap}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">GAPs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-400">{report.summary.empty}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Sem dados</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${report.summary.percentComplete === 100 ? 'bg-green-500' : report.summary.percentComplete >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${report.summary.percentComplete}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  {report.summary.ok} de {report.summary.withData} entidades com dados estão exibidas. {report.summary.gap > 0 && `${report.summary.gap} entidades com dados ainda não aparecem no Cadastro.`}
                </p>
              </div>
            </div>

            {/* Detail by section */}
            <ScrollArea className="flex-1 mt-3">
              <div className="space-y-3">
                {report.sections.map(section => {
                  const sectionGaps = section.entities.filter(e => e.status === 'gap').length;
                  return (
                    <div key={section.id} className="bg-white border border-[var(--pinbank-blue)]/10 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{section.title}</p>
                          <p className="text-[11px] text-slate-500">{section.description}</p>
                        </div>
                        {sectionGaps > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-[10px]">{sectionGaps} GAP{sectionGaps > 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                      <div className="divide-y divide-slate-50">
                        {section.entities.map(entity => {
                          const sc = STATUS_CONFIG[entity.status];
                          const Icon = sc.icon;
                          return (
                            <div key={entity.name} className="px-4 py-2.5 flex items-start gap-3">
                              <Icon className={`w-4 h-4 ${sc.color} flex-shrink-0 mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-[var(--pinbank-blue)] font-mono">{entity.name}</span>
                                  <Badge variant="outline" className="text-[9px] py-0">{entity.recordsFound} reg.</Badge>
                                  <Badge className={`${sc.bg} ${sc.color} text-[9px] py-0 border ${sc.border}`}>{sc.label}</Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{entity.description}</p>
                                {entity.displayedIn && (
                                  <p className="text-[11px] text-green-700 mt-0.5">✓ Exibido em: {entity.displayedIn}</p>
                                )}
                                {entity.note && (
                                  <p className="text-[11px] text-red-600 mt-0.5">⚠ {entity.note}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Auditado em {new Date(report.auditedAt).toLocaleString('pt-BR')}</span>
              <Button size="sm" variant="outline" onClick={runAudit} className="text-xs">Re-auditar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}