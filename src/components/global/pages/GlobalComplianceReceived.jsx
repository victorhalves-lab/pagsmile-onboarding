import React from 'react';
import { ShieldCheck } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalComplianceReceived() {
  return (
    <StubSection
      title="KYC Recebidos (Global)"
      subtitle="Lista de Compliance Questionnaires submetidos: UBOs, Diretores, Documentos, Status de revisão."
      phase={4}
      icon={ShieldCheck}
    />
  );
}