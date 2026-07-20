import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, FileCheck, KeyRound, AlertTriangle, Users, Lock } from 'lucide-react';

export default function GovernanceKPIs({ stats }) {
  const items = [
    { label: 'Eventos Auditados (30d)', value: stats.auditLogsCount, icon: FileCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Acessos Registrados (30d)', value: stats.accessAuditsCount, icon: Shield, color: 'text-blue-600 bg-blue-50' },
    { label: 'Logins Admin (30d)', value: stats.loginAttemptsCount, icon: KeyRound, color: 'text-violet-600 bg-violet-50' },
    { label: 'Tentativas Bloqueadas', value: stats.failedLoginsCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Eventos 2FA (30d)', value: stats.twoFactorCount, icon: Lock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Usuários Admin Ativos', value: stats.activeAdmins, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${it.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-[#0A0A0A]">{it.value ?? '—'}</div>
            <div className="text-xs text-[#0A0A0A]/60 mt-0.5">{it.label}</div>
          </Card>
        );
      })}
    </div>
  );
}