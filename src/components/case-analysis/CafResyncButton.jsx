import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * CafResyncButton — botão admin pra forçar reconciliação CAF de um caso específico.
 * Útil quando o webhook não chegou e queremos buscar o status atual manualmente.
 */
export default function CafResyncButton({ onboardingCaseId, transactionId, size = 'sm', variant = 'outline', onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleResync = async () => {
    if (!onboardingCaseId && !transactionId) {
      toast.error('onboardingCaseId ou transactionId é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const payload = transactionId ? { transactionId } : { onboardingCaseId };
      const res = await base44.functions.invoke('cafReconcilePendingTransactions', payload);
      const data = res.data;

      if (data?.success) {
        const { processed, reconciled, stillProcessing, failed } = data;
        if (processed === 0) {
          toast.info('Nenhuma transação pendente pra reconciliar');
        } else if (reconciled > 0) {
          toast.success(`${reconciled} transação(ões) reconciliada(s) com a CAF`, {
            description: stillProcessing > 0 ? `${stillProcessing} ainda em processamento` : undefined,
          });
          if (onSuccess) onSuccess(data);
        } else if (stillProcessing > 0) {
          toast.info(`${stillProcessing} transação(ões) ainda em processamento na CAF`);
        } else if (failed > 0) {
          toast.error(`${failed} falha(s) ao consultar CAF`);
        }
      } else {
        toast.error(data?.error || 'Falha na reconciliação');
      }
    } catch (e) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleResync}
      disabled={loading}
      className="gap-1.5"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Sincronizando...' : 'Resincronizar CAF'}
    </Button>
  );
}