import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, User, ChevronRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUS_CONFIG = {
  'Pendente': 'bg-gray-100 text-gray-700',
  'Em Análise': 'bg-blue-100 text-blue-700',
  'Aprovado': 'bg-green-100 text-green-700',
  'Manual': 'bg-amber-100 text-amber-700',
  'Recusado': 'bg-red-100 text-red-700',
};

function formatDoc(doc) {
  if (!doc) return '—';
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

export default function CadastroSubsellersTab({ subsellers }) {
  const [search, setSearch] = useState('');

  const filtered = subsellers.filter(s => {
    const q = search.toLowerCase();
    return !q ||
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.companyName || '').toLowerCase().includes(q) ||
      (s.cpfCnpj || '').includes(q);
  });

  if (!subsellers.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Users className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum subseller vinculado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
        <Input
          placeholder="Buscar subseller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(s => (
          <Link
            key={s.id}
            to={`/CadastroDetalhe?id=${s.id}`}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 hover:border-[var(--pagsmile-green)]/40 hover:shadow-md transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
              {s.type === 'PJ' ? <Building2 className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--pagsmile-blue)] truncate">{s.companyName || s.fullName}</span>
                <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
              </div>
              <p className="text-xs text-[var(--pagsmile-blue)]/50">{formatDoc(s.cpfCnpj)}</p>
            </div>
            <Badge className={`text-[10px] ${STATUS_CONFIG[s.onboardingStatus] || STATUS_CONFIG['Pendente']}`}>
              {s.onboardingStatus}
            </Badge>
            <ChevronRight className="w-4 h-4 text-[var(--pagsmile-blue)]/20 group-hover:text-[var(--pagsmile-green)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}