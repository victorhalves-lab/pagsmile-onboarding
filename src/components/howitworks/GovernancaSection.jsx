import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, History, UserCheck, Key } from 'lucide-react';

/**
 * HowItWorks Section — Governança & Acesso (v9.0)
 * Cobre: AccessProfile granular, 2FA TOTP+PIN forçado, AccessAudit, TwoFactorAudit, AdminLoginAttempt.
 * Fontes: components/admin/* + functions/twoFactor* + functions/admin* + entities/AccessProfile.
 */
export default function GovernancaSection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#5cf7cf]" /> Três Camadas de Proteção
        </h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Controle granular de acesso (AccessProfile) + autenticação multifator obrigatória (TOTP + PIN pessoal)
          + auditoria 100% (AccessAudit + TwoFactorAudit + AdminLoginAttempt). Todas as ações dos perfis admin
          são rastreadas com retenção de 5 anos (Lei 9.613/1998 Art. 10).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="bg-blue-50/60 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" /> AccessProfile (Perfis Granulares)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#002443]/75">
            <p><strong>5 perfis pré-instalados:</strong> Administrador, Analista de Compliance, Analista Comercial, CEO/Diretor, Introducer.</p>
            <p><strong>Default deny:</strong> qualquer página/aba/sub-aba/ação não permitida fica oculta E inacessível via URL direta.</p>
            <p><strong>4 níveis de granularidade:</strong> canView (página) → tabs (canView/canEdit) → subTabs → actions (botões específicos como "Aprovar caso").</p>
            <p><strong>Telas:</strong> /GestaoPerfis (CRUD), /EditorPerfil?slug=... (editor visual), /GestaoUsuarios (atribuição).</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-purple-50/60 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" /> 2FA Obrigatório (TOTP + PIN)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#002443]/75">
            <p><strong>Enrollment forçado:</strong> todo admin é obrigado a configurar 2FA no primeiro login (TwoFactorEnrollScreen).</p>
            <p><strong>TOTP RFC 6238:</strong> secret 160 bits (Base32, 32 chars), compatível com Google Authenticator/Authy/1Password. Janela ±1 step (30s) para clock drift.</p>
            <p><strong>PIN pessoal:</strong> 6 dígitos hasheados com SHA-256 + salt 128 bits.</p>
            <p><strong>10 backup codes:</strong> uso único, hasheados ao gerar.</p>
            <p><strong>JWT:</strong> assinado com ADMIN_JWT_SECRET, expira em 2h, validado server-side a cada page load via verifyAdminToken — adulteração via DevTools impossível.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-amber-50/60 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" /> Anti Brute-Force (AdminLoginAttempt)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#002443]/75">
            <p><strong>5 falhas em 15min</strong> → usuário bloqueado por 30min, evento <code>locked_out</code>.</p>
            <p><strong>10 falhas em 1h</strong> → alerta automático ao canal #security do Slack.</p>
            <p><strong>20 falhas de IPs distintos em 24h</strong> → alerta crítico + exigência de rotação de senha.</p>
            <p>Cada tentativa registra email, sucesso/falha, hash do IP (SHA-256), user-agent e motivo.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-emerald-50/60 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" /> Auditoria 100% (5 anos)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#002443]/75">
            <p><strong>AccessAudit:</strong> page_view, tab_view, subtab_view, action_executed, access_denied, profile_changed, login, logout — com IP hash, user-agent, payload de detalhes.</p>
            <p><strong>TwoFactorAudit:</strong> enroll_start/complete, totp_success/fail, pin_success/fail, backup_code_used, admin_reset, locked_out.</p>
            <p><strong>Tela /AuditoriaAcessos:</strong> visualização unificada com filtros + exportação CSV para auditorias regulatórias.</p>
            <p><strong>Retenção:</strong> 5 anos conforme Lei 9.613/1998 Art. 10.</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-bold text-amber-900 mb-1">⚠️ Usuários de Parceiros Externos (fora de AccessProfile)</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          Usuários de parceiros de compliance vivem na entidade <code>CompliancePartnerUser</code> (não AccessProfile) com 3 papéis:
          viewer (só leitura), analyst (pode submeter recomendação) e manager (pode reatribuir casos dentro do parceiro).
          Acessam apenas /ComplianceParceiro e /ComplianceParceiroDetalhe com visibilidade controlada (full/redacted/summary_only).
        </p>
      </div>
    </div>
  );
}