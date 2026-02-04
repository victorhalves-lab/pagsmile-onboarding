import React from 'react';
import { CheckCircle, Info, Shield } from 'lucide-react';
import FormSection from '../FormSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Step11Confirmacao({ formData, handleChange }) {
  return (
    <FormSection
      title="Confirmação e Declarações"
      subtitle="Revisão final e aceitação dos termos."
      icon={CheckCircle}
    >
      <Alert className="bg-[var(--pagsmile-green)]/10 border-[var(--pagsmile-green)]/30">
        <Info className="h-4 w-4 text-[var(--pagsmile-green)]" />
        <AlertDescription className="text-slate-700">
          <strong>Quase lá!</strong> Por favor, revise e confirme as declarações abaixo antes de prosseguir.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white">
          <Checkbox
            id="declaracao1"
            checked={formData.declaracao1 || false}
            onCheckedChange={(checked) => handleChange('declaracao1', checked)}
            className="mt-1"
          />
          <Label htmlFor="declaracao1" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
            Declaro que todas as informações fornecidas neste questionário são verdadeiras, precisas e completas.
            <span className="text-red-500 ml-1">*</span>
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white">
          <Checkbox
            id="declaracao2"
            checked={formData.declaracao2 || false}
            onCheckedChange={(checked) => handleChange('declaracao2', checked)}
            className="mt-1"
          />
          <Label htmlFor="declaracao2" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
            Autorizo a PagSmile a realizar as consultas e verificações necessárias para confirmar as informações prestadas.
            <span className="text-red-500 ml-1">*</span>
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white">
          <Checkbox
            id="declaracao3"
            checked={formData.declaracao3 || false}
            onCheckedChange={(checked) => handleChange('declaracao3', checked)}
            className="mt-1"
          />
          <Label htmlFor="declaracao3" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
            Li e aceito os{' '}
            <a href="#" className="text-[var(--pagsmile-green)] hover:underline font-medium">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-[var(--pagsmile-green)] hover:underline font-medium">
              Política de Privacidade
            </a>{' '}
            da PagSmile.
            <span className="text-red-500 ml-1">*</span>
          </Label>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-slate-700">
          <strong>A segurança dos seus dados é a nossa prioridade.</strong> Todas as informações são protegidas e tratadas com confidencialidade.
        </AlertDescription>
      </Alert>
    </FormSection>
  );
}