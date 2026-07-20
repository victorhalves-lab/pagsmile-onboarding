import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, Building2, Plus, X, Shield, ShieldAlert } from 'lucide-react';
// SDK-FREE for public routes.
import { callPublicFunction } from '@/lib/publicApi';
import { formatCnpj } from '@/hooks/useCnpjAutocomplete';

// CNAEs proibidos (Anexo I Pin Bank)
const ATIVIDADES_PROIBIDAS_CNAES = ['9200301', '9200302'];
const ATIVIDADES_RESTRITAS_CNAES = ['9200301', '9200302', '9200399', '6619302', '6622300', '4789004', '4723700', '1220401', '1220402', '4774100'];

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
      let body = null;
      try {
        body = await callPublicFunction('brasilApiCnpj', { cnpj: digits });
      } catch (e) {
        newItems[idx] = { ...newItems[idx], status: 'error', error: 'Falha ao consultar CNPJ.' };
        setLoadingIdx(null);
        updateItems([...newItems]);
        return;
      }
      setLoadingIdx(null);

      const payload = body?.data ?? body;
      if (payload?.error) {
        newItems[idx] = { ...newItems[idx], status: 'error', error: payload.error };
      } else {
        const d = payload;
        const isActive = d.situacao_cadastral === 2;
        const cnaeFiscalStr = String(d.cnae_fiscal || '');
        const allCnaes = [cnaeFiscalStr, ...(d.cnaes_secundarios || []).map(c => String(c.codigo))];
        const isProibido = allCnaes.some(c => ATIVIDADES_PROIBIDAS_CNAES.includes(c));
        const isRestrito = allCnaes.some(c => ATIVIDADES_RESTRITAS_CNAES.includes(c));
        
        newItems[idx] = {
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
          isProibido,
          isRestrito,
          status: isActive ? 'ok' : 'inactive'
        };
        
        // Background screening (CEIS/CNEP) — non-blocking
        callPublicFunction('sanctionsScreening', { action: 'screenCnpj', cnpj: digits }).then(body2 => {
          const p2 = body2?.data ?? body2;
          if (p2?.hasFlags) {
            setItems(prev => {
              const updated = [...prev];
              if (updated[idx]) {
                updated[idx] = { ...updated[idx], screeningFlags: p2.flags };
              }
              return updated;
            });
          }
        }).catch(() => {});
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
      <Label className="text-sm font-semibold text-[#0A0A0A]">{label}</Label>
      
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0A0A0A]/50 w-5">#{idx + 1}</span>
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
              <Input
                value={formatCnpj(item.cnpj || '')}
                onChange={(e) => handleCnpjChange(idx, e.target.value)}
                placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)"
                className="h-10 pl-10 pr-10 font-mono text-sm"
                maxLength={18}
              />
              {loadingIdx === idx && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#1356E2]" />}
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
                {item.isProibido && (
                  <Badge className="bg-red-100 text-red-800 text-[10px]">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Atividade Proibida (Anexo I)
                  </Badge>
                )}
                {item.isRestrito && !item.isProibido && (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Atividade Restrita
                  </Badge>
                )}
              </div>
              {item.screeningFlags && item.screeningFlags.length > 0 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  {item.screeningFlags.map((flag, fi) => (
                    <p key={fi} className="text-xs text-red-700 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 flex-shrink-0" /> {flag}
                    </p>
                  ))}
                </div>
              )}
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