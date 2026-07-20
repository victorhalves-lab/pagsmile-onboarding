import React from 'react';
import { CheckCircle2, Clock, Mail, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LeadSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const protocolo = urlParams.get('protocolo');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
          alt="Pin Bank" 
          className="h-8 mx-auto mb-8"
        />

        {/* Sucesso */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--pinbank-blue)]/10 mb-6">
            <CheckCircle2 className="w-10 h-10 text-[var(--pinbank-blue)]" />
          </div>

          <h1 className="text-2xl font-bold text-[var(--pinbank-blue)] mb-2">
            Questionário Enviado!
          </h1>
          <p className="text-[var(--pinbank-blue)]/70 mb-6">
            Seus dados foram recebidos com sucesso. Nossa equipe entrará em contato em breve.
          </p>

          {protocolo && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-[var(--pinbank-blue)]/60 mb-1">Protocolo</p>
              <p className="text-lg font-mono font-bold text-[var(--pinbank-blue)]">{protocolo}</p>
            </div>
          )}

          <div className="space-y-4 text-left">
            <h3 className="font-semibold text-[var(--pinbank-blue)] text-sm">Próximos passos:</h3>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--pinbank-blue)]">Análise automática</p>
                <p className="text-xs text-[var(--pinbank-blue)]/60">
                  Nossa IA analisará seu perfil comercial em instantes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--pinbank-blue)]">Contato comercial</p>
                <p className="text-xs text-[var(--pinbank-blue)]/60">
                  Um especialista entrará em contato para discutir sua proposta
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--pinbank-blue)]">Prazo estimado</p>
                <p className="text-xs text-[var(--pinbank-blue)]/60">
                  Retorno em até 24 horas úteis
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--pinbank-blue)]/40 mt-6">
          &copy; {new Date().getFullYear()} Pin Bank. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}