import React from 'react';

/**
 * Header de zona da proposta pública (paleta Pin Bank oficial).
 *
 * variant:
 *  - 'online'     → fundo gradiente azul→verde escuro Pin Bank (autoridade, canal principal)
 *  - 'presencial' → fundo verde Pin Bank principal (tátil, físico)
 *  - 'outros'     → fundo cinza Pin Bank com borda verde (neutro, condições gerais)
 *
 * Uso: bloco visual que separa as 3 zonas da proposta pública.
 */
export default function SectionHeader({ icon: Icon, title, subtitle, variant = 'online' }) {
  const variants = {
    online: {
      wrapper: 'bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C]',
      iconBox: 'bg-[#E84B1C]/20',
      iconColor: 'text-[#E84B1C]',
      titleColor: 'text-white',
      subtitleColor: 'text-white/70',
    },
    presencial: {
      wrapper: 'bg-[#1356E2]',
      iconBox: 'bg-white/25',
      iconColor: 'text-white',
      titleColor: 'text-white',
      subtitleColor: 'text-white/85',
    },
    outros: {
      wrapper: 'bg-[#f4f4f4] border border-[#1356E2]/20',
      iconBox: 'bg-[#1356E2]/15',
      iconColor: 'text-[#E84B1C]',
      titleColor: 'text-[#0A0A0A]',
      subtitleColor: 'text-[#0A0A0A]/70',
    },
  };
  const v = variants[variant] || variants.online;

  return (
    <div className={`rounded-2xl p-5 md:p-6 mb-4 flex items-start gap-4 shadow-sm ${v.wrapper}`}>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${v.iconBox}`}>
          <Icon className={`w-5 h-5 ${v.iconColor}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className={`text-lg md:text-xl font-bold ${v.titleColor} leading-tight`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-xs md:text-sm mt-1 leading-relaxed ${v.subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}