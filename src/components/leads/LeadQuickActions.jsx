import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Phone, FileText, Shield, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadQuickActions({ lead }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ status, activityType, description }) => {
      await base44.entities.Lead.update(lead.id, { status, lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({
        leadId: lead.id,
        activityType,
        description,
        performedBy: 'admin',
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivities', lead.id] });
      toast.success('Ação realizada com sucesso');
    }
  });

  const actions = [];

  if (['questionario_preenchido', 'analisado_priscila'].includes(lead.status)) {
    actions.push({
      label: 'Iniciar Contato',
      icon: Phone,
      variant: 'default',
      className: 'bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white',
      onClick: () => updateMutation.mutate({
        status: 'em_contato_comercial',
        activityType: 'contato_iniciado',
        description: 'Contato comercial iniciado'
      })
    });
  }

  if (['questionario_preenchido', 'analisado_priscila', 'em_contato_comercial'].includes(lead.status) && lead.priscilaRiskLevel !== 'CRITICO') {
    actions.push({
      label: 'Gerar Proposta',
      icon: FileText,
      variant: 'outline',
      className: 'border-blue-300 text-blue-700 hover:bg-blue-50',
      onClick: () => navigate(createPageUrl('CriarProposta') + `?leadId=${lead.id}`)
    });
  }

  if (lead.status === 'proposta_aceita') {
    actions.push({
      label: 'Iniciar KYC',
      icon: Shield,
      variant: 'default',
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
      onClick: () => updateMutation.mutate({
        status: 'kyc_iniciado',
        activityType: 'kyc_iniciado',
        description: 'Processo de KYC iniciado'
      })
    });
  }

  if (lead.status === 'proposta_enviada') {
    actions.push({
      label: 'Reenviar Proposta',
      icon: Send,
      variant: 'outline',
      className: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
      onClick: () => toast.info('Funcionalidade de reenvio em breve')
    });
  }

  if (lead.status === 'kyc_aprovado') {
    actions.push({
      label: 'Ativar Merchant',
      icon: CheckCircle2,
      variant: 'default',
      className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      onClick: () => updateMutation.mutate({
        status: 'ativado',
        activityType: 'status_alterado_manual',
        description: 'Merchant ativado'
      })
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Button
            key={i}
            variant={action.variant}
            size="sm"
            className={`gap-1.5 ${action.className}`}
            onClick={action.onClick}
            disabled={updateMutation.isPending}
          >
            <Icon className="w-4 h-4" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}