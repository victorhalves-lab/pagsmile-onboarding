import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import StubSection from './StubSection';

export default function GlobalDashboard() {
  return (
    <StubSection
      title="Global Dashboard"
      subtitle="KPIs em USD: TPV total, receita estimada, leads, win rate. Lista de propostas e questionários recentes."
      phase={2}
      icon={LayoutDashboard}
    />
  );
}