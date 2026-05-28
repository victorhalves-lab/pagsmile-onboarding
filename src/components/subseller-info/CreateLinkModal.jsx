import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X, Building2, UserPlus, Search, CheckCircle2, Loader2, ArrowLeft, Sparkles
} from 'lucide-react';

function formatCnpj(v = '') {
  const d = String(v).replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const emptyForm = {
  gateway_name: '',
  gateway_cnpj: '',
  gateway_contact_name: '',
  gateway_contact_email: '',
  notes: '',
  merchantId: null,
};

/**
 * CreateLinkModal — modal autocontido para criar link de coleta de subsellers.
 *
 * Não usa Dialog do shadcn (estava quebrado). Overlay próprio com:
 * - 1 só tela
 * - toggle interno entre "cliente existente" e "novo cliente"
 * - bloqueia scroll do body enquanto aberto
 * - fecha com ESC + clicando fora
 */
export default function CreateLinkModal({ open, onClose, onSubmit, isSubmitting }) {
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setMode('existing');
      setSearch('');
      setForm(emptyForm);
    }
  }, [open]);

  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['merchants-pj-aprovados'],
    queryFn: () => base44.entities.Merchant.filter({ type: 'PJ', onboardingStatus: 'Aprovado' }, '-created_date', 500),
    initialData: [],
    enabled: open && mode === 'existing',
  });

  const filteredMerchants = useMemo(() => {
    if (!search.trim()) return merchants;
    const q = search.toLowerCase();
    return merchants.filter(m =>
      (m.companyName || '').toLowerCase().includes(q) ||
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.cpfCnpj || '').includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  }, [merchants, search]);

  const selectMerchant = (m) => {
    setForm({
      gateway_name: m.companyName || m.fullName || '',
      gateway_cnpj: m.cpfCnpj || '',
      gateway_contact_name: m.fullName || '',
      gateway_contact_email: m.email || '',
      notes: '',
      merchantId: m.id,
    });
  };

  const canSubmit = mode === 'existing'
    ? !!form.merchantId && !!form.gateway_name.trim() && !isSubmitting
    : !!form.gateway_name.trim() && form.gateway_cnpj.replace(/\D/g, '').length === 14 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#002443]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-[640px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#002443]/8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#2bc196]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#2bc196]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#002443] truncate">Novo link de coleta</h2>
              <p className="text-[11px] text-[#002443]/50 truncate">Cliente Gateway envia subsellers para sua inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#002443]/40 hover:bg-[#002443]/5 hover:text-[#002443] transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex bg-[#f4f4f4] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { setMode('existing'); setForm(emptyForm); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'existing'
                  ? 'bg-white text-[#002443] shadow-sm'
                  : 'text-[#002443]/50 hover:text-[#002443]/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Cliente já da base
            </button>
            <button
              type="button"
              onClick={() => { setMode('new'); setForm(emptyForm); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'new'
                  ? 'bg-white text-[#002443] shadow-sm'
                  : 'text-[#002443]/50 hover:text-[#002443]/80'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Novo cliente
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {mode === 'existing' ? (
            <ExistingClientPanel
              search={search}
              setSearch={setSearch}
              merchants={filteredMerchants}
              loading={loadingMerchants}
              selectedId={form.merchantId}
              onSelect={selectMerchant}
              totalCount={merchants.length}
            />
          ) : (
            <NewClientPanel form={form} setForm={setForm} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#002443]/8 bg-[#f4f4f4]/40 flex items-center justify-between gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</>
            ) : (
              'Gerar link'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExistingClientPanel({ search, setSearch, merchants, loading, selectedId, onSelect, totalCount }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#002443]/40 pointer-events-none" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou email..."
          className="pl-9"
        />
      </div>

      <div className="border border-[#002443]/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2bc196] mx-auto" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-8 h-8 text-[#002443]/15 mx-auto mb-2" />
            <p className="text-xs text-[#002443]/50">
              {totalCount === 0
                ? 'Nenhum cliente PJ aprovado na base ainda.'
                : 'Nenhum resultado para a busca.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#002443]/5 max-h-[320px] overflow-y-auto">
            {merchants.slice(0, 100).map(m => {
              const selected = selectedId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m)}
                  className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                    selected ? 'bg-[#2bc196]/10' : 'hover:bg-[#002443]/3'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-[#2bc196] text-white' : 'bg-[#002443]/5 text-[#002443]/60'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#002443] truncate">
                      {m.companyName || m.fullName}
                    </div>
                    <div className="text-[11px] text-[#002443]/50 truncate">
                      {m.cpfCnpj ? formatCnpj(m.cpfCnpj) : '—'}{m.email && ` · ${m.email}`}
                    </div>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-[#2bc196] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {merchants.length > 100 && (
        <p className="text-[10px] text-[#002443]/40 text-center">
          Mostrando 100 resultados — refine a busca para ver outros.
        </p>
      )}
    </div>
  );
}

function NewClientPanel({ form, setForm }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-[#002443]">Nome do Gateway *</Label>
        <Input
          autoFocus
          value={form.gateway_name}
          onChange={(e) => setForm({ ...form, gateway_name: e.target.value })}
          placeholder="Ex: Gateway XYZ"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-[#002443]">CNPJ *</Label>
        <Input
          value={formatCnpj(form.gateway_cnpj)}
          onChange={(e) => setForm({ ...form, gateway_cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-[#002443]">Contato (nome)</Label>
          <Input
            value={form.gateway_contact_name}
            onChange={(e) => setForm({ ...form, gateway_contact_name: e.target.value })}
            placeholder="João Silva"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#002443]">Contato (email)</Label>
          <Input
            type="email"
            value={form.gateway_contact_email}
            onChange={(e) => setForm({ ...form, gateway_contact_email: e.target.value })}
            placeholder="contato@gateway.com"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-[#002443]">Notas internas</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Opcional — só você verá."
          className="mt-1 h-20"
        />
      </div>
    </div>
  );
}