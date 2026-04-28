import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AccessAuditTable({ items }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-[#002443] mb-3">Auditoria de Acessos & Permissões</h3>
      <p className="text-xs text-[#002443]/60 mb-4">Registra cada tentativa de acesso a páginas e ações sensíveis, indicando se foi permitida ou bloqueada pelo perfil.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-[#002443]/60">
            <tr>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Usuário</th>
              <th className="text-left px-3 py-2">Perfil</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Página/Alvo</th>
              <th className="text-left px-3 py-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {(!items || items.length === 0) && <tr><td colSpan={6} className="text-center py-8 text-[#002443]/50">Sem registros</td></tr>}
            {items?.slice(0, 150).map(a => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(a.created_date), 'dd/MM/yy HH:mm')}</td>
                <td className="px-3 py-2 text-xs">{a.user_email}</td>
                <td className="px-3 py-2 text-xs"><Badge variant="outline">{a.profile_slug || '—'}</Badge></td>
                <td className="px-3 py-2 text-xs">{a.action}</td>
                <td className="px-3 py-2 text-xs text-[#002443]/70">{a.target_page || a.target_entity || '—'}</td>
                <td className="px-3 py-2">
                  {a.allowed
                    ? <Badge className="bg-emerald-100 text-emerald-700">Permitido</Badge>
                    : <Badge className="bg-red-100 text-red-700">Bloqueado</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}