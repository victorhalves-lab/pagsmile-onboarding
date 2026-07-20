import React from 'react';
import { User, Building2, Receipt, Building, Mail, Phone, CreditCard, Calendar, Globe, Users } from 'lucide-react';

export default function CaseMerchantTab({ merchant }) {
  const fields = [
    { label: 'Tipo', value: merchant?.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica', icon: merchant?.type === 'PF' ? User : Building2 },
    { label: 'CPF/CNPJ', value: merchant?.cpfCnpj || '-', icon: Receipt },
    { label: 'Nome/Razão Social', value: merchant?.fullName || '-', icon: User },
    { label: 'Nome Fantasia', value: merchant?.companyName || '-', icon: Building },
    { label: 'E-mail', value: merchant?.email || '-', icon: Mail },
    { label: 'Telefone', value: merchant?.phone || '-', icon: Phone },
    { label: 'Serviços de Pagamento', value: merchant?.paymentServices?.join(', ') || '-', icon: CreditCard },
    { label: 'Data de Nascimento', value: merchant?.dateOfBirth ? new Date(merchant.dateOfBirth).toLocaleDateString('pt-BR') : '-', icon: Calendar },
    { label: 'Nacionalidade', value: merchant?.nationality || '-', icon: Globe },
    { label: 'Nome da Mãe', value: merchant?.motherName || '-', icon: Users },
    { label: 'Data de Cadastro', value: merchant?.created_date ? new Date(merchant.created_date).toLocaleDateString('pt-BR') : '-', icon: Calendar }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-[var(--pinbank-blue)] mb-6">Informações do Merchant</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[var(--pinbank-blue)]/50" />
                <p className="text-sm text-[var(--pinbank-blue)]/70 font-semibold">{item.label}</p>
              </div>
              <p className="font-semibold text-[var(--pinbank-blue)]">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}