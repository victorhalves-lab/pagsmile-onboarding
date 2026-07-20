import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, Building2, User, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal para buscar e puxar um Merchant existente para um card de subseller.
 * Lista Merchants aprovados/em análise, filtrados por busca, e chama o backend
 * `pullMerchantToSubseller` para retornar os campos + documentos prontos.
 */
export default function PullMerchantModal({ open, onClose, onPull }) {
  const [search, setSearch] = useState('');
  const [pullingId, setPullingId] = useState(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lista merchants — limita a últimos 200, filtra client-side
  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ['merchantsForPull'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 200),
    enabled: open,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return merchants;
    return merchants.filter(m => {
      const hay = [m.fullName, m.companyName, m.cpfCnpj, m.email]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [merchants, search]);

  const handlePull = async (merchant) => {
    setPullingId(merchant.id);
    try {
      const res = await base44.functions.invoke('pullMerchantToSubseller', { merchantId: merchant.id });
      if (res.data?.ok) {
        const warnings = res.data.warnings || [];
        if (warnings.length > 0) {
          toast.warning(`Cliente puxado com ${warnings.length} aviso(s).`, {
            description: warnings.slice(0, 2).join(' • '),
          });
        } else {
          toast.success('Cliente puxado!', {
            description: `${res.data.subseller.documents?.length || 0} documento(s) importado(s).`,
          });
        }
        onPull(res.data.subseller);
        onClose();
      } else {
        toast.error(res.data?.error || 'Erro ao puxar cliente.');
      }
    } catch (e) {
      toast.error(e?.message || 'Erro ao puxar cliente.');
    } finally {
      setPullingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#0A0A0A]/8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1356E2]/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-[#1356E2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0A0A0A] truncate">Puxar cliente existente</h2>
              <p className="text-[11px] text-[#0A0A0A]/50 truncate">
                Pré-preenche os dados e documentos já coletados na plataforma.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0A0A0A]/40 hover:bg-[#0A0A0A]/5 hover:text-[#0A0A0A] transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#0A0A0A]/8 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CNPJ/CPF ou email..."
              className="pl-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#0A0A0A]/50">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <ul className="divide-y divide-[#0A0A0A]/5">
              {filtered.map(m => {
                const isPJ = m.type === 'PJ';
                const isPulling = pullingId === m.id;
                return (
                  <li
                    key={m.id}
                    className="px-6 py-3 flex items-center gap-3 hover:bg-[#f4f4f4]/60 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPJ ? 'bg-[#1356E2]/10 text-[#1356E2]' : 'bg-[#0A0A0A]/8 text-[#0A0A0A]'
                    }`}>
                      {isPJ ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0A0A0A] truncate">
                        {m.companyName || m.fullName}
                      </div>
                      <div className="text-[11px] text-[#0A0A0A]/50 truncate">
                        {m.cpfCnpj}
                        {m.onboardingStatus && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#0A0A0A]/30" />
                            {m.onboardingStatus}
                            {m.onboardingStatus === 'Aprovado' && <CheckCircle2 className="w-3 h-3 text-[#1356E2]" />}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePull(m)}
                      disabled={!!pullingId}
                    >
                      {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Puxar'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#0A0A0A]/8 bg-[#f4f4f4]/40 text-[11px] text-[#0A0A0A]/50 flex-shrink-0">
          Mostrando até 200 clientes mais recentes. Use a busca para encontrar mais rápido.
        </div>
      </div>
    </div>
  );
}