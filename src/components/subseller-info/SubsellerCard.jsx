import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download } from 'lucide-react';
import PersonTypeToggle from './PersonTypeToggle';
import DocSlot from './DocSlot';
import PullMerchantModal from './PullMerchantModal';

function formatCnpj(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
function formatCpf(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

// Slots de documentos por tipo de pessoa
const DOC_SLOTS_PJ = [
  { key: 'contrato_social', label: 'Contrato Social da empresa', required: true, multiple: false },
  { key: 'doc_socio', label: 'Documento dos sócios', required: true, multiple: true },
  { key: 'selfie_socio', label: 'Selfie do sócio com o documento', required: true, multiple: true },
  { key: 'comprovante_endereco_empresa', label: 'Comprovante de endereço da empresa', required: true, multiple: false },
];
const DOC_SLOTS_PF = [
  { key: 'documento_id', label: 'Documento de identificação', required: true, multiple: false },
  { key: 'selfie_documento', label: 'Selfie segurando o documento', required: true, multiple: false },
  { key: 'comprovante_residencia', label: 'Comprovante de residência', required: true, multiple: false },
];

export default function SubsellerCard({ idx, row, token, onUpdate, onRemove, onReplaceRow, allowPullMerchant = false }) {
  const isPJ = (row.person_type || 'PJ') === 'PJ';
  const filled = !!(row.company_name?.trim() || (isPJ ? row.cnpj?.trim() : row.cpf?.trim()));
  const slots = isPJ ? DOC_SLOTS_PJ : DOC_SLOTS_PF;
  const [pullOpen, setPullOpen] = useState(false);

  const handlePulled = (pulledSubseller) => {
    // Substitui a row inteira pelos dados puxados (preserva nada do que estava antes —
    // o operador escolheu puxar, então o card vira o cliente puxado).
    if (onReplaceRow) onReplaceRow(pulledSubseller);
  };

  const docsByType = (type) => (row.documents || []).filter(d => d.doc_type === type);

  const addDoc = (doc) => {
    onUpdate('documents', [...(row.documents || []), doc]);
  };
  const removeDoc = (doc, idxInList) => {
    const all = row.documents || [];
    // localiza pelo file_uri pra remover o item específico, mesmo dentro do mesmo type
    const sameType = all.filter(d => d.doc_type === doc.doc_type);
    const target = sameType[idxInList];
    if (!target) return;
    onUpdate('documents', all.filter(d => d !== target));
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all border-2 ${
        filled
          ? 'border-[#1356E2]/50 shadow-lg shadow-[#1356E2]/10'
          : 'border-[#0A0A0A]/10 shadow-md'
      }`}
    >
      {/* Faixa lateral colorida para reforçar a separação */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          filled ? 'bg-[#1356E2]' : 'bg-[#0A0A0A]/20'
        }`}
        aria-hidden="true"
      />

      <CardContent className="p-5 md:p-6 space-y-4 pl-6 md:pl-7">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0A0A0A]/8">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black tabular-nums ${
                filled ? 'bg-[#1356E2] text-white shadow-md shadow-[#1356E2]/30' : 'bg-[#f4f4f4] text-[#0A0A0A]/50'
              }`}
            >
              {idx + 1}
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-[#0A0A0A] truncate">
                {row.company_name || `Subseller #${idx + 1}`}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/40">
                {(row.person_type || 'PJ') === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {allowPullMerchant && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPullOpen(true)}
                className="h-8 text-xs border-[#1356E2]/40 text-[#E84B1C] hover:bg-[#1356E2]/5"
                title="Puxar dados de um cliente já cadastrado na plataforma"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Puxar cliente
              </Button>
            )}
            <button
              onClick={onRemove}
              className="text-[#0A0A0A]/30 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg"
              title="Remover este subseller"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toggle PJ / PF */}
        <div>
          <Label className="text-xs mb-1.5 block">Tipo *</Label>
          <PersonTypeToggle
            value={row.person_type || 'PJ'}
            onChange={(v) => onUpdate('person_type', v)}
          />
        </div>

        {/* Campos básicos */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">{isPJ ? 'Razão Social / Nome Fantasia *' : 'Nome completo *'}</Label>
            <Input
              value={row.company_name || ''}
              onChange={(e) => onUpdate('company_name', e.target.value)}
              placeholder={isPJ ? 'Ex: Loja XYZ Ltda' : 'Ex: João da Silva'}
            />
          </div>

          {isPJ ? (
            <>
              <div>
                <Label className="text-xs">CNPJ *</Label>
                <Input
                  value={row.cnpj || ''}
                  onChange={(e) => onUpdate('cnpj', formatCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">CNAE (atividade principal)</Label>
                <Input
                  value={row.cnae || ''}
                  onChange={(e) => onUpdate('cnae', e.target.value)}
                  placeholder="Ex: 47.81-4-00 — Comércio varejista de artigos do vestuário"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs">CPF *</Label>
                <Input
                  value={row.cpf || ''}
                  onChange={(e) => onUpdate('cpf', formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">RG</Label>
                <Input
                  value={row.rg || ''}
                  onChange={(e) => onUpdate('rg', e.target.value)}
                  placeholder="Ex: 12.345.678-9"
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-xs">Modelo de Negócio</Label>
            <Select value={row.business_model || ''} onValueChange={(v) => onUpdate('business_model', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="saas">SaaS / Assinatura</SelectItem>
                <SelectItem value="link_pagamento">Link de Pagamento</SelectItem>
                <SelectItem value="infoprodutos">Infoprodutos / Cursos</SelectItem>
                <SelectItem value="dropshipping">Dropshipping</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">O que vende?</Label>
            <Input
              value={row.what_they_sell || ''}
              onChange={(e) => onUpdate('what_they_sell', e.target.value)}
              placeholder="Ex: Roupas femininas"
            />
          </div>

          {/* Campo obrigatório quando "outro" */}
          {row.business_model === 'outro' && (
            <div className="md:col-span-2">
              <Label className="text-xs text-red-600">
                Explique qual é o modelo de negócio *
              </Label>
              <Textarea
                value={row.business_model_other || ''}
                onChange={(e) => onUpdate('business_model_other', e.target.value)}
                placeholder="Descreva o modelo de negócio do subseller (obrigatório)"
                className="h-16 border-red-300"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <Label className="text-xs">Site ou Link da Oferta</Label>
            <Input
              value={row.offer_url || ''}
              onChange={(e) => onUpdate('offer_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Explicação da oferta (se não houver site)</Label>
            <Textarea
              value={row.offer_explanation || ''}
              onChange={(e) => onUpdate('offer_explanation', e.target.value)}
              placeholder="Descreva claramente o produto/serviço, valor, condições..."
              className="h-20"
            />
          </div>

          {/* Volumetria */}
          <div className="md:col-span-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 mb-2">Volumetria estimada</div>
          </div>
          <div>
            <Label className="text-xs">TPV Mensal (R$)</Label>
            <Input
              type="number"
              value={row.monthly_tpv || ''}
              onChange={(e) => onUpdate('monthly_tpv', e.target.value)}
              placeholder="Ex: 50000"
            />
          </div>
          <div>
            <Label className="text-xs">Ticket Médio (R$)</Label>
            <Input
              type="number"
              value={row.average_ticket || ''}
              onChange={(e) => onUpdate('average_ticket', e.target.value)}
              placeholder="Ex: 150"
            />
          </div>

          {/* Conta bancária */}
          <div className="md:col-span-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 mb-2">Conta bancária para liquidação</div>
          </div>
          <div>
            <Label className="text-xs">Banco</Label>
            <Input value={row.bank_name || ''} onChange={(e) => onUpdate('bank_name', e.target.value)} placeholder="Ex: Itaú, Bradesco..." />
          </div>
          <div>
            <Label className="text-xs">Tipo de Conta</Label>
            <Select value={row.bank_account_type || 'corrente'} onValueChange={(v) => onUpdate('bank_account_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Agência</Label>
            <Input value={row.bank_agency || ''} onChange={(e) => onUpdate('bank_agency', e.target.value)} placeholder="0000" />
          </div>
          <div>
            <Label className="text-xs">Conta</Label>
            <Input value={row.bank_account || ''} onChange={(e) => onUpdate('bank_account', e.target.value)} placeholder="00000-0" />
          </div>
          <div>
            <Label className="text-xs">Titular da Conta</Label>
            <Input value={row.bank_holder_name || ''} onChange={(e) => onUpdate('bank_holder_name', e.target.value)} placeholder="Nome do titular" />
          </div>
          <div>
            <Label className="text-xs">CPF/CNPJ do Titular</Label>
            <Input value={row.bank_holder_document || ''} onChange={(e) => onUpdate('bank_holder_document', e.target.value)} placeholder="Documento do titular" />
          </div>
        </div>

        {/* Documentos */}
        <div className="pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 mb-2">
            Documentos obrigatórios ({isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'})
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {slots.map(slot => (
              <DocSlot
                key={slot.key}
                token={token}
                docType={slot.key}
                label={slot.label}
                required={slot.required}
                multiple={slot.multiple}
                value={docsByType(slot.key)}
                onAdd={addDoc}
                onRemove={(idxInList) => removeDoc({ doc_type: slot.key }, idxInList)}
              />
            ))}
          </div>
        </div>
      </CardContent>

      <PullMerchantModal
        open={pullOpen}
        onClose={() => setPullOpen(false)}
        onPull={handlePulled}
      />
    </Card>
  );
}