import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, ShieldAlert } from 'lucide-react';

/**
 * CommercialConsistencyAudit — Bloco que detecta discrepâncias entre Lead.status, Proposal,
 * StandardProposal e a FUV. Recebe o objeto `audit` retornado por buildCommercialDataset().
 *
 * Categorias:
 *   1. desyncedAcceptedLeads — leads com Proposal aceita mas Lead.status fora da família accepted
 *   2. orphanAcceptedMatchingByCnpj — propostas aceitas sem leadId, mas o CNPJ bate com um lead
 *   3. standardWithoutFlags — leads marcados na família accepted, sem Proposal e sem flags claras
 */
export default function CommercialConsistencyAudit({ audit }) {
  const [openSection, setOpenSection] = useState(null);
  const a = audit || {};
  const d = a.desyncedAcceptedLeads || [];
  const o = a.orphanAcceptedMatchingByCnpj || [];
  const s = a.standardWithoutFlags || [];

  const totalIssues = d.length + o.length + s.length;

  const sections = [
    {
      key: 'desynced',
      title: 'Leads dessincronizados',
      subtitle: 'Proposta aceita, mas Lead.status fora de proposta_aceita/kyc_*/ativado',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
      items: d,
      renderItem: (item) => (
        <div className="flex items-center justify-between gap-3 py-1.5 px-2 hover:bg-amber-50/50 rounded">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#002443] truncate">{item.fullName || '(sem nome)'}</p>
            <p className="text-[10px] text-[#002443]/50">status atual: <code className="bg-amber-100 px-1 rounded">{item.status}</code></p>
          </div>
          <Link to={`${createPageUrl('LeadDetails')}?id=${item.id}`} className="text-[10px] text-[#2bc196] hover:underline flex items-center gap-1 shrink-0">
            Abrir <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
    {
      key: 'orphan',
      title: 'Propostas órfãs com match por CNPJ',
      subtitle: 'Proposta aceita sem leadId, mas o CNPJ pertence a um lead existente',
      icon: ShieldAlert,
      color: 'text-purple-600 bg-purple-50',
      items: o,
      renderItem: (item) => (
        <div className="flex items-center justify-between gap-3 py-1.5 px-2 hover:bg-purple-50/50 rounded">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#002443] truncate">{item.clienteNome || '(sem nome)'} <span className="text-[#002443]/40">· {item.codigo || item.id}</span></p>
            <p className="text-[10px] text-[#002443]/50">CNPJ: {item.clienteCnpj}</p>
          </div>
          <Badge variant="outline" className="text-[9px]">precisa vincular leadId</Badge>
        </div>
      ),
    },
    {
      key: 'standard',
      title: 'Aceites suspeitos sem evidência',
      subtitle: 'Lead na família accepted, sem Proposal e sem flags de StandardProposal',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
      items: s,
      renderItem: (item) => (
        <div className="flex items-center justify-between gap-3 py-1.5 px-2 hover:bg-rose-50/50 rounded">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#002443] truncate">{item.fullName || '(sem nome)'}</p>
            <p className="text-[10px] text-[#002443]/50">
              status: <code className="bg-rose-100 px-1 rounded">{item.status}</code>
              {item.origemLead && <> · origem: <code className="bg-rose-100 px-1 rounded">{item.origemLead}</code></>}
            </p>
          </div>
          <Link to={`${createPageUrl('LeadDetails')}?id=${item.id}`} className="text-[10px] text-[#2bc196] hover:underline flex items-center gap-1 shrink-0">
            Abrir <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <Card className="rounded-2xl border-[#002443]/5 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${totalIssues === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {totalIssues === 0 ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#002443]">Auditoria de Consistência Comercial</h3>
              <p className="text-[11px] text-[#002443]/50">Discrepâncias entre Lead, Proposta e StandardProposal</p>
            </div>
          </div>
          {totalIssues === 0 ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Tudo consistente</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">{totalIssues} inconsistência{totalIssues > 1 ? 's' : ''}</Badge>
          )}
        </div>

        {totalIssues === 0 ? (
          <p className="text-xs text-[#002443]/60 text-center py-6">
            Nenhuma divergência detectada entre as fontes comerciais. ✨
          </p>
        ) : (
          <div className="space-y-2">
            {sections.map(sec => {
              if (sec.items.length === 0) return null;
              const isOpen = openSection === sec.key;
              const Icon = sec.icon;
              return (
                <div key={sec.key} className="border border-[#002443]/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isOpen ? null : sec.key)}
                    className="w-full flex items-center justify-between gap-3 p-3 hover:bg-[#f4f4f4]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${sec.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-semibold text-[#002443]">{sec.title}</p>
                        <p className="text-[10px] text-[#002443]/50 truncate">{sec.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{sec.items.length}</Badge>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#002443]/40" /> : <ChevronDown className="w-4 h-4 text-[#002443]/40" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#002443]/5 max-h-64 overflow-y-auto p-2 bg-[#f4f4f4]/30">
                      {sec.items.slice(0, 25).map((item, idx) => (
                        <div key={item.id || idx}>{sec.renderItem(item)}</div>
                      ))}
                      {sec.items.length > 25 && (
                        <p className="text-[10px] text-[#002443]/40 text-center mt-2">+ {sec.items.length - 25} adicional{sec.items.length - 25 > 1 ? 'is' : ''}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}