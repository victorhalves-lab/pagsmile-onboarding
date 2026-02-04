import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { User, Building2, ArrowRight } from 'lucide-react';

export default function MerchantTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = React.useState(null);

  const merchantTypes = [
    {
      type: 'PF',
      icon: User,
      title: 'Pessoa Física',
      description: 'Cadastro individual para pessoas físicas',
      features: ['CPF', 'RG ou CNH', 'Comprovante de endereço']
    },
    {
      type: 'PJ',
      icon: Building2,
      title: 'Pessoa Jurídica',
      description: 'Cadastro para empresas e MEI',
      features: ['CNPJ', 'Contrato Social', 'Documentos dos sócios']
    }
  ];

  const handleContinue = () => {
    if (selectedType) {
      navigate(createPageUrl('QuestionnaireForm') + `?type=${selectedType}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Selecione o Tipo de Cadastro
          </h1>
          <p className="text-lg text-slate-600">
            Escolha como você deseja se cadastrar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {merchantTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.type;
            return (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={`bg-white p-8 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-[var(--primary)] shadow-lg scale-105'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${
                  isSelected ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{type.title}</h3>
                <p className="text-slate-600 mb-4">{type.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Documentos necessários:</p>
                  <ul className="space-y-1">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white h-12 text-lg disabled:opacity-50"
        >
          Continuar
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}