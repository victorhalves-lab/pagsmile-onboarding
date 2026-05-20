// V5.2 — Banner exibido quando o tier do seller escala dinamicamente.
// Mostra qual foi a mudança (T1 → T2 → T3) + a lista de motivos.
import React from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

const TIER_LABEL = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
  subseller_pj: 'Subseller PJ',
  subseller_pf: 'Subseller PF',
};

function bannerKey(from, to) {
  if (from === 'tier_1' && to === 'tier_2') return 'tier.escalated.t1_to_t2';
  if (from === 'tier_1' && to === 'tier_3') return 'tier.escalated.t1_to_t3';
  if (from === 'tier_2' && to === 'tier_3') return 'tier.escalated.t2_to_t3';
  return 'tier.escalated.banner';
}

export default function TierEscalatedBanner({ tier_base, tier_final, motivos = [] }) {
  if (!tier_base || !tier_final || tier_base === tier_final) return null;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpRight className="w-4 h-4 text-indigo-700" />
        <span className="text-xs font-medium text-indigo-700">
          {TIER_LABEL[tier_base]} → {TIER_LABEL[tier_final]}
        </span>
      </div>
      <p className="text-sm text-indigo-900 mb-2">
        {getMicrocopy(bannerKey(tier_base, tier_final))}
      </p>
      {motivos.length > 0 && (
        <ul className="space-y-1 mt-2 pl-1 border-l-2 border-indigo-200">
          {motivos.map((m, i) => (
            <li key={i} className="text-xs text-indigo-800 flex gap-2 pl-2">
              <Info className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}