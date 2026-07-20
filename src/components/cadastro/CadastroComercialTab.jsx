import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, UserPlus, Presentation, Activity, ExternalLink, Calendar, Mail, Phone, Building2, Hash, Percent, Globe } from 'lucide-react';

function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--pinbank-blue)]" />
        {title}
        {badge != null && <Badge className="bg-[var(--pinbank-blue)]/10 text-[var(--pinbank-blue)] text-[10px] ml-1">{badge}</Badge>}
      </h3>
      {children}
    </div>
  );
}

const ACTIVITY_LABELS = {
  questionario_preenchido: 'Questionário preenchido',
  analisado_priscila: 'Análise PRISCILA',
  contato_iniciado: 'Contato iniciado',
  proposta_criada: 'Proposta criada',
  proposta_enviada: 'Proposta enviada',
  proposta_visualizada: 'Proposta visualizada',
  proposta_aceita: 'Proposta aceita',
  proposta_recusada: 'Proposta recusada',
  proposta_contraproposta: 'Contraproposta',
  kyc_iniciado: 'KYC iniciado',
  kyc_aprovado: 'KYC aprovado',
  kyc_revisao_manual: 'KYC em revisão manual',
  kyc_rejeitado: 'KYC rejeitado',
  status_alterado_manual: 'Status alterado manualmente',
  perdido: 'Lead perdido',
  nota_adicionada: 'Nota adicionada',
};

const ACTIVITY_COLORS = {
  proposta_aceita: 'bg-green-100 text-green-700',
  kyc_aprovado: 'bg-green-100 text-green-700',
  proposta_recusada: 'bg-red-100 text-red-700',
  kyc_rejeitado: 'bg-red-100 text-red-700',
  perdido: 'bg-red-100 text-red-700',
  kyc_revisao_manual: 'bg-amber-100 text-amber-700',
};

export default function CadastroComercialTab({ lead, allLeads = [] }) {
  const leadIds = allLeads.map(l => l.id);

  // LeadActivity (timeline comercial)
  const { data: activities = [] } = useQuery({
    queryKey: ['cadastro-lead-activities', leadIds],
    queryFn: async () => {
      if (!leadIds.length) return [];
      const results = await Promise.all(leadIds.map(id => base44.entities.LeadActivity.filter({ leadId: id })));
      return results.flat().sort((a, b) => new Date(b.activityDate || b.created_date) - new Date(a.activityDate || a.created_date));
    },
    enabled: leadIds.length > 0,
  });

  // Introducer
  const { data: introducer } = useQuery({
    queryKey: ['cadastro-introducer', lead?.introducerId],
    queryFn: async () => {
      const arr = await base44.entities.Introducer.filter({ id: lead.introducerId });
      return arr[0] || null;
    },
    enabled: !!lead?.introducerId,
  });

  // KickOffPresentation
  const { data: kickoffs = [] } = useQuery({
    queryKey: ['cadastro-kickoffs', lead?.cpfCnpj],
    queryFn: () => base44.entities.KickOffPresentation.filter({ clientCnpj: lead.cpfCnpj }),
    enabled: !!lead?.cpfCnpj,
  });

  const hasData = lead?.commercialAgentName || introducer || kickoffs.length > 0 || activities.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <Briefcase className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum dado comercial registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Vendedor comercial responsável */}
      {(lead?.commercialAgentName || lead?.commercialAgentId) && (
        <Section icon={Briefcase} title="Responsável Comercial">
          <div className="text-sm">
            <p className="font-semibold text-[var(--pinbank-blue)]">{lead.commercialAgentName || lead.commercialAgentId}</p>
            {lead.origemLead && <p className="text-xs text-[var(--pinbank-blue)]/50 mt-1">Origem: {lead.origemLead}</p>}
            {lead.onboardingLinkCode && <p className="text-xs text-[var(--pinbank-blue)]/50">Link de captura: {lead.onboardingLinkCode}</p>}
            {lead.protocolo && <p className="text-xs text-[var(--pinbank-blue)]/50">Protocolo: {lead.protocolo}</p>}
          </div>
        </Section>
      )}

      {/* Introducer */}
      {introducer && (
        <Section icon={UserPlus} title="Introducer (Indicação)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
              <div>
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Nome</p>
                <p className="font-semibold">{introducer.name || introducer.companyName || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Hash className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
              <div>
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">Código de Referência</p>
                <p className="font-mono text-xs font-semibold">{introducer.referralCode}</p>
              </div>
            </div>
            {introducer.contactEmail && (
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">E-mail</p>
                  <p className="font-semibold text-xs">{introducer.contactEmail}</p>
                </div>
              </div>
            )}
            {introducer.contactPhone && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">Telefone</p>
                  <p className="font-semibold text-xs">{introducer.contactPhone}</p>
                </div>
              </div>
            )}
            {introducer.commissionRate != null && (
              <div className="flex items-start gap-2">
                <Percent className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">Comissão</p>
                  <p className="font-semibold">{introducer.commissionRate}%</p>
                </div>
              </div>
            )}
            {introducer.uniqueLandingPageSlug && (
              <div className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">Landing Page</p>
                  <Link to={`/parceiro/${introducer.uniqueLandingPageSlug}`} target="_blank" className="text-xs font-semibold text-[var(--pinbank-blue)] hover:underline flex items-center gap-1">
                    /parceiro/{introducer.uniqueLandingPageSlug} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Kick-Off Presentations */}
      {kickoffs.length > 0 && (
        <Section icon={Presentation} title="Apresentações Kick-Off" badge={kickoffs.length}>
          <div className="space-y-2">
            {kickoffs.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{k.clientName}</p>
                    {k.segment && <Badge variant="outline" className="text-[10px]">{k.segment}</Badge>}
                    {k.status === 'arquivada' && <Badge className="bg-slate-200 text-slate-600 text-[10px]">Arquivada</Badge>}
                  </div>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">
                    {k.responsavelNome ? `Por ${k.responsavelNome} • ` : ''}{new Date(k.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {k.publicToken && (
                  <Link to={`/KickOffPublico?token=${k.publicToken}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <ExternalLink className="w-3 h-3" /> Abrir
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Lead Activity Timeline */}
      {activities.length > 0 && (
        <Section icon={Activity} title="Timeline Comercial" badge={activities.length}>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--pinbank-blue)]/8" />
            <div className="space-y-2">
              {activities.slice(0, 30).map((a, i) => {
                const date = new Date(a.activityDate || a.created_date);
                const color = ACTIVITY_COLORS[a.activityType] || 'bg-blue-100 text-blue-700';
                const label = ACTIVITY_LABELS[a.activityType] || a.activityType;
                return (
                  <div key={a.id || i} className="relative pl-9">
                    <div className={`absolute left-1.5 top-3 w-3 h-3 rounded-full border-2 border-white ${color.split(' ')[0]}`} />
                    <div className="bg-slate-50 rounded-lg p-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge className={`text-[10px] ${color}`}>{label}</Badge>
                        {a.description && <p className="text-xs text-[var(--pinbank-blue)]/80 mt-1">{a.description}</p>}
                        <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">por {a.performedBy}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Calendar className="w-3 h-3 text-[var(--pinbank-blue)]/30 inline" />
                        <span className="text-[10px] text-[var(--pinbank-blue)]/40 ml-1">{date.toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activities.length > 30 && (
                <p className="text-[10px] text-[var(--pinbank-blue)]/40 text-center pt-2">
                  + {activities.length - 30} atividades mais antigas
                </p>
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}