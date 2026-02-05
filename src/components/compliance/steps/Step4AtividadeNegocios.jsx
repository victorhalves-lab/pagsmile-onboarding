import React, { useEffect } from 'react';
import { Briefcase, Plus, Trash2, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export default function Step4AtividadeNegocios({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  
  // Cálculo automático do Volume Mensal
  useEffect(() => {
    const ticket = parseFloat(formData.ticketMedio || '0');
    const qtd = parseFloat(formData.qtdTransacoesMensal || '0');
    if (!isNaN(ticket) && !isNaN(qtd)) {
      const volume = ticket * qtd;
      handleChange('volumeMensalEstimado', volume.toFixed(2));
    }
  }, [formData.ticketMedio, formData.qtdTransacoesMensal]);

  const canaisVendaOptions = [
    { id: 'site_proprio', label: 'Site Próprio / E-commerce' },
    { id: 'marketplace', label: 'Marketplace (Ex: ML, Amazon)' },
    { id: 'redes_sociais', label: 'Redes Sociais / WhatsApp' },
    { id: 'televendas', label: 'Televendas / Call Center' },
    { id: 'loja_fisica', label: 'Loja Física / Presencial' },
    { id: 'aplicativo', label: 'Aplicativo Mobile' }
  ];

  const handleCanalChange = (canalId, checked) => {
    const currentCanais = formData.canaisVenda || [];
    if (checked) {
      handleChange('canaisVenda', [...currentCanais, canalId]);
    } else {
      handleChange('canaisVenda', currentCanais.filter(id => id !== canalId));
    }
  };

  // Garante que arrays existam
  const topProdutos = formData.topProdutos || [];
  const topClientes = formData.topClientes || [];

  const addProduto = () => {
    // Se a função handleAddArrayItem não for passada (fluxo Pix simplificado), usamos uma lógica local ou fallback
    if (handleAddArrayItem) {
      handleAddArrayItem('topProdutos', { nome: '', percentual: '' });
    } else {
      // Fallback para fluxo simplificado se necessário, ou assumimos que sempre será passado
      const newProds = [...topProdutos, { nome: '', percentual: '' }];
      handleChange('topProdutos', newProds);
    }
  };

  const removeProduto = (index) => {
    if (handleRemoveArrayItem) {
      handleRemoveArrayItem('topProdutos', index);
    } else {
      const newProds = topProdutos.filter((_, i) => i !== index);
      handleChange('topProdutos', newProds);
    }
  };

  const updateProduto = (index, field, value) => {
    if (handleArrayChange) {
      handleArrayChange('topProdutos', index, field, value);
    } else {
      const newProds = [...topProdutos];
      newProds[index] = { ...newProds[index], [field]: value };
      handleChange('topProdutos', newProds);
    }
  };
  
  const addCliente = () => {
    if (handleAddArrayItem) {
      handleAddArrayItem('topClientes', { nome: '', documento: '' });
    } else {
      const newCli = [...topClientes, { nome: '', documento: '' }];
      handleChange('topClientes', newCli);
    }
  };

  const removeCliente = (index) => {
    if (handleRemoveArrayItem) {
      handleRemoveArrayItem('topClientes', index);
    } else {
      const newCli = topClientes.filter((_, i) => i !== index);
      handleChange('topClientes', newCli);
    }
  };

  const updateCliente = (index, field, value) => {
    if (handleArrayChange) {
      handleArrayChange('topClientes', index, field, value);
    } else {
      const newCli = [...topClientes];
      newCli[index] = { ...newCli[index], [field]: value };
      handleChange('topClientes', newCli);
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Atividade */}
      <FormSection
        title="Atividade e Produtos"
        subtitle="Detalhe o que sua empresa faz e vende."
        icon={Briefcase}
      >
        <FormField
          label="CNAE Principal"
          required
          value={formData.cnaePrincipal}
          onChange={(value) => handleChange('cnaePrincipal', value)}
          placeholder="Ex: 47.72-5-00"
          helpText="Código Nacional de Atividade Econômica principal."
        />
        
        <FormField
          label="CNAEs Secundários"
          type="textarea"
          value={formData.cnaesSecundarios}
          onChange={(value) => handleChange('cnaesSecundarios', value)}
          placeholder="Liste os CNAEs secundários, se houver."
          rows={2}
        />
        
        <FormField
          label="Descrição Detalhada do Negócio"
          required
          type="textarea"
          value={formData.descricaoAtividade}
          onChange={(value) => handleChange('descricaoAtividade', value)}
          placeholder="Descreva detalhadamente como sua empresa opera, como capta clientes e como entrega o produto/serviço. (Mínimo 50 caracteres)"
          rows={4}
          minLength={50}
        />

        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">O que você vende? <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={[
              { value: 'produto_fisico', label: 'Produto Físico' },
              { value: 'produto_digital', label: 'Produto Digital / Infoproduto' },
              { value: 'servico', label: 'Serviço' },
              { value: 'misto', label: 'Misto / Híbrido' }
            ]}
            value={formData.tipoProdutoPrincipal}
            onChange={(value) => handleChange('tipoProdutoPrincipal', value)}
            columns={2}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Top 3 Produtos/Serviços (Curva A)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addProduto} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)]">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          {topProdutos.map((prod, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input 
                  placeholder="Nome do Produto/Serviço" 
                  value={prod.nome} 
                  onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input 
                  placeholder="% Rec." 
                  type="number" 
                  value={prod.percentual} 
                  onChange={(e) => updateProduto(index, 'percentual', e.target.value)}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeProduto(index)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {topProdutos.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum produto listado.</p>}
        </div>
      </FormSection>

      {/* Seção de Canais e Operação */}
      <FormSection
        title="Canais de Venda e Clientes"
        subtitle="Onde você vende e para quem."
        icon={ShoppingBag}
      >
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Canais de Venda <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canaisVendaOptions.map(canal => (
              <div key={canal.id} className="flex items-center space-x-2 p-3 border border-slate-200 rounded-xl bg-white">
                <Checkbox 
                  id={canal.id} 
                  checked={(formData.canaisVenda || []).includes(canal.id)}
                  onCheckedChange={(checked) => handleCanalChange(canal.id, checked)}
                />
                <Label htmlFor={canal.id} className="cursor-pointer text-sm text-slate-700">{canal.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <FormField
          label="URL do Site / Aplicativo"
          value={formData.urlSite}
          onChange={(value) => handleChange('urlSite', value)}
          placeholder="https://www.seusite.com.br"
          helpText="Onde seu cliente realiza a compra ou contratação."
        />

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">Top 5 Maiores Clientes/Sellers (opcional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCliente} className="text-[var(--pagsmile-green)] border-[var(--pagsmile-green)]">
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          
          {topClientes.map((cli, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input 
                  placeholder="Nome do Cliente" 
                  value={cli.nome} 
                  onChange={(e) => updateCliente(index, 'nome', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="CNPJ/CPF (opcional)" 
                  value={cli.documento} 
                  onChange={(e) => updateCliente(index, 'documento', e.target.value)}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeCliente(index)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {topClientes.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum cliente listado.</p>}
        </div>
      </FormSection>

      {/* Seção de Volumetria */}
      <FormSection
        title="Volumetria e Financeiro"
        subtitle="Projeções financeiras da operação."
        icon={TrendingUp}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Quantidade Transações/Mês"
            required
            type="number"
            value={formData.qtdTransacoesMensal}
            onChange={(value) => handleChange('qtdTransacoesMensal', value)}
            placeholder="Ex: 1000"
          />
          <FormField
            label="Ticket Médio (R$)"
            required
            type="number"
            value={formData.ticketMedio}
            onChange={(value) => handleChange('ticketMedio', value)}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Volume Mensal Estimado (R$)"
            value={formData.volumeMensalEstimado}
            readOnly
            placeholder="Calculado automaticamente..."
            className="bg-slate-50 text-slate-500 cursor-not-allowed"
          />
          <FormField
            label="Faturamento Anual (R$)"
            value={formData.faturamentoAnual}
            onChange={(value) => handleChange('faturamentoAnual', value)}
            placeholder="Ex: 1.000.000,00"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Expectativa de Crescimento (12 meses)</Label>
          <SelectionButton
            options={[
              { value: 'estavel', label: 'Estável (0-10%)' },
              { value: 'moderado', label: 'Moderado (10-30%)' },
              { value: 'alto', label: 'Alto (30-100%)' },
              { value: 'exponencial', label: 'Exponencial (>100%)' }
            ]}
            value={formData.expectativaCrescimento}
            onChange={(value) => handleChange('expectativaCrescimento', value)}
            columns={2}
          />
        </div>
      </FormSection>
    </div>
  );
}