import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import PartnerMDRTable from './PartnerMDRTable';

export default function PartnerCard({ partner, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f4f4f4]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {partner.isPrincipal && <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#002443]">{partner.name}</h3>
              {partner.isPrincipal && (
                <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Principal</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-[11px] text-[#002443]/50">
              <span>Antecipação: <strong className="text-[#002443]">{(partner.percentualAntecipacao || 0).toFixed(2)}%</strong></span>
              <span>Fee: <strong className="text-[#002443]">R$ {(partner.transactionFee || 0).toFixed(2)}</strong></span>
              <span>Antifraude: <strong className="text-[#002443]">R$ {(partner.antifraudCost || 0).toFixed(2)}</strong></span>
              <span>3DS: <strong className="text-[#002443]">R$ {(partner.threeDSCost || 0).toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="w-4 h-4 text-[#002443]/40" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#002443]/30 ml-1" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30 ml-1" />}
        </div>
      </div>

      {/* Expanded - MDR Table */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#002443]/5 pt-4">
          <PartnerMDRTable mdr={partner.mdr || {}} readOnly />
        </div>
      )}
    </div>
  );
}