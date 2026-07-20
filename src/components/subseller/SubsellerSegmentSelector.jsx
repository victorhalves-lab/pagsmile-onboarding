import React from 'react';
import { ShoppingCart, Cloud, BookOpen, Truck } from 'lucide-react';

/**
 * Seletor de segmento para subsellers PJ.
 *
 * REGRA DE NEGÓCIO: subsellers/subcontas são SEMPRE vendedores finais dentro de
 * um seller principal (gateway/marketplace). Portanto só fazem sentido 4 segmentos
 * de operação de venda direta: E-commerce, Dropshipping, Infoprodutos e SaaS.
 *
 * Segmentos como Gateway, Marketplace, MPE, Educação e Link de Pagamento NÃO
 * existem no contexto de subseller — quem opera esses modelos é o seller principal.
 *
 * Cada segmento resolve para um QuestionnaireTemplate V4 completo (mesmo rigor do seller direto).
 */
const SEGMENTS = [
  {
    model: 'ComplianceEcommerceV4',
    storageKey: 'compliance_data_subseller_ecommerce',
    title: 'E-commerce',
    description: 'Loja virtual com produtos físicos',
    icon: ShoppingCart,
    color: '#3b82f6',
  },
  {
    model: 'ComplianceDropshippingV4',
    storageKey: 'compliance_data_subseller_dropshipping',
    title: 'Dropshipping',
    description: 'Venda sem estoque próprio',
    icon: Truck,
    color: '#ef4444',
  },
  {
    model: 'ComplianceInfoprodutosV4',
    storageKey: 'compliance_data_subseller_infoprodutos',
    title: 'Infoprodutos',
    description: 'Cursos, e-books, mentorias digitais',
    icon: BookOpen,
    color: '#f59e0b',
  },
  {
    model: 'ComplianceSaaSV4',
    storageKey: 'compliance_data_subseller_saas',
    title: 'SaaS',
    description: 'Software como serviço — assinatura recorrente',
    icon: Cloud,
    color: '#06b6d4',
  },
];

export default function SubsellerSegmentSelector({ onSelect, onBack, branding }) {
  const bPrimary = branding?.primaryColor || '#1356E2';
  const bSecondary = branding?.secondaryColor || '#0A0A0A';
  const hasBranding = !!branding?.name;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
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
          Qual é o segmento da sua empresa?
        </h1>
        <p className="text-sm mt-2" style={{ color: bSecondary + '99' }}>
          Selecione o segmento que melhor descreve sua atividade para iniciar o questionário correto.
        </p>
      </div>

      {/* Grid de segmentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SEGMENTS.map(seg => {
          const Icon = seg.icon;
          return (
            <button
              key={seg.model}
              onClick={() => onSelect(seg)}
              className="group bg-white rounded-2xl p-5 border-2 border-transparent hover:border-current transition-all duration-300 shadow-sm hover:shadow-xl text-left"
              onMouseEnter={e => e.currentTarget.style.borderColor = bPrimary}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{ backgroundColor: seg.color + '15' }}
              >
                <Icon className="w-6 h-6" style={{ color: seg.color }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: bSecondary }}>
                {seg.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: bSecondary + '70' }}>
                {seg.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Back button */}
      {onBack && (
        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-sm font-semibold hover:underline"
            style={{ color: bSecondary + '70' }}
          >
            ← Voltar e escolher outro tipo de cadastro
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-center mt-4">
        <p className="text-xs" style={{ color: bSecondary + '50' }}>
          Não encontrou seu segmento? Escolha o mais próximo — você poderá detalhar sua atividade no questionário.
        </p>
      </div>
    </div>
  );
}

export { SEGMENTS };