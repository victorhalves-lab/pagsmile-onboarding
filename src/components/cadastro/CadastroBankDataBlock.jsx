import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Landmark, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pendente:   { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Aguardando' },
  preenchido: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Preenchido' },
  expirado:   { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Expirado' },
};

export default function CadastroBankDataBlock({ allCaseIds = [], merchantId }) {
  const { data: byCases = [] } = useQuery({
    queryKey: ['cadastro-bankdata-cases', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.BankDataCollection.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const { data: byMerchant = [] } = useQuery({
    queryKey: ['cadastro-bankdata-merchant', merchantId],
    queryFn: () => base44.entities.BankDataCollection.filter({ merchantId }),
    enabled: !!merchantId,
  });

  const records = useMemo(() => {
    const map = new Map();
    [...byCases, ...byMerchant].forEach(b => map.set(b.id, b));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [byCases, byMerchant]);

  if (!records.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-[var(--pagsmile-green)]" />
        Dados Bancários ({records.length})
      </h3>
      <div className="space-y-2">
        {records.map(r => {
          const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendente;
          const Icon = sc.icon;
          return (
            <div key={r.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={`gap-1 text-[10px] ${sc.color}`}><Icon className="w-3 h-3" />{sc.label}</Badge>
                  {r.linkSentAt && <span className="text-[10px] text-[var(--pagsmile-blue)]/50">enviado em {new Date(r.linkSentAt).toLocaleDateString('pt-BR')}</span>}
                  {r.filledAt && <span className="text-[10px] text-green-700">preenchido em {new Date(r.filledAt).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>
              {r.status === 'preenchido' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {r.banco && <div><p className="text-[10px] text-[var(--pagsmile-blue)]/50">Banco</p><p className="font-semibold">{r.banco}</p></div>}
                  {r.agencia && <div><p className="text-[10px] text-[var(--pagsmile-blue)]/50">Agência</p><p className="font-semibold">{r.agencia}{r.digitoAgencia ? `-${r.digitoAgencia}` : ''}</p></div>}
                  {r.conta && <div><p className="text-[10px] text-[var(--pagsmile-blue)]/50">Conta</p><p className="font-semibold">{r.conta}{r.digitoConta ? `-${r.digitoConta}` : ''}</p></div>}
                  {r.cpfCnpj && <div><p className="text-[10px] text-[var(--pagsmile-blue)]/50">CPF/CNPJ</p><p className="font-semibold">{r.cpfCnpj}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}