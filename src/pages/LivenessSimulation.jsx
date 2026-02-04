import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Shield, User, Scan, Camera, FileText, Loader2, 
  CheckCircle2, Smile, MoveHorizontal 
} from 'lucide-react';

const STAGES = [
  { id: 'welcome', progress: 0, title: 'Bem-vindo' },
  { id: 'liveness_instructions', progress: 15, title: 'Instruções de Vivacidade' },
  { id: 'liveness_scanning', progress: 35, title: 'Escaneando...' },
  { id: 'facematch_selfie', progress: 55, title: 'Tirar Selfie' },
  { id: 'facematch_document', progress: 75, title: 'Foto do Documento' },
  { id: 'processing', progress: 90, title: 'Processando...' },
  { id: 'completed', progress: 100, title: 'Concluído' }
];

export default function LivenessSimulation() {
  const [currentStage, setCurrentStage] = useState('welcome');
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  const stage = STAGES.find(s => s.id === currentStage);

  useEffect(() => {
    // Auto-avançar em estágios de processamento
    if (currentStage === 'liveness_scanning') {
      const timer = setTimeout(() => setCurrentStage('facematch_selfie'), 3000);
      return () => clearTimeout(timer);
    }
    if (currentStage === 'processing') {
      const timer = setTimeout(() => setCurrentStage('completed'), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStage]);

  useEffect(() => {
    // Notificar janela pai quando completado
    if (currentStage === 'completed' && sessionId && window.opener) {
      window.opener.postMessage({ type: 'LIVENESS_COMPLETED', sessionId }, '*');
    }
  }, [currentStage, sessionId]);

  const handleCloseWindow = () => {
    window.close();
  };

  const renderStage = () => {
    switch (currentStage) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-[var(--pagsmile-green)]/10 rounded-full flex items-center justify-center">
              <Shield className="w-12 h-12 text-[var(--pagsmile-green)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verificação de Identidade</h2>
              <p className="text-slate-400">Para sua segurança, precisamos verificar sua identidade.</p>
            </div>
            <div className="space-y-3 text-left bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Scan className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Prova de Vivacidade</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Camera className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Tirar uma Selfie</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <FileText className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Foto do Documento</span>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStage('liveness_instructions')}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              Iniciar Verificação
            </Button>
          </div>
        );

      case 'liveness_instructions':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-slate-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Prova de Vivacidade</h2>
              <p className="text-slate-400">Siga as instruções para completar a prova de vivacidade.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Smile className="w-8 h-8 text-[var(--pagsmile-green)]" />
                <span className="text-slate-300">Sorria para a câmera.</span>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <MoveHorizontal className="w-8 h-8 text-[var(--pagsmile-green)]" />
                <span className="text-slate-300">Mova a cabeça lentamente de um lado para o outro.</span>
              </div>
            </div>
            <p className="text-sm text-yellow-400">
              Certifique-se de estar em um local bem iluminado.
            </p>
            <Button 
              onClick={() => setCurrentStage('liveness_scanning')}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              Iniciar Captura
            </Button>
          </div>
        );

      case 'liveness_scanning':
        return (
          <div className="text-center space-y-6">
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 border-4 border-dashed border-[var(--pagsmile-green)] rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-slate-700 rounded-full flex items-center justify-center">
                <Scan className="w-16 h-16 text-[var(--pagsmile-green)] animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Escaneando Vivacidade...</h2>
              <p className="text-slate-400">Mantenha seu rosto centralizado no quadro.</p>
            </div>
          </div>
        );

      case 'facematch_selfie':
        return (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Tirar uma Selfie</h2>
              <p className="text-slate-400">Posicione seu rosto dentro da área indicada.</p>
            </div>
            <div className="aspect-[4/3] bg-slate-700 rounded-xl flex items-center justify-center">
              <User className="w-24 h-24 text-slate-500" />
            </div>
            <Button 
              onClick={() => setCurrentStage('facematch_document')}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capturar Selfie
            </Button>
          </div>
        );

      case 'facematch_document':
        return (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Foto do Documento</h2>
              <p className="text-slate-400">Tire uma foto nítida da frente do seu RG/CNH.</p>
            </div>
            <div className="aspect-[16/10] bg-slate-700 rounded-xl flex items-center justify-center">
              <FileText className="w-24 h-24 text-slate-500" />
            </div>
            <Button 
              onClick={() => setCurrentStage('processing')}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capturar Documento
            </Button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-[var(--pagsmile-green)] animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Processando...</h2>
              <p className="text-slate-400">Estamos verificando suas informações.</p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Prova de vivacidade concluída.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Selfie capturada.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span>Comparando faces e documentos.</span>
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-[var(--pagsmile-green)]/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-[var(--pagsmile-green)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Verificação Concluída!</h2>
              <p className="text-slate-400">Sua identidade foi verificada com sucesso.</p>
            </div>
            <div className="space-y-2 text-left bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Vivacidade validada.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Correspondência facial aprovada.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-[var(--pagsmile-green)]" />
                <span>Documento verificado.</span>
              </div>
            </div>
            <Button 
              onClick={handleCloseWindow}
              className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center p-6">
      <style>{`
        :root {
          --pagsmile-green: #2bc196;
        }
      `}</style>
      <div className="max-w-md w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>{stage?.title}</span>
            <span>{stage?.progress}%</span>
          </div>
          <Progress value={stage?.progress || 0} className="h-2" />
        </div>

        {/* Card principal */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          {renderStage()}
        </div>

        {/* Logo Pagsmile */}
        <div className="text-center mt-6">
          <img 
            src="https://pagsmile.com/images/header/pagsmile_logo.svg" 
            alt="Pagsmile" 
            className="h-6 mx-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
}