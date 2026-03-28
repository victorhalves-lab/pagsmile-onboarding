import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CircleDot, ArrowRight } from 'lucide-react';

export default function NotificacoesAutomacoesSection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Notificações, Automações e Scheduled Tasks</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          O sistema dispara notificações automáticas via Slack e E-mail, além de executar tarefas agendadas para manter a operação fluindo sem intervenção manual.
        </p>
      </div>

      {/* Notificações Slack */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-[#002443] text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center"><span className="text-xs">💬</span></div>
          Notificações Slack (Bot)
        </h4>
        <div className="space-y-2">
          {[
            { event: 'Novo Lead criado', fn: 'notifyNewLead', trigger: 'Automação entity: Lead.create', canal: 'Canal configurado', msg: 'Nome, empresa, tipo negócio, TPV, score PRISCILA' },
            { event: 'Proposta Visualizada', fn: 'notifyProposalViewed', trigger: 'PropostaPublica abre com token', canal: 'Canal configurado', msg: 'Nome empresa, código proposta, data/hora visualização' },
            { event: 'Proposta Aceita', fn: 'notifyProposalAccepted', trigger: 'Cliente clica Aceitar na PropostaPublica', canal: 'Canal configurado', msg: 'Nome empresa, código proposta, valor TPV estimado' },
          ].map((n, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Badge className="bg-purple-100 text-purple-700 border-0 text-[9px] whitespace-nowrap">{n.event}</Badge>
              <div className="flex-1">
                <p className="text-[10px] text-[#002443]/60"><span className="font-semibold">Function:</span> {n.fn} · <span className="font-semibold">Trigger:</span> {n.trigger}</p>
                <p className="text-[9px] text-[#002443]/40 mt-0.5"><span className="font-semibold">Mensagem contém:</span> {n.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E-mail */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-[#002443] text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center"><span className="text-xs">📧</span></div>
          E-mails Automáticos
        </h4>
        <div className="space-y-2">
          {[
            { event: 'Follow-up Lead Inativo', fn: 'sendFollowUpEmail', trigger: 'Scheduled: leads sem interação >7 dias', desc: 'E-mail personalizado com template configurável (MessageTemplate). Pode usar variáveis dinâmicas: {nome}, {empresa}, {protocolo}.' },
            { event: 'Proposta Enviada', fn: 'Via SendEmail integration', trigger: 'Comercial envia proposta', desc: 'E-mail com link público da proposta, taxas resumidas e CTA de aceite.' },
          ].map((n, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] whitespace-nowrap">{n.event}</Badge>
              <div className="flex-1">
                <p className="text-[10px] text-[#002443]/60"><span className="font-semibold">Function:</span> {n.fn} · <span className="font-semibold">Trigger:</span> {n.trigger}</p>
                <p className="text-[9px] text-[#002443]/40 mt-0.5">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Tasks */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-[#002443] text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center"><span className="text-xs">⏰</span></div>
          Tarefas Agendadas (Scheduled Tasks)
        </h4>
        <div className="space-y-2">
          {[
            { task: 'Expirar Propostas Vencidas', fn: 'expireProposals', freq: 'Diária', desc: 'Verifica todas as propostas (Proposal, StandardProposal, PixProposal) com validUntil no passado e status "enviada"/"visualizada". Muda para "expirada".' },
            { task: 'Verificar SLA de Leads', fn: 'checkLeadSLA', freq: 'Periódica', desc: 'Verifica leads sem interação por X dias. Gera alertas no dashboard e pode disparar follow-up automático.' },
            { task: 'Verificar Leads Incompletos', fn: 'checkIncompleteLeads', freq: 'Periódica', desc: 'Identifica leads com questionário parcialmente preenchido ou dados faltantes. Gera alertas.' },
            { task: 'Alertar Propostas Expirando', fn: 'checkExpiringProposals', freq: 'Diária', desc: 'Identifica propostas com ≤3 dias para expirar e gera alertas visuais na Gestão de Propostas.' },
          ].map((t, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] whitespace-nowrap">{t.freq}</Badge>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-[#002443]">{t.task}</p>
                <p className="text-[9px] text-[#002443]/40 mt-0.5"><span className="font-semibold">Function:</span> {t.fn} — {t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Versionamento de Propostas */}
      <div className="border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-[#002443] text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#2bc196]/10 flex items-center justify-center"><span className="text-xs">🔄</span></div>
          Sistema de Versionamento de Propostas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Como funciona</p>
            {['Cada proposta tem: version (1, 2, 3...), previousVersionId, rootProposalId, isCurrentVersion', 'Ao criar nova versão: duplica proposta atual, incrementa version, define previousVersionId = proposta atual, rootProposalId = primeira versão', 'Versão anterior recebe isCurrentVersion = false', 'Nova versão recebe isCurrentVersion = true e novo código/token', 'Todas as versões compartilham o mesmo rootProposalId para lineage tracking'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Visualização</p>
            {['ProposalHistoryModal: modal com timeline de todas as versões', 'Cada versão mostra: código, data, status, quem criou', 'Badge "V1", "V2", "V3" na tabela de propostas', 'Navegação entre versões com botão "Ver"', 'Disponível para Proposal, PixProposal (StandardProposal não tem versionamento)'].map((item, i) => (
              <p key={i} className="text-[10px] text-[#002443]/60 flex items-start gap-1.5 mb-1">
                <ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}