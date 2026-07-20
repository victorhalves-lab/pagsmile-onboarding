import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  FileText, Loader2, RefreshCw, AlertTriangle, CheckCircle2, 
  AlertOctagon, Info, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * BDCNarrativeReport — Generates comprehensive, deeply detailed narrative from BDC analysis.
 * Every section is exhaustive. Every dataset is explained. Every finding has full context.
 */

function buildNarrativePrompt(analysis) {
  const isPF = analysis.type === 'PF';
  const sections = analysis.sections || {};
  
  const allItems = [];
  const extractItems = (sectionName, section) => {
    if (section?.items) {
      for (const item of section.items) {
        allItems.push({ 
          section: sectionName, 
          label: item.label, 
          value: item.value, 
          risk: item.risk, 
          points: item.points,
          details: item.details || null,
          owners: item.owners || null,
          lawsuits: item.lawsuits || null,
        });
      }
    }
  };

  if (isPF) {
    extractItems('Identidade', sections.identity);
    extractItems('Compliance', sections.compliance);
    extractItems('Reputação', sections.reputation);
  } else {
    extractItems('Dados Cadastrais', sections.identity);
    extractItems('Quadro Societário', sections.owners);
    extractItems('Presença Digital', sections.digital);
    extractItems('Compliance/PLD', sections.compliance);
    extractItems('Reputação', sections.reputation);
    extractItems('Financeiro', sections.financial);
    extractItems('Evolução Histórica', sections.evolution);
    extractItems('ESG / Lista Suja MTE', sections.esg);
    extractItems('Validação de Contatos', sections.contacts);
    extractItems('KYC Funcionários', sections.employeesKyc);
    extractItems('Dados Setoriais', sections.sectorial);
    extractItems('Ativos Patrimoniais', sections.assets);
  }

  const blocksText = (analysis.blocks || []).map(b => `- BLOQUEIO ${b.code}: ${b.label} — ${b.detail}`).join('\n');
  
  // Group items by section for richer context
  const sectionGroups = {};
  for (const item of allItems) {
    if (!sectionGroups[item.section]) sectionGroups[item.section] = [];
    sectionGroups[item.section].push(item);
  }
  
  const detailedItemsText = Object.entries(sectionGroups).map(([section, items]) => {
    const lines = items.map(i => {
      let line = `  - ${i.label}: ${i.value} (risco: ${i.risk}, impacto: ${i.points > 0 ? '+' : ''}${i.points} pontos)`;
      if (i.details) line += `\n    Detalhes: ${JSON.stringify(i.details)}`;
      if (i.owners && i.owners.length > 0) line += `\n    Sócios: ${i.owners.map(o => `${o.name} (${o.role || 'N/I'}, ${o.participation || '?'}%)`).join('; ')}`;
      if (i.lawsuits && i.lawsuits.length > 0) {
        line += `\n    Total de processos: ${i.lawsuits.length}`;
        for (const l of i.lawsuits.slice(0, 15)) {
          line += `\n      - Nº ${l.number} | Tipo: ${l.type || 'N/I'} | Assunto: ${l.subject || l.inferredSubject || 'N/I'} | Tribunal: ${l.court || 'N/I'} (${l.state || ''}) | Vara: ${l.judgingBody || l.courtDistrict || 'N/I'} | Status: ${l.status || 'N/I'} | Valor: ${l.value != null ? 'R$ ' + Number(l.value).toLocaleString('pt-BR') : 'N/I'} | Distribuição: ${l.startDate || 'N/I'} | Última mov.: ${l.lastUpdate || 'N/I'}`;
          if (l.recentUpdates && l.recentUpdates.length > 0) line += ` | Movimentações recentes: ${l.recentUpdates.slice(0, 3).map(u => u.content).join(' → ')}`;
          if (l.parties && l.parties.length > 0) line += ` | Partes: ${l.parties.slice(0, 4).map(p => `${p.name || p.Name || 'N/I'} (${p.specificType || p.type || p.Type || 'N/I'})`).join(', ')}`;
          if (l.ownerName) line += ` | Sócio: ${l.ownerName}`;
        }
        if (i.lawsuits.length > 15) line += `\n      ... e mais ${i.lawsuits.length - 15} processos`;
      }
      return line;
    }).join('\n');
    return `[${section}]\n${lines}`;
  }).join('\n\n');

  return `Você é o analista de compliance MAIS DETALHISTA e MAIS COMPLETO do mercado financeiro brasileiro. Seu trabalho é transformar dados técnicos da Big Data Corp em um relatório EXTREMAMENTE DETALHADO, EXTREMAMENTE PROFUNDO, EXTREMAMENTE BEM EXPLICADO que qualquer pessoa — do estagiário ao diretor — consiga entender perfeitamente.

CONTEXTO: A Big Data Corp (BDC) é uma empresa brasileira que agrega dados de dezenas de fontes públicas e privadas para criar um perfil completo de empresas e pessoas. Consultamos até 34 datasets (bases de dados) diferentes para montar este perfil. Cada dataset traz um tipo específico de informação.

═══════════════════════════════════════════════════
DADOS COMPLETOS DA ANÁLISE
═══════════════════════════════════════════════════

Tipo de consulta: ${analysis.type} (${isPF ? 'Pessoa Física — CPF' : 'Pessoa Jurídica — CNPJ'})
Score de Risco Final: ${analysis.scoring?.finalScore} de 849 pontos possíveis
Subfaixa de Decisão: ${analysis.scoring?.subfaixa} — ${analysis.scoring?.subfaixaNome}
Composição do Score:
  - Camada 1 (Score Base do Segmento): ${analysis.scoring?.baseScore} pontos — este é o risco inerente ao tipo de negócio
  - Camada 2 (Variáveis Encontradas): ${analysis.scoring?.variablesScore > 0 ? '+' : ''}${analysis.scoring?.variablesScore} pontos — pontos somados ou subtraídos com base nos dados encontrados
  - Camada 3 (Enriquecimento Externo): ${analysis.scoring?.enrichmentScore > 0 ? '+' : ''}${analysis.scoring?.enrichmentScore} pontos — pontos de reputação, mídia e mercado
Datasets Consultados: ${analysis.datasetsQueried} bases de dados
Grupo de Datasets: ${analysis.datasetGroup || 'N/D'}
Modelo do Template: ${analysis.templateModel || 'N/D'}
${analysis.scoring?.weightBreakdown ? `Pesos ponderados: ${Object.entries(analysis.scoring.weightBreakdown).map(([k,v]) => `${k}(${v.weight})=${v.weightedScore}pts`).join(', ')}` : ''}

${blocksText ? `═══ BLOQUEIOS ATIVOS (IMPEDEM APROVAÇÃO) ═══\n${blocksText}\n` : '═══ BLOQUEIOS: Nenhum bloqueio ativo ═══'}

═══ TODOS OS DADOS ENCONTRADOS POR SEÇÃO ═══
${detailedItemsText}

═══════════════════════════════════════════════════
INSTRUÇÕES — LEIA COM ATENÇÃO
═══════════════════════════════════════════════════

Escreva um relatório EXTREMAMENTE DETALHADO em português brasileiro. NÃO RESUMA. NÃO ABREVIE. Cada seção deve ser PROFUNDA e COMPLETA. O time de compliance precisa entender TUDO sem precisar olhar os dados brutos.

SEÇÕES OBRIGATÓRIAS (cada uma deve ter VÁRIOS parágrafos detalhados):

## 📊 Resumo Executivo

Escreva um resumo de pelo menos 8-10 linhas que cubra:
- Quem é esta ${isPF ? 'pessoa' : 'empresa'} (nome, tipo, setor, idade, porte)
- Qual o nível de risco geral e o que isso significa na prática
- Quantos pontos de atenção graves foram encontrados
- Se há bloqueios que impedem aprovação
- Qual a recomendação principal (aprovar, aprovar com condições, revisar manualmente, recusar)
- Qual o grau de confiança nesta análise (baseado na quantidade de dados disponíveis)
- Quais são os 2-3 fatores de risco MAIS IMPORTANTES que o decisor precisa saber IMEDIATAMENTE

## 🏢 ${isPF ? 'Perfil Completo da Pessoa' : 'Perfil Completo da Empresa'}

Escreva uma narrativa DETALHADA (mínimo 10-15 linhas) como se estivesse contando a história desta ${isPF ? 'pessoa' : 'empresa'}:
${isPF ? `
- Nome completo, CPF (situação junto à Receita Federal), data de nascimento, idade atual
- Endereço principal, cidade, estado, se há mais endereços cadastrados
- Telefones e e-mails vinculados
- Nome da mãe (se disponível — usado para validação de identidade)
- Gênero, nacionalidade
- Se há alguma irregularidade no CPF e o que isso implica
` : `
- Razão social completa, nome fantasia, CNPJ com situação cadastral junto à Receita Federal
- Data de fundação e quantos anos tem a empresa — explicar se é nova (menos de 2 anos = risco maior) ou estabelecida
- Capital social declarado — explicar se é compatível com o volume de transações que pretende processar
- Porte (MEI, ME, EPP, Demais) e o que isso significa na prática
- Regime tributário (Simples Nacional, Lucro Presumido, Lucro Real) e o que implica
- Natureza jurídica completa e o que significa (LTDA, S.A., EIRELI, etc.)
- CNAE principal e secundários — explicar em linguagem simples qual é a atividade da empresa e se algum CNAE é considerado de risco (jogos, apostas, cripto, armas, etc.)
- Endereço principal completo
- Número de empregados (se disponível) — empresa sem funcionários pode ser sinal de empresa de fachada
- E-mail e telefone principal
- Se há alguma situação especial (em recuperação judicial, em liquidação, etc.)
`}

## 👥 ${isPF ? 'Situação Legal e Compliance' : 'Quadro Societário — Análise Detalhada de Cada Sócio'}

${isPF ? `Escreva uma análise DETALHADA (mínimo 10 linhas) sobre:
- Se a pessoa é PEP (Pessoa Politicamente Exposta) — explicar o que é PEP e por que é relevante para compliance
- Se está em alguma lista de sanções nacional ou internacional (OFAC, EU, UN, COAF, CEIS, CNEP)
- Todos os processos judiciais encontrados — para CADA processo: tipo (cível, criminal, trabalhista, tributário), tribunal, status, valor da causa, e o que significa
- Se tem negativação (nome sujo) — Serasa, SPC, protestos — valores e credores
- Se tem dívida ativa com o governo — valores e órgãos
- Se já fez doações eleitorais — valores e para quem
` : `Escreva uma análise DETALHADA (mínimo 15 linhas) sobre CADA sócio encontrado:
- Liste CADA sócio por nome, CPF/CNPJ, qualificação (administrador, sócio, etc.), percentual de participação
- Para cada sócio, informe: se é PEP (Pessoa Politicamente Exposta — explicar que PEP é qualquer pessoa que exerce ou exerceu cargo público relevante, como vereador, juiz, diretor de estatal, e seus familiares), se está em lista de sanções
- Se algum sócio tem processos judiciais — detalhar cada processo: número, tipo, tribunal, status, valor, e explicar o que significa
- Se algum sócio fez doações eleitorais — valores e para quais partidos/candidatos
- Se há vínculos com envolvimento político
- Se o quadro societário é compatível com o tipo de empresa (exemplo: empresa de tecnologia com 0 sócios pode ser empresa de fachada)
- Se há sócios em comum com outras empresas (grupo econômico)
`}

## 🌐 Presença Digital e Atividade Real
${isPF ? 'Se houver dados de presença online, descreva.' : `
Escreva uma análise DETALHADA (mínimo 8-10 linhas) sobre:
- Domínios registrados da empresa — idade do domínio, SSL, plataforma tecnológica, métodos de pagamento aceitos, tipo de site
- Passagens pela web — quantas vezes a empresa apareceu em buscas/sites nos últimos 12 meses. Zero passagens = empresa fantasma
- Nível de atividade — score de operação real
- Score de "Shell Company" (empresa de fachada) — >30% preocupante, >50% grave, >80% bloqueio
- Presença em marketplaces, anúncios online
`}

## 📈 Evolução Histórica e Alterações Cadastrais
${isPF ? 'Se disponível, descreva histórico da pessoa.' : `
Escreva uma análise DETALHADA sobre:
- Evolução do capital social ao longo do tempo — se houve queda significativa (esvaziamento patrimonial?)
- Evolução do número de funcionários — se houve queda drástica (empresa encerrando operações?)
- Histórico de alterações cadastrais — quantas mudanças nos últimos 12 meses
- Mudanças de CNAE — se a empresa mudou de atividade recentemente e por quê
- Mudanças de razão social — se trocou de nome (tentando se desvincular de histórico negativo?)
- O que a ESTABILIDADE ou INSTABILIDADE cadastral diz sobre esta empresa
`}

## 🌿 ESG / Lista Suja MTE / Compliance Ambiental
${isPF ? 'Se disponível, descreva dados ESG da pessoa.' : `
Escreva uma análise DETALHADA sobre:
- Se a empresa consta na Lista Suja do MTE (trabalho escravo) — PRESENÇA = REJEIÇÃO IMEDIATA
- Scores ESG (ambiental, social, governança) se disponíveis
- Embargos IBAMA se detectados — o que significa para a operação
- Alertas de desmatamento se detectados
- Implicações legais e regulatórias de cada achado
`}

## 📞 Validação de Contatos
${isPF ? '' : `
Analise os contatos encontrados pela BDC:
- Telefones: quantos encontrados, tipos (fixo/móvel), operadoras, status (ativo/inativo)
- E-mails: domínios corporativos vs genéricos (gmail, hotmail), o que isso indica sobre a maturidade da empresa
- Endereços: quantos encontrados, se corroboram o endereço declarado
- Divergências entre contatos declarados e contatos encontrados
`}

## 👷 KYC Funcionários
${isPF ? 'Não aplicável para PF.' : `
Analise o resultado do KYC dos funcionários da empresa:
- Se algum funcionário é PEP (Pessoa Politicamente Exposta) — explicar por que funcionários PEP são um risco operacional
- Se algum funcionário consta em listas de sanções — impacto direto na operação
- Número total de funcionários verificados
`}

## 🏛️ Dados Setoriais (Registros Regulatórios)
${isPF ? 'Não aplicável para PF.' : `
Analise os registros em órgãos reguladores setoriais:
- ANVISA, CVM, ANS, OAB, CRM, CREA, e outros
- Status de cada registro (ativo, inativo, suspenso)
- Se a empresa precisa de registro setorial e não possui — red flag regulatório
- O que cada registro significa para a operação
`}

## 🏠 Ativos Patrimoniais
${isPF ? 'Não aplicável para PF.' : `
Analise os ativos registrados em nome da empresa:
- Imóveis (cartórios), veículos (DETRAN/RENAVAM), aeronaves (ANAC), embarcações (Marinha)
- Valor estimado total dos ativos
- O que a presença ou ausência de ativos diz sobre a solidez da empresa
- Empresas de fachada raramente possuem ativos patrimoniais registrados
`}

${isPF ? `## 💰 Renda e Patrimônio Estimado
Analise os dados de renda e patrimônio da pessoa:
- Renda estimada mensal — se é compatível com a participação societária
- Patrimônio estimado — se é compatível com o capital investido
- O que divergências entre renda/patrimônio e atividade econômica indicam

## 🗳️ Envolvimento Político Individual
Analise vínculos políticos individuais:
- Candidaturas, filiações partidárias, cargos públicos
- Implicações para compliance e PLD/FT

## 📱 Comportamento Digital e Mobilidade
Analise dados comportamentais:
- Frequência de mudanças de endereço e telefone
- Atividade digital — presença ou ausência online
- O que padrões de alta mobilidade indicam para risco
` : ''}

## ⚠️ Pontos de Atenção — Análise Detalhada de Cada Risco

Para CADA item com risco ALTO ou CRÍTICO, escreva um bloco detalhado com:

**1. O que foi encontrado** — Descreva o dado objetivo encontrado, com números e detalhes. Não diga apenas "tem processos", diga "foram encontrados 15 processos judiciais, sendo 3 criminais e 12 cíveis, com valor total de R$ 2.3 milhões".

**2. Por que isso é grave** — Explique em linguagem simples por que este achado é preocupante. Exemplo: "Processos criminais indicam que os sócios podem estar envolvidos em atividades ilegais. Se a empresa for aprovada e houver lavagem de dinheiro, a Pin Bank pode ser responsabilizada como facilitadora."

**3. Qual o impacto regulatório** — Explique quais normas/regulamentos este achado pode violar (Circular BCB 3.978, Resolução 4.893, normas de PLD/FT, etc.) — mas EXPLICANDO o que cada norma exige em linguagem simples.

**4. O que recomendamos fazer** — Ação específica: solicitar documentos, pedir esclarecimentos, monitorar, bloquear, etc. Seja ESPECÍFICO (exemplo: "Solicitar ao merchant uma certidão negativa criminal do sócio João Silva emitida há no máximo 30 dias").

## ✅ Pontos Positivos — O que Favorece este Caso

Liste TODOS os aspectos positivos encontrados, explicando por que cada um é relevante. Exemplos:
- Empresa ativa há mais de 5 anos sem alterações suspeitas = estabilidade
- Sem negativação ou dívida ativa = saúde financeira
- Boa reputação no Reclame Aqui = empresa que se preocupa com clientes
- Presença em marketplaces reconhecidos = operação legítima verificável
- Capital social compatível com operação = não é subcapitalizada
NÃO resuma em uma linha. Explique cada ponto positivo e por que ele importa.

## 📋 Recomendação Final Detalhada

Escreva um parecer conclusivo de pelo menos 8-10 linhas que inclua:
- Decisão recomendada: Aprovar / Aprovar com Condições / Revisão Manual / Recusar
- Justificativa detalhada da decisão
- Se "Aprovado com Condições": liste CADA condição específica (Rolling Reserve de X%, monitoramento mensal, KYC reforçado, etc.)
- Se "Revisão Manual": liste EXATAMENTE o que o analista deve investigar e quais documentos solicitar
- Se "Recusar": explique EXATAMENTE quais achados são bloqueantes e por quê
- Nível de confiança na análise (alto, médio, baixo) e por quê
- Sugestão de monitoramento pós-aprovação (se aplicável)

## 🗂️ Datasets Consultados — O que Cada Fonte de Dados Revelou

Para CADA dataset consultado que retornou dados, escreva um parágrafo explicando:
1. **Nome do dataset** e o que ele faz (em linguagem simples)
2. **O que encontramos** neste dataset específico
3. **O que isso significa** para a análise de risco

Datasets que devem ser explicados (se consultados):
- **basic_data**: Dados cadastrais básicos da Receita Federal — CNPJ, razão social, situação, fundação, capital, CNAE
- **registration_data**: Dados de registro detalhados — QSA completo, inscrição estadual, situação especial
- **kyc**: Know Your Customer — verifica se a empresa está em listas de sanções (OFAC, EU, UN), se é PEP, doações eleitorais
- **owners_kyc**: KYC de cada sócio individualmente — PEP, sanções, processos por sócio
- **relationships**: Vínculos societários — quem são os sócios, qualificação, percentual
- **owners_lawsuits**: Processos judiciais de cada sócio
- **owners_influence**: Nível de influência e conexões dos sócios
- **owners_electoral_donors**: Doações eleitorais feitas pelos sócios
- **political_involvement**: Envolvimento político do quadro societário
- **government_debtors**: Dívida ativa com governo federal, estadual, municipal
- **processes**: Processos judiciais da empresa (não dos sócios)
- **domains**: Domínios de internet registrados, idade, SSL, plataforma
- **passages**: Passagens pela web — proxy de atividade real da empresa
- **activity_indicators**: Indicadores de atividade — nível de operação real, score de empresa de fachada
- **media_profile_and_exposure**: Notícias na mídia com análise de sentimento — positivo, neutro, negativo
- **reputations_and_reviews**: Avaliações em plataformas como Reclame Aqui
- **collections**: Presença em cobrança — Serasa, SPC, protestos
- **financial_market**: Registros no Banco Central, CVM, SUSEP
- **marketplace_data**: Presença em marketplaces (Mercado Livre, Shopee, etc.)
- **merchant_category_data**: MCC (Merchant Category Code) real da empresa
- **economic_group**: Grupo econômico — empresas relacionadas
- **economic_group_kyc**: KYC do grupo econômico — PEP e sanções de entidades do grupo econômico inteiro (participações indiretas)
- **economic_group_relationships**: Relacionamentos do grupo econômico — mapeamento completo de todas empresas do grupo com vínculos corporativos
- **configurable_recency_qsa**: QSA em tempo real da Receita Federal — composição societária atualizada em real-time
- **lawsuits_distribution_data**: Distribuição de processos — visão agregada por tipo (criminal, cível, trabalhista)
- **owners_lawsuits_distribution**: Distribuição de processos dos sócios — pré-triagem agregada
- **history_basic_data**: Histórico de dados cadastrais — mudanças de nome, CNAE, regime tributário ao longo do tempo
- **company_evolution**: Evolução da empresa — série temporal de capital social, funcionários, sócios
- **esg_and_compliance**: ESG — Lista Suja do MTE (trabalho escravo), indicadores ambientais e sociais, embargos IBAMA
- **emails_extended**: E-mails associados à empresa — domínios corporativos vs genéricos
- **phones_extended**: Telefones associados — tipo, operadora, status ativo/inativo
- **addresses_extended**: Endereços associados em bases públicas e privadas
- **risk_data**: Dados de risco PF — cobrança, inadimplência, nível de risco individual
- **employees_kyc**: KYC dos funcionários — verifica PEP e sanções entre empregados-chave da empresa
- **sectorial_data**: Dados setoriais — registros em ANVISA, CVM, ANS, OAB, CRM, CREA e outros órgãos reguladores
- **assets**: Ativos patrimoniais — imóveis, veículos, aeronaves e embarcações registrados em nome da empresa/sócios
- **income_estimated**: Renda e patrimônio estimado PF — faixa de renda e patrimônio calculados por modelos estatísticos
- **political_involvement**: Envolvimento político — candidaturas, filiações partidárias, cargos públicos
- **behavior_data**: Dados comportamentais PF — frequência de mudanças de endereço/telefone, atividade digital

REGRAS ABSOLUTAS:
- NUNCA resuma algo em 1-2 linhas quando pode explicar em 5-8 linhas
- NUNCA use sigla sem explicar o que significa entre parênteses
- NUNCA diga apenas "risco alto" sem explicar POR QUE é alto e QUAL O IMPACTO PRÁTICO
- SEMPRE use exemplos concretos com os dados reais encontrados (números, nomes, datas)
- SEMPRE explique como se a pessoa lendo NUNCA tivesse trabalhado com compliance
- Use negrito para destacar informações importantes
- O relatório deve ter pelo menos 2000 palavras para ser considerado adequadamente detalhado`;
}

