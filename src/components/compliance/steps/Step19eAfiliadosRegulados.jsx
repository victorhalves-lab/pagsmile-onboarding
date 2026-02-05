import React from 'react';
import { TrendingUp } from 'lucide-react';
import FormSection from '../FormSection';
import YesNoQuestion from '../YesNoQuestion';

export default function Step19eAfiliadosRegulados({ formData, handleChange }) {
  if (!formData.operaAfiliados && !formData.categoriaSensivel) {
    return (
        <FormSection
            title="Operação - Afiliados e Regulação"
            subtitle="Informações sobre afiliados e categorias reguladas."
            icon={TrendingUp}
        >
            <div className="p-8 text-center text-[var(--pagsmile-blue)]/60 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10">
                <p>Nenhuma informação adicional necessária para esta seção com base nas respostas anteriores.</p>
                <p className="text-xs mt-2">Clique em "Continuar" para prosseguir.</p>
            </div>
        </FormSection>
    )
  }

  return (
    <FormSection
      title="Operação - Afiliados e Regulação"
      subtitle="Informações sobre afiliados e categorias reguladas."
      icon={TrendingUp}
    >
      {/* Afiliados */}
      {formData.operaAfiliados === true && (
        <div className="space-y-4 p-4 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10">
           <h3 className="font-semibold text-[var(--pagsmile-blue)]">B5. Afiliados/Parceiros</h3>
           
           <YesNoQuestion
             question="Aprova/valida afiliados antes de venderem?"
             value={formData.validaAfiliados}
             onChange={(val) => handleChange('validaAfiliados', val)}
             detailValue={formData.comoValidaAfiliados}
             onDetailChange={(val) => handleChange('comoValidaAfiliados', val)}
             detailLabel="Como é feita a aprovação?"
             required
           />

           <YesNoQuestion
             question="Afiliado recebe comissão antes da entrega?"
             value={formData.comissaoAntecipada}
             onChange={(val) => handleChange('comissaoAntecipada', val)}
             detailValue={formData.momentoComissao}
             onDetailChange={(val) => handleChange('momentoComissao', val)}
             detailLabel="Em que momento a comissão é paga?"
             required
           />

           <YesNoQuestion
             question="Monitora origem de tráfego/ofertas?"
             value={formData.monitoraTrafego}
             onChange={(val) => handleChange('monitoraTrafego', val)}
             detailValue={formData.comoMonitoraTrafego}
             onDetailChange={(val) => handleChange('comoMonitoraTrafego', val)}
             detailLabel="Como monitora?"
             required
           />
        </div>
      )}

      {/* Categoria Regulada */}
      {formData.categoriaSensivel === true && (
        <div className="space-y-4 p-4 bg-[var(--pagsmile-blue)]/5 rounded-xl border border-[var(--pagsmile-blue)]/10 mt-4">
           <h3 className="font-semibold text-[var(--pagsmile-blue)]">B6. Categoria Regulada</h3>
           
           <YesNoQuestion
             question="Operação exige licença/alvará/RT?"
             value={formData.exigeLicencaRT}
             onChange={(val) => handleChange('exigeLicencaRT', val)}
             required
           />

           <YesNoQuestion
             question="Existem restrições de publicidade?"
             value={formData.restricoesPublicidade}
             onChange={(val) => handleChange('restricoesPublicidade', val)}
             detailValue={formData.comoGaranteConformidade}
             onDetailChange={(val) => handleChange('comoGaranteConformidade', val)}
             detailLabel="Como garante conformidade?"
             required
           />
        </div>
      )}
    </FormSection>
  );
}