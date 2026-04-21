import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, AlertTriangle, XCircle } from 'lucide-react';

/**
 * CafEngagementBadges — Mostra badges distintas de engajamento CAF:
 *   🔵 N aberturas (SDK iniciado)
 *   🟡 N abandonos (cliente saiu sem tentar — beforeunload)
 *   🔴 N falhas técnicas (SDK reprovou ou erro real)
 *
 * Isso ajuda o analista a entender o perfil do cliente:
 *  - Muitos abandonos → problema de engajamento/UX (link externo pode ajudar)
 *  - Muitas falhas técnicas → problema real (documento ruim, iluminação, etc.)
 *
 * Props: onboardingCaseId
 */
export default function CafEngagementBadges({ onboardingCaseId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['cafEngagementLogs', onboardingCaseId],
    queryFn: async () => {
      if (!onboardingCaseId) return [];
      return await base44.entities.IntegrationLog.filter(
        { onboarding_case_id: onboardingCaseId, provider: 'CAF' },
        '-created_date',
        200
      );
    },
    enabled: !!onboardingCaseId,
    staleTime: 30_000,
  });

  // Classifica os logs
  let opened = 0;
  let abandoned = 0;
  let techFailed = 0;

  for (const l of logs) {
    const flags = Array.isArray(l.red_flags) ? l.red_flags : [];
    if (flags.includes('CAF_SDK_ABANDONED')) abandoned++;
    else if (flags.includes('CAF_SDK_OPENED')) opened++;
    else if (flags.some(f => typeof f === 'string' && f.startsWith('CAF_SDK_ERROR_'))) techFailed++;
  }

  // Se nada relevante, não renderiza
  if (opened === 0 && abandoned === 0 && techFailed === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 flex-wrap">
        {opened > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] gap-0.5 px-1.5 py-0.5 cursor-help">
                <Eye className="w-2.5 h-2.5" />{opened} abert{opened > 1 ? 'uras' : 'ura'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              Cliente abriu o SDK {opened}x (iniciou a captura)
            </TooltipContent>
          </Tooltip>
        )}
        {abandoned > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-300 text-[9px] gap-0.5 px-1.5 py-0.5 cursor-help">
                <AlertTriangle className="w-2.5 h-2.5" />{abandoned} abandono{abandoned > 1 ? 's' : ''}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              Cliente fechou a aba sem capturar nada — <strong>não conta como tentativa técnica</strong>.
              Pode ser falta de engajamento ou indecisão.
            </TooltipContent>
          </Tooltip>
        )}
        {techFailed > 0 && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Badge className="bg-red-50 text-red-700 border border-red-200 text-[9px] gap-0.5 px-1.5 py-0.5 cursor-help">
                <XCircle className="w-2.5 h-2.5" />{techFailed} falha{techFailed > 1 ? 's' : ''} técnica{techFailed > 1 ? 's' : ''}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              Falhas reais do SDK (liveness reprovado, facematch não bateu, erro de câmera, etc.).
              Após 2 falhas técnicas, o cliente vê o botão "Onboarding oficial CAF".
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}