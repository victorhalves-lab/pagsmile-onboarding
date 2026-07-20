import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, Plus, Trash2 } from 'lucide-react';

export default function MeetingFormBusinessDetails({ form, updateField }) {
  const addRevenueRow = () => {
    updateField('revenueBreakdown', [...form.revenueBreakdown, { product: '', percentage: 0 }]);
  };

  const updateRevenue = (index, field, value) => {
    const updated = [...form.revenueBreakdown];
    updated[index] = { ...updated[index], [field]: field === 'percentage' ? Number(value) : value };
    updateField('revenueBreakdown', updated);
  };

  const removeRevenue = (index) => {
    updateField('revenueBreakdown', form.revenueBreakdown.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-[#0A0A0A]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-[#1356E2]" />
          Detalhamento do Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Descrição do Negócio e Produtos/Serviços</Label>
          <Textarea value={form.businessDescription} onChange={e => updateField('businessDescription', e.target.value)} placeholder="Descreva o core business, principais produtos e serviços..." rows={3} />
        </div>
        <div>
          <Label>Canais de Venda</Label>
          <Input value={form.salesChannels} onChange={e => updateField('salesChannels', e.target.value)} placeholder="E-commerce, loja física, marketplaces, etc." />
        </div>

        {/* Revenue breakdown */}
        <div>
          <Label className="mb-2 block">Distribuição de Receita por Produto/Serviço</Label>
          <div className="space-y-2">
            {form.revenueBreakdown.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input className="flex-1" value={row.product} onChange={e => updateRevenue(i, 'product', e.target.value)} placeholder="Nome do produto/serviço" />
                <div className="w-24 relative">
                  <Input type="number" min="0" max="100" value={row.percentage || ''} onChange={e => updateRevenue(i, 'percentage', e.target.value)} placeholder="%" />
                </div>
                {form.revenueBreakdown.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeRevenue(i)} className="text-red-400 hover:text-red-600 h-9 px-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addRevenueRow} className="mt-2">
            <Plus className="w-3 h-3 mr-1" /> Adicionar Produto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}