import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, Building2, Plus, X, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCnpj } from '@/hooks/useCnpjAutocomplete';

function validarCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  let soma = 0;
  const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 12; i++) soma += parseInt(digits[i]) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(digits[12]) !== d1) return false;
  soma = 0;
  const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 13; i++) soma += parseInt(digits[i]) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(digits[13]) !== d2) return false;
  return true;
}

export default function Top5CnpjField({
  value = [],
  onChange,
  questionId,
  label = 'Top 5 Maiores Clientes',
  maxItems = 5,
  checkAnexoI = false
}) {
  const [items, setItems] = useState(value.length > 0 ? value : [{ cnpj: '', nome: '', ramo: '', status: 'empty' }]);
  const [loadingIdx, setLoadingIdx] = useState(null);

  const updateItems = useCallback((newItems) => {
    setItems(newItems);
    onChange(questionId, newItems);
  }, [onChange, questionId]);

  const handleCnpjChange = useCallback(async (idx, rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 14);
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], cnpj: digits, status: digits.length < 14 ? 'empty' : 'loading' };
    setItems(newItems);

    if (digits.length === 14 && validarCnpj(digits)) {
      setLoadingIdx(idx);
      const res = await base44.functions.invoke('brasilApiCnpj', { cnpj: digits });
      setLoadingIdx(null);

      if (res.data?.error) {
        newItems[idx] = { ...newItems[idx], status: 'error', error: res.data.error };
      } else {
        const d = res.data;
        const isActive = d.situacao_cadastral === 2;
        const itemData = {
          cnpj: digits,
          nome: d.razao_social || '',
          ramo: d.cnae_fiscal_descricao || '',
          porte: d.porte,
          capitalSocial: d.capital_social,
          idadeEmpresa: d.idade_empresa_anos,
          qsa: d.qsa || [],
          isActive,
          situacao: d.descricao_situacao_cadastral,
          cnaeFiscal: d.cnae_fiscal,
          anexoI: d.anexo_i || null,
          setorRegulado: d.setor_regulado || null,
          status: isActive ? 'ok' : 'inactive'
        };
        if (checkAnexoI && d.anexo_i) {
          if (d.anexo_i.proibido) {
            itemData.status = 'blocked';
            itemData.blockReason = `Atividade PROIBIDA (Anexo I): ${d.anexo_i.descricao || d.cnae_fiscal_descricao}`;
          } else if (d.anexo_i.restrito) {
            itemData.restrictedFlag = `Atividade RESTRITA: ${d.anexo_i.descricao || d.cnae_fiscal_descricao}`;
          }
        }
        newItems[idx] = itemData;
      }
      updateItems([...newItems]);
    }
  }, [items, updateItems]);

  const addItem = () => {
    if (items.length < maxItems) {
      updateItems([...items, { cnpj: '', nome: '', ramo: '', status: 'empty' }]);
    }
  };

  const removeItem = (idx) => {
    if (items.length > 1) {
      updateItems(items.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-[#002443]">{label}</Label>
      
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#002443]/50 w-5">#{idx + 1}</span>
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
              <Input
                value={formatCnpj(item.cnpj || '')}
                onChange={(e) => handleCnpjChange(idx, e.target.value)}
                placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)"
                className="h-10 pl-10 pr-10 font-mono text-sm"
                maxLength={18}
              />
              {loadingIdx === idx && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
              {item.status === 'ok' && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
              {item.status === 'inactive' && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
            </div>
            {items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                <X className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
          
          {item.status === 'ok' && (
            <div className="space-y-1.5 ml-7">
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" /> {item.nome}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{item.ramo}</Badge>
                {item.porte && <Badge variant="outline" className="text-[10px]">{item.porte}</Badge>}
              </div>
              {item.restrictedFlag && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Shield className="w-3 h-3 flex-shrink-0" /> {item.restrictedFlag}
                  </p>
                </div>
              )}
            </div>
          )}
          {item.status === 'blocked' && (
            <div className="ml-7 space-y-1.5">
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-red-50 text-red-700 text-[10px]">{item.nome}</Badge>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3 flex-shrink-0" /> {item.blockReason}
                </p>
              </div>
            </div>
          )}
          {item.status === 'inactive' && (
            <div className="ml-7 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                CNPJ com situação "{item.situacao}" — {item.nome}
              </p>
            </div>
          )}
          {item.status === 'error' && (
            <p className="ml-7 text-xs text-red-600">{item.error}</p>
          )}
        </div>
      ))}
      
      {items.length < maxItems && (
        <Button variant="outline" size="sm" onClick={addItem} className="text-xs gap-1">
          <Plus className="w-3 h-3" /> Adicionar CNPJ
        </Button>
      )}
    </div>
  );
}