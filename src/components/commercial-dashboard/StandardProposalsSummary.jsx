import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

export default function StandardProposalsSummary({ standardProposals, pixProposals }) {
  // Standard proposals by segment
  const activeStd = standardProposals.filter(p => p.status === 'ativa');
  const segmentCounts = {};
  activeStd.forEach(p => {
    const seg = p.segment || 'Outros';
    segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
  });

  // PIX proposals summary
  const pixTotal = pixProposals.length;
  const pixSent = pixProposals.filter(p => !['rascunho', 'cancelada'].includes(p.status)).length;
  const pixAccepted = pixProposals.filter(p => p.status === 'aceita').length;

  return (
    <Card className="rounded-2xl border-[#0A0A0A]/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-[#0A0A0A]">
            <div className="p-1.5 rounded-lg bg-[#1356E2]/10">
              <FileText className="w-3.5 h-3.5 text-[#1356E2]" />
            </div>
            Propostas Padrão & PIX
          </CardTitle>
          <div className="flex gap-2">
            <Link to={createPageUrl('GestaoPropostasPadrao')}>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#1356E2] hover:text-[#0A0A0A] font-semibold">
                Padrão <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <Link to={createPageUrl('GestaoPropostasPix')}>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#1356E2] hover:text-[#0A0A0A] font-semibold">
                PIX <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Standard by segment */}
        <div>
          <p className="text-xs font-semibold text-[#0A0A0A]/50 uppercase mb-2">Propostas Padrão Ativas por Segmento</p>
          {Object.keys(segmentCounts).length === 0 ? (
            <p className="text-xs text-[#0A0A0A]/30">Nenhuma proposta padrão ativa</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).map(([seg, count]) => (
                <div key={seg} className="flex items-center justify-between p-2 rounded-lg bg-[#F7F5F0]">
                  <span className="text-xs font-medium text-[#0A0A0A]">{seg}</span>
                  <span className="text-xs font-bold text-[#0A0A0A]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIX summary */}
        <div>
          <p className="text-xs font-semibold text-[#0A0A0A]/50 uppercase mb-2">Propostas PIX</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[#F7F5F0]">
              <p className="text-lg font-bold text-[#0A0A0A]">{pixTotal}</p>
              <p className="text-[10px] text-[#0A0A0A]/40">Total</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50">
              <p className="text-lg font-bold text-blue-600">{pixSent}</p>
              <p className="text-[10px] text-[#0A0A0A]/40">Enviadas</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50">
              <p className="text-lg font-bold text-green-600">{pixAccepted}</p>
              <p className="text-[10px] text-[#0A0A0A]/40">Aceitas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}