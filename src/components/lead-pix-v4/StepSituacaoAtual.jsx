import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonSelector from './ButtonSelector';
import { TEMPO_USO_OPTIONS, CUSTO_PIX_OPTIONS, MOTIVO_BUSCA_OPTIONS } from './pixQuestionnaireData';

export default function StepSituacaoAtual({ form, updateField }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#002443]">Situação Atual</h2>

      <div>
        <Label className="text-xs">Parceiro/processador PIX atual *</Label>
        <Input
          value={form.parceiroPix || ''}
          onChange={e => updateField('parceiroPix', e.target.value)}
          placeholder="Nome do parceiro ou 'Primeiro'"
          className="text-xs"
        />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Há quanto tempo usa? *</Label>
        <ButtonSelector options={TEMPO_USO_OPTIONS} value={form.tempoUso} onChange={v => updateField('tempoUso', v)} columns={5} />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Quanto paga por PIX atualmente? *</Label>
        <ButtonSelector options={CUSTO_PIX_OPTIONS} value={form.custoPix} onChange={v => updateField('custoPix', v)} columns={3} />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Principal motivo para buscar novo parceiro PIX *</Label>
        <ButtonSelector options={MOTIVO_BUSCA_OPTIONS} value={form.motivoBusca} onChange={v => updateField('motivoBusca', v)} columns={2} />
        {form.motivoBusca === 'Outro' && (
          <Input value={form.motivoBuscaOutro || ''} onChange={e => updateField('motivoBuscaOutro', e.target.value)} placeholder="Qual motivo?" className="mt-2 text-xs" />
        )}
      </div>

      <div>
        <Label className="text-xs mb-2 block">Já teve conta encerrada por banco ou processador? *</Label>
        <div className="grid grid-cols-2 gap-2">
          {['Não', 'Sim'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => updateField('contaEncerrada', opt)}
              className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all
                ${form.contaEncerrada === opt
                  ? opt === 'Sim' ? 'border-red-400 bg-red-50 text-red-700' : 'border-[#2bc196] bg-[#2bc196]/10 text-[#002443]'
                  : 'border-[#002443]/10 text-[#002443]/50 hover:border-[#002443]/20'
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {form.contaEncerrada === 'Sim' && (
          <div className="mt-2">
            <Label className="text-xs">Qual e motivo?</Label>
            <Input value={form.contaEncerradaMotivo || ''} onChange={e => updateField('contaEncerradaMotivo', e.target.value)} placeholder="Nome do banco/processador + motivo" className="text-xs" />
          </div>
        )}
      </div>
    </div>
  );
}