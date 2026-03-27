import React from 'react';
import { Shield } from 'lucide-react';

const PAGSMILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

export default function LandingHeader({ companyName, companyLogoUrl }) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="bg-gradient-to-br from-[#002443] via-[#003366] to-[#002443] rounded-3xl p-8 md:p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2bc196]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5cf7cf]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Logos */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <img
              src={PAGSMILE_LOGO}
              alt="Pagsmile"
              className="h-8 md:h-10 w-auto"
            />
            {companyLogoUrl && (
              <>
                <div className="w-px h-10 bg-white/20" />
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="h-10 md:h-12 w-auto max-w-[180px] object-contain"
                />
              </>
            )}
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {companyName ? (
                <>Soluções de Pagamento<br /><span className="text-[#2bc196]">{companyName}</span></>
              ) : (
                <>Soluções de Pagamento <span className="text-[#2bc196]">Pagsmile</span></>
              )}
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
              Taxas competitivas, tecnologia de ponta e suporte especializado para o seu negócio crescer.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              'Antifraude Integrado',
              '3DS 2.0',
              'Split de Pagamentos',
              'Antecipação Flexível',
            ].map((badge) => (
              <div key={badge} className="hidden md:flex items-center gap-1.5 text-white/40 text-xs">
                <Shield className="w-3 h-3 text-[#2bc196]/60" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}