import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles, UserPlus, FileText, FileCheck, Stamp, Shield, Database, Microscope,
  Activity, AlertTriangle, MessageSquare, Search, Filter, ClipboardList,
  UserCheck, Briefcase, Mail, Inbox, Building2
} from 'lucide-react';

/**
 * Timeline Unificada do Cliente — Sprint E
 * Consolida em ordem cronológica TODOS os eventos do ciclo de vida do cliente,
 * cruzando: leads, propostas, contratos, casos, documentos, validações CAF/BDC,
 * findings, feedbacks, eventos de monitoramento BDC e logs de auditoria.
 *
 * NÃO refaz fetch — recebe tudo do CadastroDetalhe (que já carregou).
 */

const TIPO_CONFIG = {
  lead:            { icon: UserPlus,      label: 'Lead',              color: 'bg-blue-100 text-blue-700 border-blue-200' },
  proposta:        { icon: FileText,      label: 'Proposta',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  contrato:        { icon: Stamp,         label: 'Contrato',          color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  caso:            { icon: ClipboardList, label: 'Onboarding',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
  documento:       { icon: FileCheck,     label: 'Documento',         color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  caf_bdc:         { icon: Microscope,    label: 'CAF/BDC',           color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
  compliance:      { icon: Shield,        label: 'Compliance',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  finding:         { icon: AlertTriangle, label: 'Finding',           color: 'bg-rose-100 text-rose-700 border-rose-200' },
  feedback:        { icon: MessageSquare, label: 'Feedback',          color: 'bg-teal-100 text-teal-700 border-teal-200' },
  monitoramento:   { icon: Activity,      label: 'Monitoramento',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  pendencia:       { icon: Inbox,         label: 'Pendência',         color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  auditoria:       { icon: Shield,        label: 'Auditoria',         color: 'bg-slate-100 text-slate-600 border-slate-200' },
  representante:   { icon: UserCheck,     label: 'Representante',     color: 'bg-violet-100 text-violet-700 border-violet-200' },
  comercial:       { icon: Briefcase,     label: 'Comercial',         color: 'bg-sky-100 text-sky-700 border-sky-200' },
  subseller:       { icon: Building2,     label: 'Subseller',         color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

function fmt(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CadastroTimelineUnificadaTab({
  merchant,
  allLeads = [],
  allProposals = [],
  allContracts = [],
  allCases = [],
  documents = [],
  validations = [],
  integrationLogs = [],
  scores = [],
  auditLogs = [],
  findings = [],
  feedbacks = [],
  monitoringEvents = [],
  pendencies = [],
  subsellers = [],
}) {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const events = useMemo(() => {
    const list = [];

    // 1. Criação do Merchant
    if (merchant?.created_date) {
      list.push({
        date: merchant.created_date,
        type: 'caso',
        title: 'Cadastro criado',
        description: `Merchant ${merchant.companyName || merchant.fullName} cadastrado no sistema.`,
        meta: merchant.type,
      });
    }

    // 2. Leads
    allLeads.forEach(l => {
      list.push({
        date: l.created_date,
        type: 'lead',
        title: 'Lead capturado',
        description: l.source || l.businessSubCategory || l.companyName || 'Origem não informada',
        meta: l.status,
      });
      if (l.qualifiedAt) {
        list.push({
          date: l.qualifiedAt,
          type: 'lead',
          title: 'Lead qualificado',
          description: l.qualifier || 'Qualificação IA',
        });
      }
    });

    // 3. Propostas
    allProposals.forEach(p => {
      list.push({
        date: p.created_date,
        type: 'proposta',
        title: `Proposta criada${p.versao ? ` v${p.versao}` : ''}`,
        description: `${p.clienteNome || merchant?.companyName || '—'} · ${p.status || 'rascunho'}`,
        meta: p.tipoProposta,
      });
      if (p.dataAceite || p.acceptedAt) {
        list.push({
          date: p.dataAceite || p.acceptedAt,
          type: 'proposta',
          title: 'Proposta aceita',
          description: `${p.clienteNome || merchant?.companyName || '—'}`,
        });
      }
    });

    // 4. Contratos
    allContracts.forEach(c => {
      list.push({
        date: c.created_date,
        type: 'contrato',
        title: 'Contrato gerado',
        description: c.clientName || c.title || '—',
        meta: c.status,
      });
      if (c.signedAt) {
        list.push({
          date: c.signedAt,
          type: 'contrato',
          title: 'Contrato assinado',
          description: c.clientName || '—',
        });
      }
    });

    // 5. OnboardingCases
    allCases.forEach(c => {
      list.push({
        date: c.created_date,
        type: 'caso',
        title: 'Caso de onboarding criado',
        description: `Template: ${c.questionnaireTemplateId || '—'}${c.framework_version ? ` · ${c.framework_version}` : ''}`,
        meta: c.status,
      });
      if (c.submissionDate) {
        list.push({
          date: c.submissionDate,
          type: 'caso',
          title: 'Questionário submetido',
          description: `Status: ${c.status || '—'}${c.riskScoreV4 != null ? ` · Score V4: ${c.riskScoreV4}` : ''}`,
        });
      }
      if (c.finalDecisionDate) {
        list.push({
          date: c.finalDecisionDate,
          type: 'compliance',
          title: `Decisão final: ${c.status}`,
          description: c.subfaixaNome ? `Subfaixa ${c.subfaixaNome}` : '',
        });
      }
      if (c.manualReviewDate) {
        list.push({
          date: c.manualReviewDate,
          type: 'compliance',
          title: 'Revisão manual concluída',
          description: c.manualReviewComments || '',
        });
      }
    });

    // 6. Documentos
    documents.forEach(d => {
      if (d.uploadDate || d.created_date) {
        list.push({
          date: d.uploadDate || d.created_date,
          type: 'documento',
          title: `Documento ${d.notAvailable ? 'declarado indisponível' : 'enviado'}`,
          description: d.documentName || d.fileName || '—',
          meta: d.validationStatus,
        });
      }
    });

    // 7. Validações externas
    validations.forEach(v => {
      list.push({
        date: v.created_date,
        type: 'caf_bdc',
        title: `Validação: ${v.validationType || v.provider || 'externa'}`,
        description: v.summary || v.result || '—',
        meta: v.status || v.result_status,
      });
    });

    // 8. Integration logs (CAF/BDC) — só os mais relevantes
    integrationLogs.forEach(l => {
      list.push({
        date: l.created_date,
        type: 'caf_bdc',
        title: `${l.provider}: ${l.service_type || l.dataset_codigo || '—'}`,
        description: l.error_message || (l.score != null ? `Score: ${l.score}` : ''),
        meta: l.status,
      });
    });

    // 9. Compliance scores
    scores.forEach(s => {
      list.push({
        date: s.created_date,
        type: 'compliance',
        title: `SENTINEL${s.framework_version ? ` ${s.framework_version}` : ''}: ${s.recomendacao_final || s.sentinel_recommendation || 'análise concluída'}`,
        description: s.subfaixa_nome || (s.score_final != null ? `Score ${s.score_final}` : ''),
        meta: s.subfaixa,
      });
    });

    // 10. Findings
    findings.forEach(f => {
      list.push({
        date: f.created_date,
        type: 'finding',
        title: `Finding ${f.severity || ''}: ${f.title || f.code || '—'}`,
        description: f.description || f.summary || '',
        meta: f.dimension,
      });
    });

    // 11. SentinelFeedback
    feedbacks.forEach(fb => {
      list.push({
        date: fb.created_date,
        type: 'feedback',
        title: `Feedback do analista (${fb.feedbackType || 'neutro'})`,
        description: fb.comment || fb.category || '—',
      });
    });

    // 12. BdcMonitoringEvent
    monitoringEvents.forEach(e => {
      list.push({
        date: e.receivedAt || e.created_date,
        type: 'monitoramento',
        title: `BDC: ${e.eventType || '—'}${e.severity ? ` [${e.severity}]` : ''}`,
        description: e.summary || '—',
        meta: e.processedStatus,
      });
    });

    // 13. Pendências
    pendencies.forEach(p => {
      list.push({
        date: p.created_date,
        type: 'pendencia',
        title: 'Pendência solicitada',
        description: p.summary || p.notes || `${(p.items || []).length} item(ns)`,
        meta: p.status,
      });
    });

    // 14. Subsellers
    subsellers.forEach(s => {
      list.push({
        date: s.created_date,
        type: 'subseller',
        title: 'Subseller adicionado',
        description: s.companyName || s.fullName || '—',
        meta: s._subfaixa,
      });
    });

    // 15. AuditLog (compactado — só ações relevantes)
    auditLogs
      .filter(a => ['CREATE', 'UPDATE', 'APPROVAL', 'REJECTION', 'VALIDATION'].includes(a.actionType))
      .forEach(a => {
        list.push({
          date: a.changeDate || a.created_date,
          type: 'auditoria',
          title: `${a.actionType}: ${a.entityName}`,
          description: a.actionDescription || a.changedBy || '—',
          meta: a.changedBy,
        });
      });

    return list
      .filter(e => e.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [merchant, allLeads, allProposals, allContracts, allCases, documents, validations, integrationLogs, scores, findings, feedbacks, monitoringEvents, pendencies, subsellers, auditLogs]);

  const countsByType = useMemo(() => {
    const c = {};
    events.forEach(e => { c[e.type] = (c[e.type] || 0) + 1; });
    return c;
  }, [events]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return events.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (s) {
        const hay = `${e.title} ${e.description} ${e.meta || ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [events, filterType, search]);

  // Agrupa por dia
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('pt-BR');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[var(--pagsmile-green)]" />
          <h3 className="text-base font-semibold text-[var(--pagsmile-blue)]">Timeline Unificada</h3>
          <Badge className="bg-[var(--pagsmile-green)]/10 text-[var(--pagsmile-green-dark)] text-[10px]">
            {events.length} eventos
          </Badge>
        </div>
        <p className="text-xs text-[var(--pagsmile-blue)]/60 mb-4">
          Cronologia unificada de todos os eventos do ciclo de vida deste cliente — desde a captação até o monitoramento contínuo.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pagsmile-blue)]/40" />
            <Input
              placeholder="Buscar na timeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="text-xs h-9"
          >
            <Filter className="w-3 h-3 mr-1" />
            Todos ({events.length})
          </Button>
          {Object.entries(TIPO_CONFIG).map(([key, cfg]) => {
            const n = countsByType[key] || 0;
            if (!n) return null;
            const Icon = cfg.icon;
            return (
              <Button
                key={key}
                variant={filterType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(filterType === key ? 'all' : key)}
                className="text-xs h-9"
              >
                <Icon className="w-3 h-3 mr-1" />
                {cfg.label} ({n})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-12 text-center text-sm text-[var(--pagsmile-blue)]/50">
          Nenhum evento encontrado para os filtros atuais.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 bg-[#f4f4f4]/95 backdrop-blur-sm py-2 mb-3 border-b border-[var(--pagsmile-blue)]/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--pagsmile-blue)]/70">
                  {day} <span className="font-normal text-[var(--pagsmile-blue)]/40 normal-case ml-1">· {dayEvents.length} evento(s)</span>
                </h4>
              </div>
              <div className="space-y-2 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[var(--pagsmile-blue)]/10">
                {dayEvents.map((e, idx) => {
                  const cfg = TIPO_CONFIG[e.type] || TIPO_CONFIG.auditoria;
                  const Icon = cfg.icon;
                  return (
                    <div key={`${day}-${idx}`} className="relative">
                      <div className={`absolute -left-[18px] top-3 w-3 h-3 rounded-full border-2 border-white ${cfg.color.split(' ')[0]}`} />
                      <div className="bg-white rounded-lg border border-[var(--pagsmile-blue)]/8 p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                              <span className="text-[10px] text-[var(--pagsmile-blue)]/40">
                                {new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {e.meta && (
                                <Badge variant="outline" className="text-[10px] opacity-70">{e.meta}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-[var(--pagsmile-blue)]">{e.title}</p>
                            {e.description && (
                              <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-0.5 break-words">{e.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}