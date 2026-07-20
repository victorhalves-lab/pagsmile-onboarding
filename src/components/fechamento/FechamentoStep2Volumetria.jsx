import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BarChart3, Percent } from 'lucide-react';
import { CurrencyInput } from '@/components/leads/CurrencyInput';

const DistributionSlider = ({ label, value, onChange, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-sm font-medium text-[#0A0A0A]">{label}</Label>
      <div className="px-2.5 py-1 rounded-md text-sm font-semibold" style={{ backgroundColor: `${color}1A`, color: color }}>
        {value}%
      </div>
    </div>
    <Slider
      value={[value]}
      onValueChange={(vals) => onChange(vals[0])}
      max={100}
      step={1}
      // Custom styling to pass color to CSS variables for ShadCN slider
      styles={{
        '--slider-track-background': color,
        '--slider-thumb-border-color': color,
      }}
      className={`[&>span:first-child]:bg-slate-200 [&>span>span]:bg-[var(--slider-track-background)] [&>span>button]:border-[var(--slider-thumb-border-color)]`}
    />
  </div>
);

export default function FechamentoStep2Volumetria({ formData, setFormData, nextStep, prevStep }) {
  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const tpvMensal = formData.tpvMensal || 0;
  const dist = formData.distribuicaoTpv || { cartao: 40, pix: 50, boleto: 10 };
  const totalDist = dist.cartao + dist.pix + dist.boleto;

  const handleTpvChange = (value) => {
    update('tpvMensal', value);
  };

  const handleDistributionChange = (method, newValue) => {
    const currentValue = dist[method];
    const diff = newValue - currentValue;
    let newDist = { ...dist, [method]: newValue };

    const otherMethods = Object.keys(dist).filter(m => m !== method);
    
    // Distribute the difference among other methods
    if (otherMethods.length > 0) {
      let remainingDiff = diff;
      for (let i = 0; i < otherMethods.length; i++) {
        const m = otherMethods[i];
        const change = Math.round(remainingDiff * (dist[m] / (totalDist - currentValue || 1)));
        newDist[m] -= change;
        remainingDiff -= change;
      }
      newDist[otherMethods[otherMethods.length - 1]] -= remainingDiff;
    }

    // Ensure all values are non-negative and sum to 100
    let currentTotal = 0;
    Object.keys(newDist).forEach(m => {
        if(newDist[m] < 0) newDist[m] = 0;
        currentTotal += newDist[m];
    });

    const finalAdjustment = 100 - currentTotal;
    newDist[method] += finalAdjustment;

    // Final check to ensure the changed slider is not altered if possible
    Object.keys(newDist).forEach(m => {
        if(newDist[m] < 0) newDist[m] = 0;
    });

    currentTotal = Object.values(newDist).reduce((sum, v) => sum + v, 0);
    if(currentTotal !== 100) {
         newDist[method] += 100 - currentTotal;
    }


    update('distribuicaoTpv', newDist);
  };

  const canProceed = tpvMensal > 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-5 h-5 text-[#0A0A0A]/50" />
          <h3 className="text-lg font-semibold text-[#0A0A0A]">Volume e Meios de Pagamento</h3>
        </div>
        <p className="text-sm text-[#0A0A0A]/70">Nos ajude a entender sua volumetria para oferecermos a melhor proposta.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#0A0A0A]">Qual seu TPV (Volume Total de Pagamentos) mensal estimado? <span className="text-red-500">*</span></Label>
        <CurrencyInput
            value={tpvMensal}
            onValueChange={handleTpvChange}
            className="h-12 text-lg rounded-xl"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
             <Percent className="w-4 h-4 text-[#0A0A0A]/50" />
            <Label className="text-sm font-semibold text-[#0A0A0A]">Distribuição do TPV por método <span className="text-red-500">*</span></Label>
            {totalDist !== 100 && <span className="text-xs font-bold text-red-500">(Soma deve ser 100%)</span>}
        </div>
        <div className="p-6 bg-white rounded-2xl border border-[#0A0A0A]/[0.08] space-y-5 shadow-sm">
            <DistributionSlider label="Cartão de Crédito" value={dist.cartao} onChange={v => handleDistributionChange('cartao', v)} color="#3b82f6" />
            <DistributionSlider label="PIX" value={dist.pix} onChange={v => handleDistributionChange('pix', v)} color="#1356E2" />
            <DistributionSlider label="Boleto" value={dist.boleto} onChange={v => handleDistributionChange('boleto', v)} color="#8b5cf6" />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={prevStep} className="gap-2"><ArrowLeft/> Voltar</Button>
        <Button onClick={nextStep} disabled={!canProceed} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2">Próximo <ArrowRight /></Button>
      </div>
    </div>
  );
}