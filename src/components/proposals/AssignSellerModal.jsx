import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, User, Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AssignSellerModal({ open, onClose, proposal, onAssigned }) {
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-for-assign'],
    queryFn: () => base44.entities.User.list(),
    enabled: open,
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  const handleAssign = async (user) => {
    setSaving(true);
    const entityName = proposal._entityType || 'Proposal';
    const updateData = {
      responsavelId: user.id,
      responsavelNome: user.full_name || user.email,
    };

    if (entityName === 'Proposal') {
      await base44.entities.Proposal.update(proposal.id, updateData);
    } else if (entityName === 'PixProposal') {
      await base44.entities.PixProposal.update(proposal.id, updateData);
    } else if (entityName === 'StandardProposal') {
      await base44.entities.StandardProposal.update(proposal.id, updateData);
    } else if (entityName === 'Contract') {
      await base44.entities.Contract.update(proposal.id, updateData);
    } else {
      await base44.entities.Proposal.update(proposal.id, updateData);
    }

    // Also update lead if linked
    if (proposal.leadId) {
      await base44.entities.Lead.update(proposal.leadId, {
        commercialAgentId: user.id,
        commercialAgentName: user.full_name || user.email,
      });
    }

    toast.success(`Vendedor ${user.full_name || user.email} atribuído com sucesso`);
    setSaving(false);
    onAssigned?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A0A0A]">Atribuir Vendedor</DialogTitle>
          <p className="text-xs text-[#0A0A0A]/50">
            Proposta: <span className="font-mono text-[#1356E2]">{proposal?.codigo || proposal?.id}</span>
            {proposal?.clienteNome && <> • {proposal.clienteNome}</>}
          </p>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-10 h-9 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" />
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#0A0A0A]/40 text-center py-4">Nenhum usuário encontrado</p>
            ) : (
              filtered.map(user => {
                const isCurrentSeller = proposal?.responsavelId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => !isCurrentSeller && handleAssign(user)}
                    disabled={saving || isCurrentSeller}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isCurrentSeller
                        ? 'bg-[#1356E2]/10 border border-[#1356E2]/20'
                        : 'hover:bg-[#f4f4f4] border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1356E2] to-[#0A0A0A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(user.full_name || user.email || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">{user.full_name || 'Sem nome'}</p>
                      <p className="text-[10px] text-[#0A0A0A]/40 truncate">{user.email}</p>
                    </div>
                    {isCurrentSeller && (
                      <Check className="w-4 h-4 text-[#1356E2] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}