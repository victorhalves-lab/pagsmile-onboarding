import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { LogOut, BarChart3 } from 'lucide-react';

export default function IntroducerPortalHeader({ user, introducer }) {
  return (
    <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white text-xl font-bold">
            {introducer?.name?.charAt(0) || 'I'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
                alt="Pagsmile" 
                className="h-5 w-auto opacity-80"
              />
              <span className="text-white/40 text-xs">|</span>
              <span className="text-white/60 text-xs font-medium">Portal do Parceiro</span>
            </div>
            <h1 className="text-xl font-bold text-white">{introducer?.name || 'Introducer'}</h1>
            <p className="text-white/50 text-xs mt-0.5">
              Código: <span className="font-mono text-[#5cf7cf]">{introducer?.referralCode}</span>
              {user?.email && <span className="ml-3">{user.email}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <BarChart3 className="w-4 h-4 text-[#5cf7cf]" />
            <span className="text-white/80 text-xs font-medium">Meu Dashboard</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => base44.auth.logout()}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}