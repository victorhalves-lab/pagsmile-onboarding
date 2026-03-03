import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Link2, Copy, Clock, Send, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const STATUS_COLORS = {
  rascunho: 'bg-slate-100 text-slate-700',
  enviada: 'bg-yellow-100 text-yellow-700',
  visualizada: 'bg-orange-100 text-orange-700',
  contraproposta: 'bg-blue-100 text-blue-700',
  aceita: 'bg-green-100 text-green-700',
  recusada: 'bg-red-100 text-red-700',
  expirada: 'bg-slate-100 text-slate-500',
};

export default function LeadProposals({ leadId }) {
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['leadProposals', leadId],
    queryFn: () => base44.entities.Proposal.filter({ leadId }, '-created_date'),
    enabled: !!leadId
  });

  const copyLink = (p) => {
    const url = `${window.location.origin}/PropostaPublica?token=${p.tokenPublico}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Propostas ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-center py-4 text-[var(--pagsmile-blue)]/50 text-sm">Nenhuma proposta vinculada</p>
        ) : (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--pagsmile-green)]">{p.codigo}</span>
                    <Badge className={`text-[10px] ${STATUS_COLORS[p.status] || 'bg-slate-100'}`}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--pagsmile-blue)]/50">
                    {p.sentDate && (
                      <span className="flex items-center gap-0.5"><Send className="w-2.5 h-2.5" /> {moment(p.sentDate).format('DD/MM')}</span>
                    )}
                    {p.acceptedDate && (
                      <span className="flex items-center gap-0.5 text-green-600"><CheckCircle2 className="w-2.5 h-2.5" /> {moment(p.acceptedDate).format('DD/MM')}</span>
                    )}
                    {p.rejectedDate && (
                      <span className="flex items-center gap-0.5 text-red-600"><XCircle className="w-2.5 h-2.5" /> {moment(p.rejectedDate).format('DD/MM')}</span>
                    )}
                    {p.validUntil && (
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Válida até {moment(p.validUntil).format('DD/MM')}</span>
                    )}
                  </div>
                  {p.estimatedRevenue > 0 && (
                    <p className="text-[10px] text-[var(--pagsmile-green)] mt-0.5">
                      Receita estimada: R$ {p.estimatedRevenue.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link to={createPageUrl('CriarProposta') + `?edit=${p.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                  </Link>
                  {p.tokenPublico && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyLink(p)}>
                      <Link2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}