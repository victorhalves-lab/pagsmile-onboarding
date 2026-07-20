import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Section4UBO({ formData, handleChange, handleArrayChange, handleAddArrayItem, handleRemoveArrayItem }) {
  const nacionalidadeOptions = [
    'Brasil', 'Estados Unidos', 'Portugal', 'Espanha', 'Argentina', 
    'Chile', 'Colômbia', 'México', 'Alemanha', 'França', 
    'Itália', 'Reino Unido', 'China', 'Japão', 'Outro'
  ];

  const ubos = formData.ubos || [];

  const addUBO = () => {
    handleAddArrayItem('ubos', {
      nome: '',
      nacionalidade: '',
      endereco: '',
      participacao: '',
      documento: '',
      isPEP: null,
      pepDetalhe: ''
    });
  };

  return (
    <FormSection
      title="Beneficiários Finais (UBO)"
      subtitle="Indivíduos com > 25% de participação na empresa."
      icon={Users}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Empresa de capital aberto? <span className="text-red-500">*</span>
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Capital aberto' },
            { value: false, label: 'Não', description: 'Capital fechado' }
          ]}
          value={formData.empresaCapitalAberto}
          onChange={(value) => handleChange('empresaCapitalAberto', value)}
          columns={2}
        />
      </div>

      {formData.empresaCapitalAberto === false && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">
              Beneficiários Finais (UBOs)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUBO}
              className="text-[var(--pinbank-blue)] border-[var(--pinbank-blue)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar UBO
            </Button>
          </div>

          {ubos.map((ubo, index) => (
            <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">UBO {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveArrayItem('ubos', index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <FormField
                label="Nome Completo"
                required
                value={ubo.nome}
                onChange={(value) => handleArrayChange('ubos', index, 'nome', value)}
                placeholder="Nome completo"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Nacionalidade <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={ubo.nacionalidade}
                    onValueChange={(value) => handleArrayChange('ubos', index, 'nacionalidade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nacionalidadeOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  label="% Participação"
                  required
                  type="number"
                  value={ubo.participacao}
                  onChange={(value) => handleArrayChange('ubos', index, 'participacao', value)}
                  placeholder="Ex: 30"
                />
              </div>

              <FormField
                label="Endereço Residencial"
                required
                type="textarea"
                value={ubo.endereco}
                onChange={(value) => handleArrayChange('ubos', index, 'endereco', value)}
                placeholder="Endereço completo"
                rows={2}
              />

              <FormField
                label="CPF/Passaporte"
                required
                value={ubo.documento}
                onChange={(value) => handleArrayChange('ubos', index, 'documento', value)}
                placeholder="Documento"
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  É PEP (Pessoa Politicamente Exposta)? <span className="text-red-500">*</span>
                </Label>
                <SelectionButton
                  options={[
                    { value: true, label: 'Sim' },
                    { value: false, label: 'Não' }
                  ]}
                  value={ubo.isPEP}
                  onChange={(value) => handleArrayChange('ubos', index, 'isPEP', value)}
                  columns={2}
                />
              </div>

              {ubo.isPEP === true && (
                <FormField
                  label="Detalhes PEP"
                  required
                  type="textarea"
                  value={ubo.pepDetalhe}
                  onChange={(value) => handleArrayChange('ubos', index, 'pepDetalhe', value)}
                  placeholder="Descreva cargo/função"
                  rows={2}
                />
              )}
            </div>
          ))}

          {ubos.length === 0 && (
            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum UBO adicionado ainda.</p>
              <p className="text-sm">Clique em "Adicionar UBO" para incluir os beneficiários finais.</p>
            </div>
          )}
        </div>
      )}
    </FormSection>
  );
}