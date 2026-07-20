import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Loader2, UserPlus, Handshake, Save, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * LeadAssignmentCard
 * Permite ao admin atribuir / trocar a qualquer momento:
 *  - Introducer (parceiro indicador)
 *  - Responsável comercial (usuário interno)
 * Funciona para leads vindos de qualquer origem (manual, landing, formulário, simplificado, etc.)
 */
export default function LeadAssignmentCard({ lead }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [introducerId, setIntroducerId] = useState(lead.introducerId || 'none');
  const [agentEmail, setAgentEmail] = useState(lead.commercialAgentId || 'none');

  useEffect(() => {
    setIntroducerId(lead.introducerId || 'none');
    setAgentEmail(lead.commercialAgentId || 'none');
  }, [lead.id, lead.introducerId, lead.commercialAgentId]);

  // Carrega introducers ativos
  const { data: introducers = [], isLoading: loadingIntroducers } = useQuery({
    queryKey: ['introducers-list'],
    queryFn: () => base44.entities.Introducer.list('-created_date', 200),
  });

  // Carrega usuários (filtra admins/comerciais)
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = { lastInteractionDate: new Date().toISOString() };

      // Introducer
      const newIntroId = introducerId === 'none' ? null : introducerId;
      const oldIntroId = lead.introducerId || null;
      if (newIntroId !== oldIntroId) {
        if (newIntroId) {
          const intro = introducers.find(i => i.id === newIntroId);
          updates.introducerId = newIntroId;
          updates.introducerName = intro?.fullName || intro?.companyName || '';
          updates.introducerReferralCode = intro?.referralCode || '';
        } else {
          updates.introducerId = null;
          updates.introducerName = null;
          updates.introducerReferralCode = null;
        }
      }

      // Comercial
      const newAgentEmail = agentEmail === 'none' ? null : agentEmail;
      const oldAgentEmail = lead.commercialAgentId || null;
      if (newAgentEmail !== oldAgentEmail) {
        if (newAgentEmail) {
          const u = users.find(x => x.email === newAgentEmail);
          updates.commercialAgentId = newAgentEmail;
          updates.commercialAgentName = u?.full_name || newAgentEmail;
        } else {
          updates.commercialAgentId = null;
          updates.commercialAgentName = null;
        }
      }

      await base44.entities.Lead.update(lead.id, updates);

      // Activity log (sempre que algo muda)
      const changes = [];
      if (newIntroId !== oldIntroId) {
        changes.push(newIntroId
          ? `Introducer atribuído: ${updates.introducerName}`
          : 'Introducer removido');
      }
      if (newAgentEmail !== oldAgentEmail) {
        changes.push(newAgentEmail
          ? `Comercial responsável atribuído: ${updates.commercialAgentName}`
          : 'Comercial responsável removido');
      }
      if (changes.length > 0) {
        await base44.entities.LeadActivity.create({
          leadId: lead.id,
          activityType: 'atribuicao_alterada',
          description: changes.join(' | '),
          performedBy: 'admin',
          activityDate: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivities', lead.id] });
      toast.success('Atribuições atualizadas');
      setEditing(false);
    },
    onError: (e) => toast.error(`Erro: ${e?.message || 'falha ao salvar'}`)
  });

  const cancelEdit = () => {
    setIntroducerId(lead.introducerId || 'none');
    setAgentEmail(lead.commercialAgentId || 'none');
    setEditing(false);
  };

  const introducerLabel = lead.introducerName
    ? `${lead.introducerName}${lead.introducerReferralCode ? ` · ${lead.introducerReferralCode}` : ''}`
    : '— sem introducer —';
  const agentLabel = lead.commercialAgentName || lead.commercialAgentId || '— sem comercial responsável —';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Handshake className="w-4 h-4 text-[#1356E2]" /> Atribuições do Lead
        </CardTitle>
        {!editing && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#0A0A0A]/40 mb-1">Introducer</p>
              <p className={`font-medium ${lead.introducerName ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/40 italic'}`}>
                {introducerLabel}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#0A0A0A]/40 mb-1">Comercial Responsável</p>
              <p className={`font-medium ${lead.commercialAgentName ? 'text-[#0A0A0A]' : 'text-[#0A0A0A]/40 italic'}`}>
                {agentLabel}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-[#0A0A0A]/60 mb-1 block">Introducer</label>
              <Select value={introducerId} onValueChange={setIntroducerId} disabled={loadingIntroducers}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingIntroducers ? 'Carregando…' : 'Selecione um introducer'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem introducer —</SelectItem>
                  {introducers.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.fullName || i.companyName || i.email}
                      {i.referralCode ? ` · ${i.referralCode}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-[#0A0A0A]/60 mb-1 block">Comercial Responsável</label>
              <Select value={agentEmail} onValueChange={setAgentEmail} disabled={loadingUsers}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingUsers ? 'Carregando…' : 'Selecione um responsável'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem responsável —</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name || u.email}
                      {u.role ? ` · ${u.role}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saveMutation.isPending}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  : <Save className="w-3.5 h-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}