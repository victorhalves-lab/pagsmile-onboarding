import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CircleDot } from 'lucide-react';

function TabDetail({ name, group, icon, description, metricas, graficos, insights }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-[#2bc196]/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-[#002443] text-sm">{name}</h5>
            <Badge className="bg-slate-100 text-slate-600 border-0 text-[8px]">{group}</Badge>
          </div>
          <p className="text-[10px] text-[#002443]/50 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {metricas && (
          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
            <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Métricas / KPIs</p>
            {metricas.map((m, i) => <p key={i} className="text-[9px] text-blue-800/60 flex items-start gap-1"><CircleDot className="w-2.5 h-2.5 mt-0.5 shrink-0 text-blue-400" />{m}</p>)}
          </div>
        )}
        {graficos && (
          <div className="bg-[#2bc196]/5 rounded-lg p-3 border border-[#2bc196]/10">
            <p className="text-[8px] font-bold text-[#2bc196] uppercase tracking-wider mb-1.5">Gráficos / Visualizações</p>
            {graficos.map((g, i) => <p key={i} className="text-[9px] text-[#002443]/60 flex items-start gap-1"><CircleDot className="w-2.5 h-2.5 mt-0.5 shrink-0 text-[#2bc196]" />{g}</p>)}
          </div>
        )}
        {insights && (
          <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
            <p className="text-[8px] font-bold text-purple-600 uppercase tracking-wider mb-1.5">Insights Gerados</p>
            {insights.map((ins, i) => <p key={i} className="text-[9px] text-purple-800/60 flex items-start gap-1"><CircleDot className="w-2.5 h-2.5 mt-0.5 shrink-0 text-purple-400" />{ins}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DadosInsightsSection() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Dados & Insights — Central de Inteligência de Negócio</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-3">
          Página premium com 20 abas analíticas organizadas em 5 grupos. Cruza dados de 10 entidades: Leads, Proposals, PixProposals, OnboardingCases, ComplianceScores, Merchants, Partners, DocumentUploads, QuestionnaireResponses e ComplianceSessions.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Inteligência', count: '2 abas', color: 'bg-purple-500/20' },
            { label: 'Volume & Taxas', count: '6 abas', color: 'bg-blue-500/20' },
            { label: 'Comercial', count: '3 abas', color: 'bg-green-500/20' },
            { label: 'Perfil & Risco', count: '8 abas', color: 'bg-amber-500/20' },
            { label: 'Parceiros', count: '1 aba', color: 'bg-cyan-500/20' },
          ].map((g, i) => (
            <div key={i} className={`${g.color} rounded-lg p-2 text-center`}>
              <p className="text-[10px] font-bold text-white">{g.label}</p>
              <p className="text-[9px] text-white/50">{g.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GRUPO: INTELIGÊNCIA */}
      <h4 className="text-sm font-bold text-purple-600 border-b border-purple-200 pb-1 mt-6">🧠 Inteligência</h4>
      <TabDetail name="Insights IA" group="Inteligência" description="IA analisa todos os dados e gera insights narrativos automáticos sobre tendências, anomalias e oportunidades."
        metricas={['Resumo executivo gerado por LLM', 'Análise de tendências (crescimento/queda)', 'Anomalias detectadas nos dados']}
        graficos={['Cards de insights com ícones por categoria', 'Priorização por impacto']}
        insights={['Recomendações de ação para comercial', 'Alertas de performance', 'Sugestões de otimização']}
      />
      <TabDetail name="Inteligência de Mercado" group="Inteligência" description="Extrai dados do questionário Pagsmile v5 para gerar inteligência de mercado: segmentação granular, concorrência, dores, urgência, maturidade antifraude e canal de aquisição."
        metricas={['Leads com perfil v5 vs total', 'Novos merchants (nunca processaram)', 'Urgência imediata (count)', 'Insatisfeitos com processador atual']}
        graficos={['Donut: Segmento granular v5 (10 verticais)', 'Donut: Satisfação com processador', 'Donut: Urgência de migração', 'Donut: Já processa pagamentos?', 'Donut: Maturidade antifraude', 'Donut: Faturamento anual', 'Donut: Modelo de cobrança', 'Donut: Funcionários', 'Donut: Expectativa de crescimento', 'HorizontalBarList: Processador atual (de onde vêm)', 'HorizontalBarList: Principais dores do mercado', 'HorizontalBarList: Canal de aquisição', 'HorizontalBarList: Plataforma e-commerce']}
        insights={['De qual processador vêm mais leads', 'Quais dores mais recorrentes', 'Qual segmento cresce mais', 'Qual canal de marketing mais efetivo']}
      />

      {/* GRUPO: VOLUME & TAXAS */}
      <h4 className="text-sm font-bold text-blue-600 border-b border-blue-200 pb-1 mt-6">💰 Volume & Taxas</h4>
      <TabDetail name="TPV & Volume" group="Volume" description="Análise de volume transacional (TPV) e ticket médio de todos os leads."
        metricas={['TPV total, médio, mediano', 'Ticket médio por tipo de negócio', 'Distribuição por faixas de TPV']}
        graficos={['Histograma de TPV', 'Barras por tipo negócio', 'Evolução temporal']}
        insights={['Concentração de volume por segmento', 'Outliers de TPV']}
      />
      <TabDetail name="Benchmark de Taxas" group="Volume" description="Compara taxas esperadas pelos leads vs taxas oferecidas nas propostas."
        metricas={['Taxa média esperada vs oferecida', 'Delta (gap) entre expectativa e oferta', 'Min/Max/Mediana por faixa']}
        graficos={['Gráfico de dispersão expectativa × oferta', 'Barras comparativas']}
        insights={['Onde estamos acima/abaixo do mercado', 'Segmentos mais/menos sensíveis a preço']}
      />
      <TabDetail name="Mix de Produtos" group="Volume" description="Distribuição percentual dos métodos de pagamento preferidos pelos leads."
        metricas={['% PIX, Crédito, Débito, Boleto', 'Preferência por tipo de negócio']}
        graficos={['Donut chart de mix', 'Barras por segmento']}
        insights={['Tendência de migração para PIX', 'Perfil de produto por vertical']}
      />
      <TabDetail name="Taxas Esperadas (Lead)" group="Volume" description="Taxas que os leads declaram pagar atualmente (expectativa do mercado)."
        metricas={['MDR 1x médio declarado', 'MDR parcelado médio', 'PIX/Boleto médio', 'Antecipação média']}
        graficos={['Histograma por faixa', 'Min-Max-Mediana por bandeira']}
        insights={['Pressão de preço do mercado', 'Oportunidade de upsell']}
      />
      <TabDetail name="Taxas Propostas" group="Volume" description="Taxas efetivamente oferecidas nas propostas comerciais."
        metricas={['MDR médio por bandeira × faixa', 'PIX médio oferecido', 'Fee médio por transação', 'Antecipação média']}
        graficos={['Heatmap bandeira × faixa', 'Evolução de taxas no tempo']}
        insights={['Margem implícita por segmento', 'Convergência de pricing']}
      />
      <TabDetail name="Rentabilidade" group="Volume" description="Análise de margem: receita estimada vs custo do parceiro adquirente."
        metricas={['Receita MDR estimada', 'Custo parceiro estimado', 'Margem bruta', 'Margem % média']}
        graficos={['Barras receita vs custo', 'Ranking de propostas por margem']}
        insights={['Propostas com margem negativa', 'Top 10 mais rentáveis']}
      />

      {/* GRUPO: COMERCIAL */}
      <h4 className="text-sm font-bold text-green-600 border-b border-green-200 pb-1 mt-6">📈 Comercial</h4>
      <TabDetail name="Performance Comercial" group="Comercial" description="Métricas de desempenho do time de vendas: velocidade, conversão, produtividade."
        metricas={['Tempo médio lead → proposta', 'Tempo médio proposta → aceite', 'Taxa de conversão geral', 'Propostas por comercial']}
        graficos={['Funil com tempos por etapa', 'Ranking de vendedores']}
        insights={['Gargalos no ciclo de venda', 'Vendedores top performers']}
      />
      <TabDetail name="Funil de Conversão" group="Comercial" description="Análise detalhada do funil de vendas com taxas de conversão entre cada estágio."
        metricas={['Leads por estágio', 'Taxa conversão estágio-a-estágio', 'Drop-off por coluna', 'Tempo médio por estágio']}
        graficos={['Funil visual com % entre estágios', 'Barras de volume por estágio']}
        insights={['Estágio com maior perda', 'Oportunidade de otimização']}
      />
      <TabDetail name="Introducers" group="Comercial" description="Performance dos parceiros de indicação: leads gerados, conversão, receita."
        metricas={['Leads por Introducer', 'Taxa conversão por parceiro', 'TPV gerado por parceiro', 'Receita estimada por parceiro']}
        graficos={['Ranking de Introducers', 'Evolução de leads por parceiro']}
        insights={['ROI por canal de indicação', 'Parceiros mais rentáveis']}
      />

      {/* GRUPO: PERFIL & RISCO */}
      <h4 className="text-sm font-bold text-amber-600 border-b border-amber-200 pb-1 mt-6">🛡️ Perfil & Risco</h4>
      <TabDetail name="Perfil de Leads" group="Perfil" description="Segmentação demográfica e comportamental dos leads."
        metricas={['Distribuição por tipo negócio', 'Distribuição por região/MCC', 'Score médio por segmento']}
        graficos={['Donut por businessSubCategory', 'Mapa de calor por MCC']}
        insights={['Perfil do lead ideal', 'Segmentos subexplorados']}
      />
      <TabDetail name="Operacional" group="Perfil" description="Métricas operacionais de volume e eficiência da plataforma."
        metricas={['Total leads/mês', 'Total casos compliance/mês', 'Tempo médio processamento']}
        graficos={['Evolução mensal', 'Barras por tipo']}
        insights={['Capacidade operacional', 'Tendência de crescimento']}
      />
      <TabDetail name="Risco do Portfólio" group="Risco" description="Visão consolidada de risco da carteira de merchants e leads."
        metricas={['Distribuição BAIXO/MÉDIO/ALTO/CRÍTICO', 'Score médio da carteira', 'Concentração de risco']}
        graficos={['Donut por nível de risco', 'Histograma de scores SENTINEL']}
        insights={['Exposição total ao risco', 'Tendência de deterioração']}
      />
      <TabDetail name="Risco Operacional" group="Risco" description="Análise das 16 flags silenciosas do Lead v5, chargeback, MED PIX, encerramentos, idade empresa, capital social e CNAEs do enriquecimento CNPJ."
        metricas={['Leads com flags (count e tipos)', 'Chargeback crítico (>2%)', 'Contas já encerradas', 'Empresas <6 meses (CNPJ enrich.)']}
        graficos={['HorizontalBarList: Mapa de 16 flags silenciosas', 'Donut: Faixa de chargeback', 'Donut: MED PIX (contestações)', 'Donut: Encerramento de contas', 'Donut: Idade da empresa (enrichment CNPJ)', 'Donut: Porte (Receita Federal)', 'Donut: Capital Social (faixas)', 'HorizontalBarList: CNAEs mais frequentes']}
        insights={['Flags mais recorrentes na carteira', 'Exposição a chargeback/MED PIX', 'Saúde financeira do portfólio (idade + capital)', 'Concentração de CNAEs (risco setorial)']}
      />
      <TabDetail name="Compliance" group="Risco" description="Métricas de compliance: aprovações, rejeições, documentos, tempos."
        metricas={['Taxa aprovação automática', 'Taxa revisão manual', 'Docs por caso (média)', 'Respostas por caso']}
        graficos={['Funil compliance', 'Evolução aprovações/rejeições']}
        insights={['Eficiência da IA', 'Tipos de documento mais problemáticos']}
      />
      <TabDetail name="Jornada de Compliance" group="Risco" description="Análise microscópica das ComplianceSessions: taxa de conclusão, abandono por etapa e modelo, tempo mediano, conversão por vertical."
        metricas={['Total sessões de compliance', 'Taxa de conclusão (%)', 'Sessões abandonadas (count + %)', 'Tempo mediano de preenchimento']}
        graficos={['Donut: Status da sessão (active/completed/expired)', 'Donut: Fase atual de abandono (Questionário/Documentos/Concluído)', 'Donut: Tipo de fluxo', 'HorizontalBarList: Volume por modelo de compliance', 'BarChart: Conversão por modelo (concluídos vs abandonados)', 'BarChart: Etapa de abandono (em qual step param)']}
        insights={['Modelo com maior/menor conversão', 'Etapa com maior drop-off', 'Eficiência do pré-preenchimento v4', 'Tempo médio por vertical']}
      />
      <TabDetail name="Saúde dos Dados" group="Risco" description="Qualidade e completude dos dados nos registros de leads."
        metricas={['% leads com e-mail', '% leads com CNPJ', '% leads com TPV', '% campos preenchidos']}
        graficos={['Barras de completude por campo', 'Evolução da qualidade']}
        insights={['Campos mais ignorados', 'Impacto na qualificação']}
      />

      {/* GRUPO: PARCEIROS */}
      <h4 className="text-sm font-bold text-cyan-600 border-b border-cyan-200 pb-1 mt-6">🤝 Parceiros</h4>
      <TabDetail name="Parceiros Adquirentes" group="Parceiros" description="Análise de uso e custos dos parceiros adquirentes nas propostas."
        metricas={['Propostas por parceiro', 'Custo médio por parceiro', 'Margem média por parceiro']}
        graficos={['Ranking por volume de propostas', 'Comparativo de custos']}
        insights={['Parceiro mais competitivo por MCC', 'Concentração em poucos parceiros']}
      />
    </div>
  );
}