import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Shield, ChevronRight } from 'lucide-react';

const RISK_COLORS = {
  'BAIXO': 'bg-green-100 text-green-700',
  'BAIXO-MÉDIO': 'bg-blue-100 text-blue-700',
  'MÉDIO': 'bg-amber-100 text-amber-700',
  'MÉDIO-ALTO': 'bg-orange-100 text-orange-700',
  'ALTO': 'bg-red-100 text-red-700',
  'MUITO ALTO': 'bg-red-200 text-red-800',
};

export default function SegmentRatesList({ segments, activeId, onSelect }) {
  if (!segments?.length) return null;

  return (
    <div className="space-y-2">
      {segments.map(seg => {
        const isActive = seg.id === activeId;
        return (
          <button
            key={seg.id}
            onClick={() => onSelect(seg.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group
              ${isActive
                ? 'bg-[#2bc196]/10 border-[#2bc196]/40 shadow-sm'
                : 'bg-white border-[#002443]/8 hover:border-[#2bc196]/20 hover:bg-[#2bc196]/5'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate ${isActive ? 'text-[#2bc196]' : 'text-[#002443]'}`}>
                    {seg.segmentName}
                  </h3>
                  <Badge className={`text-[10px] px-1.5 py-0 ${RISK_COLORS[seg.riskLevel] || 'bg-gray-100 text-gray-600'}`}>
                    {seg.riskLevel}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#002443]/50">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    MDR: {seg.mdrAvista}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    PIX: {seg.pixTaxaPercentual}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    MCC: {seg.mcc}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#2bc196]' : 'text-[#002443]/20 group-hover:text-[#002443]/40'}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}