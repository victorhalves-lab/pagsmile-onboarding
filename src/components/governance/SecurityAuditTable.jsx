import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const eventColors = {
  totp_success: 'bg-emerald-100 text-emerald-700',
  pin_success: 'bg-emerald-100 text-emerald-700',
  enroll_complete: 'bg-blue-100 text-blue-700',
  totp_fail: 'bg-red-100 text-red-700',
  pin_fail: 'bg-red-100 text-red-700',
  locked_out: 'bg-red-100 text-red-700',
  admin_reset: 'bg-amber-100 text-amber-700',
  backup_code_used: 'bg-violet-100 text-violet-700',
};

export default function SecurityAuditTable({ twoFactor, loginAttempts }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold text-[#0A0A0A] mb-3">Eventos 2FA</h3>
        <p className="text-xs text-[#0A0A0A]/60 mb-4">Enrollments, TOTP, PINs e códigos de backup dos administradores.</p>
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {(!twoFactor || twoFactor.length === 0) && <div className="text-center py-6 text-[#0A0A0A]/50 text-sm">Sem registros</div>}
          {twoFactor?.slice(0, 80).map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{t.user_email}</div>
                <div className="text-[#0A0A0A]/50">{format(new Date(t.created_date), 'dd/MM/yy HH:mm')}</div>
              </div>
              <Badge className={eventColors[t.event] || 'bg-slate-100'}>{t.event}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-[#0A0A0A] mb-3">Tentativas de Login Admin</h3>
        <p className="text-xs text-[#0A0A0A]/60 mb-4">Logs de cada tentativa de login no portal administrativo.</p>
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {(!loginAttempts || loginAttempts.length === 0) && <div className="text-center py-6 text-[#0A0A0A]/50 text-sm">Sem registros</div>}
          {loginAttempts?.slice(0, 80).map(l => (
            <div key={l.id} className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.user_email}</div>
                <div className="text-[#0A0A0A]/50">{format(new Date(l.created_date), 'dd/MM/yy HH:mm')} · {l.reason || '—'}</div>
              </div>
              {l.success
                ? <Badge className="bg-emerald-100 text-emerald-700">Sucesso</Badge>
                : <Badge className="bg-red-100 text-red-700">Falha</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}