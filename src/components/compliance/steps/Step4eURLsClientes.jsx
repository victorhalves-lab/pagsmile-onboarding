import React from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Step4eURLsClientes({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  const topClientes = formData.topClientes || [];

  const addCliente = () => {
    if (handleAddArrayItem) handleAddArrayItem('topClientes', { nome: '', cnpj: '', ramo: '' });
  };
  const removeCliente = (idx) => {
    if (handleRemoveArrayItem) handleRemoveArrayItem('topClientes', idx);
  };
  const updateCliente = (idx, field, val) => {
    if (handleArrayChange) handleArrayChange('topClientes', idx, field, val);
  };

  return (
    <FormSection
      title="Presença Digital"
      subtitle="URLs e estrutura de clientes."
      icon={Globe}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Site Corporativo"
            required
            value={formData.siteCorporativo}
            onChange={(val) => handleChange('siteCorporativo', val)}
            placeholder="https://www.empresa.com.br"
            className="text-[var(--pagsmile-blue)]"
          />
          <FormField
            label="URL do Produto/App/Checkout"
            value={formData.urlProduto}
            onChange={(val) => handleChange('urlProduto', val)}
            placeholder="https://... (opcional)"
            className="text-[var(--pagsmile-blue)]"
          />
        </div>

        <YesNoQuestion
          question="Sua operação é de gateway, marketplace, plataforma de infoprodutos ou plataforma que tem sellers?"
          value={formData.operaMarketplace}
          onChange={(val) => handleChange('operaMarketplace', val)}
          required
          helperText="Controle de Seção"
        />

        {formData.operaMarketplace === true && (
           <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-[var(--pagsmile-blue)]/10">
             <div className="flex justify-between items-center mb-2">
               <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Top 5 Maiores Clientes/Sellers</Label>
               <Button type="button" variant="outline" size="sm" onClick={addCliente} disabled={topClientes.length >= 5} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
                 <Plus className="w-4 h-4 mr-1" /> Adicionar
               </Button>
             </div>
             {topClientes.map((cli, idx) => (
               <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                 <Input 
                   placeholder="Nome" 
                   value={cli.nome} 
                   onChange={(e) => updateCliente(idx, 'nome', e.target.value)}
                   className="text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
                 />
                 <Input 
                   placeholder="CNPJ" 
                   value={cli.cnpj} 
                   onChange={(e) => updateCliente(idx, 'cnpj', e.target.value)}
                   className="text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
                 />
                 <div className="flex gap-2">
                    <Input 
                      placeholder="Ramo de Atividade" 
                      value={cli.ramo} 
                      onChange={(e) => updateCliente(idx, 'ramo', e.target.value)}
                      className="text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCliente(idx)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
               </div>
             ))}
             {topClientes.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Nenhum cliente adicionado.</p>}
           </div>
        )}
      </div>
    </FormSection>
  );
}