import React, { useEffect } from 'react';
import { Briefcase, Plus, Trash2, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Step4AtividadeNegocios({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  
  // Cálculo automático do Volume de Transações/Mês
  useEffect(() => {
    const volume = parseFloat(formData.volumeMensalEstimado || '0');
    const ticket = parseFloat(formData.ticketMedio || '0');
    if (!isNaN(volume) && !isNaN(ticket) && ticket > 0) {
      const qtd = Math.round(volume / ticket);
      handleChange('qtdTransacoesMensalCalculado', qtd.toString());
    }
  }, [formData.volumeMensalEstimado, formData.ticketMedio]);

  // Ensure arrays exist
  const topProdutos = formData.topProdutos || [
    { nome: '', percentual: '' },
    { nome: '', percentual: '' },
    { nome: '', percentual: '' }
  ];
  
  const divisaoPercentual = formData.divisaoPercentual || [];
  const topClientes = formData.topClientes || [];

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

  const addCliente = () => {
    if (handleAddArrayItem) handleAddArrayItem('topClientes', { nome: '', cnpj: '', ramo: '' });
  };
  const removeCliente = (idx) => {
    if (handleRemoveArrayItem) handleRemoveArrayItem('topClientes', idx);
  };
  const updateCliente = (idx, field, val) => {
    if (handleArrayChange) handleArrayChange('topClientes', idx, field, val);
  };

  const canaisVendaOptions = [
    { id: 'site_proprio', label: 'Site Próprio' },
    { id: 'app_mobile', label: 'Aplicativo móvel' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'link_pagamento', label: 'Link de pagamento' },
    { id: 'loja_fisica', label: 'PDV / Loja física' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'televendas', label: 'Televendas' },
    { id: 'outro', label: 'Outro' }
  ];

  const handleCanalChange = (id, checked) => {
    const current = formData.canaisVenda || [];
    if (checked) handleChange('canaisVenda', [...current, id]);
    else handleChange('canaisVenda', current.filter(c => c !== id));
  };

  return (
    <div className="space-y-8">
      {/* Seção 2: Atividade e Negócios */}
      <FormSection
        title="Atividade e Negócios"
        subtitle="Descreva a atividade da empresa"
        icon={Briefcase}
      >
        {/* 1. O que você vende? */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-slate-700">Qual o principal tipo de produto/serviço? <span className="text-red-500">*</span></Label>
          <Select 
            value={formData.tipoProdutoPrincipal} 
            onValueChange={(val) => handleChange('tipoProdutoPrincipal', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="software_saas">Software (SaaS)</SelectItem>
              <SelectItem value="ecommerce">E-commerce (Varejo Online)</SelectItem>
              <SelectItem value="servicos_digitais">Serviços Digitais (Consultoria, Marketing)</SelectItem>
              <SelectItem value="hardware">Hardware/Eletrônicos</SelectItem>
              <SelectItem value="financeiro">Serviços Financeiros</SelectItem>
              <SelectItem value="conteudo">Mídia/Conteúdo Digital</SelectItem>
              <SelectItem value="educacao">Educação/Cursos Online</SelectItem>
              <SelectItem value="games">Jogos/Games</SelectItem>
              <SelectItem value="turismo">Turismo/Viagens</SelectItem>
              <SelectItem value="saude">Saúde/Bem-estar</SelectItem>
              <SelectItem value="alimentacao">Alimentação/Delivery</SelectItem>
              <SelectItem value="logistica">Logística/Transporte</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>

          <FormField
            label="Descreva brevemente todos os produtos/serviços comercializados"
            required
            type="textarea"
            value={formData.descricaoProdutos}
            onChange={(val) => handleChange('descricaoProdutos', val)}
            placeholder="Ex: Vendemos roupas masculinas e femininas, incluindo camisetas, calças jeans..."
            minLength={20}
            rows={3}
            helpText="Mínimo 20 caracteres"
          />

          <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Top 3 produtos/serviços mais relevantes <span className="text-red-500">*</span></Label>
             {[0, 1, 2].map(i => (
               <Input
                 key={i}
                 placeholder={`${i+1}º produto/serviço mais vendido`}
                 value={topProdutos[i]?.nome || ''}
                 onChange={(e) => updateTopProduto(i, e.target.value)}
                 className="mb-2"
               />
             ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-slate-700">Divisão Percentual dos Volumes <span className="text-red-500">*</span></Label>
              <Button type="button" variant="outline" size="sm" onClick={addDivisao} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)]">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            {divisaoPercentual.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input 
                  placeholder="Nome do produto/serviço" 
                  value={item.nome}
                  onChange={(e) => updateDivisao(idx, 'nome', e.target.value)}
                  className="flex-1"
                />
                <Input 
                  placeholder="%" 
                  type="number"
                  value={item.percentual}
                  onChange={(e) => updateDivisao(idx, 'percentual', e.target.value)}
                  className="w-24"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeDivisao(idx)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-slate-500">A soma deve ser 100%.</p>
          </div>
        </div>

        {/* 2. Escopo do Negócio */}
        <FormField
          label="Escopo do Negócio"
          required
          type="textarea"
          value={formData.escopoNegocio}
          onChange={(val) => handleChange('escopoNegocio', val)}
          placeholder="Descreva detalhadamente o que a empresa faz, seus produtos/serviços, público-alvo, etc. (mínimo 50 caracteres)"
          minLength={50}
          rows={4}
        />

        {/* 3, 4, 5. Volumes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Estimativa de Volume/Mês (R$)"
            required
            type="number"
            value={formData.volumeMensalEstimado}
            onChange={(val) => handleChange('volumeMensalEstimado', val)}
            placeholder="Ex: 100000"
            icon={DollarSign}
          />
          <FormField
            label="Ticket Médio (R$)"
            required
            type="number"
            value={formData.ticketMedio}
            onChange={(val) => handleChange('ticketMedio', val)}
            placeholder="Ex: 150"
            icon={DollarSign}
          />
          <FormField
            label="Volume de Transações/Mês"
            value={formData.qtdTransacoesMensalCalculado}
            readOnly
            className="bg-slate-50 cursor-not-allowed"
            placeholder="Calculado automaticamente"
            helpText="Baseado em Volume / Ticket Médio"
          />
        </div>

        {/* 6, 7. URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Site Corporativo"
            required
            value={formData.siteCorporativo}
            onChange={(val) => handleChange('siteCorporativo', val)}
            placeholder="https://www.empresa.com.br"
          />
          <FormField
            label="URL do Produto/App/Checkout"
            value={formData.urlProduto}
            onChange={(val) => handleChange('urlProduto', val)}
            placeholder="https://... (opcional)"
          />
        </div>

        {/* 8. Gateway/Marketplace */}
        <YesNoQuestion
          question="Sua operação é de gateway, marketplace, plataforma de infoprodutos ou plataforma que tem sellers?"
          value={formData.operaMarketplace}
          onChange={(val) => handleChange('operaMarketplace', val)}
          required
          helperText="Controle de Seção"
        />

        {/* 9. Top 5 Sellers (Condicional) */}
        {formData.operaMarketplace === true && (
           <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="flex justify-between items-center mb-2">
               <Label className="text-sm font-medium text-slate-700">Top 5 Maiores Clientes/Sellers</Label>
               <Button type="button" variant="outline" size="sm" onClick={addCliente} disabled={topClientes.length >= 5} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)]">
                 <Plus className="w-4 h-4 mr-1" /> Adicionar
               </Button>
             </div>
             {topClientes.map((cli, idx) => (
               <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-center bg-white p-2 rounded border border-slate-100">
                 <Input 
                   placeholder="Nome" 
                   value={cli.nome} 
                   onChange={(e) => updateCliente(idx, 'nome', e.target.value)}
                 />
                 <Input 
                   placeholder="CNPJ" 
                   value={cli.cnpj} 
                   onChange={(e) => updateCliente(idx, 'cnpj', e.target.value)}
                 />
                 <div className="flex gap-2">
                    <Input 
                      placeholder="Ramo de Atividade" 
                      value={cli.ramo} 
                      onChange={(e) => updateCliente(idx, 'ramo', e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCliente(idx)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
               </div>
             ))}
             {topClientes.length === 0 && <p className="text-xs text-slate-400">Nenhum cliente adicionado.</p>}
           </div>
        )}

        {/* 10. Canais de Venda */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Canais de Venda <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {canaisVendaOptions.map(opt => (
              <div key={opt.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={opt.id}
                  checked={(formData.canaisVenda || []).includes(opt.id)}
                  onCheckedChange={(chk) => handleCanalChange(opt.id, chk)}
                />
                <Label htmlFor={opt.id} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* 11. Expectativa de Crescimento */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Expectativa de Crescimento (12 meses)</Label>
          <Select 
            value={formData.expectativaCrescimento} 
            onValueChange={(val) => handleChange('expectativaCrescimento', val)}
          >
            <SelectTrigger>
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

      </FormSection>
    </div>
  );
}