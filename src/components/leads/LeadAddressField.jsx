import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin, CheckCircle, Loader2, AlertTriangle, Pencil, ShieldCheck
} from 'lucide-react';
import FormFieldError from './FormFieldError';

const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

function formatCep(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5);
  return digits;
}

async function fetchCepViaCep(cep) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: data.uf || '',
  };
}

async function fetchCepBrasilApi(cep) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    logradouro: data.street || '',
    bairro: data.neighborhood || '',
    cidade: data.city || '',
    uf: data.state || '',
  };
}

/**
 * Campo de endereço completo para questionário de Lead.
 * Pré-preenche com dados do CNPJ e permite edição via autocomplete CEP.
 * O lead é obrigado a confirmar que o endereço está correto.
 */
export default function LeadAddressField({
  formData,
  updateField,
  cnpjApiData,
  addressFieldId,
  validationErrors = {},
}) {
  const addr = formData[addressFieldId] || {};
  const [isEditing, setIsEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(!!formData[`${addressFieldId}_confirmed`]);
  const [cepDisplay, setCepDisplay] = useState(formatCep(addr.cep || ''));
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  // Pre-fill from CNPJ data when it arrives
  useEffect(() => {
    if (!cnpjApiData?.endereco) return;
    const existing = formData[addressFieldId];
    // Only pre-fill if address is empty (not already confirmed/edited)
    if (existing && existing.cep) return;
    const e = cnpjApiData.endereco;
    const newAddr = {
      cep: e.cep || '',
      logradouro: e.logradouro || '',
      numero: e.numero || '',
      complemento: e.complemento || '',
      bairro: e.bairro || '',
      cidade: e.municipio || '',
      uf: e.uf || '',
    };
    updateField(addressFieldId, newAddr);
    setCepDisplay(formatCep(e.cep || ''));
    setConfirmed(false);
    updateField(`${addressFieldId}_confirmed`, false);
  }, [cnpjApiData]);

  const updateAddr = useCallback((key, value) => {
    const updated = { ...(formData[addressFieldId] || {}), [key]: value };
    updateField(addressFieldId, updated);
  }, [formData, addressFieldId, updateField]);

  const handleCepChange = useCallback(async (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setCepDisplay(formatCep(digits));
    updateAddr('cep', digits);
    setCepError('');

    if (digits.length !== 8) return;

    setCepLoading(true);
    let result = null;
    try {
      result = await fetchCepViaCep(digits);
    } catch {}
    if (!result) {
      try {
        result = await fetchCepBrasilApi(digits);
      } catch {}
    }
    setCepLoading(false);

    if (result) {
      const updated = {
        ...(formData[addressFieldId] || {}),
        cep: digits,
        logradouro: result.logradouro || '',
        bairro: result.bairro || '',
        cidade: result.cidade || '',
        uf: result.uf || '',
      };
      updateField(addressFieldId, updated);
      setCepError('');
    } else {
      setCepError('CEP não encontrado. Preencha o endereço manualmente.');
    }
  }, [formData, addressFieldId, updateField]);

  const handleConfirm = () => {
    setConfirmed(true);
    updateField(`${addressFieldId}_confirmed`, true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setConfirmed(false);
    updateField(`${addressFieldId}_confirmed`, false);
  };

  const hasPrefill = !!(addr.cep || addr.logradouro);
  const fieldError = validationErrors[addressFieldId];
  const confirmError = validationErrors[`${addressFieldId}_confirmed`];

  // Read-only display when confirmed
  if (confirmed && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1356E2]" />
          <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">
            Endereço da Empresa
          </Label>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <ShieldCheck className="w-3 h-3" />
            Confirmado
          </Badge>
        </div>
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
          <p className="text-sm font-medium text-[#0A0A0A]">
            {addr.logradouro}{addr.numero ? `, ${addr.numero}` : ''}{addr.complemento ? ` - ${addr.complemento}` : ''}
          </p>
          <p className="text-sm text-[#0A0A0A]/70">
            {addr.bairro} — {addr.cidade}/{addr.uf}
          </p>
          <p className="text-xs text-[#0A0A0A]/50">CEP: {formatCep(addr.cep)}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="text-xs gap-1"
        >
          <Pencil className="w-3 h-3" />
          Alterar endereço
        </Button>
      </div>
    );
  }

  // Editable form
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#0A0A0A]/50" />
        <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">
          Endereço da Empresa <span className="text-red-500">*</span>
        </Label>
        {hasPrefill && !isEditing && (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" />
            Pré-preenchido via CNPJ
          </Badge>
        )}
      </div>

      {hasPrefill && !isEditing && (
        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <p className="font-semibold mb-1">Endereço encontrado na Receita Federal:</p>
          <p>
            {addr.logradouro}{addr.numero ? `, ${addr.numero}` : ''}{addr.complemento ? ` - ${addr.complemento}` : ''} — {addr.bairro}, {addr.cidade}/{addr.uf} — CEP {formatCep(addr.cep)}
          </p>
          <p className="mt-2 text-blue-600">
            Se estiver correto, clique em "Confirmar endereço". Caso precise alterar, clique em "Editar".
          </p>
        </div>
      )}

      {/* CEP field — always visible when editing or no prefill */}
      {(isEditing || !hasPrefill) && (
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {isEditing && (
            <p className="text-xs text-[#0A0A0A]/60 mb-2">
              Digite o novo CEP para preencher automaticamente, ou edite os campos manualmente.
            </p>
          )}

          {/* CEP */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#0A0A0A]/70">CEP <span className="text-red-500">*</span></Label>
            <div className="relative w-48">
              <Input
                value={cepDisplay}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="h-10 rounded-xl font-mono text-sm"
                maxLength={9}
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#1356E2]" />
              )}
            </div>
            {cepError && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {cepError}
              </p>
            )}
          </div>

          {/* Logradouro + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">Logradouro <span className="text-red-500">*</span></Label>
              <Input
                value={addr.logradouro || ''}
                onChange={(e) => updateAddr('logradouro', e.target.value)}
                placeholder="Rua, Av, etc."
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">Número <span className="text-red-500">*</span></Label>
              <Input
                value={addr.numero || ''}
                onChange={(e) => updateAddr('numero', e.target.value)}
                placeholder="123 ou S/N"
                className="h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Complemento + Bairro */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">Complemento</Label>
              <Input
                value={addr.complemento || ''}
                onChange={(e) => updateAddr('complemento', e.target.value)}
                placeholder="Sala, Andar, etc."
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">Bairro <span className="text-red-500">*</span></Label>
              <Input
                value={addr.bairro || ''}
                onChange={(e) => updateAddr('bairro', e.target.value)}
                placeholder="Bairro"
                className="h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Cidade + UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">Cidade <span className="text-red-500">*</span></Label>
              <Input
                value={addr.cidade || ''}
                onChange={(e) => updateAddr('cidade', e.target.value)}
                placeholder="Cidade"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#0A0A0A]/70">UF <span className="text-red-500">*</span></Label>
              <Select value={addr.uf || ''} onValueChange={(v) => updateAddr('uf', v)}>
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {UF_LIST.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <FormFieldError error={fieldError} />
      <FormFieldError error={confirmError} />

      {/* Action buttons */}
      <div className="flex gap-3">
        {hasPrefill && !isEditing && (
          <>
            <Button
              type="button"
              onClick={handleConfirm}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2 h-11 rounded-xl px-6"
            >
              <ShieldCheck className="w-4 h-4" />
              Confirmar endereço
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleEdit}
              className="gap-2 h-11 rounded-xl"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </>
        )}
        {(isEditing || !hasPrefill) && (
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!addr.cep || !addr.logradouro || !addr.numero || !addr.bairro || !addr.cidade || !addr.uf}
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2 h-11 rounded-xl px-6"
          >
            <ShieldCheck className="w-4 h-4" />
            Confirmar endereço
          </Button>
        )}
      </div>
    </div>
  );
}