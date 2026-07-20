import React, { useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Step4dVolumetria({ formData, handleChange }) {
  // Cálculo automático do Volume de Transações/Mês
  useEffect(() => {
    const volume = parseFloat(formData.volumeMensalEstimado || '0');
    const ticket = parseFloat(formData.ticketMedio || '0');
    if (!isNaN(volume) && !isNaN(ticket) && ticket > 0) {
      const qtd = Math.round(volume / ticket);
      handleChange('qtdTransacoesMensalCalculado', qtd.toString());
    }
  }, [formData.volumeMensalEstimado, formData.ticketMedio]);

  return (
    <FormSection
      title="Volumetria e Crescimento"
      subtitle="Estimativas financeiras e projeções."
      icon={TrendingUp}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Estimativa de Volume/Mês (R$)"
            required
            type="number"
            value={formData.volumeMensalEstimado}
            onChange={(val) => handleChange('volumeMensalEstimado', val)}
            placeholder="Ex: 100000"
            icon={DollarSign}
            className="text-[var(--pinbank-blue)]"
          />
          <FormField
            label="Ticket Médio (R$)"
            required
            type="number"
            value={formData.ticketMedio}
            onChange={(val) => handleChange('ticketMedio', val)}
            placeholder="Ex: 150"
            icon={DollarSign}
            className="text-[var(--pinbank-blue)]"
          />
        </div>
        
        <FormField
          label="Volume de Transações/Mês"
          value={formData.qtdTransacoesMensalCalculado}
          readOnly
          className="bg-slate-50 cursor-not-allowed text-[var(--pinbank-blue)] font-semibold"
          placeholder="Calculado automaticamente"
          helpText="Baseado em Volume / Ticket Médio"
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--pinbank-blue)]">Expectativa de Crescimento (12 meses)</Label>
          <Select 
            value={formData.expectativaCrescimento} 
            onValueChange={(val) => handleChange('expectativaCrescimento', val)}
          >
            <SelectTrigger className="border-[var(--pinbank-blue)]/20 text-[var(--pinbank-blue)] focus:ring-[var(--pinbank-blue)]">
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ate_10">Até 10%</SelectItem>
              <SelectItem value="11_25">11% a 25%</SelectItem>
              <SelectItem value="26_50">26% a 50%</SelectItem>
              <SelectItem value="51_100">51% a 100%</SelectItem>
              <SelectItem value="mais_100">Mais de 100%</SelectItem>
              <SelectItem value="nao_sabe">Não sabe informar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormSection>
  );
}