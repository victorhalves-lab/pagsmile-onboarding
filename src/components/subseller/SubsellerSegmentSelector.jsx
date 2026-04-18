import React from 'react';
import { 
  ShoppingCart, Server, Store, Cloud, BookOpen, GraduationCap, 
  Truck, Briefcase, Link2 
} from 'lucide-react';

/**
 * Seletor de segmento para subsellers PJ — aplica paridade com sellers diretos.
 * Exibe os 9 modelos V4 disponíveis (exclui PIX Merchant e PIX Intermediário).
 * Cada segmento resolve para um QuestionnaireTemplate V4 completo.
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
    model: 'ComplianceGatewayV4',
    storageKey: 'compliance_data_subseller_gateway',
    title: 'Gateway de Pagamento',
    description: 'Plataforma que processa pagamentos para terceiros',
    icon: Server,
    color: '#8b5cf6',
  },
  {
    model: 'ComplianceMarketplaceV4',
    storageKey: 'compliance_data_subseller_marketplace',
    title: 'Marketplace',
    description: 'Plataforma com múltiplos vendedores',
    icon: Store,
    color: '#ec4899',
  },
  {
    model: 'ComplianceSaaSV4',
    storageKey: 'compliance_data_subseller_saas',
    title: 'SaaS',
    description: 'Software como serviço — assinatura recorrente',
    icon: Cloud,
    color: '#06b6d4',
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
    model: 'ComplianceEducacaoV4',
    storageKey: 'compliance_data_subseller_educacao',
    title: 'Educação',
    description: 'Instituições e plataformas educacionais',
    icon: GraduationCap,
    color: '#10b981',
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
    model: 'ComplianceMPEV4',
    storageKey: 'compliance_data_subseller_mpe',
    title: 'MEI / ME / EPP',
    description: 'Micro e pequenas empresas',
    icon: Briefcase,
    color: '#84cc16',
  },
  {
    model: 'ComplianceLinkPagamentoV4',
    storageKey: 'compliance_data_subseller_link',
    title: 'Link de Pagamento',
    description: 'Vendas por link direto ao consumidor',
    icon: Link2,
    color: '#f97316',
  },
];

export default function SubsellerSegmentSelector({ onSelect, onBack, branding }) {
  const bPrimary = branding?.primaryColor || '#2bc196';
  const bSecondary = branding?.secondaryColor || '#002443';
  const hasBranding = !!branding?.name;

  return (
    <div className="max-w-5xl mx-auto">
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
            alt="Pagsmile"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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