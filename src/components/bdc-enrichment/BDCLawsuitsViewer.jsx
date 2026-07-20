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
            <span className="text-xs font-bold text-[#0A0A0A] font-mono">{lawsuit.number}</span>
            {lawsuit.ownerName && (
              <Badge className="bg-violet-100 text-violet-700 border border-violet-200 text-[9px]">
                <Users className="w-3 h-3 mr-0.5" /> {lawsuit.ownerName}
              </Badge>
            )}
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
              <span className="text-[11px] text-[#0A0A0A]/60">{lawsuit.type}</span>
            )}
            {lawsuit.area && lawsuit.area !== lawsuit.type && (
              <span className="text-[11px] text-[#0A0A0A]/40">• {lawsuit.area}</span>
            )}
          </div>
          {lawsuit.subject && (
            <p className="text-[11px] text-[#0A0A0A]/70 mt-1 line-clamp-2">{lawsuit.subject}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasValue && (
            <span className="text-xs font-semibold text-[#0A0A0A]">
              R$ {Number(lawsuit.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
        </div>
      </button>

      {/* Details */}
      {open && (
        <div className="border-t border-slate-100 p-4 bg-[#fafafa] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lawsuit.court && (
              <DetailField icon={MapPin} label="Tribunal" value={lawsuit.court} />
            )}
            {lawsuit.judgingBody && (
              <DetailField icon={Scale} label="Órgão Julgador / Vara" value={lawsuit.judgingBody} />
            )}
            {lawsuit.courtType && (
              <DetailField icon={Scale} label="Tipo de Justiça" value={lawsuit.courtType} />
            )}
            {lawsuit.courtDistrict && (
              <DetailField icon={MapPin} label="Comarca" value={lawsuit.courtDistrict} />
            )}
            {lawsuit.state && (
              <DetailField icon={MapPin} label="UF" value={lawsuit.state} />
            )}
            {lawsuit.jurisdiction && !lawsuit.courtType && (
              <DetailField icon={Scale} label="Instância / Jurisdição" value={lawsuit.jurisdiction} />
            )}
            {lawsuit.startDate && (
              <DetailField icon={Calendar} label="Data de Distribuição" value={formatDate(lawsuit.startDate)} />
            )}
            {lawsuit.lastUpdate && (
              <DetailField icon={Clock} label="Última Movimentação" value={formatDate(lawsuit.lastUpdate)} />
            )}
            {lawsuit.closeDate && lawsuit.closeDate !== '0001-01-01T00:00:00' && (
              <DetailField icon={Calendar} label="Data de Encerramento" value={formatDate(lawsuit.closeDate)} />
            )}
            {lawsuit.lawsuitAge != null && (
              <DetailField icon={Clock} label="Idade do Processo" value={`${lawsuit.lawsuitAge} dias`} />
            )}
            {lawsuit.numberOfUpdates > 0 && (
              <DetailField icon={FileText} label="Total de Movimentações" value={String(lawsuit.numberOfUpdates)} />
            )}
            {lawsuit.hostService && (
              <DetailField icon={FileText} label="Sistema" value={lawsuit.hostService} />
            )}
            {lawsuit.pole && (
              <DetailField icon={Users} label="Polo" value={lawsuit.pole} />
            )}
            {hasValue && (
              <DetailField icon={DollarSign} label="Valor da Causa" value={`R$ ${Number(lawsuit.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            )}
          </div>

          {/* Subject + Inferred */}
          {(lawsuit.subject || lawsuit.inferredSubject) && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-1">Assunto Principal</p>
              <p className="text-xs text-[#0A0A0A]/80 leading-relaxed font-medium">{lawsuit.subject || lawsuit.inferredSubject}</p>
              {lawsuit.otherSubjects && lawsuit.otherSubjects.length > 0 && (
                <div className="mt-1.5">
                  <p className="text-[10px] text-[#0A0A0A]/40 mb-0.5">Outros assuntos:</p>
                  {lawsuit.otherSubjects.map((s, i) => (
                    <span key={i} className="text-[11px] text-[#0A0A0A]/60 mr-2">• {s}</span>
                  ))}
                </div>
              )}
              {lawsuit.inferredBroadSubject && lawsuit.inferredBroadSubject !== lawsuit.subject && (
                <p className="text-[10px] text-[#0A0A0A]/40 mt-1">Área ampla: {lawsuit.inferredBroadSubject}</p>
              )}
            </div>
          )}

          {/* Recent Updates (movimentações) */}
          {lawsuit.recentUpdates && lawsuit.recentUpdates.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-2">
                Últimas Movimentações ({lawsuit.recentUpdates.length} de {lawsuit.numberOfUpdates || lawsuit.recentUpdates.length})
              </p>
              <div className="space-y-2">
                {lawsuit.recentUpdates.map((upd, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="text-[10px] text-[#0A0A0A]/35 font-mono whitespace-nowrap min-w-[70px]">
                      {upd.date ? formatDate(upd.date) : '—'}
                    </span>
                    <span className="text-[#0A0A0A]/70 leading-relaxed">{upd.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback: lastMovement if no recentUpdates */}
          {(!lawsuit.recentUpdates || lawsuit.recentUpdates.length === 0) && lawsuit.lastMovement && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-1">Última Movimentação</p>
              <p className="text-xs text-[#0A0A0A]/80 leading-relaxed">{lawsuit.lastMovement}</p>
            </div>
          )}

          {/* Parties */}
          {lawsuit.parties && lawsuit.parties.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-2">Partes Envolvidas ({lawsuit.parties.length})</p>
              <div className="space-y-1.5">
                {lawsuit.parties.map((party, i) => {
                  const name = typeof party === 'string' ? party : (party?.name || party?.Name || party?.PartyName || '');
                  const role = typeof party === 'object' ? (party?.specificType || party?.type || party?.Type || party?.Role || '') : '';
                  const doc = typeof party === 'object' ? (party?.doc || party?.Doc || party?.TaxIdNumber || '') : '';
                  const polarity = typeof party === 'object' ? (party?.polarity || party?.Polarity || '') : '';
                  const polarityColors = { ACTIVE: 'text-blue-600', PASSIVE: 'text-red-600', NEUTRAL: 'text-slate-500' };
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px] flex-wrap">
                      <Users className="w-3 h-3 text-[#0A0A0A]/30 shrink-0" />
                      <span className="text-[#0A0A0A] font-medium">{name || 'N/I'}</span>
                      {role && <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 ${polarityColors[polarity] || 'text-[#0A0A0A]/50'}`}>{role}</span>}
                      {doc && <span className="text-[#0A0A0A]/30 font-mono text-[10px]">{doc}</span>}
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
      <Icon className="w-3.5 h-3.5 text-[#0A0A0A]/30 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-[#0A0A0A]/40 font-medium">{label}</p>
        <p className="text-xs text-[#0A0A0A]/80">{value}</p>
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
          <h5 className="text-xs font-bold text-[#0A0A0A]">
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0A0A0A]/30" />
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