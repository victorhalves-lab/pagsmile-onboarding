import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight, User } from 'lucide-react';

const SUBFAIXA_COLORS = {
  '1A': 'bg-green-100 text-green-700',
  '1B': 'bg-green-100 text-green-700',
  '2A': 'bg-blue-100 text-blue-700',
  '2B': 'bg-blue-100 text-blue-700',
  '3A': 'bg-amber-100 text-amber-700',
  '3B': 'bg-amber-100 text-amber-700',
  '4':  'bg-orange-100 text-orange-700',
  '5':  'bg-red-100 text-red-700',
};

function formatDoc(doc) {
  if (!doc) return '—';
  const c = doc.replace(/\D/g, '');
  if (c.length === 14) return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (c.length === 11) return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

export default function CadastroSubsellersTab({ subsellers = [] }) {
  if (!subsellers.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <Users className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum subseller vinculado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-[var(--pinbank-blue)]/60 mb-2">{subsellers.length} subseller(s)</p>
      {subsellers.map(s => (
        <Link
          key={s.id}
          to={`/CadastroDetalhe?id=${s.id}`}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--pinbank-blue)]/8 hover:border-[var(--pinbank-blue)]/40 hover:shadow-md transition-all group"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {s.type === 'PJ' ? <Users className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--pinbank-blue)] truncate">
                {s.companyName || s.fullName}
              </span>
              <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
            </div>
            <p className="text-xs text-[var(--pinbank-blue)]/50">{formatDoc(s.cpfCnpj)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {s._scoreV4 != null && (
              <div className="text-center">
                <p className="text-xs font-bold text-[var(--pinbank-blue)]">{s._scoreV4}</p>
                <p className="text-[9px] text-[var(--pinbank-blue)]/40">Score V4</p>
              </div>
            )}
            {s._subfaixa && (
              <Badge className={`text-[10px] ${SUBFAIXA_COLORS[s._subfaixa] || 'bg-slate-100 text-slate-600'}`}>
                {s._subfaixa}{s._subfaixaNome ? ` • ${s._subfaixaNome}` : ''}
              </Badge>
            )}
            <Badge className="text-[10px]" variant="outline">{s.onboardingStatus}</Badge>
            <ChevronRight className="w-4 h-4 text-[var(--pinbank-blue)]/20 group-hover:text-[var(--pinbank-blue)]" />
          </div>
        </Link>
      ))}
    </div>
  );
}