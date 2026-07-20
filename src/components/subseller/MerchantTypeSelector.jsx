import React from 'react';
import { User, Building2 } from 'lucide-react';

export default function MerchantTypeSelector({ onSelect, branding }) {
  const bPrimary = branding?.primaryColor || '#1356E2';
  const bSecondary = branding?.secondaryColor || '#0A0A0A';
  const hasBranding = !!branding?.name;

  const options = [
    {
      type: 'PF',
      title: 'Pessoa Física',
      description: 'CPF — Autônomo, profissional liberal ou vendedor individual',
      icon: User,
    },
    {
      type: 'PJ',
      title: 'Pessoa Jurídica',
      description: 'CNPJ — Empresa, MEI, EIRELI ou sociedade',
      icon: Building2,
    },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        {hasBranding ? (
          branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-9 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: bPrimary }}>
              {branding.name.charAt(0)}
            </div>
          )
        ) : (
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png"
            alt="Pin Bank"
            className="h-7 mx-auto mb-4"
          />
        )}
        <h1 className="text-2xl font-bold" style={{ color: bSecondary }}>
          Questionário de Compliance
        </h1>
        <p className="text-sm mt-2" style={{ color: bSecondary + '99' }}>
          Selecione o tipo de cadastro para iniciar o questionário
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="group bg-white rounded-2xl p-6 border-2 border-transparent hover:border-current transition-all duration-300 shadow-sm hover:shadow-lg text-left"
              style={{ '--tw-border-opacity': 1 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = bPrimary}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: bPrimary + '15' }}
              >
                <Icon className="w-7 h-7" style={{ color: bPrimary }} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: bSecondary }}>
                {opt.title}
              </h3>
              <p className="text-sm" style={{ color: bSecondary + '70' }}>
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="text-center mt-6">
        <p className="text-xs flex items-center justify-center gap-1" style={{ color: bSecondary + '50' }}>
          Seus dados estão protegidos e serão tratados com confidencialidade.
        </p>
      </div>
    </div>
  );
}