import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, ChevronUp, Scale, AlertTriangle, Calendar, 
  MapPin, Users, FileText, DollarSign, Clock, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

function LawsuitCard({ lawsuit, index }) {
  const [open, setOpen] = useState(false);

  const isCriminal = /criminal|penal|crime/i.test(lawsuit.type || '') || /criminal|penal|crime/i.test(lawsuit.area || '');
  const hasValue = lawsuit.value != null && Number(lawsuit.value) > 0;

  return (
    <div className={`border rounded-xl overflow-hidden ${isCriminal ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className={`p-1.5 rounded-lg mt-0.5 ${isCriminal ? 'bg-red-100' : 'bg-blue-50'}`}>
          <Scale className={`w-4 h-4 ${isCriminal ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#002443] font-mono">{lawsuit.number}</span>
            {isCriminal && (
              <Badge className="bg-red-100 text-red-700 border border-red-200 text-[9px]">
                <AlertTriangle className="w-3 h-3 mr-0.5" /> CRIMINAL
              </Badge>
            )}
            {lawsuit.status && (
              <Badge variant="outline" className="text-[9px]">{lawsuit.status}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {lawsuit.type && (
              <span className="text-[11px] text-[#002443]/60">{lawsuit.type}</span>
            )}
            {lawsuit.area && lawsuit.area !== lawsuit.type && (
              <span className="text-[11px] text-[#002443]/40">• {lawsuit.area}</span>
            )}
          </div>
          {lawsuit.subject && (
            <p className="text-[11px] text-[#002443]/70 mt-1 line-clamp-2">{lawsuit.subject}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasValue && (
            <span className="text-xs font-semibold text-[#002443]">
              R$ {Number(lawsuit.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>

      {/* Details */}
      {open && (
        <div className="border-t border-slate-100 p-4 bg-[#fafafa] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lawsuit.court && (
              <DetailField icon={MapPin} label="Tribunal / Vara" value={lawsuit.court} />
            )}
            {lawsuit.jurisdiction && (
              <DetailField icon={Scale} label="Instância / Jurisdição" value={lawsuit.jurisdiction} />
            )}
            {lawsuit.startDate && (
              <DetailField icon={Calendar} label="Data de Distribuição" value={formatDate(lawsuit.startDate)} />
            )}
            {lawsuit.lastUpdate && (
              <DetailField icon={Clock} label="Última Movimentação" value={formatDate(lawsuit.lastUpdate)} />
            )}
            {lawsuit.pole && (
              <DetailField icon={Users} label="Polo" value={lawsuit.pole} />
            )}
            {hasValue && (
              <DetailField icon={DollarSign} label="Valor da Causa" value={`R$ ${Number(lawsuit.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            )}
          </div>

          {lawsuit.lastMovement && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#002443]/50 mb-1">Última Movimentação</p>
              <p className="text-xs text-[#002443]/80 leading-relaxed">{lawsuit.lastMovement}</p>
            </div>
          )}

          {lawsuit.subject && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#002443]/50 mb-1">Assunto / Descrição</p>
              <p className="text-xs text-[#002443]/80 leading-relaxed">{lawsuit.subject}</p>
            </div>
          )}

          {/* Parties */}
          {lawsuit.parties && lawsuit.parties.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#002443]/50 mb-2">Partes Envolvidas</p>
              <div className="space-y-1.5">
                {lawsuit.parties.map((party, i) => {
                  const name = typeof party === 'string' ? party : (party?.Name || party?.PartyName || party?.PersonName || JSON.stringify(party));
                  const role = typeof party === 'object' ? (party?.Role || party?.PartyRole || party?.Pole || '') : '';
                  const doc = typeof party === 'object' ? (party?.TaxIdNumber || party?.Document || '') : '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <Users className="w-3 h-3 text-[#002443]/30 shrink-0" />
                      <span className="text-[#002443] font-medium">{name}</span>
                      {role && <span className="text-[#002443]/40">({role})</span>}
                      {doc && <span className="text-[#002443]/30 font-mono text-[10px]">{doc}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-[#002443]/30 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-[#002443]/40 font-medium">{label}</p>
        <p className="text-xs text-[#002443]/80">{value}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/D';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function BDCLawsuitsViewer({ lawsuits }) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!lawsuits || lawsuits.length === 0) return null;

  const criminalCount = lawsuits.filter(l => /criminal|penal|crime/i.test(l.type || '') || /criminal|penal|crime/i.test(l.area || '')).length;

  const filtered = lawsuits.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.number || '').toLowerCase().includes(q) ||
      (l.court || '').toLowerCase().includes(q) ||
      (l.type || '').toLowerCase().includes(q) ||
      (l.subject || '').toLowerCase().includes(q) ||
      (l.area || '').toLowerCase().includes(q)
    );
  });

  const displayed = showAll ? filtered : filtered.slice(0, 10);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h5 className="text-xs font-bold text-[#002443]">
            {lawsuits.length} Processo(s) Detalhado(s)
          </h5>
          {criminalCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 border text-[9px]">
              {criminalCount} criminal(is)
            </Badge>
          )}
        </div>
      </div>

      {lawsuits.length > 3 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#002443]/30" />
          <Input
            placeholder="Buscar por número, vara, tipo, assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}

      <div className="space-y-2">
        {displayed.map((lawsuit, i) => (
          <LawsuitCard key={i} lawsuit={lawsuit} index={i} />
        ))}
      </div>

      {filtered.length > 10 && !showAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-xs"
        >
          Ver todos os {filtered.length} processos
        </Button>
      )}
    </div>
  );
}