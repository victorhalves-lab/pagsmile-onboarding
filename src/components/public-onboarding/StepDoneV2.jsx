import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function StepDoneV2({ mode }) {
  const messages = {
    full: 'Questionário, documentos e verificação de identidade concluídos.',
    docs_caf: 'Documentos enviados e verificação de identidade concluída.',
    docs_only: 'Documentos enviados com sucesso.',
    caf_only: 'Verificação de identidade concluída com sucesso.',
  };
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-5">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">Tudo pronto!</h2>
      <p className="text-[#0A0A0A]/60 max-w-md mx-auto mb-4 text-sm md:text-base">
        {messages[mode] || 'Processo concluído com sucesso.'}
      </p>
      <p className="text-[#0A0A0A]/60 max-w-md mx-auto text-sm">
        Nossa equipe de compliance já recebeu as informações e vai analisar em seguida. Você pode fechar esta página.
      </p>
    </div>
  );
}