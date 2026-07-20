import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Rocket, Loader2, Scale } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Botão admin que cria um caso V5.2 espelho a partir de um caso V4.
 * - Só aparece quando: latestCase existe, é V4 e o usuário é admin.
 * - O caso V4 original NÃO é modificado (DNA imutável).
 * - Após reprocessar, redireciona para o novo caso V5.2.
 */
export default function ReprocessV4AsV5_2Button({ latestCase, isAdmin, merchantId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fv = latestCase?.framework_version || 'v4.0';

  // [V5.2 Fase 6.5.3] Verifica se já existe um mirror V5.2 deste caso V4
  // — quando existir, mostramos um botão extra "Comparar V4↔V5.2" que vai
  // direto pro Comparator (em vez de abrir AlertDialog redundante).
  // IMPORTANTE: useQuery DEVE vir antes de qualquer early return (Rules of Hooks).
  const { data: existingMirror } = useQuery({
    queryKey: ['v5_2-mirror', latestCase?.id],
    queryFn: async () => {
      const mirrors = await base44.entities.OnboardingCase.filter({ legacyV4CaseId: latestCase.id });
      return mirrors[0] || null;
    },
    enabled: !!(isAdmin && latestCase?.id && fv !== 'v5.2'),
  });

  if (!isAdmin || !latestCase) return null;
  if (fv === 'v5.2') return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('reprocessV4AsV5_2', {
        legacyV4CaseId: latestCase.id,
      });
      const data = res?.data || {};
      if (data.error) {
        toast.error(`Erro: ${data.error}`);
        return;
      }
      if (data.alreadyExists) {
        toast.info('Já existe um caso V5.2 espelho — abrindo o Comparator.');
      } else {
        toast.success(`Caso V5.2 criado! ${data.responsesCopied || 0} respostas copiadas.`);
      }
      setOpen(false);
      // [V5.2 Fase 6.5.3] Após criar/encontrar o mirror, leva direto ao Comparator
      // — é o ponto de uso mais útil. O admin pode voltar ao CadastroDetalhe pelo header do Comparator.
      navigate(`/ComparatorV4V5_2?v4=${latestCase.id}`);
    } catch (err) {
      toast.error(`Erro ao reprocessar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="gap-2 text-xs border-[#1356E2]/30 text-[#E84B1C] hover:bg-[#1356E2]/10"
          title={
            existingMirror
              ? 'Já existe um mirror V5.2 — clique para criar/atualizar novamente'
              : 'Cria um caso V5.2 espelho (sandbox) sem alterar o V4 original'
          }
        >
          <Rocket className="w-3.5 h-3.5" />
          {existingMirror ? 'Reprocessar V5.2 novamente' : 'Reprocessar como V5.2'}
        </Button>

        {existingMirror && (
          <Button
            variant="outline"
            onClick={() => navigate(`/ComparatorV4V5_2?v4=${latestCase.id}`)}
            className="gap-2 text-xs border-[#0A0A0A]/20 text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
            title="Ver V4 e V5.2 lado a lado (auditoria)"
          >
            <Scale className="w-3.5 h-3.5" /> Comparar V4 ↔ V5.2
          </Button>
        )}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#1356E2]" />
              Reprocessar caso como V5.2 (BETA)
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-[#0A0A0A]/80">
                <p>
                  Esta ação cria um <strong>caso V5.2 paralelo</strong> a partir do caso V4 atual.
                  O caso V4 original <strong>NÃO é modificado</strong> — fica preservado como histórico.
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                  <p><strong>O que será feito:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#0A0A0A]/70">
                    <li>Criar novo <code className="text-[10px] bg-white px-1 rounded">OnboardingCase</code> com <code className="text-[10px] bg-white px-1 rounded">framework_version='v5.2'</code></li>
                    <li>Copiar todas as respostas do questionário</li>
                    <li>Disparar o pipeline V5.2 (scoring tier-aware)</li>
                    <li>Vincular ao caso V4 via <code className="text-[10px] bg-white px-1 rounded">legacyV4CaseId</code></li>
                  </ul>
                </div>
                <p className="text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ Use apenas para validação/sandbox. Ainda em BETA — não substitui análise oficial.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirm(); }}
              disabled={loading}
              className="bg-[#1356E2] hover:bg-[#E84B1C] text-white"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando…</>
              ) : (
                <><Rocket className="w-4 h-4 mr-2" />Confirmar reprocessamento</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}