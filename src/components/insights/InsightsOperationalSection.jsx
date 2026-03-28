import React from 'react';
import StatCard from './StatCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import { Building2, Globe, ShoppingCart, RefreshCw } from 'lucide-react';

export default function InsightsOperationalSection({ leads, cases }) {
  // Extract operational profile from questionnaireData
  const modeloMap = {};
  const tipoClienteMap = {};
  const internacionalMap = {};
  const canalVendaMap = {};
  const tipoProdutoMap = {};
  const flagCounts = { fisico: 0, digital: 0, marketplace: 0, crossBorder: 0, recorrencia: 0, subMerchants: 0, afiliados: 0, categoriaRegulada: 0, armazenaCartao: 0, sazonalidade: 0 };
  let totalWithProfile = 0;

  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    let hasProfile = false;

    Object.entries(qd).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      const k = key.toLowerCase();
      const v = String(val);

      // Modelo de negócio
      if (k === 'modelonegocio' || k.includes('modelo') && k.includes('negocio')) {
        modeloMap[v] = (modeloMap[v] || 0) + 1; hasProfile = true;
      }
      // Tipo de clientes
      if (k === 'tipoclientes' || (k.includes('tipo') && k.includes('cliente'))) {
        tipoClienteMap[v] = (tipoClienteMap[v] || 0) + 1; hasProfile = true;
      }
      // Internacional
      if (k === 'proporcaointernacional' || k.includes('internacional')) {
        internacionalMap[v] = (internacionalMap[v] || 0) + 1;
      }
      // Canal de venda
      if (k === 'canalvenda' || (k.includes('canal') && k.includes('venda'))) {
        canalVendaMap[v] = (canalVendaMap[v] || 0) + 1;
      }
      // Tipo produto
      if (k === 'tipoprodutoprincipal') {
        tipoProdutoMap[v] = (tipoProdutoMap[v] || 0) + 1; hasProfile = true;
      }
      // Boolean flags
      if (val === true || val === 'true') {
        if (k.includes('vendefisico') || k.includes('vende_fisico')) flagCounts.fisico++;
        if (k.includes('vendedigital') || k.includes('vende_digital') || k.includes('vendeservico')) flagCounts.digital++;
        if (k.includes('operamarketplace') || k.includes('opera_marketplace')) flagCounts.marketplace++;
        if (k.includes('crossborder') || k.includes('cross_border')) flagCounts.crossBorder++;
        if (k.includes('recorrencia') || k.includes('assinatura')) flagCounts.recorrencia++;
        if (k.includes('subvendedores') || k.includes('sub_vendedores') || k.includes('submerchant')) flagCounts.subMerchants++;
        if (k.includes('operaafiliados') || k.includes('opera_afiliados')) flagCounts.afiliados++;
        if (k.includes('categoriasensivel') || k.includes('categoria_sensivel')) flagCounts.categoriaRegulada++;
        if (k.includes('armazenacartao') || k.includes('armazena_cartao')) flagCounts.armazenaCartao++;
        if (k.includes('sazonalidade')) flagCounts.sazonalidade++;
      }
    });

    if (hasProfile) totalWithProfile++;
  });

  const flagsData = [
    { name: 'Produto Físico', value: flagCounts.fisico },
    { name: 'Produto Digital/Serviço', value: flagCounts.digital },
    { name: 'Marketplace/Sellers', value: flagCounts.marketplace },
    { name: 'Cross-border', value: flagCounts.crossBorder },
    { name: 'Recorrência/Assinatura', value: flagCounts.recorrencia },
    { name: 'Sub-merchants', value: flagCounts.subMerchants },
    { name: 'Afiliados/Revendedores', value: flagCounts.afiliados },
    { name: 'Categoria Regulada', value: flagCounts.categoriaRegulada },
    { name: 'Armazena dados cartão', value: flagCounts.armazenaCartao },
    { name: 'Sazonalidade', value: flagCounts.sazonalidade },
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const toDonut = (map) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Com Perfil Operacional" value={totalWithProfile} subtitle={`de ${leads.length} leads`} icon={Building2} />
        <StatCard label="Marketplaces/Sellers" value={flagCounts.marketplace} icon={ShoppingCart} />
        <StatCard label="Cross-border" value={flagCounts.crossBorder} icon={Globe} />
        <StatCard label="Recorrência" value={flagCounts.recorrencia} icon={RefreshCw} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(modeloMap).length > 0 && <DonutChart title="Modelo de Negócio" data={toDonut(modeloMap)} />}
        {Object.keys(tipoProdutoMap).length > 0 && <DonutChart title="Tipo de Produto/Serviço" data={toDonut(tipoProdutoMap)} />}
        {Object.keys(tipoClienteMap).length > 0 && <DonutChart title="Tipo de Clientes (B2B/B2C)" data={toDonut(tipoClienteMap)} colorMap={{ B2C: '#2bc196', B2B: '#002443', Ambos: '#f59e0b' }} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flagsData.length > 0 && <HorizontalBarList title="Características Operacionais" data={flagsData} color="#002443" />}
        {Object.keys(internacionalMap).length > 0 && <DonutChart title="Clientes Internacionais" data={toDonut(internacionalMap)} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(canalVendaMap).length > 0 && <HorizontalBarList title="Canal de Venda" data={toDonut(canalVendaMap)} />}
      </div>
    </div>
  );
}