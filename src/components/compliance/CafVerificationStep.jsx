import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ScanFace, FileCheck, CheckCircle2, Loader2, AlertCircle,
  Camera, Shield, ArrowRight, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CafVerificationStep — Handles the 3-step native CAF verification:
 * 1. Document Capture (front)
 * 2. Document Capture (back) 
 * 3. Liveness + FaceMatch
 *
 * Since CAF SDKs (DocumentDetector, CafFaceLiveness) are native mobile SDKs
 * and cannot run in a browser, this component generates a CAF web verification
 * link via the API and embeds it, OR shows instructions for mobile.
 */

const STEPS = [
  { 
    id: 'document', 
    label: 'Documento de Identidade',
    description: 'Capture a frente e o verso do seu RG ou CNH',
    icon: FileCheck,
    color: 'blue'
  },
  { 
    id: 'liveness', 
    label: 'Prova de Vida',
    description: 'Verificação facial com prova de vida',
    icon: ScanFace,
    color: 'purple'
  },
];

export default function CafVerificationStep({ 
  personName, 
  personCpf,
  onComplete,
  onSkip,
  onboardingCaseId 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cafData, setCafData] = useState(null);
  const [error, setError] = useState(null);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verifyingResult, setVerifyingResult] = useState(false);

  // Generate CAF token and start verification
  const startVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('cafGenerateToken', {
        personName: personName || '',
        personCpf: personCpf || '',
      });

      const data = response.data;
      if (data.error) {
        setError(data.error);
        toast.error('Erro ao iniciar verificação: ' + data.error);
        return;
      }

      setCafData(data);
      setVerificationStarted(true);
      toast.success('Verificação iniciada! Siga as instruções abaixo.');
    } catch (err) {
      setError(err.message);
      toast.error('Erro ao conectar com serviço de verificação');
    } finally {
      setLoading(false);
    }
  }, [personName, personCpf]);

  // Check verification result
  const checkResult = useCallback(async () => {
    if (!cafData?.transactionId) return;
    setVerifyingResult(true);
    try {
      const response = await base44.functions.invoke('cafVerifyResult', {
        transactionId: cafData.transactionId,
        onboardingCaseId: onboardingCaseId || '',
      });

      const result = response.data;
      if (result.approved) {
        setVerificationComplete(true);
        toast.success('Verificação concluída com sucesso!');
        onComplete?.({
          transactionId: cafData.transactionId,
          status: 'approved',
          ...result,
        });
      } else if (result.status === 'pending' || result.status === 'processing') {
        toast.info('Verificação ainda em processamento. Tente novamente em alguns instantes.');
      } else {
        toast.error('Verificação não aprovada. Status: ' + (result.status || 'desconhecido'));
      }
    } catch (err) {
      toast.error('Erro ao verificar resultado: ' + err.message);
    } finally {
      setVerifyingResult(false);
    }
  }, [cafData, onboardingCaseId, onComplete]);

  // Completed state
  if (verificationComplete) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-2">Verificação Concluída!</h3>
        <p className="text-sm text-[#002443]/60 mb-6">
          Sua identidade foi verificada com sucesso. Prossiga para o envio dos documentos complementares.
        </p>
        <Button
          onClick={() => onComplete?.({ transactionId: cafData?.transactionId, status: 'approved' })}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-xl"
        >
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-50 mb-4">
          <ScanFace className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-[#002443] mb-2">
          Verificação de Identidade
        </h2>
        <p className="text-sm text-[#002443]/60 max-w-md mx-auto">
          Para sua segurança, precisamos verificar sua identidade com captura de documento e prova de vida.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep || verificationComplete;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {idx > 0 && <div className={`w-8 h-0.5 ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                isDone ? 'bg-green-50 border-green-200' :
                isActive ? 'bg-purple-50 border-purple-200' :
                'bg-slate-50 border-slate-200'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                )}
                <span className={`text-xs font-medium ${isDone ? 'text-green-700' : isActive ? 'text-purple-700' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content */}
      {!verificationStarted ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Camera className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Tenha em mãos seu RG ou CNH</p>
                <p className="text-xs text-blue-600 mt-1">
                  Você precisará fotografar a frente e o verso do documento, e em seguida fazer uma verificação facial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <ScanFace className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-800">Prova de vida</p>
                <p className="text-xs text-purple-600 mt-1">
                  Uma verificação facial será realizada para confirmar que é você mesmo. Procure um local com boa iluminação.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Erro na verificação</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={startVerification}
              disabled={loading}
              className="flex-1 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Iniciando...</>
              ) : (
                <><ScanFace className="w-4 h-4 mr-2" /> Iniciar Verificação</>
              )}
            </Button>
            {onSkip && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="text-slate-500 border-slate-200 h-12 rounded-xl"
              >
                Pular
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {/* Verification in progress */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mb-2">
              <ScanFace className="w-7 h-7 text-amber-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-[#002443]">Verificação em Andamento</h3>
            <p className="text-sm text-[#002443]/60">
              O processo de verificação de identidade foi iniciado. Complete a captura do documento e a prova de vida usando o link abaixo.
            </p>

            {cafData?.transactionId && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                ID da Transação: <span className="font-mono font-semibold">{cafData.transactionId}</span>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2">Instruções:</p>
              <ol className="text-xs text-amber-700 space-y-1.5 list-decimal pl-4">
                <li>Abra a câmera do dispositivo quando solicitado</li>
                <li>Fotografe a <strong>frente</strong> do seu RG ou CNH</li>
                <li>Fotografe o <strong>verso</strong> do documento</li>
                <li>Realize a <strong>prova de vida</strong> (siga as instruções na tela)</li>
                <li>Aguarde a confirmação e volte aqui para verificar o resultado</li>
              </ol>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={checkResult}
                disabled={verifyingResult}
                className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6 h-11 rounded-xl"
              >
                {verifyingResult ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Verificar Resultado</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setVerificationStarted(false);
                  setCafData(null);
                }}
                className="border-slate-200 text-slate-500 h-11 rounded-xl"
              >
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
        <Shield className="w-5 h-5 text-[#002443]/40 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#002443]">Verificação segura</p>
          <p className="text-xs text-[#002443]/50 mt-1">
            Este processo utiliza tecnologia avançada de reconhecimento facial e detecção de documentos, certificada pela CAF (Combate à Fraude).
          </p>
        </div>
      </div>
    </div>
  );
}