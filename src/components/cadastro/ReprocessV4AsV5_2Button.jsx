import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Rocket, Loader2 } from 'lucide-react';
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

  if (!isAdmin || !latestCase) return null;
  const fv = latestCase.framework_version || 'v4.0';
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
        toast.info('Já existe um caso V5.2 espelho — abrindo o existente.');
      } else {
        toast.success(`Caso V5.2 criado! ${data.responsesCopied || 0} respostas copiadas.`);
      }
      setOpen(false);
      // Redireciona para o mesmo merchant — o V5.2 será o novo latestCase
      if (data.merchantId) {
        navigate(`/CadastroDetalhe?id=${data.merchantId}`);
        // Força reload da página para refetch das queries
        setTimeout(() => window.location.reload(), 100);
      }
    } catch (err) {
      toast.error(`Erro ao reprocessar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 text-xs border-[#2bc196]/30 text-[#36706c] hover:bg-[#2bc196]/10"
        title="Cria um caso V5.2 espelho (sandbox) sem alterar o V4 original"
      >
        <Rocket className="w-3.5 h-3.5" /> Reprocessar como V5.2
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#2bc196]" />
              Reprocessar caso como V5.2 (BETA)
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-[#002443]/80">
                <p>
                  Esta ação cria um <strong>caso V5.2 paralelo</strong> a partir do caso V4 atual.
                  O caso V4 original <strong>NÃO é modificado</strong> — fica preservado como histórico.
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                  <p><strong>O que será feito:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#002443]/70">
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
              className="bg-[#2bc196] hover:bg-[#36706c] text-white"
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