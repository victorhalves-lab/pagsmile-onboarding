import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Building2, CheckCircle, AlertTriangle, Loader2, XCircle,
  MapPin, ShieldCheck, Pencil, User, Mail, Phone, Globe
} from 'lucide-react';
import useCnpjAutocomplete, { formatCnpj } from '@/hooks/useCnpjAutocomplete';

const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

function formatCep(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5);
  return digits;
}

async function fetchCep(cep) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return { logradouro: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', uf: data.uf || '' };
}

export default function FechamentoCompanyForm({ formData, setFormData, onSubmit, isSubmitting }) {
  const { data: cnpjData, isLoading: cnpjLoading, error: cnpjError, validationError, consultarCnpj, reset } = useCnpjAutocomplete();
  const [cnpjDisplay, setCnpjDisplay] = useState('');
  const [hasConsulted, setHasConsulted] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [cepDisplay, setCepDisplay] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const update = useCallback((key, val) => setFormData(prev => ({ ...prev, [key]: val })), [setFormData]);

  const handleCnpjChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    setCnpjDisplay(formatCnpj(raw));
    update('cnpj', raw);
    if (raw.length < 14 && hasConsulted) { reset(); setHasConsulted(false); setAddressConfirmed(false); }
    if (raw.length === 14) {
      consultarCnpj(raw).then(result => {
        setHasConsulted(true);
        if (!result) return;
        update('razaoSocial', result.razao_social || '');
        update('nomeFantasia', result.nome_fantasia || '');
        if (result.site_sugerido) update('website', result.site_sugerido);
        if (result.endereco) {
          const e = result.endereco;
          update('endereco', { cep: e.cep || '', logradouro: e.logradouro || '', numero: e.numero || '', complemento: e.complemento || '', bairro: e.bairro || '', cidade: e.municipio || '', uf: e.uf || '' });
          setCepDisplay(formatCep(e.cep || ''));
          setAddressConfirmed(false);
          setEditingAddress(false);
        }
      });
    }
  }, [update, hasConsulted, reset, consultarCnpj]);

  const addr = formData.endereco || {};
  const updateAddr = useCallback((key, val) => {
    update('endereco', { ...addr, [key]: val });
  }, [addr, update]);

  const handleCepChange = useCallback(async (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setCepDisplay(formatCep(digits));
    updateAddr('cep', digits);
    if (digits.length !== 8) return;
    setCepLoading(true);
    const result = await fetchCep(digits).catch(() => null);
    setCepLoading(false);
    if (result) {
      update('endereco', { ...(formData.endereco || {}), cep: digits, logradouro: result.logradouro, bairro: result.bairro, cidade: result.cidade, uf: result.uf });
    }
  }, [formData.endereco, update, updateAddr]);

  const isActive = cnpjData?.situacao_cadastral === 2;
  const isInactive = cnpjData && cnpjData.situacao_cadastral !== 2;
  const hasPrefillAddr = !!(addr.cep || addr.logradouro);

  const canSubmit = formData.cnpj?.length === 14 && formData.razaoSocial && formData.contactName && formData.email && addressConfirmed;

  return (
    <div className="space-y-6">
      {/* CNPJ */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#002443]/40" />
          <Label className="text-sm font-semibold text-[#002443]">CNPJ <span className="text-red-500">*</span></Label>
          {isActive && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1"><CheckCircle className="w-3 h-3" />Ativo na RF</Badge>}
          {isInactive && <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1"><XCircle className="w-3 h-3" />{cnpjData.descricao_situacao_cadastral}</Badge>}
        </div>
        <div className="relative">
          <Input value={cnpjDisplay} onChange={handleCnpjChange} placeholder="XX.XXX.XXX/XXXX-XX" className={`h-12 rounded-xl font-mono text-base tracking-wide ${isActive ? 'border-emerald-400 ring-1 ring-emerald-200' : isInactive ? 'border-red-400 ring-1 ring-red-300' : ''}`} maxLength={18} />
          {cnpjLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
        </div>
        {validationError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{validationError}</p>}
        {cnpjError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{cnpjError}</p>}
        {isActive && <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl"><p className="text-xs font-semibold text-emerald-800">{cnpjData.razao_social}</p>{cnpjData.nome_fantasia && <p className="text-xs text-emerald-700">Fantasia: {cnpjData.nome_fantasia}</p>}<p className="text-xs text-emerald-600">{cnpjData.cnae_fiscal_descricao}</p></div>}
        {isInactive && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-xs text-amber-800 font-medium">CNPJ com situação "{cnpjData.descricao_situacao_cadastral}". Você pode continuar, mas a análise pode ser impactada.</p></div>}
      </div>

      {/* Razão Social + Nome Fantasia */}
      {hasConsulted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">Razão Social <span className="text-red-500">*</span></Label>
            <Input value={formData.razaoSocial || ''} onChange={e => update('razaoSocial', e.target.value)} className="h-11 rounded-xl text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">Nome Fantasia</Label>
            <Input value={formData.nomeFantasia || ''} onChange={e => update('nomeFantasia', e.target.value)} className="h-11 rounded-xl text-sm" />
          </div>
        </div>
      )}

      {/* Endereço */}
      {hasPrefillAddr && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#002443]/40" />
            <Label className="text-sm font-semibold text-[#002443]">Endereço <span className="text-red-500">*</span></Label>
            {addressConfirmed && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1"><ShieldCheck className="w-3 h-3" />Confirmado</Badge>}
            {!addressConfirmed && !editingAddress && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] gap-1"><CheckCircle className="w-3 h-3" />Via CNPJ</Badge>}
          </div>

          {addressConfirmed && !editingAddress ? (
            <div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <p className="text-sm font-medium text-[#002443]">{addr.logradouro}{addr.numero ? `, ${addr.numero}` : ''}{addr.complemento ? ` - ${addr.complemento}` : ''}</p>
                <p className="text-sm text-[#002443]/70">{addr.bairro} — {addr.cidade}/{addr.uf}</p>
                <p className="text-xs text-[#002443]/50">CEP: {formatCep(addr.cep)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => { setEditingAddress(true); setAddressConfirmed(false); }} className="text-xs gap-1 mt-2"><Pencil className="w-3 h-3" />Alterar</Button>
            </div>
          ) : !editingAddress ? (
            <div>
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <p className="font-semibold mb-1">Endereço encontrado na Receita Federal:</p>
                <p>{addr.logradouro}{addr.numero ? `, ${addr.numero}` : ''} — {addr.bairro}, {addr.cidade}/{addr.uf} — CEP {formatCep(addr.cep)}</p>
                <p className="mt-2 text-blue-600">Se estiver correto, clique em "Confirmar". Caso precise alterar, clique em "Editar".</p>
              </div>
              <div className="flex gap-3 mt-3">
                <Button type="button" onClick={() => setAddressConfirmed(true)} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 h-10 rounded-xl px-5 text-sm"><ShieldCheck className="w-4 h-4" />Confirmar endereço</Button>
                <Button type="button" variant="outline" onClick={() => setEditingAddress(true)} className="gap-2 h-10 rounded-xl text-sm"><Pencil className="w-4 h-4" />Editar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-[#f4f4f4] rounded-xl border border-[#002443]/[0.06]">
              <p className="text-xs text-[#002443]/60">Digite o novo CEP ou edite manualmente.</p>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#002443]/70">CEP <span className="text-red-500">*</span></Label>
                <div className="relative w-48">
                  <Input value={cepDisplay} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className="h-10 rounded-xl font-mono text-sm" maxLength={9} />
                  {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1"><Label className="text-xs font-medium text-[#002443]/70">Logradouro *</Label><Input value={addr.logradouro || ''} onChange={e => updateAddr('logradouro', e.target.value)} className="h-10 rounded-xl text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs font-medium text-[#002443]/70">Número *</Label><Input value={addr.numero || ''} onChange={e => updateAddr('numero', e.target.value)} className="h-10 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-medium text-[#002443]/70">Complemento</Label><Input value={addr.complemento || ''} onChange={e => updateAddr('complemento', e.target.value)} className="h-10 rounded-xl text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs font-medium text-[#002443]/70">Bairro *</Label><Input value={addr.bairro || ''} onChange={e => updateAddr('bairro', e.target.value)} className="h-10 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1"><Label className="text-xs font-medium text-[#002443]/70">Cidade *</Label><Input value={addr.cidade || ''} onChange={e => updateAddr('cidade', e.target.value)} className="h-10 rounded-xl text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs font-medium text-[#002443]/70">UF *</Label>
                  <Select value={addr.uf || ''} onValueChange={v => updateAddr('uf', v)}>
                    <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="button" onClick={() => { setAddressConfirmed(true); setEditingAddress(false); }} disabled={!addr.cep || !addr.logradouro || !addr.cidade || !addr.uf} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 h-10 rounded-xl px-5 text-sm"><ShieldCheck className="w-4 h-4" />Confirmar endereço</Button>
            </div>
          )}
        </div>
      )}

      {/* Contato */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#002443] flex items-center gap-2"><User className="w-4 h-4 text-[#002443]/40" />Dados de Contato</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">Nome do Responsável <span className="text-red-500">*</span></Label>
            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" /><Input value={formData.contactName || ''} onChange={e => update('contactName', e.target.value)} placeholder="Seu nome completo" className="h-11 rounded-xl text-sm pl-10" /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">E-mail Corporativo <span className="text-red-500">*</span></Label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" /><Input type="email" value={formData.email || ''} onChange={e => update('email', e.target.value)} placeholder="contato@empresa.com" className="h-11 rounded-xl text-sm pl-10" /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">Telefone / WhatsApp <span className="text-red-500">*</span></Label>
            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" /><Input value={formData.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-9999" className="h-11 rounded-xl text-sm pl-10" /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#002443]/70">Website <span className="text-[#002443]/40">(opcional)</span></Label>
            <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" /><Input value={formData.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://www.suaempresa.com" className="h-11 rounded-xl text-sm pl-10" /></div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl text-base font-bold shadow-lg shadow-[#2bc196]/20 hover:scale-[1.01] transition-all gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
        {isSubmitting ? 'Processando...' : 'Avançar para Compliance →'}
      </Button>
      {!canSubmit && !isSubmitting && (
        <p className="text-xs text-center text-[#002443]/40">Preencha todos os campos obrigatórios e confirme o endereço para continuar.</p>
      )}
    </div>
  );
}