export default function BDCNarrativeReport({ analysis, complianceScore }) {
  const [narrative, setNarrative] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (analysis && !narrative && !generating) {
      if (complianceScore?.analise_completa_ia && complianceScore.analise_completa_ia.length > 500) {
        setNarrative(complianceScore.analise_completa_ia);
        return;
      }
      generateNarrative();
    }
  }, [analysis]);

  const generateNarrative = async () => {
    if (!analysis) return;
    setGenerating(true);
    setError(null);
    try {
      const prompt = buildNarrativePrompt(analysis);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });
      setNarrative(result);
    } catch (e) {
      console.error('Narrative generation error:', e);
      setError('Não foi possível gerar o relatório narrativo. Tente novamente.');
    }
    setGenerating(false);
  };

  if (!analysis) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#0A0A0A]">📝 Relatório Completo — Análise BDC em Linguagem Clara</h4>
          <p className="text-[10px] text-[#0A0A0A]/40">
            Análise profunda e detalhada de todos os datasets da Big Data Corp — cada dado explicado em linguagem natural
          </p>
        </div>
        <div className="flex items-center gap-2">
          {narrative && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); generateNarrative(); }}
              disabled={generating}
              className="text-[10px] h-7 px-2"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${generating ? 'animate-spin' : ''}`} />
              Regerar
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-6">
          {generating && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-sm font-medium text-[#0A0A0A]/60">Gerando relatório detalhado com IA...</p>
              <p className="text-xs text-[#0A0A0A]/40">Analisando todos os datasets e gerando explicações completas. Pode levar até 30 segundos.</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-xs text-red-700 mb-2">{error}</p>
              <Button size="sm" onClick={generateNarrative} className="bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                <RefreshCw className="w-3 h-3 mr-1" /> Tentar Novamente
              </Button>
            </div>
          )}

          {narrative && !generating && (
            <div className="prose prose-sm max-w-none text-[#0A0A0A]">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold text-[#0A0A0A] mt-7 mb-3 pb-2 border-b-2 border-indigo-100">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold text-[#0A0A0A] mt-5 mb-2 pl-3 border-l-3 border-indigo-300">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-[13px] text-[#0A0A0A]/85 leading-[1.8] my-2">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-[#0A0A0A] font-bold">{children}</strong>
                  ),
                  li: ({ children }) => (
                    <li className="text-[13px] text-[#0A0A0A]/85 leading-[1.8] my-1.5">{children}</li>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1">{children}</ol>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-300 pl-4 my-4 bg-indigo-50/40 py-3 pr-4 rounded-r-xl text-[13px] italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-6 border-slate-200" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="bg-slate-50 px-3 py-2 text-left font-bold text-[#0A0A0A] border border-slate-200 text-xs">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-[#0A0A0A]/80 border border-slate-200 text-xs">
                      {children}
                    </td>
                  ),
                }}
              >
                {narrative}
              </ReactMarkdown>
            </div>
          )}

          {!narrative && !generating && !error && (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-[#0A0A0A]/15 mx-auto mb-4" />
              <p className="text-sm font-medium text-[#0A0A0A]/50 mb-2">Relatório detalhado ainda não gerado</p>
              <p className="text-xs text-[#0A0A0A]/35 mb-4 max-w-md mx-auto">
                Clique abaixo para gerar uma análise completa e profunda de todos os dados da Big Data Corp, 
                com explicação de cada dataset, cada achado de risco, e recomendações detalhadas.
              </p>
              <Button onClick={generateNarrative} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-10 px-5 rounded-xl">
                <Sparkles className="w-4 h-4 mr-2" /> Gerar Relatório Completo Detalhado
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}