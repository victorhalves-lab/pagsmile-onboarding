import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, User, Building2, Clock, Loader2,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Mail
} from 'lucide-react';

const getStatusBadge = (status) => {
  const config = {
    'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    'Em Processamento': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 },
    'Aprovado': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
    'Manual': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
    'Recusado': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
  };
  const { color, icon: Icon } = config[status] || config['Pendente'];
  return <Badge className={`${color} gap-1 text-sm px-3 py-1 border`}><Icon className="w-4 h-4" />{status}</Badge>;
};

export default function CaseHeader({ onboardingCase, merchant, onRefetch }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <Button variant="ghost" onClick={() => navigate(createPageUrl('AdminDashboard'))} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
        </Button>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {merchant?.type === 'PF' ? <User className="w-6 h-6 text-blue-600" /> : <Building2 className="w-6 h-6 text-purple-600" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">{merchant?.fullName || 'Merchant'}</h1>
            <p className="text-[var(--pagsmile-blue)]/70 font-medium">{merchant?.cpfCnpj || '-'}</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/60 font-medium mt-1">
              Criado em {onboardingCase.created_date ? new Date(onboardingCase.created_date).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : '-'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        {getStatusBadge(onboardingCase.status)}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefetch}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          {merchant?.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${merchant.email}`}><Mail className="w-4 h-4 mr-1" /> E-mail</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}