import React from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import FormSection from '../FormSection';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Step4cProdutosServicos({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  const topProdutos = formData.topProdutos || [
    { nome: '', percentual: '' },
    { nome: '', percentual: '' },
    { nome: '', percentual: '' }
  ];
  
  const divisaoPercentual = formData.divisaoPercentual || [];

  const updateTopProduto = (index, value) => {
    const newProds = [...topProdutos];
    newProds[index] = { ...newProds[index], nome: value };
    handleChange('topProdutos', newProds);
  };

  const addDivisao = () => {
    if (handleAddArrayItem) handleAddArrayItem('divisaoPercentual', { nome: '', percentual: '' });
  };
  const removeDivisao = (idx) => {
    if (handleRemoveArrayItem) handleRemoveArrayItem('divisaoPercentual', idx);
  };
  const updateDivisao = (idx, field, val) => {
    if (handleArrayChange) handleArrayChange('divisaoPercentual', idx, field, val);
  };

  return (
    <FormSection
      title="Produtos e Serviços"
      subtitle="Detalhes sobre o mix de produtos."
      icon={Package}
    >
      <div className="space-y-6">
        <div className="space-y-3">
           <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Top 3 produtos/serviços mais relevantes <span className="text-red-500">*</span></Label>
           {[0, 1, 2].map(i => (
             <Input
               key={i}
               placeholder={`${i+1}º produto/serviço mais vendido`}
               value={topProdutos[i]?.nome || ''}
               onChange={(e) => updateTopProduto(i, e.target.value)}
               className="mb-2 text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
             />
           ))}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-[var(--pagsmile-blue)]">Divisão Percentual dos Volumes <span className="text-red-500">*</span></Label>
            <Button type="button" variant="outline" size="sm" onClick={addDivisao} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          {divisaoPercentual.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input 
                placeholder="Nome do produto/serviço" 
                value={item.nome}
                onChange={(e) => updateDivisao(idx, 'nome', e.target.value)}
                className="flex-1 text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
              />
              <Input 
                placeholder="%" 
                type="number"
                value={item.percentual}
                onChange={(e) => updateDivisao(idx, 'percentual', e.target.value)}
                className="w-24 text-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]/20"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeDivisao(idx)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {divisaoPercentual.length === 0 && (
            <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-sm">
                Adicione a divisão percentual dos volumes de venda.
            </div>
          )}
          <p className="text-xs text-[var(--pagsmile-blue)]/70">A soma deve ser 100%.</p>
        </div>
      </div>
    </FormSection>
  );
}