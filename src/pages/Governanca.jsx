import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, FileCheck, KeyRound, BookOpen, GitCommit } from 'lucide-react';
import GovernanceKPIs from '@/components/governance/GovernanceKPIs';
import AuditLogTable from '@/components/governance/AuditLogTable';
import AccessAuditTable from '@/components/governance/AccessAuditTable';
import SecurityAuditTable from '@/components/governance/SecurityAuditTable';
import GovernanceFramework from '@/components/governance/GovernanceFramework';
import ChangelogTimeline from '@/components/governance/ChangelogTimeline';

export default function Governanca() {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [accessAudits, setAccessAudits] = useState([]);
  const [twoFactor, setTwoFactor] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [users, setUsers] = useState([]);
  const [changelog, setChangelog] = useState([]);

  const loadAll = async () => {
    const [logs, access, tf, logins, allUsers, changes] = await Promise.all([
      base44.entities.AuditLog.list('-changeDate', 500).catch(() => []),
      base44.entities.AccessAudit.list('-created_date', 300).catch(() => []),
      base44.entities.TwoFactorAudit.list('-created_date', 200).catch(() => []),
      base44.entities.AdminLoginAttempt.list('-created_date', 200).catch(() => []),
      base44.entities.User.list().catch(() => []),
      base44.entities.CodeChangelog.list('-implementedAt', 500).catch(() => []),
    ]);
    setAuditLogs(logs);
    setAccessAudits(access);
    setTwoFactor(tf);
    setLoginAttempts(logins);
    setUsers(allUsers);
    setChangelog(changes);
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    const within30 = (arr, key) => arr.filter(a => new Date(a[key] || a.created_date).getTime() >= cutoff).length;
    return {
      auditLogsCount: within30(auditLogs, 'changeDate'),
      accessAuditsCount: within30(accessAudits, 'created_date'),
      loginAttemptsCount: within30(loginAttempts, 'created_date'),
      failedLoginsCount: loginAttempts.filter(l => !l.success && new Date(l.created_date).getTime() >= cutoff).length,
      twoFactorCount: within30(twoFactor, 'created_date'),
      activeAdmins: users.filter(u => u.role === 'admin').length,
    };
  }, [auditLogs, accessAudits, loginAttempts, twoFactor, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1356E2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#1356E2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">Governança</h1>
            <p className="text-sm text-[#0A0A0A]/60">Visão centralizada de auditoria, acessos, segurança e framework de governança.</p>
          </div>
        </div>
      </div>

      <GovernanceKPIs stats={stats} />

      <Tabs defaultValue="changelog">
        <TabsList>
          <TabsTrigger value="changelog"><GitCommit className="w-4 h-4 mr-2" /> Changelog</TabsTrigger>
          <TabsTrigger value="audit"><FileCheck className="w-4 h-4 mr-2" /> Audit Log</TabsTrigger>
          <TabsTrigger value="access"><Shield className="w-4 h-4 mr-2" /> Acessos</TabsTrigger>
          <TabsTrigger value="security"><KeyRound className="w-4 h-4 mr-2" /> Segurança / 2FA</TabsTrigger>
          <TabsTrigger value="framework"><BookOpen className="w-4 h-4 mr-2" /> Framework</TabsTrigger>
        </TabsList>
        <TabsContent value="changelog" className="mt-4"><ChangelogTimeline entries={changelog} onRefresh={loadAll} /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditLogTable logs={auditLogs} /></TabsContent>
        <TabsContent value="access" className="mt-4"><AccessAuditTable items={accessAudits} /></TabsContent>
        <TabsContent value="security" className="mt-4"><SecurityAuditTable twoFactor={twoFactor} loginAttempts={loginAttempts} /></TabsContent>
        <TabsContent value="framework" className="mt-4"><GovernanceFramework /></TabsContent>
      </Tabs>
    </div>
  );
}