import React from 'react';
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tela reutilizável para estados de erro em propostas públicas.
 *
 * Distingue:
 *  - 'error'     → erro de rede / timeout → botão de retry, NÃO fala "não encontrada"
 *  - 'notfound'  → realmente não existe  → mensagem clara de link inválido
 *
 * Esta separação é crítica: antes, qualquer falha transitória mostrava
 * "proposta não encontrada" para o cliente, causando a pior UX possível.
 */
export default function PublicProposalErrorState({ status, onRetry, isRetrying = false }) {
  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">
          Conexão instável
        </h1>
        <p className="text-[#002443]/70 mb-6">
          Não conseguimos carregar a sua proposta agora. Isso pode ser um problema temporário de rede.
          <br /><br />
          Sua proposta <strong>continua disponível</strong> — basta tentar novamente.
        </p>
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-2xl font-bold"
        >
          {isRetrying ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recarregando...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente</>
          )}
        </Button>
        <p className="text-xs text-[#002443]/40 mt-6">
          Se o problema persistir, entre em contato com seu consultor.
        </p>
      </div>
    );
  }

  // notfound
  return (
    <div className="max-w-lg mx-auto py-20 text-center px-4">
      <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
      <h1 className="text-2xl font-bold text-[#002443] mb-2">
        Proposta não encontrada
      </h1>
      <p className="text-[#002443]/60 mb-4">
        Esta proposta não está mais disponível. Entre em contato com seu consultor para receber um novo link.
      </p>
    </div>
  );
}