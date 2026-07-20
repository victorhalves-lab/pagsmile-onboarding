import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

/**
 * Modal admin para varrer e mesclar Merchants duplicados (mesmo CNPJ/CPF).
 *
 * Fluxo:
 *   1. Ao abrir: roda dryRun=true → mostra grupos com duplicatas + canônico + duplicados.
 *   2. Admin revisa e clica "Mesclar X grupos".
 *   3. Roda dryRun=false → migra cases/leads/contratos e apaga duplicados.
 */
export default function MergeDuplicatesModal({ open, onOpenChange, onMerged }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [executing, setExecuting] = useState(false);

  // Roda preview ao abrir
  React.useEffect(() => {
    if (open && !report) {
      runScan();
    }
    if (!open) {
      setReport(null);
    }
  }, [open]);

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('mergeDuplicateMerchants', { dryRun: true });
      setReport(res.data);
    } catch (err) {
      toast.error('Erro ao escanear: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runMerge = async () => {
    if (!confirm(`Confirmar mesclagem de ${report.totalGroupsWithDuplicates} grupos? Esta ação NÃO pode ser desfeita.`)) return;
    setExecuting(true);
    try {
      const res = await base44.functions.invoke('mergeDuplicateMerchants', { dryRun: false });
      const r = res.data;
      toast.success(`✓ ${r.merchantsDeleted} duplicatas removidas. ${r.casesMigrated} casos migrados.`);
      setReport(null);
      onMerged?.();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao mesclar: ' + err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--pinbank-blue)]">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Mesclagem de Cadastros Duplicados
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--pinbank-blue)]" />
            <p className="text-sm text-[var(--pinbank-blue)]/60 mt-3">Escaneando base de Merchants...</p>
          </div>
        )}

        {!loading && report && report.totalGroupsWithDuplicates === 0 && (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="font-semibold text-[var(--pinbank-blue)]">Nenhuma duplicata encontrada</p>
            <p className="text-sm text-[var(--pinbank-blue)]/60 mt-1">Sua base está limpa.</p>
          </div>
        )}

        {!loading && report && report.totalGroupsWithDuplicates > 0 && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900">
                ⚠️ {report.totalGroupsWithDuplicates} grupo{report.totalGroupsWithDuplicates > 1 ? 's' : ''} com duplicatas
                <span className="text-amber-700 font-normal"> ({report.totalDuplicateRecords} registro{report.totalDuplicateRecords > 1 ? 's' : ''} extra{report.totalDuplicateRecords > 1 ? 's' : ''} a remover)</span>
              </p>
              <p className="text-xs text-amber-700/80 mt-1">
                O registro <strong>mais antigo</strong> de cada grupo é mantido como canônico.
                Casos, subsellers e contratos dos duplicados são migrados para ele.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {report.groups.map((g, idx) => (
                <div key={idx} className="border border-[var(--pinbank-blue)]/10 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[var(--pinbank-blue)]/40" />
                    <code className="text-xs font-mono text-[var(--pinbank-blue)]/60">{g.cpfCnpj}</code>
                    <Badge variant="outline" className="text-[10px]">{g.duplicates.length + 1} registros</Badge>
                  </div>

                  {/* Canônico */}
                  <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] font-bold text-green-700 uppercase">Manter (canônico)</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--pinbank-blue)] mt-1">
                      {g.canonical.companyName || g.canonical.fullName}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[var(--pinbank-blue)]/60 mt-0.5">
                      <span>{g.canonical.email}</span>
                      <span>•</span>
                      <span>{g.canonical.onboardingStatus}</span>
                      <span>•</span>
                      <span>{new Date(g.canonical.created_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Duplicados */}
                  {g.duplicates.map((d) => (
                    <div key={d.id} className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-[10px] font-bold text-red-700 uppercase">Remover</span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--pinbank-blue)] mt-1">
                        {d.companyName || d.fullName}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-[var(--pinbank-blue)]/60 mt-0.5">
                        <span>{d.email}</span>
                        <span>•</span>
                        <span>{d.onboardingStatus}</span>
                        <span>•</span>
                        <span>{new Date(d.created_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-2 sticky bottom-0 bg-white pt-3 border-t border-[var(--pinbank-blue)]/10">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={executing}>
                Cancelar
              </Button>
              <Button
                onClick={runMerge}
                disabled={executing}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {executing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mesclando...</>
                ) : (
                  <>Mesclar {report.totalGroupsWithDuplicates} grupo{report.totalGroupsWithDuplicates > 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}