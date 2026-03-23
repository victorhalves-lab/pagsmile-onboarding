import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Target, Upload, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PixFormCompetitors({ form, updateField }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('competitorProposalUrl', file_url);
    setUploading(false);
    toast.success('Arquivo enviado com sucesso!');
  };

  return (
    <Card className="border-[#002443]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-[#2bc196]" />
          Concorrência e Dores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Quais parceiros atuais de PIX?</Label>
            <Input value={form.currentPixPartners} onChange={e => updateField('currentPixPartners', e.target.value)} placeholder="Ex: Banco X, Y Pagamentos" />
          </div>
          <div>
            <Label>Quanto paga atualmente por PIX?</Label>
            <Input value={form.currentPixCost} onChange={e => updateField('currentPixCost', e.target.value)} placeholder="Ex: R$ 0,89 ou 0,5%" />
          </div>
        </div>
        <div>
          <Label>Quais são as principais dores que enfrenta atualmente?</Label>
          <Textarea value={form.mainChallenges} onChange={e => updateField('mainChallenges', e.target.value)} placeholder="Ex: Altas taxas, problemas de conciliação, lentidão no suporte..." rows={3} />
        </div>
        <div>
          <Label className="mb-2 block">Upload de propostas de concorrentes (opcional)</Label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} />
              <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Selecionar Arquivo
                </span>
              </Button>
            </label>
            {form.competitorProposalUrl && (
              <span className="text-xs text-[#2bc196] flex items-center gap-1">
                <Check className="w-3 h-3" /> Arquivo enviado
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}