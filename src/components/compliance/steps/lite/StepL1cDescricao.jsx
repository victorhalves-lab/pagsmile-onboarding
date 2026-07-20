import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

export default function StepL1cDescricao({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <FileText className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Sobre o Negócio
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Conte-nos o que sua empresa faz
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--pinbank-blue)] font-semibold">Descrição Curta do Negócio</Label>
        <Textarea
          value={formData.descricaoNegocio || ''}
          onChange={(e) => handleChange('descricaoNegocio', e.target.value)}
          placeholder="O que você vende e para quem? (2-3 linhas)"
          className="min-h-[140px]"
        />
        <p className="text-xs text-[var(--pinbank-blue)]/60">
          Descreva brevemente o que sua empresa faz, quais produtos/serviços oferece e quem são seus clientes
        </p>
      </div>
    </div>
  );
}