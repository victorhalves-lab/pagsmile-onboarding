import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Globe, FileText, UserPlus, MousePointerClick, Calendar, ExternalLink, Activity, Sparkles, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Aba "Origem & Captação" — mostra por onde o cliente entrou no funil.
 * Cobre:
 * - LandingPageLead (lead via landing de parceiro)
 * - LandingPageEvent (tracking de eventos)
 * - SimplifiedLead (form simplificado)
 * - IntroducerLead (via introducer)
 * - StandardProposalLead (via proposta padrão)
 * - Lead (principal — referenciado, já aparece em Comercial)
 */

function Section({ icon: Icon, title, badge, children, accent = 'green' }) {
  const accentColor = {
    green: 'text-[var(--pagsmile-green)]',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  }[accent] || 'text-[var(--pagsmile-green)]';

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accentColor}`} />
        {title}
        {badge != null && <Badge className="bg-slate-100 text-[var(--pagsmile-blue)] text-[10px] ml-1">{badge}</Badge>}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, mono = false }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-[var(--pagsmile-blue)]/50 min-w-[100px]">{label}:</span>
      <span className={`text-[var(--pagsmile-blue)] font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

const SOURCE_CONFIG = {
  landing: { label: 'Landing Page', icon: Globe, color: 'bg-blue-100 text-blue-700' },
  introducer: { label: 'Introducer/Parceiro', icon: UserPlus, color: 'bg-purple-100 text-purple-700' },
  simplified: { label: 'Form Simplificado', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  std_proposal: { label: 'Proposta Padrão', icon: Sparkles, color: 'bg-emerald-100 text-emerald-700' },
  pagsmile_lead: { label: 'Lead Pagsmile (V5)', icon: Activity, color: 'bg-rose-100 text-rose-700' },
};

export default function CadastroOrigemTab({ merchant, allLeads = [] }) {
  const cpfCnpj = merchant?.cpfCnpj;
  const email = merchant?.email;

  // LandingPageLead
  const { data: landingLeadsByCnpj = [] } = useQuery({
    queryKey: ['cadastro-origem-landing-cnpj', cpfCnpj],
    queryFn: () => base44.entities.LandingPageLead.filter({ cpfCnpj }),
    enabled: !!cpfCnpj,
  });
  const { data: landingLeadsByEmail = [] } = useQuery({
    queryKey: ['cadastro-origem-landing-email', email],
    queryFn: () => base44.entities.LandingPageLead.filter({ email }),
    enabled: !!email,
  });
  const landingLeads = useMemo(() => {
    const map = new Map();
    [...landingLeadsByCnpj, ...landingLeadsByEmail].forEach(l => map.set(l.id, l));
    return Array.from(map.values());
  }, [landingLeadsByCnpj, landingLeadsByEmail]);

  // LandingPageEvent (tracking)
  const { data: landingEvents = [] } = useQuery({
    queryKey: ['cadastro-origem-landing-events', email],
    queryFn: () => base44.entities.LandingPageEvent.filter({ email }),
    enabled: !!email,
  });

  // SimplifiedLead
  const { data: simplifiedLeads = [] } = useQuery({
    queryKey: ['cadastro-origem-simplified', email],
    queryFn: () => base44.entities.SimplifiedLead.filter({ email }),
    enabled: !!email,
  });

  // IntroducerLead
  const { data: introducerLeadsEmail = [] } = useQuery({
    queryKey: ['cadastro-origem-intr-email', email],
    queryFn: () => base44.entities.IntroducerLead.filter({ email }),
    enabled: !!email,
  });
  const { data: introducerLeadsCnpj = [] } = useQuery({
    queryKey: ['cadastro-origem-intr-cnpj', cpfCnpj],
    queryFn: () => base44.entities.IntroducerLead.filter({ cpfCnpj }),
    enabled: !!cpfCnpj,
  });
  const introducerLeads = useMemo(() => {
    const map = new Map();
    [...introducerLeadsEmail, ...introducerLeadsCnpj].forEach(l => map.set(l.id, l));
    return Array.from(map.values());
  }, [introducerLeadsEmail, introducerLeadsCnpj]);

  // StandardProposalLead
  const { data: stdProposalLeads = [] } = useQuery({
    queryKey: ['cadastro-origem-std', email],
    queryFn: () => base44.entities.StandardProposalLead.filter({ email }),
    enabled: !!email,
  });

  // Build timeline of "primeira aparição" para o cliente
  const captureTimeline = useMemo(() => {
    const events = [];
    landingLeads.forEach(l => events.push({ type: 'landing', date: l.created_date, label: `Lead capturado via landing: ${l.landingPageSlug || l.partnerSlug || 'pública'}`, ref: l }));
    introducerLeads.forEach(l => events.push({ type: 'introducer', date: l.created_date, label: `Lead capturado via introducer: ${l.introducerName || l.introducerId || ''}`, ref: l }));
    simplifiedLeads.forEach(l => events.push({ type: 'simplified', date: l.created_date, label: `Lead capturado via form simplificado`, ref: l }));
    stdProposalLeads.forEach(l => events.push({ type: 'std_proposal', date: l.created_date, label: `Lead vindo da proposta padrão`, ref: l }));
    allLeads.forEach(l => events.push({ type: 'pagsmile_lead', date: l.created_date, label: `Lead Pagsmile (V5) preenchido${l.origemLead ? ` — origem: ${l.origemLead}` : ''}`, ref: l }));
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [landingLeads, introducerLeads, simplifiedLeads, stdProposalLeads, allLeads]);

  const hasAny = captureTimeline.length > 0 || landingEvents.length > 0;

  if (!hasAny) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <GitBranch className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhuma origem de captação registrada para este cliente</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/40 mt-2">
          Buscamos em LandingPageLead, IntroducerLead, SimplifiedLead, StandardProposalLead, Lead e LandingPageEvent.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Timeline de origem unificada */}
      {captureTimeline.length > 0 && (
        <Section icon={GitBranch} title="Timeline de Captação" badge={captureTimeline.length} accent="green">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--pagsmile-blue)]/8" />
            <div className="space-y-2">
              {captureTimeline.map((ev, i) => {
                const cfg = SOURCE_CONFIG[ev.type];
                const Icon = cfg.icon;
                const date = new Date(ev.date);
                const isFirst = i === 0;
                return (
                  <div key={`${ev.type}-${ev.ref.id}-${i}`} className="relative pl-9">
                    <div className={`absolute left-1 top-3 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${cfg.color}`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          {isFirst && <Badge className="bg-green-100 text-green-700 text-[10px]">Primeira aparição</Badge>}
                        </div>
                        <p className="text-xs text-[var(--pagsmile-blue)]/80 mt-1">{ev.label}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Calendar className="w-3 h-3 text-[var(--pagsmile-blue)]/30 inline" />
                        <span className="text-[10px] text-[var(--pagsmile-blue)]/40 ml-1">{date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Detalhe Landing Page Leads */}
      {landingLeads.length > 0 && (
        <Section icon={Globe} title="Landing Page Leads" badge={landingLeads.length} accent="blue">
          <div className="space-y-2">
            {landingLeads.map(l => (
              <div key={l.id} className="border border-blue-100 rounded-lg p-3 bg-blue-50/30 space-y-1">
                <Row label="Landing slug" value={l.landingPageSlug || l.partnerSlug || '—'} mono />
                <Row label="Nome" value={l.fullName} />
                <Row label="Telefone" value={l.phone} />
                <Row label="Empresa" value={l.companyName} />
                <Row label="UTM source" value={l.utmSource} />
                <Row label="UTM campaign" value={l.utmCampaign} />
                <Row label="Status" value={l.status} />
                <Row label="Criado em" value={new Date(l.created_date).toLocaleString('pt-BR')} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Introducer Leads */}
      {introducerLeads.length > 0 && (
        <Section icon={UserPlus} title="Introducer Leads" badge={introducerLeads.length} accent="purple">
          <div className="space-y-2">
            {introducerLeads.map(l => (
              <div key={l.id} className="border border-purple-100 rounded-lg p-3 bg-purple-50/30 space-y-1">
                <Row label="Introducer" value={l.introducerName || l.introducerId} />
                <Row label="Código ref." value={l.introducerReferralCode} mono />
                <Row label="Nome" value={l.fullName} />
                <Row label="Empresa" value={l.companyName} />
                <Row label="Status" value={l.status} />
                <Row label="Volume estimado" value={l.estimatedMonthlyVolume ? `R$ ${Number(l.estimatedMonthlyVolume).toLocaleString('pt-BR')}` : null} />
                <Row label="Criado em" value={new Date(l.created_date).toLocaleString('pt-BR')} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Simplified Leads */}
      {simplifiedLeads.length > 0 && (
        <Section icon={FileText} title="Simplified Leads (form rápido)" badge={simplifiedLeads.length} accent="amber">
          <div className="space-y-2">
            {simplifiedLeads.map(l => (
              <div key={l.id} className="border border-amber-100 rounded-lg p-3 bg-amber-50/30 space-y-1">
                <Row label="Nome" value={l.fullName || l.contactName} />
                <Row label="Empresa" value={l.companyName} />
                <Row label="Telefone" value={l.phone} />
                <Row label="Segmento" value={l.businessSegment} />
                <Row label="Volume" value={l.monthlyVolume ? `R$ ${Number(l.monthlyVolume).toLocaleString('pt-BR')}` : null} />
                <Row label="Status" value={l.status} />
                <Row label="Criado em" value={new Date(l.created_date).toLocaleString('pt-BR')} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Standard Proposal Leads */}
      {stdProposalLeads.length > 0 && (
        <Section icon={Sparkles} title="Standard Proposal Leads" badge={stdProposalLeads.length} accent="green">
          <div className="space-y-2">
            {stdProposalLeads.map(l => (
              <div key={l.id} className="border border-emerald-100 rounded-lg p-3 bg-emerald-50/30 space-y-1">
                <Row label="Nome" value={l.fullName || l.contactName} />
                <Row label="Empresa" value={l.companyName} />
                <Row label="Telefone" value={l.phone} />
                <Row label="Segmento" value={l.businessSegment} />
                <Row label="Status" value={l.status} />
                <Row label="Criado em" value={new Date(l.created_date).toLocaleString('pt-BR')} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Eventos de Landing Page */}
      {landingEvents.length > 0 && (
        <Section icon={MousePointerClick} title="Eventos de Tracking (Landing)" badge={landingEvents.length} accent="rose">
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {landingEvents.slice(0, 50).map(e => (
              <div key={e.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-[9px] font-mono">{e.eventType}</Badge>
                  {e.landingPageSlug && <span className="text-[var(--pagsmile-blue)]/60 truncate">{e.landingPageSlug}</span>}
                  {e.elementId && <span className="text-[var(--pagsmile-blue)]/40 truncate">→ {e.elementId}</span>}
                </div>
                <span className="text-[10px] text-[var(--pagsmile-blue)]/40 flex-shrink-0 ml-2">{new Date(e.created_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            ))}
            {landingEvents.length > 50 && (
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40 text-center pt-2">+ {landingEvents.length - 50} eventos mais antigos</p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}