import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';

export default function ContratoPublico() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract-public', code],
    queryFn: async () => {
      const contracts = await base44.entities.Contract.filter({ publicLinkCode: code });
      return contracts?.[0] || null;
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <FileText className="w-16 h-16 text-[#002443]/20 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#002443] mb-2">Contrato não encontrado</h1>
          <p className="text-sm text-[#002443]/50">O link pode ter expirado ou ser inválido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <div className="bg-white border-b border-[#002443]/10 py-4 px-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
              alt="Pagsmile" 
              className="h-8"
            />
            <div>
              <h1 className="text-sm font-bold text-[#002443]">Contrato de Prestação de Serviços</h1>
              <p className="text-xs text-[#002443]/50">{contract.codigo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-[900px] mx-auto my-8">
        <div className="bg-white rounded-xl shadow-lg border border-[#002443]/5">
          <ConteudoContrato contract={contract} />
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-[#002443]/40">
        <p>&copy; {new Date().getFullYear()} Pagsmile Instituição de Pagamento Ltda.</p>
      </div>
    </div>
  );
}