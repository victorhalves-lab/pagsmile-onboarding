import React from 'react';
import { callPublicFunction } from '@/lib/publicApi';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KickOffPresentation from '@/components/kickoff/KickOffPresentation';

export default function KickOffPublico() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const { data: presentation, isLoading, error } = useQuery({
    queryKey: ['kickoff-public', token],
    queryFn: async () => {
      const res = await callPublicFunction('publicReadContext', { kind: 'kickoff_public', token });
      return res?.presentation || null;
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0A0A0A]">Link inválido</h1>
          <p className="text-sm text-[#0A0A0A]/50">Token não encontrado na URL.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1356E2] mx-auto mb-4" />
          <p className="text-sm text-[#0A0A0A]/50">Carregando apresentação...</p>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#0A0A0A]">Apresentação não encontrada</h1>
          <p className="text-sm text-[#0A0A0A]/50">Este link pode ter expirado ou sido arquivado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Floating print button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <Button
          onClick={() => window.print()}
          className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white rounded-full px-6 py-3 shadow-2xl font-bold"
        >
          <Printer className="w-4 h-4 mr-2" /> Exportar PDF
        </Button>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-4">
        <KickOffPresentation
          proposal={presentation.proposalData}
          contract={presentation.contractData}
        />
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { size: landscape; margin: 0; }
        }
      `}</style>
    </div>
  );
}