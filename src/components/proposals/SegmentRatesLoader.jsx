import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Check, Info, Loader2 } from 'lucide-react';
import { DEFAULT_SEGMENT_RATES } from '@/lib/rateCalculator';
import { toast } from 'sonner';

const SEGMENTS = [
  'Educação', 'Infoprodutos', 'E-commerce', 'SaaS', 'Gateway',
  'Marketplace', 'Dropshipping', 'MPE', 'Plataformas Verticais', 'Link de Pagamento'
];

export default function SegmentRatesLoader({ onApply }) {
  const [selected, setSelected] = useState(null);

  const { data: dbRates, isLoading } = useQuery({
    queryKey: ['segmentDefaultRates'],
    queryFn: () => base44.entities.SegmentDefaultRates.list(),
    staleTime: 5 * 60 * 1000,
  });

  const getRatesForSegment = (segment) => {
    // Tenta banco primeiro, fallback para hardcoded
    const fromDb = dbRates?.find(s => s.segmentName === segment);
    if (fromDb) return fromDb;
    return DEFAULT_SEGMENT_RATES.find(s => s.segmentName === segment);
  };

  const handleSelect = (segment) => {
    const segDefault = getRatesForSegment(segment);
    if (!segDefault) return;

    const bandeiras = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
    const cartao = {};
    bandeiras.forEach(b => {
      cartao[b] = {
        avista: segDefault.mdrAvista,
        de2a6x: segDefault.mdr2a6x,
        de7a12x: segDefault.mdr7a12x,
        de13a21x: segDefault.mdr13a21x,
      };
    });

    const rates = {
      cartao,
      pix: { tipo: 'percentual', valor: segDefault.pixTaxaPercentual },
      boleto: segDefault.boleto || 2.99,
      feeTransacao: segDefault.feeTransacao,
      antifraude: segDefault.antifraude,
      alertaPreChargeback: 55,
      taxa3ds: segDefault.taxa3ds,
      setup: 5000,
      minimoGarantido: { mes1: '', mes2: '', mes3: '' },
    };

    const formUpdates = {
      taxaAntecipacao: segDefault.percentualAntecipacao,
      percentualAntecipacao: 100,
      usaAntecipacao: true,
    };

    setSelected(segment);
    onApply(rates, formUpdates);
    toast.success(`Taxas padrão "${segment}" carregadas — ajuste conforme necessário`);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
          <LayoutGrid className="w-3.5 h-3.5 text-[#2bc196]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white/80">Taxas Padrão por Segmento</h2>
          <p className="text-[10px] text-white/30">Opcional — carrega as taxas base do segmento como ponto de partida</p>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SEGMENTS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => handleSelect(s)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1.5 ${
              selected === s
                ? 'bg-[#2bc196] border-[#2bc196] text-[#002443] shadow-lg shadow-[#2bc196]/25'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-[#2bc196]/40 hover:text-white cursor-pointer'
            }`}
          >
            {selected === s && <Check className="w-3 h-3" />}
            {s}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-[10px] text-[#2bc196]/50 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Taxas do segmento "{selected}" aplicadas. Você pode editar livremente abaixo.
        </p>
      )}
    </div>
  );
}