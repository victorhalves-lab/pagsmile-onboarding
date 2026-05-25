import React from 'react';
import { Calculator } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalRevenueSimulator() {
  return (
    <StubSection
      title="Simulador de Receita (Global)"
      subtitle="Sliders para TPV, taxa, fees, chargebacks. Gráfico de projeção anual e breakdown de custos com Recharts."
      phase={2}
      icon={Calculator}
    />
  );
}