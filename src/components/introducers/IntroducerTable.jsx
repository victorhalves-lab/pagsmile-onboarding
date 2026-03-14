import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Link as LinkIcon, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const getScoreColor = (score) => {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export default function IntroducerTable({ introducers, leads, proposals, onEdit }) {
  const getIntroducerMetrics = (introducer) => {
    const introLeads = leads.filter(l => l.introducerId === introducer.id);
    const totalLeads = introLeads.length;

    const introProposals = proposals.filter(p => {
      const lead = introLeads.find(l => l.id === p.leadId);
      return !!lead;
    });
    const accepted = introProposals.filter(p => p.status === 'aceita');
    const volume = accepted.reduce((sum, p) => sum + (p.estimatedRevenue || 0), 0);
    const successRate = totalLeads > 0 ? ((accepted.length / totalLeads) * 100).toFixed(1) : '0.0';

    const leadsWithScore = introLeads.filter(l => l.priscilaQualityScore != null);
    const avgScore = leadsWithScore.length > 0
      ? Math.round(leadsWithScore.reduce((sum, l) => sum + l.priscilaQualityScore, 0) / leadsWithScore.length)
      : null;

    return { totalLeads, proposalsCreated: introProposals.length, accepted: accepted.length, volume, successRate, avgScore };
  };

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código UTM</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead className="text-center">Score Médio</TableHead>
              <TableHead className="text-center">Propostas Aceitas</TableHead>
              <TableHead className="text-right">Volume (R$)</TableHead>
              <TableHead className="text-center">Conversão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {introducers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <p className="text-[#002443]/50">Nenhum introducer encontrado</p>
                </TableCell>
              </TableRow>
            ) : introducers.map(intro => {
              const m = getIntroducerMetrics(intro);
              return (
                <TableRow key={intro.id} className="hover:bg-[#f4f4f4] transition-colors">
                  <TableCell><p className="font-semibold text-sm text-[#002443]">{intro.name}</p></TableCell>
                  <TableCell><span className="font-mono text-xs bg-[#f4f4f4] px-2 py-1 rounded-lg">{intro.referralCode}</span></TableCell>
                  <TableCell><span className="text-xs text-[#002443]/60">{intro.contactEmail || '-'}</span></TableCell>
                  <TableCell>
                    <Badge className={intro.status === 'active' ? 'bg-green-100 text-green-700 text-xs' : 'bg-slate-100 text-slate-500 text-xs'}>
                      {intro.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"><span className="font-bold text-sm">{m.totalLeads}</span></TableCell>
                  <TableCell className="text-center">
                    {m.avgScore != null ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreColor(m.avgScore)}`}>
                        <Star className="w-3 h-3" /> {m.avgScore}
                      </span>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="text-center"><span className="font-bold text-sm text-[#2bc196]">{m.accepted}</span></TableCell>
                  <TableCell className="text-right"><span className="font-mono text-sm">{m.volume > 0 ? `R$ ${m.volume.toLocaleString('pt-BR')}` : '-'}</span></TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-[#002443]/5 text-[#002443] text-xs border-0">{m.successRate}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(intro)} className="h-7"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Link to={createPageUrl('QuestionariosLeads') + `?introducer=${intro.referralCode}`}>
                        <Button variant="ghost" size="sm" className="h-7"><Eye className="w-3.5 h-3.5" /></Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}