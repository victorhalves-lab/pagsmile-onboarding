import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Users, Handshake, Power, Loader2 } from 'lucide-react';
import CompliancePartnerFormModal from '../components/partners-compliance/CompliancePartnerFormModal';
import PartnerUserManageModal from '../components/partners-compliance/PartnerUserManageModal';
import { toast } from 'sonner';

export default function AdminGestaoParceiros() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['compliance-partners'],
    queryFn: () => base44.entities.CompliancePartner.list('-created_date')
  });

  const toggleActive = async (p) => {
    try {
      await base44.entities.CompliancePartner.update(p.id, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Parceiro desativado.' : 'Parceiro ativado.');
      queryClient.invalidateQueries({ queryKey: ['compliance-partners'] });
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="w-6 h-6 text-[#2bc196]" />
            <h1 className="text-2xl font-bold text-[#002443]">Parceiros de Compliance</h1>
          </div>
          <p className="text-sm text-slate-500">Cadastre e gerencie parceiros externos e seus usuários.</p>
        </div>
        <Button onClick={() => { setSelected(null); setFormOpen(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90">
          <Plus className="w-4 h-4 mr-2" /> Novo Parceiro
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin inline text-[#2bc196]" /></div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum parceiro cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {partners.map(p => (
            <Card key={p.id} className={p.isActive ? '' : 'opacity-60'}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#002443]">{p.name}</h3>
                      <Badge className={p.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600'}>
                        {p.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {p.legalName && <p className="text-xs text-slate-500">{p.legalName}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                      {p.cnpj && <span>CNPJ: {p.cnpj}</span>}
                      {p.contactEmail && <span>· {p.contactEmail}</span>}
                      <span>· SLA {p.slaHours || 48}h</span>
                      <span>· {(p.allowedOnboardingCaseModels || []).length} modelos permitidos</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(p); setUsersOpen(true); }}>
                      <Users className="w-3 h-3 mr-1" /> Usuários
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setSelected(p); setFormOpen(true); }}>
                      <Edit className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                      <Power className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CompliancePartnerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        partner={selected}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['compliance-partners'] })}
      />
      <PartnerUserManageModal
        open={usersOpen}
        onClose={() => setUsersOpen(false)}
        partner={selected}
      />
    </div>
  );
}