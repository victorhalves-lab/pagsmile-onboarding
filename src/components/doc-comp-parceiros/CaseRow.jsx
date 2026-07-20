import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkIcon, Copy, CheckCircle2, Clock, Building2, Users } from 'lucide-react';

const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const isCnpj = (s) => onlyDigits(s).length === 14;
const isCpf = (s) => onlyDigits(s).length === 11;
const formatDoc = (s) => {
  const d = onlyDigits(s);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return s || '—';
};

/**
 * A single row in the Doc Compliance Parceiros table.
 * Renders either a seller (role='seller') or a subseller (role='subseller').
 */
export default function CaseRow({
  caseRecord,
  merchant,
  role, // 'seller' | 'subseller' | 'seller-placeholder'
  resolvedDoc, // { doc, isPJ }
  bankRecord,
  selected,
  onToggleSelect,
  onGenerateLink,
  onCopyLink,
  generatingLinks,
  subsellerCount, // only for sellers
}) {
  const m = merchant || {};
  const isSubseller = role === 'subseller';
  const isPlaceholder = role === 'seller-placeholder';

  if (isPlaceholder) {
    // Shown when a seller merchant has subsellers in scope but no case of its own in the filter
    return (
      <tr className="border-b bg-blue-50/20">
        <td className="p-3" />
        <td className="p-3" colSpan={5}>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-[#0A0A0A]">{m.companyName || m.fullName || '— Seller sem caso visível —'}</span>
            <Badge variant="outline" className="text-[10px]">Seller</Badge>
            {subsellerCount > 0 && (
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                <Users className="w-3 h-3 mr-1" />{subsellerCount} subseller{subsellerCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </td>
      </tr>
    );
  }

  const c = caseRecord;
  const bs = (() => {
    if (!bankRecord) return { label: 'Sem link', tone: 'gray' };
    if (bankRecord.status === 'preenchido') return { label: 'Preenchido', tone: 'green' };
    if (bankRecord.status === 'pendente') return { label: 'Aguardando', tone: 'amber' };
    return { label: bankRecord.status, tone: 'gray' };
  })();
  const hasLink = !!bankRecord?.token;
  const isPJ = resolvedDoc?.isPJ ?? (m.type === 'PJ');
  const doc = resolvedDoc?.doc || c.cpfCnpj || m.cpfCnpj || '';
  const isValid = isPJ ? isCnpj(doc) : isCpf(doc);

  return (
    <tr className={`border-b hover:bg-gray-50/50 ${isSubseller ? 'bg-purple-50/20' : ''}`}>
      <td className="p-3">
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(c.id)} />
      </td>
      <td className="p-3">
        <div className={`flex items-center gap-2 ${isSubseller ? 'pl-6' : ''}`}>
          {isSubseller ? (
            <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
          ) : (
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-[#0A0A0A] flex items-center gap-2 flex-wrap">
              <span>{m.companyName || m.fullName || '—'}</span>
              {isSubseller ? (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Subseller</Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-[10px]">Seller</Badge>
                  {subsellerCount > 0 && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                      {subsellerCount} subseller{subsellerCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
          </div>
        </div>
      </td>
      <td className="p-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span>{formatDoc(doc)}</span>
          {isPJ && !isValid && <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">CNPJ não encontrado</Badge>}
          {isPJ && isValid && <Badge variant="outline" className="text-[10px]">CNPJ</Badge>}
          {!isPJ && isValid && <Badge variant="outline" className="text-[10px]">CPF</Badge>}
        </div>
      </td>
      <td className="p-3"><Badge variant="outline">{c.status}</Badge></td>
      <td className="p-3">
        <Badge
          className={
            bs.tone === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            bs.tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-gray-50 text-gray-600 border-gray-200'
          }
        >
          {bs.tone === 'green' && <CheckCircle2 className="w-3 h-3 mr-1" />}
          {bs.tone === 'amber' && <Clock className="w-3 h-3 mr-1" />}
          {bs.label}
        </Badge>
      </td>
      <td className="p-3 text-right space-x-2">
        {hasLink ? (
          <Button size="sm" variant="outline" onClick={() => onCopyLink(c.id)}>
            <Copy className="w-3 h-3 mr-1" /> Copiar link
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onGenerateLink([c.id])} disabled={generatingLinks}>
            <LinkIcon className="w-3 h-3 mr-1" /> Gerar link
          </Button>
        )}
      </td>
    </tr>
  );
}