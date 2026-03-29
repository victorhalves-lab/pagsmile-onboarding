import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pencil, MapPin, Loader2, Search } from 'lucide-react';

/**
 * ETAPA 2b — Confirmação de Endereço
 * Mostra endereço retornado do CNPJ. O lead deve confirmar ou editar via CEP (ViaCEP).
 */
export default function StepEndereco({ form, updateField, cnpjData }) {
  const [editMode, setEditMode] = useState(false);
  const [confirmed, setConfirmed] = useState(form._enderecoConfirmado || false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(null);

  const endereco = cnpjData?.endereco || {};
  const hasAddress = endereco.logradouro || endereco.municipio;

  // Endereço do formulário ou do CNPJ
  const displayEndereco = {
    cep: form.enderecoCep || endereco.cep || '',
    logradouro: form.enderecoLogradouro || endereco.logradouro || '',
    numero: form.enderecoNumero || endereco.numero || '',
    complemento: form.enderecoComplemento || endereco.complemento || '',
    bairro: form.enderecoBairro || endereco.bairro || '',
    municipio: form.enderecoMunicipio || endereco.municipio || '',
    uf: form.enderecoUf || endereco.uf || '',
  };

  const formatCep = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepLookup = async (cepRaw) => {
    const digits = cepRaw.replace(/\D/g, '');
    if (digits.length < 8) return;

    setCepLoading(true);
    setCepError(null);

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: AbortSignal.timeout(5000)
      });
      const data = await resp.json();
      if (data.erro) {
        setCepError('CEP não encontrado');
        setCepLoading(false);
        return;
      }
      updateField('enderecoCep', digits);
      updateField('enderecoLogradouro', data.logradouro || '');
      updateField('enderecoBairro', data.bairro || '');
      updateField('enderecoMunicipio', data.localidade || '');
      updateField('enderecoUf', data.uf || '');
      updateField('enderecoComplemento', data.complemento || '');
    } catch {
      setCepError('Erro ao consultar CEP. Tente novamente.');
    }
    setCepLoading(false);
  };

  const handleConfirm = () => {
    // Salvar endereço confirmado no form
    updateField('enderecoCep', displayEndereco.cep);
    updateField('enderecoLogradouro', displayEndereco.logradouro);
    updateField('enderecoNumero', displayEndereco.numero);
    updateField('enderecoComplemento', displayEndereco.complemento);
    updateField('enderecoBairro', displayEndereco.bairro);
    updateField('enderecoMunicipio', displayEndereco.municipio);
    updateField('enderecoUf', displayEndereco.uf);
    updateField('_enderecoConfirmado', true);
    setConfirmed(true);
    setEditMode(false);
  };

  const handleEdit = () => {
    setConfirmed(false);
    setEditMode(true);
    updateField('_enderecoConfirmado', false);
  };

  const formatEnderecoLine = () => {
    const parts = [];
    if (displayEndereco.logradouro) parts.push(displayEndereco.logradouro);
    if (displayEndereco.numero) parts.push(displayEndereco.numero);
    if (displayEndereco.complemento) parts.push(displayEndereco.complemento);
    return parts.join(', ');
  };

  const formatCidadeLine = () => {
    const parts = [];
    if (displayEndereco.bairro) parts.push(displayEndereco.bairro);
    if (displayEndereco.municipio) parts.push(displayEndereco.municipio);
    if (displayEndereco.uf) parts.push(displayEndereco.uf);
    return parts.join(' — ');
  };

  if (!hasAddress && !editMode) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#002443]">Endereço da Empresa</h2>
          <p className="text-xs text-[#002443]/50 mt-1">Não foi possível obter o endereço automaticamente.</p>
        </div>
        <Button onClick={() => setEditMode(true)} className="bg-[#002443] text-white rounded-xl gap-2">
          <MapPin className="w-4 h-4" /> Informar endereço manualmente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Endereço da Empresa</h2>
        <p className="text-xs text-[#002443]/50 mt-1">
          {editMode ? 'Informe o CEP para buscar o endereço correto' : 'Confirme se o endereço abaixo está correto'}
        </p>
      </div>

      {!editMode ? (
        /* ── Modo Visualização: mostrar endereço e pedir confirmação ── */
        <div className="space-y-4">
          <div className={`rounded-xl border-2 p-5 transition-all ${
            confirmed ? 'border-[#2bc196] bg-[#2bc196]/5' : 'border-[#002443]/10 bg-[#f4f4f4]'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmed ? 'bg-[#2bc196]/20' : 'bg-[#002443]/5'
              }`}>
                <MapPin className={`w-5 h-5 ${confirmed ? 'text-[#2bc196]' : 'text-[#002443]/40'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#002443]">{formatEnderecoLine() || 'Endereço não disponível'}</p>
                <p className="text-sm text-[#002443]/60 mt-0.5">{formatCidadeLine()}</p>
                {displayEndereco.cep && (
                  <p className="text-xs text-[#002443]/40 mt-1 font-mono">CEP: {formatCep(displayEndereco.cep)}</p>
                )}
              </div>
              {confirmed && <CheckCircle className="w-6 h-6 text-[#2bc196] shrink-0" />}
            </div>
          </div>

          <div className="flex gap-3">
            {!confirmed ? (
              <>
                <Button onClick={handleConfirm} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl gap-2 flex-1">
                  <CheckCircle className="w-4 h-4" /> Confirmar Endereço
                </Button>
                <Button onClick={handleEdit} variant="outline" className="rounded-xl gap-2 flex-1">
                  <Pencil className="w-4 h-4" /> Editar Endereço
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit} variant="outline" className="rounded-xl gap-2">
                <Pencil className="w-4 h-4" /> Alterar Endereço
              </Button>
            )}
          </div>
          {confirmed && (
            <p className="text-[10px] text-[#2bc196] font-medium">✓ Endereço confirmado</p>
          )}
        </div>
      ) : (
        /* ── Modo Edição: CEP + Autocomplete ViaCEP ── */
        <div className="space-y-4">
          {/* CEP */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#002443]">CEP *</label>
            <div className="flex gap-2">
              <Input
                value={formatCep(form.enderecoCep || '')}
                onChange={(e) => {
                  const formatted = formatCep(e.target.value);
                  updateField('enderecoCep', formatted.replace(/\D/g, ''));
                  const digits = formatted.replace(/\D/g, '');
                  if (digits.length === 8) handleCepLookup(digits);
                }}
                placeholder="00000-000"
                className="h-12 rounded-xl font-mono flex-1"
                maxLength={9}
              />
              <Button
                type="button"
                onClick={() => handleCepLookup(form.enderecoCep || '')}
                disabled={cepLoading || (form.enderecoCep || '').replace(/\D/g, '').length < 8}
                variant="outline"
                className="h-12 rounded-xl px-4"
              >
                {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {cepError && <p className="text-xs text-red-500">{cepError}</p>}
          </div>

          {/* Logradouro */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#002443]">Logradouro</label>
            <Input
              value={form.enderecoLogradouro || ''}
              onChange={(e) => updateField('enderecoLogradouro', e.target.value)}
              placeholder="Rua, Avenida, etc."
              className="h-12 rounded-xl"
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#002443]">Número</label>
              <Input
                value={form.enderecoNumero || ''}
                onChange={(e) => updateField('enderecoNumero', e.target.value)}
                placeholder="Nº"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#002443]">Complemento</label>
              <Input
                value={form.enderecoComplemento || ''}
                onChange={(e) => updateField('enderecoComplemento', e.target.value)}
                placeholder="Sala, Andar..."
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#002443]">Bairro</label>
            <Input
              value={form.enderecoBairro || ''}
              onChange={(e) => updateField('enderecoBairro', e.target.value)}
              placeholder="Bairro"
              className="h-12 rounded-xl"
            />
          </div>

          {/* Cidade + UF */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-semibold text-[#002443]">Cidade</label>
              <Input
                value={form.enderecoMunicipio || ''}
                onChange={(e) => updateField('enderecoMunicipio', e.target.value)}
                placeholder="Cidade"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#002443]">UF</label>
              <Input
                value={form.enderecoUf || ''}
                onChange={(e) => updateField('enderecoUf', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                className="h-12 rounded-xl"
                maxLength={2}
              />
            </div>
          </div>

          {/* Botão confirmar */}
          <Button onClick={handleConfirm} className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl gap-2 h-12">
            <CheckCircle className="w-4 h-4" /> Confirmar Endereço
          </Button>
        </div>
      )}
    </div>
  );
}