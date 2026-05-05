import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, RefreshCw, Upload, Lightbulb, Camera, 
  Wifi, Eye, CircleOff, FileWarning, Shield, ExternalLink
} from 'lucide-react';

/**
 * CafErrorDiagnostic — Traduz erros do SDK CAF em feedback acionável.
 * 
 * Classifica o erro em uma categoria e mostra:
 *  - Título amigável
 *  - Causa provável
 *  - Ações recomendadas
 *  - Botões de ação contextuais (retry, fallback, suporte)
 */

const ERROR_MAP = {
  // ─── Face Match (o erro "Face picture match" da OMEGPAY) ───
  CafFaceAuthenticationError: {
    category: 'FACE_MISMATCH',
    title: 'Não conseguimos confirmar que o rosto é o mesmo do documento',
    cause: 'A selfie capturada não bateu com a foto do documento enviado. Isso pode acontecer por:',
    tips: [
      'Iluminação muito diferente entre a foto do documento e a selfie',
      'Documento estava desfocado ou parte da foto estava coberta',
      'Você pode estar usando óculos, boné ou outros acessórios agora',
      'O documento enviado pode não pertencer a você',
    ],
    icon: Eye,
    color: 'amber',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
  // ─── Liveness: detecção de vivacidade falhou ───
  CafFaceLivenessError: {
    category: 'LIVENESS_FAILED',
    title: 'Não conseguimos completar a prova de vida',
    cause: 'O sistema não conseguiu confirmar que você é uma pessoa real ao vivo. Causas comuns:',
    tips: [
      'Iluminação insuficiente ou contraluz (luz atrás de você)',
      'Movimento excessivo durante a captura',
      'Rosto não estava totalmente visível no oval',
      'Máscara, óculos escuros ou objeto cobrindo o rosto',
    ],
    icon: Lightbulb,
    color: 'amber',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
  // ─── Câmera: permissão negada ───
  CafCameraPermissionDeniedError: {
    category: 'CAMERA_PERMISSION',
    title: 'Precisamos de acesso à sua câmera',
    cause: 'O acesso à câmera foi negado. Para continuar:',
    tips: [
      'Clique no ícone de cadeado na barra de endereço do navegador',
      'Procure "Câmera" nas permissões e mude para "Permitir"',
      'Recarregue esta página após permitir',
      'Se estiver em modo anônimo, tente em uma aba normal',
    ],
    icon: Camera,
    color: 'red',
    primaryAction: 'retry',
    secondaryAction: null,
  },
  // ─── Dispositivo não suportado ───
  CafCameraUnsupportedError: {
    category: 'DEVICE_UNSUPPORTED',
    title: 'Seu navegador ou dispositivo não tem suporte',
    cause: 'A câmera não pôde ser acessada por este navegador:',
    tips: [
      'Use Chrome, Safari ou Edge atualizados',
      'Evite navegadores antigos ou modo privado',
      'Se estiver no celular, prefira Chrome ou Safari',
      'Tente acessar de outro dispositivo',
    ],
    icon: CircleOff,
    color: 'red',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
  CafUnsupportedError: {
    category: 'DEVICE_UNSUPPORTED',
    title: 'Recurso não suportado',
    cause: 'Seu dispositivo não suporta este tipo de verificação. Tente:',
    tips: [
      'Acessar por outro dispositivo (celular com Chrome ou Safari)',
      'Atualizar o navegador para a versão mais recente',
      'Desabilitar extensões de privacidade que podem bloquear a câmera',
    ],
    icon: CircleOff,
    color: 'red',
    primaryAction: 'manual',
    secondaryAction: null,
  },
  CafDeviceMotionPermissionDeniedError: {
    category: 'MOTION_PERMISSION',
    title: 'Permissão de movimento necessária',
    cause: 'No iPhone/iPad, é preciso permitir "Movimento e Orientação" para prova de vida:',
    tips: [
      'Vá em Ajustes > Safari > Avançado > Acesso à Movimento e Orientação',
      'Ative essa permissão e tente novamente',
      'Ou tente por Chrome/Firefox no mesmo dispositivo',
    ],
    icon: AlertCircle,
    color: 'red',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
  // ─── SDK foi cancelado pelo usuário ───
  CafSdkCanceledError: {
    category: 'USER_CANCELED',
    title: 'Verificação cancelada',
    cause: 'Você fechou a janela de captura antes de concluir. Sem problemas:',
    tips: [
      'Clique em "Tentar Novamente" para reiniciar',
      'Siga as instruções até o final da captura',
      'O processo leva no máximo 1 minuto',
    ],
    icon: RefreshCw,
    color: 'blue',
    primaryAction: 'retry',
    secondaryAction: null,
  },
  CafSdkCancelledError: null, // alias — preenchido abaixo
  // ─── Token/backend issues ───
  TokenFallback: {
    category: 'TOKEN_FALLBACK',
    title: 'Verificação simplificada — problema técnico na CAF',
    cause: 'Nosso sistema de verificação facial está operando em modo reduzido agora. Opções:',
    tips: [
      'Você pode enviar uma selfie manualmente — nossa equipe revisa em até 24h',
      'Ou tentar novamente em alguns minutos',
      'Seus dados já enviados foram preservados',
    ],
    icon: Shield,
    color: 'blue',
    primaryAction: 'manual',
    secondaryAction: 'retry',
  },
  // ─── Network ───
  NetworkError: {
    category: 'NETWORK',
    title: 'Problema de conexão',
    cause: 'Não conseguimos conectar com o servidor de verificação:',
    tips: [
      'Verifique sua conexão com a internet',
      'Tente trocar para outra rede (Wi-Fi ↔ 4G)',
      'Desative VPN se estiver usando',
      'Aguarde alguns segundos e tente novamente',
    ],
    icon: Wifi,
    color: 'red',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
  // ─── Default ───
  UNKNOWN: {
    category: 'UNKNOWN',
    title: 'Ocorreu um imprevisto',
    cause: 'Algo não saiu como esperado na verificação. Você pode:',
    tips: [
      'Tentar novamente — geralmente funciona na 2ª tentativa',
      'Verificar iluminação e câmera',
      'Enviar uma selfie manualmente se persistir',
    ],
    icon: FileWarning,
    color: 'slate',
    primaryAction: 'retry',
    secondaryAction: 'manual',
  },
};
ERROR_MAP.CafSdkCancelledError = ERROR_MAP.CafSdkCanceledError;

const COLOR_CLASSES = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100', title: 'text-amber-900', text: 'text-amber-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', iconBg: 'bg-red-100', title: 'text-red-900', text: 'text-red-800' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', iconBg: 'bg-blue-100', title: 'text-blue-900', text: 'text-blue-800' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600', iconBg: 'bg-slate-100', title: 'text-slate-900', text: 'text-slate-800' },
};

/**
 * Classifica o erro baseado em nome + mensagem.
 * Se não reconhecer o errorName, tenta fazer match na message.
 */
function classifyError(errorName, errorMessage) {
  if (errorName && ERROR_MAP[errorName]) return ERROR_MAP[errorName];
  
  const msg = (errorMessage || '').toLowerCase();
  // Face match é o erro que a OMEGPAY está vendo
  if (msg.includes('face picture match') || msg.includes('face match') || msg.includes('não correspondeu')) {
    return ERROR_MAP.CafFaceAuthenticationError;
  }
  if (msg.includes('liveness') || msg.includes('prova de vida')) {
    return ERROR_MAP.CafFaceLivenessError;
  }
  if (msg.includes('camera') || msg.includes('câmera') || msg.includes('permissão')) {
    return ERROR_MAP.CafCameraPermissionDeniedError;
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('conexão') || msg.includes('sdk')) {
    return ERROR_MAP.NetworkError;
  }
  if (msg.includes('cancel')) {
    return ERROR_MAP.CafSdkCanceledError;
  }
  return ERROR_MAP.UNKNOWN;
}

export default function CafErrorDiagnostic({
  errorName,
  errorMessage,
  attemptCount = 1,
  tokenType = 'unknown',
  onRetry,
  onManualFallback,
  onBdcFallback,
  cafFallbackUrl,          // ← URL do cadastro.io do segmento (já com ?externalId=...&cnpj=...)
  onCafFallbackClick,      // ← callback de rastreio (log IntegrationLog) antes de abrir
  resolvedPerson,          // ← { cpf, name, source } — pra cliente verificar se é mesmo o doc dele
  similarity = null,       // ← 0-1 — se disponível, mostra ao cliente
}) {
  const info = classifyError(errorName, errorMessage);
  const colors = COLOR_CLASSES[info.color] || COLOR_CLASSES.slate;
  const Icon = info.icon;

  // Se token é fallback, força exibir ajuda específica
  const showTokenWarning = tokenType === 'fallback' && info.category !== 'TOKEN_FALLBACK';
  const isFaceMismatch = info.category === 'FACE_MISMATCH';
  const similarityPct = similarity !== null && similarity !== undefined ? Math.round(similarity * 100) : null;

  return (
    <div className="space-y-4">
      {/* Diagnóstico principal */}
      <div className={`${colors.bg} ${colors.border} border rounded-2xl p-5`}>
        <div className="flex items-start gap-4">
          <div className={`${colors.iconBg} p-2.5 rounded-xl shrink-0`}>
            <Icon className={`${colors.icon} w-6 h-6`} />
          </div>
          <div className="flex-1">
            <h3 className={`${colors.title} font-bold text-base mb-1`}>
              {info.title}
            </h3>
            <p className={`${colors.text} text-sm mb-3 opacity-90`}>
              {info.cause}
            </p>
            <ul className="space-y-1.5">
              {info.tips.map((tip, idx) => (
                <li key={idx} className={`${colors.text} text-xs flex items-start gap-2`}>
                  <span className={`${colors.icon} font-bold shrink-0`}>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Face mismatch: mostra CPF/nome usado + similarity pra cliente confirmar */}
      {isFaceMismatch && resolvedPerson?.cpf && (
        <div className="bg-white border-2 border-amber-300 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-900 mb-2">🔍 Verifique: estamos comparando contra este CPF</p>
          <div className="flex items-center justify-between gap-3 bg-amber-50 rounded-lg p-3">
            <div className="min-w-0">
              {resolvedPerson.name && (
                <p className="text-sm font-semibold text-[#002443] truncate">{resolvedPerson.name}</p>
              )}
              <p className="text-xs text-[#002443]/70 font-mono">
                CPF: {String(resolvedPerson.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')}
              </p>
            </div>
            {similarityPct !== null && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-amber-700 font-semibold uppercase">Similaridade</p>
                <p className="text-lg font-bold text-amber-900">{similarityPct}%</p>
                <p className="text-[10px] text-amber-700">mínimo 70%</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-amber-800 mt-2">
            ⚠️ Se este CPF <strong>não é seu</strong>, é provável que o documento ou a selfie sejam de pessoa diferente.
            Use "Enviar Selfie Manualmente" e nossa equipe valida em até 24h.
          </p>
        </div>
      )}

      {/* Aviso extra se token está em fallback mode */}
      {showTokenWarning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-900">Sistema em modo simplificado</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              A verificação facial está temporariamente operando em modo reduzido. 
              Você pode enviar uma selfie manualmente — é igualmente seguro e será revisado pela nossa equipe.
            </p>
          </div>
        </div>
      )}

      {/* Contador de tentativas */}
      {attemptCount > 1 && (
        <div className="text-center">
          <p className="text-xs text-[#002443]/50">
            Tentativa {attemptCount} • {attemptCount >= 2 ? 'Recomendamos enviar selfie manualmente' : 'Siga as dicas acima'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {(info.primaryAction === 'retry' || info.secondaryAction === 'retry') && onRetry && (
          <Button
            onClick={onRetry}
            className={info.primaryAction === 'retry' 
              ? 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl'
              : 'bg-white border-2 border-[#2bc196] text-[#2bc196] hover:bg-[#2bc196]/5 h-11 rounded-xl'
            }
            variant={info.primaryAction === 'retry' ? 'default' : 'outline'}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
          </Button>
        )}

        {/* Fallback CAF onboarding oficial (cadastro.io) — aparece JÁ NA 1ª falha.
             Decisão tomada após análise do caso Prime Cash (5/Mai/2026): cliente fez
             5 tentativas sem nunca ver este link porque attemptCount é resetado a cada
             sessão. A regra `>= 2` escondia a única alternativa que destrava o cliente.
             Vínculo ao cliente via externalId = onboardingCaseId (query param).
             ⚠️ Aviso destacado: compliance só é aprovado após conclusão completa. */}
        {cafFallbackUrl && (
          <div className="rounded-xl border-2 border-[#002443] bg-gradient-to-br from-[#002443]/5 to-[#2bc196]/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#002443] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#002443]">
                  Alternativa: concluir pelo onboarding oficial CAF
                </p>
                <p className="text-xs text-[#002443]/70 mt-1 leading-relaxed">
                  Você será direcionado ao portal seguro da CAF para completar a verificação.
                  <strong className="text-[#002443]"> Use o mesmo CPF e CNPJ do seu cadastro</strong> — o resultado volta automaticamente para nós.
                </p>
              </div>
            </div>

            {/* Aviso CRÍTICO destacado */}
            <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Atenção:</strong> seu compliance só será aprovado após você concluir
                <strong> completamente </strong> a prova de vida + facematch pelo link abaixo.
                Não feche a janela antes de terminar.
              </p>
            </div>

            <a
              href={cafFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { try { onCafFallbackClick?.(); } catch {} }}
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#002443] hover:bg-[#002443]/90 text-white font-semibold text-sm transition-all px-4 shadow-lg shadow-[#002443]/20"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir onboarding oficial CAF
            </a>
          </div>
        )}

        {(info.primaryAction === 'manual' || info.secondaryAction === 'manual' || attemptCount >= 2 || tokenType === 'fallback') && onManualFallback && (
          <Button
            onClick={onManualFallback}
            variant={info.primaryAction === 'manual' ? 'default' : 'outline'}
            className={info.primaryAction === 'manual'
              ? 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl'
              : 'border-purple-300 text-purple-700 hover:bg-purple-50 h-11 rounded-xl'
            }
          >
            <Upload className="w-4 h-4 mr-2" /> Enviar Selfie Manualmente
          </Button>
        )}

        {onBdcFallback && attemptCount >= 2 && (
          <Button
            onClick={onBdcFallback}
            variant="ghost"
            className="text-[#002443]/60 hover:text-[#002443] h-10 text-xs"
          >
            Verificação Alternativa (BigDataCorp)
          </Button>
        )}
      </div>

      {/* Detalhe técnico (colapsável via details nativo) */}
      {(errorName || errorMessage) && (
        <details className="text-[10px] text-[#002443]/40">
          <summary className="cursor-pointer hover:text-[#002443]/60">Detalhes técnicos (para suporte)</summary>
          <div className="mt-1 p-2 bg-slate-50 rounded font-mono">
            {errorName && <div>name: {errorName}</div>}
            {errorMessage && <div>msg: {errorMessage}</div>}
            <div>tokenType: {tokenType}</div>
          </div>
        </details>
      )}
    </div>
  );
}