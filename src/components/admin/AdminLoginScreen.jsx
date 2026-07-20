import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

// Storage key for the signed JWT. Value is useless without server secret.
const ADMIN_TOKEN_KEY = 'base44_admin_jwt';

export default function AdminLoginScreen({ onSuccess }) {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode1, setShowCode1] = useState(false);
  const [showCode2, setShowCode2] = useState(false);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('verifyAdminCode', {
        code: code1,
        code2: code2,
      });
      const data = response.data || {};

      if (data.success && data.token) {
        // Store the signed JWT. Server will validate on every mount.
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        onSuccess(data.token);
      } else if (data.locked) {
        setLockedSeconds(data.retryAfterSeconds || 3600);
        setError(`Muitas tentativas falhas. Aguarde ${Math.ceil((data.retryAfterSeconds || 3600) / 60)} minutos.`);
      } else {
        setError('Códigos de acesso inválidos.');
      }
    } catch (err) {
      // Axios throws on non-2xx. Extract message if possible.
      const status = err?.response?.status;
      const respData = err?.response?.data;
      if (status === 429 || respData?.locked) {
        setLockedSeconds(respData?.retryAfterSeconds || 3600);
        setError(`Muitas tentativas. Aguarde ${Math.ceil((respData?.retryAfterSeconds || 3600) / 60)} minutos.`);
      } else if (status === 403) {
        setError('Acesso negado. Sua conta não tem permissão.');
      } else if (status === 401) {
        setError('Você precisa estar autenticado.');
      } else {
        setError('Códigos de acesso inválidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1356E2]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#1356E2]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Área Administrativa</h1>
          <p className="text-white/50 text-sm">Insira os dois códigos de acesso da equipe para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Código de Acesso 1</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                type={showCode1 ? 'text' : 'password'}
                value={code1}
                onChange={(e) => setCode1(e.target.value)}
                placeholder="Primeiro código de acesso"
                className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#1356E2] focus:ring-[#1356E2]"
                autoFocus
                autoComplete="off"
                disabled={lockedSeconds > 0}
              />
              <button
                type="button"
                onClick={() => setShowCode1(!showCode1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showCode1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Código de Acesso 2</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                type={showCode2 ? 'text' : 'password'}
                value={code2}
                onChange={(e) => setCode2(e.target.value)}
                placeholder="Segundo código de acesso"
                className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#1356E2] focus:ring-[#1356E2]"
                autoComplete="off"
                disabled={lockedSeconds > 0}
              />
              <button
                type="button"
                onClick={() => setShowCode2(!showCode2)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showCode2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !code1 || !code2 || lockedSeconds > 0}
            className="w-full h-12 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white font-semibold rounded-xl"
          >
            {loading ? 'Verificando...' : lockedSeconds > 0 ? 'Bloqueado' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          &copy; {new Date().getFullYear()} Pin Bank — Acesso restrito
        </p>
      </div>
    </div>
  );
}