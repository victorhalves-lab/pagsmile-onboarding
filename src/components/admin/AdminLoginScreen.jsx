import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginScreen({ onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('verifyAdminCode', { code });
      if (response.data?.success) {
        sessionStorage.setItem('admin_verified', 'true');
        onSuccess();
      } else {
        setError('Código de acesso inválido.');
      }
    } catch (err) {
      setError('Código de acesso inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#002443] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#2bc196]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Área Administrativa</h1>
          <p className="text-white/50 text-sm">Insira o código de acesso da equipe para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de acesso"
              className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#2bc196] focus:ring-[#2bc196]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !code}
            className="w-full h-12 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-semibold rounded-xl"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          &copy; {new Date().getFullYear()} Pagsmile — Acesso restrito
        </p>
      </div>
    </div>
  );
}