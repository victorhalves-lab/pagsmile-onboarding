import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, Mail, Loader2, CheckCircle2, AlertCircle, 
  ArrowLeft, ArrowRight, ExternalLink 
} from 'lucide-react';

export default function LivenessFacematchStep() {
  const navigate = useNavigate();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState('pending'); // pending, sent, completed, failed
  const [sessionId, setSessionId] = useState('');

  // Gera o link simulado
  const simulatedLivenessLink = sessionId 
    ? `${window.location.origin}${createPageUrl('LivenessSimulation')}?sessionId=${sessionId}`
    : '';

  // Escuta mensagens do popup de liveness
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'LIVENESS_COMPLETED' && event.data?.sessionId === sessionId) {
        setLivenessStatus('completed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId]);

  const handleGenerateLink = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setLinkGenerated(true);
    setLivenessStatus('sent');
  };

  const handleOpenSimulation = () => {
    window.open(simulatedLivenessLink, '_blank', 'width=500,height=700');
  };

  const handleContinue = () => {
    navigate(createPageUrl('OnboardingCompletion'));
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pagsmile-green)]/10 mb-4">
              <Shield className="w-8 h-8 text-[var(--pagsmile-green)]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Verificação de Identidade</h1>
            <p className="text-slate-500 mt-2">Liveness e Facematch</p>
          </div>

          {/* Descrição */}
          <p className="text-slate-600 text-center mb-6">
            Para garantir a segurança, precisamos verificar a identidade do sócio principal. 
            Um link será enviado para realizar o teste de vivacidade e comparação facial.
          </p>

          {/* Campo de e-mail */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="partnerEmail" className="text-sm font-medium text-slate-700">
              E-mail do Sócio Principal
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="partnerEmail"
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="email.socio@empresa.com.br"
                className="pl-10"
                disabled={linkGenerated}
              />
            </div>
          </div>

          {/* Botão de gerar link */}
          {!linkGenerated && (
            <Button
              onClick={handleGenerateLink}
              disabled={!partnerEmail}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
            >
              Gerar Link de Verificação
            </Button>
          )}

          {/* Status do Liveness */}
          {linkGenerated && (
            <div className="space-y-4">
              {/* Painel de Status */}
              <div className={`p-4 rounded-xl border-2 ${
                livenessStatus === 'completed' 
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : livenessStatus === 'failed'
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-300 bg-blue-50'
              }`}>
                <div className="flex items-center gap-3">
                  {livenessStatus === 'sent' && (
                    <>
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-800">Link Enviado</p>
                        <p className="text-sm text-blue-600">Aguardando conclusão da verificação.</p>
                      </div>
                    </>
                  )}
                  {livenessStatus === 'completed' && (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-[var(--pagsmile-green)]" />
                      <div>
                        <p className="font-medium text-[var(--pagsmile-green)]">Verificação Concluída</p>
                        <p className="text-sm text-slate-600">Sua identidade foi verificada com sucesso.</p>
                      </div>
                    </>
                  )}
                  {livenessStatus === 'failed' && (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Verificação Falhou</p>
                        <p className="text-sm text-red-600">Algo deu errado. Por favor, tente novamente.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Alerta de Modo Demo */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Modo Demonstração:</strong> Esta é uma simulação do fluxo de verificação de vivacidade. 
                  No ambiente real, o link seria enviado por e-mail.
                </AlertDescription>
              </Alert>

              {/* Botão para abrir simulação */}
              {livenessStatus === 'sent' && (
                <Button
                  onClick={handleOpenSimulation}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Simulação Externa
                </Button>
              )}
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            {livenessStatus === 'completed' ? (
              <Button
                onClick={handleContinue}
                className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
              >
                Continuar para o Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl('AdminDashboard'))}
              >
                Voltar para o Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}