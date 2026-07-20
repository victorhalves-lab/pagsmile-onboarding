import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, KeyRound, HelpCircle } from 'lucide-react';

const ADMIN_TOKEN_KEY = 'base44_admin_jwt';

// Replaces AdminLoginScreen.
// Asks for TOTP + PIN per session. Backup code path available.

export default function TwoFactorLoginScreen({ onSuccess }) {
  const [totpCode, setTotpCode] = useState('');
  const [pin, setPin] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      const payload = useBackup ? { backupCode } : { totpCode, pin };
      const res = await base44.functions.invoke('twoFactorVerify', payload);
      const data = res.data || {};

      if (data.success && data.token) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        onSuccess(data.token);
      } else if (data.locked) {
        setLockedSeconds(data.retryAfterSeconds || 3600);
        setError(`Muitas tentativas. Aguarde ${Math.ceil((data.retryAfterSeconds || 3600) / 60)} minutos.`);
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (err) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      if (status === 429 || respData?.locked) {
        setLockedSeconds(respData?.retryAfterSeconds || 3600);
        setError(`Muitas tentativas. Aguarde ${Math.ceil((respData?.retryAfterSeconds || 3600) / 60)} minutos.`);
      } else {
        setError(respData?.error || 'Código inválido');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1356E2]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#1356E2]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verificação de 2 Fatores</h1>
          <p className="text-white/50 text-sm">
            {useBackup ? 'Use um dos seus códigos de backup.' : 'Insira o código do Google Authenticator e seu PIN pessoal.'}
          </p>
        </div>

        <form onSubmit={submit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
          {!useBackup ? (
            <>
              <div>
                <label className="text-white/50 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Código TOTP (6 dígitos)
                </label>
                <Input
                  type="text" inputMode="numeric" maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="bg-white/10 border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl focus:border-[#1356E2] focus:ring-[#1356E2]"
                  autoFocus autoComplete="one-time-code"
                  disabled={lockedSeconds > 0}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> PIN Pessoal (6 dígitos)
                </label>
                <Input
                  type="password" inputMode="numeric" maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="bg-white/10 border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl focus:border-[#1356E2] focus:ring-[#1356E2]"
                  autoComplete="off"
                  disabled={lockedSeconds > 0}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-white/50 text-xs font-medium mb-1.5 block">Código de Backup</label>
              <Input
                type="text" maxLength={11}
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXXX-XXXXX"
                className="bg-white/10 border-white/10 text-white text-center text-lg tracking-widest h-14 rounded-xl font-mono uppercase focus:border-[#1356E2]"
                autoFocus autoComplete="off"
                disabled={lockedSeconds > 0}
              />
              <p className="text-[10px] text-white/30 mt-1">Este código será consumido após o uso.</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading || lockedSeconds > 0 || (useBackup ? backupCode.length < 11 : (totpCode.length !== 6 || pin.length !== 6))}
            className="w-full h-12 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white font-semibold rounded-xl"
          >
            {loading ? 'Verificando...' : lockedSeconds > 0 ? 'Bloqueado' : 'Entrar'}
          </Button>

          <button
            type="button"
            onClick={() => { setUseBackup(!useBackup); setError(''); }}
            className="w-full text-xs text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5 pt-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {useBackup ? 'Voltar para TOTP + PIN' : 'Perdi meu Authenticator — usar código de backup'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          &copy; {new Date().getFullYear()} Pin Bank — Acesso restrito
        </p>
      </div>
    </div>
  );
}