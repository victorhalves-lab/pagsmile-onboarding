import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

export default function CaseValidationsTab({ validations }) {
  const getValidationStatusBadge = (status) => {
    const colors = {
      'Sucesso': 'bg-green-100 text-green-800',
      'Falha': 'bg-red-100 text-red-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Erro': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || colors['Pendente']}>{status}</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-[var(--pinbank-blue)] mb-6">Validações Externas</h3>
      {validations.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-[var(--pinbank-blue)]/70 font-medium">Nenhuma validação realizada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {validations.map((validation, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    validation.provider === 'BigDataCorp' ? 'bg-blue-100' :
                    validation.provider === 'CAF' ? 'bg-purple-100' : 'bg-teal-100'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      validation.provider === 'BigDataCorp' ? 'text-blue-600' :
                      validation.provider === 'CAF' ? 'text-purple-600' : 'text-teal-600'
                    }`} />
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--pinbank-blue)]">{validation.provider}</span>
                    <p className="text-sm text-[var(--pinbank-blue)]/70 font-medium">{validation.validationType}</p>
                  </div>
                </div>
                {getValidationStatusBadge(validation.status)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
                {validation.score !== undefined && (
                  <div>
                    <p className="text-xs text-[var(--pinbank-blue)]/70 font-semibold">Score</p>
                    <p className="font-semibold text-[var(--pinbank-blue)]">{validation.score}</p>
                  </div>
                )}
                {validation.responseTime && (
                  <div>
                    <p className="text-xs text-[var(--pinbank-blue)]/70 font-semibold">Tempo de Resposta</p>
                    <p className="font-semibold text-[var(--pinbank-blue)]">{validation.responseTime}ms</p>
                  </div>
                )}
                {validation.timestamp && (
                  <div>
                    <p className="text-xs text-[var(--pinbank-blue)]/70 font-semibold">Data</p>
                    <p className="font-semibold text-[var(--pinbank-blue)]">{new Date(validation.timestamp).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
              {validation.errorMessage && (
                <Alert className="mt-3 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{validation.errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}