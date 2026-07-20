import React from 'react';
import { CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import FormSection from '../FormSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function Step11Confirmacao({ formData, handleChange }) {
  
  const handleCheck = (field, checked) => {
    handleChange(field, checked);
  };

  return (
    <div className="space-y-8">
      <FormSection
        title="Confirmação e Documentos"
        subtitle="Confirme as declarações e faça o upload dos documentos obrigatórios."
        icon={CheckCircle}
      >
        <h3 className="font-bold text-[var(--pinbank-blue)] mb-4 uppercase text-sm tracking-wide">1. Confirmação de Verificação de Identidade</h3>
        <div className="flex items-start space-x-3 mb-6 p-4 bg-[var(--pinbank-blue)]/5 rounded border border-[var(--pinbank-blue)]/10">
           <Checkbox 
              id="confirma_caf" 
              checked={formData.confirmaCaf}
              onCheckedChange={(c) => handleCheck('confirmaCaf', c)}
              className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]"
           />
           <div className="grid gap-1.5 leading-none">
              <Label htmlFor="confirma_caf" className="text-sm font-medium leading-none text-[var(--pinbank-blue)] cursor-pointer">
                 Confirmo que realizei a verificação de identidade no CAF
              </Label>
              <p className="text-xs text-red-500">
                 Atenção: A reprovação será automática se a verificação CAF não tiver sido realizada.
              </p>
           </div>
        </div>

        <h3 className="font-bold text-[var(--pinbank-blue)] mb-4 uppercase text-sm tracking-wide">2. Declarações</h3>
        <div className="space-y-4 mb-6">
           <div className="flex items-start space-x-3">
              <Checkbox id="dec_1" checked={formData.declaraVerdade} onCheckedChange={(c) => handleCheck('declaraVerdade', c)} className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]" />
              <Label htmlFor="dec_1" className="text-sm text-[var(--pinbank-blue)] cursor-pointer">Declaro que todas as informações são verdadeiras e completas</Label>
           </div>
           <div className="flex items-start space-x-3">
              <Checkbox id="dec_2" checked={formData.declaraLicito} onCheckedChange={(c) => handleCheck('declaraLicito', c)} className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]" />
              <Label htmlFor="dec_2" className="text-sm text-[var(--pinbank-blue)] cursor-pointer">Declaro que a empresa não atua em atividades ilegais ou proibidas</Label>
           </div>
           <div className="flex items-start space-x-3">
              <Checkbox id="dec_3" checked={formData.autorizaConsulta} onCheckedChange={(c) => handleCheck('autorizaConsulta', c)} className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]" />
              <Label htmlFor="dec_3" className="text-sm text-[var(--pinbank-blue)] cursor-pointer">Autorizo a Pin Bank a verificar os dados junto a bureaus e fontes públicas</Label>
           </div>
        </div>

        <h3 className="font-bold text-[var(--pinbank-blue)] mb-4 uppercase text-sm tracking-wide">3. Termo de Responsabilidade e Veracidade</h3>
        <div className="bg-[var(--pinbank-blue)]/5 p-4 rounded-xl border border-[var(--pinbank-blue)]/10 mb-6">
           <p className="text-xs text-[var(--pinbank-blue)]/80 mb-4 text-justify">
              Pelo presente instrumento, declaro estar ciente de que as informações prestadas neste formulário são verdadeiras e assumo inteira responsabilidade pela sua exatidão. Comprometo-me a manter tais informações atualizadas e a comunicar imediatamente qualquer alteração. Declaro ainda estar ciente de que a falsidade das informações aqui prestadas pode configurar crime de falsidade ideológica (art. 299 do Código Penal) e sujeitar-me às sanções penais, civis e administrativas cabíveis.
           </p>
           <div className="flex items-start space-x-3">
              <Checkbox id="termo_resp" checked={formData.aceiteTermoResponsabilidade} onCheckedChange={(c) => handleCheck('aceiteTermoResponsabilidade', c)} className="border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] data-[state=checked]:bg-[var(--pinbank-blue)] data-[state=checked]:border-[var(--pinbank-blue)]" />
              <Label htmlFor="termo_resp" className="text-sm font-bold text-[var(--pinbank-blue)] cursor-pointer">
                 Li, compreendi e ACEITO INTEGRALMENTE o Termo de Responsabilidade e Veracidade acima descrito, assumindo total responsabilidade pelas informações prestadas.
              </Label>
           </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
           <AlertTriangle className="w-5 h-5 shrink-0" />
           <p>Próximo passo: Upload de Documentos Obrigatórios.</p>
        </div>

      </FormSection>
    </div>
  );
}