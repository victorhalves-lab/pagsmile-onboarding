import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { DEFAULT_SEGMENT_RATES } from '@/lib/rateCalculator';
import { toast } from 'sonner';

function RateInput({ label, value, onChange, suffix = '%', step = '0.01' }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px] font-bold text-[#0A0A0A]/40">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          value={value || ''}
          onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : '')}
          className="h-8 rounded-lg text-xs pr-8"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#0A0A0A]/30">{suffix}</span>
      </div>
    </div>
  );
}

function SegmentCard({ segment, index, onUpdate, onRemove }) {
  const update = (field, value) => onUpdate(index, { ...segment, [field]: value });

  return (
    <div className="border border-[#0A0A0A]/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            value={segment.segmentName || ''}
            onChange={e => update('segmentName', e.target.value)}
            placeholder="Nome do Segmento"
            className="h-8 w-48 rounded-lg text-sm font-bold"
          />
          <Input
            value={segment.mcc || ''}
            onChange={e => update('mcc', e.target.value)}
            placeholder="MCC"
            className="h-8 w-24 rounded-lg text-xs font-mono"
          />
          <Input
            value={segment.riskLevel || ''}
            onChange={e => update('riskLevel', e.target.value)}
            placeholder="Nível de Risco"
            className="h-8 w-32 rounded-lg text-xs"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 h-7">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* MDR */}
      <div>
        <p className="text-[10px] font-bold text-[#1356E2] uppercase tracking-wider mb-1.5">MDR Cartão</p>
        <div className="grid grid-cols-4 gap-2">
          <RateInput label="1x (à vista)" value={segment.mdrAvista} onChange={v => update('mdrAvista', v)} />
          <RateInput label="2-6x" value={segment.mdr2a6x} onChange={v => update('mdr2a6x', v)} />
          <RateInput label="7-12x" value={segment.mdr7a12x} onChange={v => update('mdr7a12x', v)} />
          <RateInput label="13-21x" value={segment.mdr13a21x} onChange={v => update('mdr13a21x', v)} />
        </div>
      </div>

      {/* Operational */}
      <div>
        <p className="text-[10px] font-bold text-[#1356E2] uppercase tracking-wider mb-1.5">Taxas Operacionais</p>
        <div className="grid grid-cols-4 gap-2">
          <RateInput label="Processamento" value={segment.feeTransacao} onChange={v => update('feeTransacao', v)} suffix="R$" step="0.01" />
          <RateInput label="Antifraude" value={segment.antifraude} onChange={v => update('antifraude', v)} suffix="R$" step="0.01" />
          <RateInput label="3DS" value={segment.taxa3ds} onChange={v => update('taxa3ds', v)} suffix="R$" step="0.01" />
          <RateInput label="Antecipação a.m." value={segment.percentualAntecipacao} onChange={v => update('percentualAntecipacao', v)} />
        </div>
      </div>

      {/* PIX */}
      <div>
        <p className="text-[10px] font-bold text-[#1356E2] uppercase tracking-wider mb-1.5">PIX</p>
        <div className="grid grid-cols-2 gap-2">
          <RateInput label="PIX Percentual" value={segment.pixTaxaPercentual} onChange={v => update('pixTaxaPercentual', v)} />
          <RateInput label="PIX Fixo" value={segment.pixTaxaFixa} onChange={v => update('pixTaxaFixa', v)} suffix="R$" step="0.01" />
        </div>
      </div>
    </div>
  );
}

export default function StandardRatesEditor({ rates = [], onChange }) {
  const { data: dbRates, isLoading: isLoadingDefaults } = useQuery({
    queryKey: ['segmentDefaultRates'],
    queryFn: () => base44.entities.SegmentDefaultRates.list(),
    staleTime: 5 * 60 * 1000,
  });

  const handleUpdate = (index, updated) => {
    const newRates = [...rates];
    newRates[index] = updated;
    onChange(newRates);
  };

  const handleRemove = (index) => {
    onChange(rates.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...rates, {
      segmentName: '', mcc: '', riskLevel: '',
      mdrAvista: 0, mdr2a6x: 0, mdr7a12x: 0, mdr13a21x: 0,
      percentualAntecipacao: 0, feeTransacao: 0, antifraude: 0, taxa3ds: 0,
      pixTaxaPercentual: 0.45, pixTaxaFixa: 0.30,
    }]);
  };

  const handleLoadDefaults = () => {
    // Banco é fonte de verdade, fallback para hardcoded
    const source = (dbRates && dbRates.length > 0) ? dbRates : DEFAULT_SEGMENT_RATES;
    const cleaned = source.map(s => ({
      segmentName: s.segmentName, mcc: s.mcc, riskLevel: s.riskLevel,
      mdrAvista: s.mdrAvista, mdr2a6x: s.mdr2a6x, mdr7a12x: s.mdr7a12x, mdr13a21x: s.mdr13a21x,
      percentualAntecipacao: s.percentualAntecipacao, feeTransacao: s.feeTransacao,
      antifraude: s.antifraude, taxa3ds: s.taxa3ds,
      pixTaxaPercentual: s.pixTaxaPercentual, pixTaxaFixa: s.pixTaxaFixa,
    }));
    onChange(cleaned);
    toast.success(`${cleaned.length} segmentos padrão carregados!`);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-[#0A0A0A]/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#1356E2] uppercase tracking-wider">Taxas por Segmento</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadDefaults} disabled={isLoadingDefaults} className="rounded-xl text-xs h-7">
            {isLoadingDefaults ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Carregar Padrão (10 segmentos)
          </Button>
          <Button variant="outline" size="sm" onClick={handleAdd} className="rounded-xl text-xs h-7">
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {rates.length === 0 && (
        <div className="text-center py-6 bg-[#f4f4f4] rounded-xl">
          <p className="text-xs text-[#0A0A0A]/40 mb-2">Nenhum segmento configurado</p>
          <Button variant="outline" size="sm" onClick={handleLoadDefaults} disabled={isLoadingDefaults} className="rounded-xl text-xs">
            {isLoadingDefaults ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            Carregar os 10 Segmentos Padrão
          </Button>
        </div>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {rates.map((seg, i) => (
          <SegmentCard key={i} segment={seg} index={i} onUpdate={handleUpdate} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  );
}