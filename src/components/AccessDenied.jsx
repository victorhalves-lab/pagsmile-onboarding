import React from 'react';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f4f4]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-50">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#002443] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Acesso Restrito
          </h1>
          <p className="text-[#002443]/60 text-sm mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Esta área é exclusiva para usuários autorizados da plataforma PagSmile. 
            Seu e-mail não possui permissão de acesso.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-[#002443]/70 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <p className="font-semibold text-amber-800 mb-2">O que fazer?</p>
            <ul className="list-disc list-inside space-y-1 text-left text-xs">
              <li>Entre em contato com o administrador para solicitar acesso</li>
              <li>Verifique se está usando o e-mail correto</li>
              <li>Se recebeu um convite, use o mesmo e-mail do convite</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => base44.auth.logout(window.location.origin)}
              className="w-full bg-[#002443] hover:bg-[#002443]/90 text-white h-11 rounded-xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair e trocar de conta
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="w-full text-[#002443]/50 hover:text-[#002443] h-10"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à página inicial
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-[#002443]/30 mt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        © {new Date().getFullYear()} PagSmile — Plataforma de Pagamentos
      </p>
    </div>
  );
}