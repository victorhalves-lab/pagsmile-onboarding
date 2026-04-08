import React from 'react';
import { Shield, FileText, FileCheck, Stamp, Users, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function InfoCard({ icon: Icon, title, value, sub, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">{title}</p>
          <p className="text-sm font-semibold text-[var(--pagsmile-blue)]">{value || '—'}</p>
          {sub && <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CadastroOverviewTab({ merchant, latestCase, lead, latestProposal, latestContract, latestScore, documents, subsellers, allProposals = [], allContracts = [], allLeads = [], allCases = [] }) {
  const statusIcon = {
    'Aprovado': <CheckCircle2 className="w-4 h-4 text-green-600" />,
    'Recusado': <XCircle className="w-4 h-4 text-red-600" />,
    'Manual': <AlertTriangle className="w-4 h-4 text-amber-600" />,
    'Pendente': <Clock className="w-4 h-4 text-gray-500" />,
    'Em Análise': <Clock className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard
          icon={Shield}
          title="Status Onboarding"
          value={merchant.onboardingStatus}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <InfoCard
          icon={FileText}
          title={`Propostas (${allProposals.length})`}
          value={latestProposal ? latestProposal.status : 'Sem proposta'}
          sub={latestProposal?.codigo}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <InfoCard
          icon={Stamp}
          title={`Contratos (${allContracts.length})`}
          value={latestContract ? latestContract.status : 'Sem contrato'}
          sub={latestContract?.codigo}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <InfoCard
          icon={FileCheck}
          title="Documentos"
          value={`${documents.filter(d => d.validationStatus === 'Validado').length}/${documents.length} validados`}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Risk & Compliance */}
      {latestScore && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--pagsmile-green)]" />
            Compliance & Risco
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{latestScore.score_final ?? latestScore.score_geral_composto ?? '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Score Final</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{latestScore.subfaixa || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Subfaixa</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{latestScore.subfaixa_nome || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Classificação</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{latestScore.recomendacao_final || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Recomendação</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{latestScore.monitoramento_nivel || '—'}</p>
              <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Monitoramento</p>
            </div>
          </div>
        </div>
      )}

      {/* Red Flags */}
      {latestCase?.redFlags?.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Red Flags ({latestCase.redFlags.length})
          </h3>
          <ul className="space-y-1">
            {latestCase.redFlags.map((flag, i) => (
              <li key={i} className="text-xs text-red-700/80 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lead Data Summary */}
      {lead && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3">Dados Comerciais (Lead)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {lead.tpvMensal && (
              <div>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50">TPV Mensal</p>
                <p className="font-semibold">R$ {Number(lead.tpvMensal).toLocaleString('pt-BR')}</p>
              </div>
            )}
            {lead.ticketMedio && (
              <div>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Ticket Médio</p>
                <p className="font-semibold">R$ {Number(lead.ticketMedio).toLocaleString('pt-BR')}</p>
              </div>
            )}
            {lead.businessSubCategory && (
              <div>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Segmento</p>
                <p className="font-semibold capitalize">{lead.businessSubCategory}</p>
              </div>
            )}
            {lead.priscilaRiskLevel && (
              <div>
                <p className="text-[10px] text-[var(--pagsmile-blue)]/50">Risco PRISCILA</p>
                <Badge className={`text-[10px] ${
                  lead.priscilaRiskLevel === 'BAIXO' ? 'bg-green-100 text-green-700' :
                  lead.priscilaRiskLevel === 'MEDIO' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>{lead.priscilaRiskLevel}</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subsellers Count */}
      {!merchant.isSubseller && subsellers.length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Subsellers ({subsellers.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center text-xs">
            <div>
              <p className="text-lg font-bold text-green-600">{subsellers.filter(s => s.onboardingStatus === 'Aprovado').length}</p>
              <p className="text-[var(--pagsmile-blue)]/50">Aprovados</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{subsellers.filter(s => s.onboardingStatus === 'Manual').length}</p>
              <p className="text-[var(--pagsmile-blue)]/50">Manual</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{subsellers.filter(s => ['Pendente', 'Em Análise'].includes(s.onboardingStatus)).length}</p>
              <p className="text-[var(--pagsmile-blue)]/50">Pendentes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{subsellers.filter(s => s.onboardingStatus === 'Recusado').length}</p>
              <p className="text-[var(--pagsmile-blue)]/50">Recusados</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--pagsmile-blue)]">{subsellers.filter(s => s.type === 'PF').length}</p>
              <p className="text-[var(--pagsmile-blue)]/50">PF</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}