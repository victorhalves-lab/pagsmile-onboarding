import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const MODULOS = [
  { key: 'subadquirenciaCartao', label: 'Módulo A – Subadquirência / Gateway / Orquestrador / API Cartão / Antifraude' },
  { key: 'contaPagamento', label: 'Módulo B – Conta (Conta de Pagamento / Conta Liquidação)' },
  { key: 'pixRecebimentos', label: 'Módulo C – Cobrança Pix (API Pix para cobrança)' },
  { key: 'pixPagamentos', label: 'Módulo D – Pix Pagamentos' },
  { key: 'boleto', label: 'Módulo E – Boleto' },
  { key: 'gateway', label: 'Módulo F – Gateway' },
];

export default function ModulosForm({ contract, onChange }) {
  const modules = contract.modules || {};

  const handleModuleToggle = (key, checked) => {
    onChange('modules', { ...modules, [key]: checked });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-[#002443] border-b border-[#002443]/10 pb-2">Módulos Ativos</h3>

      <div className="space-y-3">
        {MODULOS.map(mod => (
          <label key={mod.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#002443]/5 hover:border-[#2bc196]/20 hover:bg-[#2bc196]/5 transition-all cursor-pointer">
            <Checkbox
              checked={modules[mod.key] || false}
              onCheckedChange={(checked) => handleModuleToggle(mod.key, checked)}
            />
            <span className="text-sm text-[#002443]">{mod.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-1.5 mt-4">
        <Label className="text-xs font-semibold text-[#002443]/70 uppercase tracking-wider">Outros Módulos</Label>
        <Textarea
          value={contract.otherModules || ''}
          onChange={e => onChange('otherModules', e.target.value)}
          placeholder="Descreva outros módulos adicionais..."
          className="h-20"
        />
      </div>
    </div>
  );
}