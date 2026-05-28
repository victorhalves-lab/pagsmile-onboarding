import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import PersonTypeToggle from './PersonTypeToggle';
import DocSlot from './DocSlot';

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

export default function SubsellerCard({ idx, row, token, onUpdate, onRemove }) {
  const isPJ = (row.person_type || 'PJ') === 'PJ';
  const filled = !!(row.company_name?.trim() || (isPJ ? row.cnpj?.trim() : row.cpf?.trim()));
  const slots = isPJ ? DOC_SLOTS_PJ : DOC_SLOTS_PF;

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
    <Card className={`transition-all ${filled ? 'border-[#2bc196]/40 shadow-sm' : 'border-[#002443]/5'}`}>
      <CardContent className="p-5 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${filled ? 'bg-[#2bc196] text-white' : 'bg-[#f4f4f4] text-[#002443]/40'}`}>
              {idx + 1}
            </div>
            <span className="text-sm font-semibold text-[#002443]">
              {row.company_name || `Subseller #${idx + 1}`}
            </span>
          </div>
          <button onClick={onRemove} className="text-[#002443]/30 hover:text-red-500 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">Volumetria estimada</div>
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">Conta bancária para liquidação</div>
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">
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
    </Card>
  );
}