import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Presentation, RotateCcw } from 'lucide-react';
import ClientSelector from '@/components/kickoff/ClientSelector';
import KickOffPresentation from '@/components/kickoff/KickOffPresentation';

export default function GerarKickOff() {
  const [selectedData, setSelectedData] = useState(null);
  const presentationRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setSelectedData(null);
  };

  if (!selectedData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <ClientSelector onSelect={setSelectedData} />
      </div>
    );
  }

  const { proposal, contract } = selectedData;

  return (
    <div>
      {/* Header - hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden sticky top-0 z-10 bg-[#f4f4f4] py-3 -mx-4 px-4 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleReset} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[#002443] flex items-center gap-2">
              <Presentation className="w-5 h-5 text-[#2bc196]" />
              Kick-Off — {proposal?.clienteNome || 'Cliente'}
            </h1>
            <p className="text-xs text-[#002443]/50">
              {proposal?.codigo || '—'} • {proposal?.businessSubCategory || '—'}
              {contract?.codigo ? ` • Contrato: ${contract.codigo}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} className="rounded-xl text-sm border-[#002443]/10">
            <RotateCcw className="w-4 h-4 mr-2" /> Trocar Cliente
          </Button>
          <Button onClick={handlePrint} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl px-5 font-bold">
            <Printer className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Presentation */}
      <div ref={presentationRef}>
        <KickOffPresentation proposal={proposal} contract={contract} />
      </div>

      {/* Print styles */}
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