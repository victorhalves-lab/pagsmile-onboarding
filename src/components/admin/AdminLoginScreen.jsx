import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

export default function AdminLoginScreen({ onSuccess }) {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode1, setShowCode1] = useState(false);
  const [showCode2, setShowCode2] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('verifyAdminCode', { 
        code: code1, 
        code2: code2 
      });
      if (response.data?.success) {
        sessionStorage.setItem('admin_verified', 'true');
        onSuccess();
      } else {
        setError('Códigos de acesso inválidos.');
      }
    } catch (err) {
      setError('Códigos de acesso inválidos.');
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
          <p className="text-white/50 text-sm">Insira os dois códigos de acesso da equipe para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
          {/* Primeiro código */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Código de Acesso 1</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                type={showCode1 ? 'text' : 'password'}
                value={code1}
                onChange={(e) => setCode1(e.target.value)}
                placeholder="Primeiro código de acesso"
                className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#2bc196] focus:ring-[#2bc196]"
                autoFocus
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

          {/* Segundo código */}
          <div>
            <label className="text-white/50 text-xs font-medium mb-1.5 block">Código de Acesso 2</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                type={showCode2 ? 'text' : 'password'}
                value={code2}
                onChange={(e) => setCode2(e.target.value)}
                placeholder="Segundo código de acesso"
                className="pl-10 pr-10 bg-white/10 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#2bc196] focus:ring-[#2bc196]"
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
            disabled={loading || !code1 || !code2}
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