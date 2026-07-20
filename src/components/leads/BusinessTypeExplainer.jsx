import React from 'react';
import { Store, Network, ShoppingBag } from 'lucide-react';

const TYPES = [
  {
    keywords: ['merchant', 'merchan'],
    icon: Store,
    label: 'Merchant',
    color: '#1356E2',
    description: 'Empresa que vende de maneira online diretamente para o consumidor final. Possui seu próprio e-commerce e opera suas vendas sem intermediários.'
  },
  {
    keywords: ['gateway'],
    icon: Network,
    label: 'Gateway',
    color: '#3b82f6',
    description: 'Empresa que possui sub-sellers dentro da sua estrutura, os quais vendem através de sites separados. O gateway processa os pagamentos para esses sub-sellers.'
  },
  {
    keywords: ['marketplace'],
    icon: ShoppingBag,
    label: 'Marketplace',
    color: '#8b5cf6',
    description: 'Empresa de e-commerce que permite sub-contas (sub-sellers) dentro da sua estrutura. Esses sub-sellers vendem através da plataforma de e-commerce do marketplace.'
  }
];

export default function BusinessTypeExplainer() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      {TYPES.map((type) => {
        const Icon = type.icon;
        return (
          <div
            key={type.label}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${type.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: type.color }} />
              </div>
              <span className="font-bold text-sm text-[#0A0A0A]">{type.label}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#0A0A0A]/70">
              {type.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}