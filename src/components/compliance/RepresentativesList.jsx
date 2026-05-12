import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Users, Mail, Phone, Copy, CheckCircle2, Loader2, Info, Send } from 'lucide-react';
import { toast } from 'sonner';
import { callPublicFunction } from '@/lib/publicApi';

/**
 * RepresentativesList — componente OPT-IN do fluxo de compliance.
 *
 * Pergunta "Tem mais de um representante legal?" → se SIM, lista dinâmica.
 * Tenta pré-popular com dados QSA da BDC (`bdcSocios` recebido por prop).
 *
 * Props:
 *   - value: { hasMultiple: boolean, list: [{nome, cpf, email, phone, cargo}] }
 *   - onChange: (newValue) => void
 *   - bdcSocios?: Array de sócios já enriquecidos pela BDC (auto-fill)
 *   - caseId?: id do caso (para gerar links CAF — só aparece quando há lista)
 *   - docLinkToken?: token do caso (necessário para gerar links públicos)
 *   - hasBranding?: boolean
 */
export default function RepresentativesList({ value, onChange, bdcSocios = [], caseId, docLinkToken, hasBranding = false }) {
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState([]);

  const state = value || { hasMultiple: null, list: [] };

  // Auto-popular com BDC quando user diz "Sim" pela primeira vez e BDC tem dados
  useEffect(() => {
    if (state.hasMultiple === true && state.list.length === 0 && bdcSocios.length > 1) {
      const seeded = bdcSocios.slice(1, 6).map(s => ({
        nome: s.nome || '',
        cpf: s.cpf || '',
        email: s.email || '',
        phone: s.phone || s.telefone || '',
        cargo: s.cargo || 'Sócio',
        _autoFilled: true,
      }));
      onChange({ ...state, list: seeded });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasMultiple, bdcSocios.length]);

  const setHasMultiple = (val) => {
    onChange({ ...state, hasMultiple: val, list: val ? state.list : [] });
  };

  const addRepresentative = () => {
    const newRep = { nome: '', cpf: '', email: '', phone: '', cargo: '' };
    onChange({ ...state, list: [...state.list, newRep] });
  };

  const updateRep = (idx, field, val) => {
    const newList = [...state.list];
    newList[idx] = { ...newList[idx], [field]: val, _autoFilled: false };
    onChange({ ...state, list: newList });
  };

  const removeRep = (idx) => {
    onChange({ ...state, list: state.list.filter((_, i) => i !== idx) });
  };

  const formatCpf = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (val) => {
    const d = (val || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const canGenerateLinks = caseId && docLinkToken && state.list.length > 0
    && state.list.every(r => (r.cpf || '').replace(/\D/g, '').length === 11 && (r.nome || '').trim().length >= 3);

  const handleGenerateLinks = async () => {
    if (!canGenerateLinks) {
      toast.error('Preencha CPF e Nome de todos os representantes antes de gerar os links.');
      return;
    }
    setGeneratingLinks(true);
    try {
      const res = await callPublicFunction('generateMultiCafLinks', {
        caseId,
        docLinkToken,
        baseUrl: window.location.origin,
        representatives: state.list.map(r => ({
          cpf: (r.cpf || '').replace(/\D/g, ''),
          nome: r.nome,
          email: r.email,
          phone: r.phone,
          cargo: r.cargo,
        })),
      });
      if (res?.success && Array.isArray(res.links)) {
        setGeneratedLinks(res.links);
        toast.success(`${res.links.length} link(s) CAF gerado(s) com sucesso!`);
      } else {
        toast.error(res?.error || 'Não foi possível gerar os links');
      }
    } catch (err) {
      toast.error('Erro ao gerar links: ' + (err.message || 'desconhecido'));
    }
    setGeneratingLinks(false);
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-5">
      {/* Pergunta 1: tem mais de um? */}
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-[#002443]">
          Existe mais de um representante legal nesta empresa?
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <p className="text-xs text-[#002443]/60">
          Inclua sócios, administradores ou procuradores que tenham poderes para representar legalmente a empresa.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={state.hasMultiple === true ? 'default' : 'outline'}
            onClick={() => setHasMultiple(true)}
            className={`flex-1 h-11 font-semibold ${state.hasMultiple === true ? 'brand-select-active bg-[#2bc196] hover:bg-[#2bc196]/90 text-white border-[#2bc196]' : 'brand-select-hover hover:border-[#2bc196] hover:text-[#2bc196]'}`}
          >
            Sim
          </Button>
          <Button
            type="button"
            variant={state.hasMultiple === false ? 'default' : 'outline'}
            onClick={() => setHasMultiple(false)}
            className={`flex-1 h-11 font-semibold ${state.hasMultiple === false ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'hover:border-red-400 hover:text-red-500'}`}
          >
            Não
          </Button>
        </div>
      </div>

      {/* Lista (somente se Sim) */}
      {state.hasMultiple === true && (
        <div className="space-y-4 p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-semibold text-emerald-800">
                Representantes adicionais ({state.list.length})
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRepresentative}
              className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
          </div>

          {bdcSocios.length > 1 && state.list.some(r => r._autoFilled) && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Pré-preenchemos os representantes com base nos sócios oficiais do QSA da Receita Federal (via BigDataCorp).
                Confirme/edite os dados de contato.
              </p>
            </div>
          )}

          {state.list.length === 0 && (
            <p className="text-xs text-[#002443]/50 italic text-center py-2">
              Clique em "Adicionar" para incluir os representantes legais.
            </p>
          )}

          {state.list.map((rep, idx) => (
            <div key={idx} className="bg-white border border-emerald-200/60 rounded-xl p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Representante #{idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRep(idx)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#002443]/70">Nome completo *</Label>
                  <Input
                    value={rep.nome || ''}
                    onChange={(e) => updateRep(idx, 'nome', e.target.value)}
                    placeholder="Nome do representante"
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#002443]/70">CPF *</Label>
                  <Input
                    value={formatCpf(rep.cpf || '')}
                    onChange={(e) => updateRep(idx, 'cpf', e.target.value.replace(/\D/g, ''))}
                    placeholder="000.000.000-00"
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#002443]/70">E-mail</Label>
                  <Input
                    type="email"
                    value={rep.email || ''}
                    onChange={(e) => updateRep(idx, 'email', e.target.value)}
                    placeholder="email@empresa.com"
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#002443]/70">Telefone</Label>
                  <Input
                    value={formatPhone(rep.phone || '')}
                    onChange={(e) => updateRep(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="(11) 99999-9999"
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-[#002443]/70">Cargo / Função</Label>
                  <Input
                    value={rep.cargo || ''}
                    onChange={(e) => updateRep(idx, 'cargo', e.target.value)}
                    placeholder="Ex: Sócio-Administrador, Diretor, Procurador"
                    className="h-10 text-sm mt-1"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Bloco de geração de links CAF */}
          {state.list.length > 0 && caseId && docLinkToken && (
            <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#002443]/80 leading-relaxed">
                  <strong>Atenção:</strong> todos os representantes legais precisam concluir a verificação CAF (selfie + documento).
                  Você pode gerar um link individual para cada um e enviar por WhatsApp, email ou qualquer canal.
                </p>
              </div>

              {generatedLinks.length === 0 ? (
                <Button
                  type="button"
                  onClick={handleGenerateLinks}
                  disabled={!canGenerateLinks || generatingLinks}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl"
                >
                  {generatingLinks ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando links...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Gerar links CAF para todos</>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  {generatedLinks.map((link, idx) => (
                    <div key={idx} className="bg-white border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#002443]">
                          {link.nome} {link.cpf && `— ${formatCpf(link.cpf)}`}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={link.url}
                          className="h-9 text-xs bg-slate-50 font-mono"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => copyLink(link.url)}
                          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {link.email && (
                        <p className="text-[10px] text-[#002443]/50 mt-1.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Envie para: {link.email}
                        </p>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateLinks}
                    disabled={generatingLinks}
                    className="w-full h-9 text-xs"
                  >
                    {generatingLinks ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Atualizando...</>
                    ) : (
                      'Regenerar links'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}