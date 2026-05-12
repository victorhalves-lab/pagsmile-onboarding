import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink, CheckCircle2, Clock, XCircle, Mail, Phone, Briefcase, Hash } from 'lucide-react';

const CAF_STATUS = {
  pending:   { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Aguardando' },
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Concluído' },
  failed:    { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Falhou' },
};

function formatCpf(cpf) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length === 11) return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return cpf;
}

export default function CadastroRepresentantesTab({ latestCase }) {
  const additional = latestCase?.additionalRepresentatives || [];
  const cafLinks = latestCase?.cafLinksPorRepresentante || [];
  const contacts = latestCase?.representativesContacts || [];

  // Merge dos representantes adicionais com seus respectivos links CAF e contatos BDC
  const merged = additional.map(rep => {
    const cleanCpf = (rep.cpf || '').replace(/\D/g, '');
    const link = cafLinks.find(l => (l.cpf || '').replace(/\D/g, '') === cleanCpf);
    const contact = contacts.find(c => (c.cpf || '').replace(/\D/g, '') === cleanCpf);
    return { ...rep, _link: link, _contact: contact };
  });

  if (!merged.length && !cafLinks.length && !contacts.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Users className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum representante adicional registrado</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/40 mt-1">O representante principal é exibido nos Dados Cadastrais.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <p className="text-sm text-[var(--pagsmile-blue)]/60">
        {merged.length} representante(s) adicional(is) • {cafLinks.length} link(s) CAF gerado(s)
      </p>

      {merged.map((rep, idx) => {
        const status = rep._link?.status || 'pending';
        const sc = CAF_STATUS[status] || CAF_STATUS.pending;
        const StatusIcon = sc.icon;
        return (
          <div key={idx} className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">{rep.nome || 'Sem nome'}</h3>
                  {rep._link && (
                    <Badge className={`gap-1 text-[10px] ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />CAF {sc.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--pagsmile-blue)]/60">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{formatCpf(rep.cpf)}</span>
                  {rep.cargo && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{rep.cargo}</span>}
                  {rep.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{rep.email}</span>}
                  {rep.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{rep.phone}</span>}
                </div>
              </div>
              {rep._link?.url && (
                <a href={rep._link.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1 text-xs flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Link CAF
                  </Button>
                </a>
              )}
            </div>

            {/* Contatos BDC verificados */}
            {rep._contact && (rep._contact.phones?.length || rep._contact.emails?.length) && (
              <div className="p-3 bg-cyan-50 rounded-lg mb-2">
                <p className="text-[10px] font-bold text-cyan-700 mb-1.5">Contatos verificados via BDC</p>
                {rep._contact.phones?.length > 0 && (
                  <div className="mb-1">
                    <span className="text-[10px] text-cyan-700/60">Telefones: </span>
                    <span className="text-xs text-cyan-800">{rep._contact.phones.join(', ')}</span>
                  </div>
                )}
                {rep._contact.emails?.length > 0 && (
                  <div>
                    <span className="text-[10px] text-cyan-700/60">E-mails: </span>
                    <span className="text-xs text-cyan-800">{rep._contact.emails.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline do link CAF */}
            {rep._link && (
              <div className="grid grid-cols-2 gap-3 text-[10px] text-[var(--pagsmile-blue)]/50 pt-2 border-t border-slate-100">
                {rep._link.generatedAt && (
                  <div>
                    <span>Link gerado: </span>
                    <span className="font-semibold text-[var(--pagsmile-blue)]/70">{new Date(rep._link.generatedAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {rep._link.completedAt && (
                  <div>
                    <span>CAF concluído: </span>
                    <span className="font-semibold text-green-700">{new Date(rep._link.completedAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Links CAF órfãos (sem representante correspondente) */}
      {cafLinks.filter(l => !merged.find(m => (m.cpf || '').replace(/\D/g, '') === (l.cpf || '').replace(/\D/g, ''))).map((link, idx) => {
        const sc = CAF_STATUS[link.status] || CAF_STATUS.pending;
        const StatusIcon = sc.icon;
        return (
          <div key={`orphan-${idx}`} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">{link.nome || 'Link CAF'}</p>
                <p className="text-xs text-[var(--pagsmile-blue)]/50">{formatCpf(link.cpf)} • {link.cargo || '—'}</p>
              </div>
              <Badge className={`gap-1 text-[10px] ${sc.color}`}>
                <StatusIcon className="w-3 h-3" />{sc.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}