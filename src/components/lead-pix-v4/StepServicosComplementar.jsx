import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ButtonSelector from './ButtonSelector';
import { SERVICOS_PIX_OPTIONS, URGENCIA_OPTIONS, COMO_CONHECEU_OPTIONS } from './pixQuestionnaireData';

export default function StepServicosComplementar({ form, updateField }) {
  const [uploading, setUploading] = React.useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('competitorFileUrl', file_url);
    setUploading(false);
    toast.success('Arquivo enviado!');
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#002443]">Serviços & Informações Complementares</h2>

      <div>
        <Label className="text-xs mb-2 block">Serviços PIX desejados * (selecione todos que se aplicam)</Label>
        <ButtonSelector
          options={SERVICOS_PIX_OPTIONS}
          value={form.servicosPix || []}
          onChange={v => updateField('servicosPix', v)}
          multi
          columns={3}
        />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Urgência *</Label>
        <ButtonSelector options={URGENCIA_OPTIONS} value={form.urgencia} onChange={v => updateField('urgencia', v)} columns={4} />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Como conheceu a PagSmile? *</Label>
        <ButtonSelector options={COMO_CONHECEU_OPTIONS} value={form.comoConheceu} onChange={v => updateField('comoConheceu', v)} columns={3} />
      </div>

      <div>
        <Label className="text-xs mb-1 block">Upload proposta concorrente (opcional)</Label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} />
            <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
              <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}Selecionar</span>
            </Button>
          </label>
          {form.competitorFileUrl && <span className="text-xs text-[#2bc196] flex items-center gap-1"><Check className="w-3 h-3" />Enviado</span>}
        </div>
      </div>

      <div>
        <Label className="text-xs">Observações (opcional)</Label>
        <Textarea
          value={form.observacoes || ''}
          onChange={e => updateField('observacoes', e.target.value)}
          placeholder="Alguma informação adicional..."
          maxLength={1000}
          rows={3}
          className="text-xs"
        />
      </div>
    </div>
  );
}