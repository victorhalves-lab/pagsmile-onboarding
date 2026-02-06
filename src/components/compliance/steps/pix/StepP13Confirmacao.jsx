import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import FormSection from '../../FormSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function StepP13Confirmacao({ formData, handleChange }) {
  return (
    <FormSection
      title="Confirmação"
      subtitle="Confirme as declarações para finalizar."
      icon={CheckCircle}
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border">
          <Checkbox 
            id="dec_1" 
            checked={formData.declaraVerdade} 
            onCheckedChange={(c) => handleChange('declaraVerdade', c)} 
            className="mt-0.5"
          />
          <Label htmlFor="dec_1" className="text-sm text-[var(--pagsmile-blue)] cursor-pointer">
            Declaro que todas as informações são verdadeiras e completas
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border">
          <Checkbox 
            id="dec_2" 
            checked={formData.declaraLicito} 
            onCheckedChange={(c) => handleChange('declaraLicito', c)} 
            className="mt-0.5"
          />
          <Label htmlFor="dec_2" className="text-sm text-[var(--pagsmile-blue)] cursor-pointer">
            Declaro que a empresa não atua em atividades ilegais ou proibidas
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg border">
          <Checkbox 
            id="dec_3" 
            checked={formData.autorizaConsulta} 
            onCheckedChange={(c) => handleChange('autorizaConsulta', c)} 
            className="mt-0.5"
          />
          <Label htmlFor="dec_3" className="text-sm text-[var(--pagsmile-blue)] cursor-pointer">
            Autorizo a Pagsmile a verificar dados junto a bureaus e fontes públicas
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-[var(--pagsmile-blue)]/5 rounded-lg border border-[var(--pagsmile-blue)]/10">
          <Checkbox 
            id="termo_resp" 
            checked={formData.aceiteTermoResponsabilidade} 
            onCheckedChange={(c) => handleChange('aceiteTermoResponsabilidade', c)} 
            className="mt-0.5"
          />
          <Label htmlFor="termo_resp" className="text-sm font-semibold text-[var(--pagsmile-blue)] cursor-pointer">
            Li e ACEITO o Termo de Responsabilidade e Veracidade
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>Próximo passo: Upload de Documentos Obrigatórios.</p>
      </div>
    </FormSection>
  );
}