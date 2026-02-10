import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Shield, User, Scan, Camera, FileText, Loader2, 
  CheckCircle2, Smile, MoveHorizontal 
} from 'lucide-react';

const STAGES = [
  { id: 'welcome', progress: 0, title: 'Verificação de Identidade' },
  { id: 'liveness_instructions', progress: 20, title: 'Prova de Vida' },
  { id: 'liveness_scanning', progress: 40, title: 'Escaneando...' },
  { id: 'facematch_selfie', progress: 55, title: 'Tire uma Selfie' },
  { id: 'facematch_document', progress: 70, title: 'Foto do Documento' },
  { id: 'processing', progress: 88, title: 'Processando...' },
  { id: 'completed', progress: 100, title: 'Verificação Concluída!' }
];

export default function LivenessSimulation() {
  const [currentStage, setCurrentStage] = useState('welcome');
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  const stage = STAGES.find(s => s.id === currentStage);

  useEffect(() => {
    if (currentStage === 'liveness_scanning') {
      const timer = setTimeout(() => setCurrentStage('facematch_selfie'), 3000);
      return () => clearTimeout(timer);
    }
    if (currentStage === 'processing') {
      const timer = setTimeout(() => setCurrentStage('completed'), 3500);
      return () => clearTimeout(timer);
    }
  }, [currentStage]);

  useEffect(() => {
    if (currentStage === 'completed' && sessionId && window.opener) {
      window.opener.postMessage({ type: 'LIVENESS_COMPLETED', sessionId }, '*');
    }
  }, [currentStage, sessionId]);

  const handleCloseWindow = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'LIVENESS_COMPLETED', sessionId }, '*');
    }
    window.close();
  };

  const renderStage = () => {
    switch (currentStage) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-[#2bc196]/10 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-[#2bc196]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Verificação de Identidade</h2>
              <p className="text-[#002443]/60 text-sm leading-relaxed px-2">
                Para finalizar a verificação da sua conta, um link será enviado para o sócio principal realizar o teste de vivacidade e comparação facial.
              </p>
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                  <Scan className="w-5 h-5 text-[#2bc196]" />
                </div>
                <span className="font-semibold text-[#002443] text-sm">Prova de Vida</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#2bc196]" />
                </div>
                <span className="font-semibold text-[#002443] text-sm">Tire uma Selfie</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#2bc196]" />
                </div>
                <span className="font-semibold text-[#002443] text-sm">Foto do Documento</span>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStage('liveness_instructions')}
              className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
            >
              Iniciar Verificação
            </Button>
          </div>
        );

      case 'liveness_instructions':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Prova de Vida</h2>
              <p className="text-[#002443]/60 text-sm">Siga as instruções na tela</p>
            </div>
            <div className="space-y-3 text-left">
              <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Smile className="w-5 h-5 text-amber-500" />
                </div>
                <span className="font-medium text-[#002443] text-sm">Sorria para a câmera</span>
              </div>
              <div className="bg-[#f8f9fa] rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <MoveHorizontal className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-medium text-[#002443] text-sm">Mova a cabeça para os lados</span>
              </div>
            </div>
            <p className="text-xs text-[#002443]/40 italic">
              Certifique-se de estar em um local bem iluminado
            </p>
            <Button 
              onClick={() => setCurrentStage('liveness_scanning')}
              className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
            >
              Iniciar Captura
            </Button>
          </div>
        );

      case 'liveness_scanning':
        return (
          <div className="text-center space-y-8 py-4">
            <div className="relative w-44 h-44 mx-auto">
              {/* Outer dashed circle */}
              <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '8s' }} viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="84" fill="none" stroke="#2bc196" strokeWidth="3" strokeDasharray="12 8" opacity="0.6" />
              </svg>
              {/* Inner circle */}
              <div className="absolute inset-4 bg-[#f0f4f8] rounded-full flex items-center justify-center">
                <Scan className="w-14 h-14 text-[#2bc196]/60" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Escaneando...</h2>
              <p className="text-[#002443]/60 text-sm">Mantenha o rosto centralizado</p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-[#2bc196] animate-spin" />
            </div>
          </div>
        );

      case 'facematch_selfie':
        return (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Tire uma Selfie</h2>
              <p className="text-[#002443]/60 text-sm">Posicione seu rosto no centro da tela</p>
            </div>
            {/* Capture area */}
            <div className="aspect-[4/3] bg-[#f4f6f8] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-3">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <span className="text-sm text-[#002443]/40">Área de captura</span>
            </div>
            <Button 
              onClick={() => setCurrentStage('facematch_document')}
              className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar Selfie
            </Button>
          </div>
        );

      case 'facematch_document':
        return (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Foto do Documento</h2>
              <p className="text-[#002443]/60 text-sm">Fotografe a frente do seu RG ou CNH</p>
            </div>
            {/* Document area */}
            <div className="aspect-[16/10] bg-[#f4f6f8] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <FileText className="w-14 h-14 text-slate-300 mb-3" />
              <span className="text-sm text-[#002443]/40">Posicione o documento aqui</span>
            </div>
            <Button 
              onClick={() => setCurrentStage('processing')}
              className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar Documento
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-8 py-4">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#2bc196] animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#002443] mb-2">Processando...</h2>
              <p className="text-[#002443]/60 text-sm">Estamos verificando suas informações</p>
            </div>
            <div className="space-y-3 text-left px-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                <span className="font-medium text-[#002443] text-sm">Prova de vida concluída</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                <span className="font-medium text-[#002443] text-sm">Selfie capturada</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                <span className="font-medium text-[#002443]/70 text-sm">Comparando faces...</span>
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-[#2bc196]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#2bc196]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#2bc196] mb-2">Verificação Concluída!</h2>
              <p className="text-[#002443]/60 text-sm">Sua identidade foi verificada com sucesso.</p>
            </div>
            <div className="bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-2xl p-5 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                <span className="font-semibold text-[#002443] text-sm">Prova de vida validada</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                <span className="font-semibold text-[#002443] text-sm">Comparação facial aprovada</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                <span className="font-semibold text-[#002443] text-sm">Documento verificado</span>
              </div>
            </div>
            <Button 
              onClick={handleCloseWindow}
              className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
            >
              Fechar Janela
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1.5 bg-slate-100">
            <div 
              className="h-full bg-[#002443] transition-all duration-700 ease-out"
              style={{ width: `${stage?.progress || 0}%` }} 
            />
          </div>

          {/* Step Label */}
          <p className="text-center text-sm text-[#002443]/40 mt-4 font-medium">
            {stage?.title}
          </p>

          {/* Content */}
          <div className="px-8 pb-8 pt-4">
            {renderStage()}
          </div>
        </div>

        {/* Pagsmile Logo */}
        <div className="text-center mt-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png"
            alt="Pagsmile" 
            className="h-6 mx-auto opacity-30"
          />
        </div>
      </div>
    </div>
  );
}