import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, FileText, CreditCard, Check } from 'lucide-react';
import moment from 'moment';

function formatCNPJ(cnpj) {
  if (!cnpj) return '-';
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14) return cnpj;
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
}

function RateSummary({ rates }) {
  if (!rates) return null;
  const masterAvista = rates.cartao?.mastercard?.avista;
  const pixVal = rates.pix?.valor;
  const pixTipo = rates.pix?.tipo;
  return (
    <div className="flex items-center gap-2 text-[10px] text-[#0A0A0A]/50 mt-1">
      {masterAvista != null && masterAvista !== '' && (
        <span className="flex items-center gap-0.5">
          <CreditCard className="w-2.5 h-2.5" /> Master à vista: {masterAvista}%
        </span>
      )}
      {pixVal != null && pixVal !== '' && (
        <span>PIX: {pixVal}{pixTipo === 'percentual' ? '%' : ' R$'}</span>
      )}
    </div>
  );
}

export default function CopyRatesModal({ isOpen, onClose, onSelect, currentProposalId }) {
  const [search, setSearch] = useState('');

  const { data: propostas = [], isLoading } = useQuery({
    queryKey: ['all-proposals-for-copy'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 200),
    enabled: isOpen,
  });

  const filtered = useMemo(() => {
    let result = propostas.filter(p => p.id !== currentProposalId);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.codigo || '').toLowerCase().includes(s) ||
        (p.clienteNome || '').toLowerCase().includes(s) ||
        (p.clienteCnpj || '').includes(s)
      );
    }
    return result;
  }, [propostas, search, currentProposalId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFB81C]" />
            Copiar Taxas de Outra Proposta
          </DialogTitle>
          <DialogDescription>
            Selecione uma proposta para copiar todas as taxas e condições comerciais.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, empresa ou CNPJ..."
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[340px] -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#FFB81C]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#0A0A0A]/40">
              Nenhuma proposta encontrada
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#0A0A0A]/5 hover:border-[#1356E2]/30 hover:bg-[#1356E2]/5 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#FFB81C] font-semibold">{p.codigo || '-'}</span>
                      <Badge className="text-[9px] bg-slate-100 text-slate-600 border-0">
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{p.clienteNome || 'Sem nome'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#0A0A0A]/40 mt-0.5">
                      <span>{formatCNPJ(p.clienteCnpj)}</span>
                      <span>{moment(p.created_date).format('DD/MM/YYYY')}</span>
                    </div>
                    <RateSummary rates={p.rates} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-[#1356E2] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}