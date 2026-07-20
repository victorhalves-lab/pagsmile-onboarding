import React from 'react';
import StatCard from './StatCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatNumber } from './insightsUtils';
import { Store, Zap, HeartCrack, Timer, Megaphone, Shield, Users, Briefcase } from 'lucide-react';

const SEGMENT_LABELS = {
  gateway: 'Gateway / PSP', marketplace: 'Marketplace', plataforma_vertical: 'Plataforma Vertical',
  ecommerce: 'E-commerce', dropshipping: 'Dropshipping', infoprodutos: 'Infoprodutos',
  saas: 'SaaS', educacao: 'Educação', link_pagamento: 'Link de Pagamento', mpe: 'MPE',
};

function countField(leads, field) {
  const map = {};
  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    const val = qd[field];
    if (val && val !== '' && val !== 0) {
      if (Array.isArray(val)) {
        val.forEach(v => { map[v] = (map[v] || 0) + 1; });
      } else {
        map[String(val)] = (map[String(val)] || 0) + 1;
      }
    }
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

export default function InsightsMarketIntelSection({ leads }) {
  // Segmento granular (v5)
  const segmentoData = countField(leads, 'segmento').map(d => ({
    ...d, name: SEGMENT_LABELS[d.name] || d.name
  }));

  // Processador atual
  const processadorData = countField(leads, 'processadorAtual');

  // Satisfação com processador
  const satisfacaoData = countField(leads, 'satisfacao');
  const satisfacaoColors = {
    'Muito satisfeito': '#1356E2', 'Satisfeito': '#E84B1C', 'Neutro': '#94a3b8',
    'Insatisfeito': '#f59e0b', 'Muito insatisfeito': '#ef4444'
  };

  // Dores do mercado (multi-select)
  const dorData = countField(leads, 'dorAtual');

  // Urgência
  const urgenciaData = countField(leads, 'urgencia');
  const urgenciaColors = {
    'Imediato (<1 semana)': '#ef4444', 'Este mês': '#f59e0b',
    'Próximos 2-3 meses': '#94a3b8', 'Estou apenas cotando': '#0A0A0A'
  };

  // Modelo de cobrança
  const modeloCobrancaData = countField(leads, 'modeloCobranca');

  // Faturamento anual
  const faturamentoData = countField(leads, 'faturamentoAnual');

  // Funcionários
  const funcData = countField(leads, 'funcionarios');

  // Como conheceu
  const comoConheceuData = countField(leads, 'comoConheceu');

  // Crescimento
  const crescimentoData = countField(leads, 'crescimento');

  // Antifraude
  const antifraudeData = countField(leads, 'antifraude');

  // Já processa?
  const jaProcessaData = countField(leads, 'jaProcessa');

  // Plataforma e-commerce
  const plataformaData = countField(leads, 'plataforma');

  // KPIs
  const totalWithSegmento = leads.filter(l => l.questionnaireData?.segmento).length;
  const totalNewMerchants = leads.filter(l => l.questionnaireData?.jaProcessa === 'Não, estou começando').length;
  const totalImediato = leads.filter(l => l.questionnaireData?.urgencia === 'Imediato (<1 semana)').length;
  const totalInsatisfeitos = leads.filter(l => ['Insatisfeito', 'Muito insatisfeito'].includes(l.questionnaireData?.satisfacao)).length;

  if (totalWithSegmento === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <Store className="w-10 h-10 mx-auto text-[#0A0A0A]/20 mb-3" />
        <p className="text-sm text-[#0A0A0A]/50">Nenhum lead com dados do questionário v5 ainda.</p>
        <p className="text-xs text-[#0A0A0A]/30 mt-1">Os dados aparecem automaticamente quando leads preenchem o questionário Pin Bank.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Leads com Perfil v5" value={totalWithSegmento} subtitle={`de ${leads.length} total`} icon={Users} />
        <StatCard label="Novos Merchants" value={totalNewMerchants} subtitle="Nunca processaram" icon={Store} />
        <StatCard label="Urgência Imediata" value={totalImediato} subtitle="Querem em <1 semana" icon={Zap} accentColor="#ef4444" />
        <StatCard label="Insatisfeitos" value={totalInsatisfeitos} subtitle="Com processador atual" icon={HeartCrack} accentColor="#f59e0b" />
      </div>

      {/* Segmento + Processador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segmentoData.length > 0 && <DonutChart title="Segmento (Granular v5)" data={segmentoData} />}
        {processadorData.length > 0 && <HorizontalBarList title="De Onde Vêm (Processador Atual)" data={processadorData} color="#0A0A0A" />}
      </div>

      {/* Dores + Satisfação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dorData.length > 0 && <HorizontalBarList title="Principais Dores do Mercado" data={dorData} color="#ef4444" />}
        {satisfacaoData.length > 0 && <DonutChart title="Satisfação com Processador Atual" data={satisfacaoData} colorMap={satisfacaoColors} />}
      </div>

      {/* Urgência + Crescimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {urgenciaData.length > 0 && <DonutChart title="Urgência de Migração" data={urgenciaData} colorMap={urgenciaColors} />}
        {crescimentoData.length > 0 && <DonutChart title="Expectativa de Crescimento" data={crescimentoData} />}
        {jaProcessaData.length > 0 && <DonutChart title="Já Processa Pagamentos?" data={jaProcessaData} colorMap={{ 'Sim, já processo': '#1356E2', 'Não, estou começando': '#f59e0b' }} />}
      </div>

      {/* Porte + Modelo cobrança */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faturamentoData.length > 0 && <DonutChart title="Faixa de Faturamento Anual" data={faturamentoData} />}
        {funcData.length > 0 && <DonutChart title="Número de Funcionários" data={funcData} />}
        {modeloCobrancaData.length > 0 && <DonutChart title="Modelo de Cobrança" data={modeloCobrancaData} />}
      </div>

      {/* Marketing + Antifraude + Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comoConheceuData.length > 0 && <HorizontalBarList title="Canal de Aquisição (Como Conheceu)" data={comoConheceuData} color="#1356E2" />}
        {antifraudeData.length > 0 && <DonutChart title="Maturidade Antifraude" data={antifraudeData} colorMap={{ 'Antifraude + 3DS': '#1356E2', 'Só antifraude': '#E84B1C', 'Só 3DS': '#f59e0b', 'Não possuo': '#ef4444' }} />}
      </div>

      {plataformaData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HorizontalBarList title="Plataforma E-commerce" data={plataformaData} />
        </div>
      )}
    </div>
  );
}