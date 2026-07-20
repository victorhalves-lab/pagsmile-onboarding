import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, X, Loader2, AlertTriangle } from 'lucide-react';

export default function RevalidationActionBar({
  selectedCount,
  onClearSelection,
  onRevalidate,
  isProcessing,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#0A0A0A] text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            <strong className="text-[#E84B1C]">{selectedCount}</strong> cliente{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-white/60 hover:text-white hover:bg-white/10 h-7 px-2"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Limpar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={isProcessing}
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-xl h-9 px-4"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Revalidar Agora</>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar Revalidação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você vai revalidar <strong>{selectedCount} cliente{selectedCount > 1 ? 's' : ''}</strong> via BigDataCorp.
              Cada consulta consome créditos BDC e os scores serão atualizados no banco.
              <br /><br />
              O processo pode levar alguns minutos dependendo da quantidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowConfirm(false); onRevalidate(); }}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90"
            >
              Confirmar e Revalidar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}