import React from 'react';
import StatCard from './StatCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import ChartCard from './ChartCard';
import { calcStats, formatNumber, formatCurrency } from './insightsUtils';
import { ShieldAlert, AlertTriangle, Skull, Building2, Timer, Globe, CreditCard, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

const FLAG_LABELS = {
  PERSONAL_EMAIL: 'E-mail pessoal (Gmail/Hotmail)',
  NO_WEBSITE: 'Sem website',
  NO_ANTIFRAUDE: 'Sem antifraude (TPV >100k)',
  HIGH_CHARGEBACK: 'Chargeback >2% (crítico)',
  HIGH_MED_PIX: 'MED PIX >1%',
  TERMINATED_BEFORE: 'Conta já encerrada',
  TPV_EXCEEDS_REVENUE: 'TPV > Faturamento declarado',
  NEW_MERCHANT: 'Merchant novo (nunca processou)',
  CNPJ_SITUACAO_IRREGULAR: 'CNPJ irregular',
  EMPRESA_NOVA: 'Empresa <6 meses',
  SETOR_REGULADO: 'Setor regulado (financeiro)',
  CNAE_MISMATCH: 'CNAE inconsistente',
  VOLUME_INCOMPATIVEL: 'Volume incompatível com porte',
  JUST_QUOTING: 'Apenas cotando',
  LOW_TICKET: 'Ticket médio <R$10',
  HIGH_REFUND_POLICY: 'Garantia 30d+ (alto reembolso)',
};

export default function InsightsRiskOperationalSection({ leads }) {
  // Extrair flags silenciosas dos leads
  const flagCounts = {};
  let totalWithFlags = 0;

  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    const flags = qd._silentFlags || qd.silentFlags || {};
    let hasFlag = false;
    Object.entries(flags).forEach(([key, val]) => {
      if (val === true) {
        flagCounts[key] = (flagCounts[key] || 0) + 1;
        hasFlag = true;
      }
    });
    if (hasFlag) totalWithFlags++;
  });

  const flagsData = Object.entries(flagCounts)
    .map(([key, value]) => ({ name: FLAG_LABELS[key] || key, value }))
    .sort((a, b) => b.value - a.value);

  // Chargeback distribution
  const chargebackMap = {};
  leads.forEach(l => {
    const val = l.questionnaireData?.chargeback;
    if (val) chargebackMap[val] = (chargebackMap[val] || 0) + 1;
  });
  const chargebackData = Object.entries(chargebackMap).map(([name, value]) => ({ name, value }));
  const chargebackColors = {
    '<1% (saudável)': '#2bc196', '1-2% (atenção)': '#f59e0b', '>2% (crítico)': '#ef4444',
    'Não sei': '#94a3b8', 'N/A - não processo cartão': '#002443'
  };

  // MED PIX
  const medPixMap = {};
  leads.forEach(l => {
    const val = l.questionnaireData?.medPix;
    if (val && val !== 'N/A') medPixMap[val] = (medPixMap[val] || 0) + 1;
  });
  const medPixData = Object.entries(medPixMap).map(([name, value]) => ({ name, value }));

  // Encerramento de contas
  const encerradoMap = {};
  leads.forEach(l => {
    const val = l.questionnaireData?.encerrado;
    if (val) encerradoMap[val] = (encerradoMap[val] || 0) + 1;
  });
  const encerradoData = Object.entries(encerradoMap).map(([name, value]) => ({ name, value }));
  const encerradoColors = { 'Nunca': '#2bc196', 'Sim, 1 vez': '#f59e0b', 'Sim, mais de 1 vez': '#ef4444' };

  // Idade das empresas (via CNPJ enrichment)
  const idadeMap = { '<6 meses': 0, '6m-1 ano': 0, '1-3 anos': 0, '3-5 anos': 0, '5-10 anos': 0, '>10 anos': 0 };
  const capitalValues = [];
  const cnaeMap = {};

  leads.forEach(l => {
    const enrichment = l.questionnaireData?._cnpjEnrichment || {};
    // Idade
    if (enrichment.data_inicio_atividade) {
      const start = new Date(enrichment.data_inicio_atividade);
      const now = new Date();
      const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (months < 6) idadeMap['<6 meses']++;
      else if (months < 12) idadeMap['6m-1 ano']++;
      else if (months < 36) idadeMap['1-3 anos']++;
      else if (months < 60) idadeMap['3-5 anos']++;
      else if (months < 120) idadeMap['5-10 anos']++;
      else idadeMap['>10 anos']++;
    }
    // Capital social
    if (enrichment.capital_social && enrichment.capital_social > 0) {
      capitalValues.push(enrichment.capital_social);
    }
    // CNAE
    if (enrichment.cnae_fiscal_descricao) {
      const desc = enrichment.cnae_fiscal_descricao.substring(0, 50);
      cnaeMap[desc] = (cnaeMap[desc] || 0) + 1;
    }
  });

  const idadeData = Object.entries(idadeMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  const capitalStats = calcStats(capitalValues);
  const cnaeData = Object.entries(cnaeMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Porte from enrichment
  const porteMap = {};
  leads.forEach(l => {
    const porte = l.questionnaireData?._cnpjEnrichment?.porte;
    if (porte) {
      const label = porte === 'ME' ? 'Microempresa (ME)' : porte === 'EPP' ? 'Empresa Pequeno Porte (EPP)' : porte;
      porteMap[label] = (porteMap[label] || 0) + 1;
    }
  });
  const porteData = Object.entries(porteMap).map(([name, value]) => ({ name, value }));

  // KPIs
  const highChargeback = flagCounts.HIGH_CHARGEBACK || 0;
  const terminated = flagCounts.TERMINATED_BEFORE || 0;
  const noWebsite = flagCounts.NO_WEBSITE || 0;
  const empresaNova = flagCounts.EMPRESA_NOVA || 0;

  // Capital social brackets
  const capitalBrackets = { '<R$10k': 0, 'R$10k-100k': 0, 'R$100k-500k': 0, 'R$500k-1M': 0, '>R$1M': 0 };
  capitalValues.forEach(v => {
    if (v < 10000) capitalBrackets['<R$10k']++;
    else if (v < 100000) capitalBrackets['R$10k-100k']++;
    else if (v < 500000) capitalBrackets['R$100k-500k']++;
    else if (v < 1000000) capitalBrackets['R$500k-1M']++;
    else capitalBrackets['>R$1M']++;
  });
  const capitalData = Object.entries(capitalBrackets).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const hasData = flagsData.length > 0 || chargebackData.length > 0 || idadeData.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <ShieldAlert className="w-10 h-10 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-sm text-[#002443]/50">Nenhum dado de risco operacional disponível ainda.</p>
        <p className="text-xs text-[#002443]/30 mt-1">Os dados aparecem quando leads preenchem o questionário Pagsmile v5.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Leads com Flags" value={totalWithFlags} subtitle={`${flagsData.length} tipos de flag`} icon={ShieldAlert} accentColor="#ef4444" />
        <StatCard label="Chargeback Crítico" value={highChargeback} subtitle=">2% declarado" icon={CreditCard} accentColor="#ef4444" />
        <StatCard label="Já Encerrados" value={terminated} subtitle="Conta anterior encerrada" icon={Skull} accentColor="#f59e0b" />
        <StatCard label="Empresa <6 meses" value={empresaNova} subtitle="CNPJ recém-aberto" icon={Timer} accentColor="#f59e0b" />
      </div>

      {/* Flags silenciosas */}
      {flagsData.length > 0 && (
        <HorizontalBarList title="Mapa de Flags Silenciosas (16 indicadores)" data={flagsData} color="#ef4444" maxItems={16} />
      )}

      {/* Chargeback + MED PIX + Encerramento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {chargebackData.length > 0 && <DonutChart title="Faixa de Chargeback" data={chargebackData} colorMap={chargebackColors} />}
        {medPixData.length > 0 && <DonutChart title="MED PIX (Fraude)" data={medPixData} colorMap={{ '<0,3%': '#2bc196', '0,3-0,5%': '#36706c', '0,5-1%': '#f59e0b', '>1%': '#ef4444' }} />}
        {encerradoData.length > 0 && <DonutChart title="Encerramento de Contas" data={encerradoData} colorMap={encerradoColors} />}
      </div>

      {/* CNPJ Enrichment: Idade + Porte + Capital */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {idadeData.length > 0 && <DonutChart title="Idade da Empresa" data={idadeData} />}
        {porteData.length > 0 && <DonutChart title="Porte (Receita Federal)" data={porteData} colorMap={{ 'Microempresa (ME)': '#2bc196', 'Empresa Pequeno Porte (EPP)': '#f59e0b', 'Demais': '#002443' }} />}
        {capitalData.length > 0 && <DonutChart title="Capital Social" data={capitalData} />}
      </div>

      {/* CNAEs mais frequentes */}
      {cnaeData.length > 0 && (
        <HorizontalBarList title="CNAEs Mais Frequentes (Receita Federal)" data={cnaeData} color="#002443" />
      )}
    </div>
  );
}