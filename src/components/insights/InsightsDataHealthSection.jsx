import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import HorizontalBarList from './HorizontalBarList';
import DonutChart from './DonutChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Database, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsDataHealthSection({ leads }) {
  const total = leads.length;
  if (total === 0) return <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center"><p className="text-sm text-[#002443]/50">Sem dados.</p></div>;

  // Field completeness
  const fields = [
    { key: 'tpvMensal', label: 'TPV Mensal', check: l => l.tpvMensal > 0 },
    { key: 'ticketMedio', label: 'Ticket Médio', check: l => l.ticketMedio > 0 },
    { key: 'mcc', label: 'MCC', check: l => !!(l.mcc || l.questionnaireData?.mcc || l.bdcEnrichmentData?.mcc?.code) },
    { key: 'cpfCnpj', label: 'CNPJ/CPF', check: l => !!l.cpfCnpj },
    { key: 'email', label: 'E-mail', check: l => !!l.email },
    { key: 'phone', label: 'Telefone', check: l => !!l.phone },
    { key: 'website', label: 'Website', check: l => !!l.website },
    { key: 'companyName', label: 'Nome Fantasia', check: l => !!l.companyName },
    { key: 'contactName', label: 'Nome Contato', check: l => !!l.contactName },
    { key: 'contactRole', label: 'Cargo Contato', check: l => !!l.contactRole },
    { key: 'businessSubCategory', label: 'Tipo Negócio', check: l => !!l.businessSubCategory },
    { key: 'expectedRates', label: 'Taxas Esperadas', check: l => l.expectedRates && Object.keys(l.expectedRates).length > 0 },
    { key: 'introducerName', label: 'Introducer', check: l => !!l.introducerName },
    { key: 'transacoesMes', label: 'Transações/Mês', check: l => l.transacoesMes > 0 },
  ];

  const completeness = fields.map(f => {
    const filled = leads.filter(f.check).length;
    return { name: f.label, value: Math.round((filled / total) * 100) };
  }).sort((a, b) => a.value - b.value);

  const avgCompleteness = Math.round(completeness.reduce((s, c) => s + c.value, 0) / completeness.length);

  // Email type distribution
  const emailTypeMap = { corporativo: 0, pessoal: 0, desconhecido: 0 };
  const freeDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'live.com', 'icloud.com', 'uol.com.br', 'terra.com.br', 'bol.com.br'];
  leads.forEach(l => {
    const email = l.email || '';
    if (!email.includes('@')) { emailTypeMap.desconhecido++; return; }
    const domain = email.split('@')[1]?.toLowerCase();
    if (freeDomains.includes(domain)) emailTypeMap.pessoal++;
    else emailTypeMap.corporativo++;
  });
  const emailData = [
    { name: 'Corporativo', value: emailTypeMap.corporativo },
    { name: 'Pessoal', value: emailTypeMap.pessoal },
  ].filter(d => d.value > 0);

  // CNPJ enrichment coverage
  const withEnrichment = leads.filter(l => l.questionnaireData?._cnpjEnrichment).length;
  const withSilentFlags = leads.filter(l => l.questionnaireData?._silentFlags).length;

  // Enrichment data analysis
  const porteMap = {};
  const simplesMap = { Sim: 0, Não: 0 };
  const idadeEmpresa = [];
  const capitalSocial = [];
  leads.forEach(l => {
    const en = l.questionnaireData?._cnpjEnrichment;
    if (!en) return;
    if (en.porte) porteMap[en.porte] = (porteMap[en.porte] || 0) + 1;
    if (en.opcao_pelo_simples === true) simplesMap.Sim++;
    else if (en.opcao_pelo_simples === false) simplesMap.Não++;
    if (en.idade_empresa_anos > 0) idadeEmpresa.push(en.idade_empresa_anos);
    if (en.capital_social > 0) capitalSocial.push(en.capital_social);
  });

  // Idade distribution
  const idadeRanges = [
    { label: '< 1 ano', min: 0, max: 1 },
    { label: '1-3 anos', min: 1, max: 3 },
    { label: '3-5 anos', min: 3, max: 5 },
    { label: '5-10 anos', min: 5, max: 10 },
    { label: '10+ anos', min: 10, max: Infinity },
  ];
  const idadeData = idadeRanges.map(r => ({
    name: r.label,
    Empresas: idadeEmpresa.filter(v => v >= r.min && v < r.max).length,
  }));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Completude Média" value={`${avgCompleteness}%`} subtitle="Campos preenchidos" icon={Database} accentColor={avgCompleteness >= 70 ? '#2bc196' : '#f59e0b'} />
        <StatCard label="Email Corporativo" value={`${total > 0 ? ((emailTypeMap.corporativo / total) * 100).toFixed(0) : 0}%`} subtitle={`${emailTypeMap.corporativo} leads`} icon={Mail} />
        <StatCard label="Enriquecimento CNPJ" value={`${total > 0 ? ((withEnrichment / total) * 100).toFixed(0) : 0}%`} subtitle={`${withEnrichment} leads`} icon={CheckCircle2} />
        <StatCard label="Silent Flags" value={withSilentFlags} subtitle="Leads com flags automáticas" icon={AlertTriangle} accentColor="#f59e0b" />
      </div>

      <ChartCard title="Completude por Campo" subtitle="% de leads com o campo preenchido">
        <ResponsiveContainer width="100%" height={Math.max(300, completeness.length * 28)}>
          <BarChart data={completeness} layout="vertical" barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#002443' }} width={120} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT} formatter={v => `${v}%`} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Completude">
              {completeness.map((entry, i) => (
                <Bar key={i} fill={entry.value >= 80 ? '#2bc196' : entry.value >= 50 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {emailData.length > 0 && <DonutChart title="Tipo de E-mail" data={emailData} colorMap={{ Corporativo: '#2bc196', Pessoal: '#f59e0b' }} />}
        {Object.keys(porteMap).length > 0 && <DonutChart title="Porte da Empresa (CNPJ)" data={Object.entries(porteMap).map(([n, v]) => ({ name: n, value: v }))} />}
        {simplesMap.Sim + simplesMap.Não > 0 && <DonutChart title="Simples Nacional" data={[{ name: 'Sim', value: simplesMap.Sim }, { name: 'Não', value: simplesMap.Não }].filter(d => d.value > 0)} colorMap={{ Sim: '#2bc196', Não: '#002443' }} />}
      </div>

      {idadeData.some(d => d.Empresas > 0) && (
        <ChartCard title="Idade das Empresas (Enriquecimento CNPJ)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={idadeData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="Empresas" fill="#002443" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}