import React from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tela exibida quando o cliente chega numa página de upload de documentos
 * SEM contexto válido (sem ?model na URL, sem localStorage, sem caseId).
 *
 * Isso pode acontecer se:
 *   - O cliente limpou cache E abriu a URL antiga diretamente
 *   - O cliente usou outro navegador
 *   - O link foi truncado (copy/paste parcial)
 *
 * Em vez de mostrar erro técnico ou uma tela em branco, orientamos
 * o cliente a voltar ao link original do questionário que recebeu.
 */
export default function NoContextRecoveryScreen({ linkSupport }) {
  return (
    <div className="max-w-xl mx-auto py-12 px-6 text-center">
      <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-amber-100 mb-6">
        <AlertTriangle className="w-10 h-10 text-amber-600" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
        Sessão não encontrada
      </h1>

      <p className="text-[#0A0A0A]/70 mb-6 leading-relaxed">
        Parece que seu progresso foi perdido — isso acontece quando o cache do navegador
        é limpo ou quando você abre o link em um navegador diferente do que iniciou o preenchimento.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
        <p className="text-sm font-semibold text-blue-900 mb-2">Como continuar:</p>
        <ol className="text-sm text-blue-900/80 space-y-1.5 list-decimal pl-5">
          <li>Volte ao e-mail ou mensagem com o link do questionário que você recebeu.</li>
          <li>Abra o link novamente no mesmo navegador.</li>
          <li>Se já havia preenchido, o sistema retomará do ponto em que parou.</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="h-11 px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à página anterior
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="h-11 px-6 bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/90 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>

      {linkSupport && (
        <p className="text-xs text-[#0A0A0A]/50 mt-8">
          Precisa de ajuda? Entre em contato: <a href={`mailto:${linkSupport}`} className="text-[var(--pinbank-blue)] font-semibold">{linkSupport}</a>
        </p>
      )}
    </div>
  );
}