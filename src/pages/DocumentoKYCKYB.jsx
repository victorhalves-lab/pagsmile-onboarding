import React, { useRef } from 'react';
import { Shield, Download, Printer, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";
const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png";

const H1 = ({ children, id }) => <h1 id={id} className="text-2xl font-black text-[#002443] mt-10 mb-4 pb-2 border-b-2 border-[#2bc196] print:text-xl print:mt-6">{children}</h1>;
const H2 = ({ children }) => <h2 className="text-lg font-bold text-[#002443] mt-6 mb-2 print:text-base print:mt-4">{children}</h2>;
const H3 = ({ children }) => <h3 className="text-base font-bold text-[#002443]/80 mt-4 mb-1.5 print:text-sm">{children}</h3>;
const P = ({ children }) => <p className="text-sm text-[#002443]/80 leading-relaxed mb-2 print:text-xs">{children}</p>;
const Li = ({ children }) => <li className="text-sm text-[#002443]/80 leading-relaxed print:text-xs">{children}</li>;
const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto my-3">
    <table className="w-full text-xs border border-[#002443]/10 print:text-[10px]">
      <thead><tr className="bg-[#002443] text-white">{headers.map((h,i) => <th key={i} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i) => <tr key={i} className={i%2===0 ? 'bg-white' : 'bg-[#f4f4f4]'}>{r.map((c,j) => <td key={j} className="px-3 py-1.5 border-t border-[#002443]/5">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);
const InfoBox = ({ title, children, color = 'blue' }) => {
  const colors = { blue: 'bg-blue-50 border-blue-200', green: 'bg-emerald-50 border-emerald-200', red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200' };
  return <div className={`p-4 rounded-xl border ${colors[color]} my-3 print:p-2 print:rounded-lg`}><p className="text-xs font-bold text-[#002443] mb-1">{title}</p><div className="text-xs text-[#002443]/70 leading-relaxed">{children}</div></div>;
};

const TOC_ITEMS = [
  { id: 's1', n: '1', label: 'Visão Geral — Arquitetura do Pipeline KYC/KYB' },
  { id: 's2', n: '2', label: 'Segmentação por Tipo de Negócio' },
  { id: 's3', n: '3', label: 'Questionários de Compliance — Estrutura e Perguntas' },
  { id: 's4', n: '4', label: 'Enriquecimento de Dados — BigDataCorp (BDC)' },
  { id: 's5', n: '5', label: 'Validação de Identidade — CAF (Combate à Fraude)' },
  { id: 's6', n: '6', label: 'Framework de Risk Scoring V4.0' },
  { id: 's7', n: '7', label: 'Pipeline Automatizado (Orquestrador)' },
  { id: 's8', n: '8', label: 'Tabela de Decisão Determinística' },
  { id: 's9', n: '9', label: 'Fluxo de Subsellers (PJ e PF)' },
  { id: 's10', n: '10', label: 'Análise SENTINEL IA (Agente Relator)' },
  { id: 's11', n: '11', label: 'Monitoramento Contínuo e Revalidação' },
  { id: 's12', n: '12', label: 'Painel de Análise de Risco — Visão do Analista' },
];

export default function DocumentoKYCKYB() {
  const handlePrint = () => window.print();

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* ══════ CAPA ══════ */}
      <div className="bg-[#002443] rounded-2xl p-10 mb-8 text-white relative overflow-hidden print:rounded-none print:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2bc196]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2bc196]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <img src={LOGO_DARK} alt="PagSmile" className="h-8 mb-8" />
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#2bc196]" />
            <span className="text-[#2bc196] text-sm font-bold tracking-wider uppercase">Documento Oficial de Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 print:text-2xl">Manual de Processos KYC / KYB</h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Descrição microscópica e exaustiva de todo o processo de onboarding, verificação de identidade, 
            enriquecimento de dados, scoring de risco e decisão automatizada da PagSmile — cobrindo fluxos de 
            Cartão (10 segmentos), PIX (Merchant e Intermediário) e Subsellers (PJ e PF).
          </p>
          <div className="flex items-center gap-4 mt-6 text-xs text-white/40">
            <span>Versão 4.0</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span>Confidencial</span>
          </div>
          <div className="mt-6 print:hidden">
            <Button onClick={handlePrint} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2">
              <Printer className="w-4 h-4" /> Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ══════ TOC ══════ */}
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-6 mb-8 print:break-after-page print:border-0">
        <h2 className="text-base font-bold text-[#002443] mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-[#2bc196]" /> Índice</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {TOC_ITEMS.map(t => (
            <a key={t.id} href={`#${t.id}`} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-[#002443]/70 hover:bg-[#2bc196]/5 hover:text-[#2bc196] transition-colors print:text-xs">
              <span className="w-6 h-6 rounded-full bg-[#002443] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{t.n}</span>
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {/* ══════ CORPO ══════ */}
      <div className="bg-white rounded-2xl border border-[#002443]/8 px-8 py-6 print:border-0 print:px-6 space-y-0">

{/* ═══════════ SEÇÃO 1 ═══════════ */}
<H1 id="s1">1. Visão Geral — Arquitetura do Pipeline KYC/KYB</H1>
<P>O pipeline de compliance da PagSmile é uma arquitetura Data-First v7.0 com 5 camadas sequenciais, onde cada camada alimenta a seguinte. A decisão final é 100% determinística — baseada exclusivamente em dados objetivos (score V4 + bloqueios + CAF), sem intervenção humana no fluxo automatizado.</P>

<H2>1.1. Fluxo Macro do Pipeline</H2>
<P>O processo completo segue esta sequência obrigatória:</P>
<ol className="list-decimal ml-6 space-y-1 mb-3">
  <Li><strong>Questionário de Compliance</strong> — Cliente preenche formulário específico ao seu segmento (Cartão ou PIX). O questionário coleta dados cadastrais, societários, operacionais, de compliance/PLD e declarações.</Li>
  <Li><strong>Upload de Documentos</strong> — Documentos societários (Contrato Social, Certidão Simplificada), documentos pessoais (RG/CNH do representante legal) e comprovante de endereço.</Li>
  <Li><strong>Verificação de Identidade (CAF)</strong> — Captura de documento (frente/verso) via SDK com document detector, seguida de prova de vida (liveness) com detecção de deepfake e facematch contra o documento.</Li>
  <Li><strong>Enriquecimento e Scoring (BDC + CAF)</strong> — Pipeline automatizado que consulta até 39 datasets na BigDataCorp, executa screening internacional de PEP/sanções via CAF, e calcula o Risk Score V4 em 3 camadas determinísticas.</Li>
  <Li><strong>Análise SENTINEL IA</strong> — Agente de IA que cruza todas as fontes (questionário × BDC × CAF) e gera relatório narrativo para dossiê. O SENTINEL é RELATOR — não tem poder de decisão.</Li>
  <Li><strong>Decisão Determinística</strong> — Baseada na subfaixa V4 (1A→5) e em fraude CAF confirmada. Notificação Slack e atualização automática de status.</Li>
</ol>

<InfoBox title="Princípio Arquitetural — Regra de Ouro v7.0" color="green">
  <ul className="list-disc ml-4 space-y-0.5">
    <li><strong>V4 (BDC) = DECISOR ABSOLUTO:</strong> score, subfaixa, bloqueios, rolling reserve, monitoramento</li>
    <li><strong>SENTINEL IA = RELATOR APENAS:</strong> narrativa, dossiê, cross-validation (NÃO afeta decisão)</li>
    <li><strong>CAF = VETO BIOMÉTRICO:</strong> única exceção que pode mudar decisão (fraude confirmada → Manual)</li>
    <li><strong>Questionário = CONTEXTO:</strong> alimenta perguntas sugeridas, nunca veta</li>
  </ul>
</InfoBox>

<H2>1.2. Regulamentações Base</H2>
<P>Todo o processo é fundamentado nas seguintes regulamentações:</P>
<ul className="list-disc ml-6 space-y-1 mb-3">
  <Li><strong>Circular BCB 3.978/2020</strong> — Política de PLD/FT para instituições de pagamento. Define obrigatoriedade de KYC, CDD, EDD para PEPs, identificação de beneficiários finais (≥25%).</Li>
  <Li><strong>Lei 9.613/1998</strong> — Lei de Prevenção à Lavagem de Dinheiro. Obriga reportar operações suspeitas ao COAF.</Li>
  <Li><strong>Resolução CMN 4.893/2021</strong> — Classifica atividades por nível de risco para instituições de pagamento.</Li>
  <Li><strong>IN RFB 1.863/2018</strong> — Define situações cadastrais de CNPJ/CPF.</Li>
  <Li><strong>Resolução BCB 5.037/2022</strong> — Sistema de Informações de Crédito (SCR).</Li>
</ul>

{/* ═══════════ SEÇÃO 2 ═══════════ */}
<H1 id="s2">2. Segmentação por Tipo de Negócio</H1>
<P>O processo é segmentado para adequar a profundidade da análise ao risco inerente de cada tipo de negócio. Cada segmento tem seu próprio modelo de questionário, grupo de datasets BDC e score base V4.</P>

<H2>2.1. Segmentos de Cartão (10 modelos)</H2>
<Table
  headers={['Segmento', 'Modelo Compliance', 'Grupo BDC', 'Score Base V4', 'Nível de Risco', 'Datasets BDC']}
  rows={[
    ['Gateway', 'ComplianceGatewayV4', 'FULL', '175', 'Muito Alto', '39 datasets'],
    ['Marketplace', 'ComplianceMarketplaceV4', 'FULL', '140', 'Alto', '39 datasets'],
    ['Plataformas Verticais', 'CompliancePlataformaVerticalV4', 'FULL', '120', 'Alto', '39 datasets'],
    ['Dropshipping', 'ComplianceDropshippingV4', 'STANDARD', '110', 'Médio-Alto', '33 datasets'],
    ['Infoprodutos', 'ComplianceInfoprodutosV4', 'STANDARD', '90', 'Médio', '33 datasets'],
    ['E-commerce', 'ComplianceEcommerceV4', 'STANDARD', '80', 'Médio', '33 datasets'],
    ['SaaS', 'ComplianceSaaSV4', 'STANDARD', '70', 'Médio-Baixo', '33 datasets'],
    ['Link de Pagamento', 'ComplianceMerchantLinkV4', 'STANDARD', '60', 'Médio-Baixo', '33 datasets'],
    ['Educação', 'ComplianceEducacaoV4', 'STANDARD', '50', 'Baixo', '33 datasets'],
    ['MPE', 'ComplianceMPEV4', 'LITE', '35', 'Baixo', '23 datasets'],
  ]}
/>

<H2>2.2. Segmentos PIX (2 modelos)</H2>
<Table
  headers={['Segmento PIX', 'Modelo Compliance', 'Grupo BDC', 'Score Base V4', 'Datasets BDC']}
  rows={[
    ['PIX Intermediário', 'pix_intermediario_v4', 'PIX_INTERMEDIARIO', '155', '31 datasets (inclui grupo econômico, credit risk)'],
    ['PIX Merchant', 'CompliancePixMerchantV4', 'PIX_MERCHANT', '65', '22 datasets'],
  ]}
/>

<H2>2.3. Segmentos Subseller (2 modelos)</H2>
<Table
  headers={['Tipo', 'Grupo BDC', 'Score Base', 'Endpoint', 'Datasets']}
  rows={[
    ['Subseller PJ (CNPJ)', 'SUBSELLER_PJ', '45', '/empresas', '23 datasets'],
    ['Subseller PF (CPF)', 'SUBSELLER_PF', '30', '/pessoas', '23 datasets (inclui SCR BCB, família KYC, renda presumida)'],
  ]}
/>

<InfoBox title="Lógica de Score Base" color="blue">
  O score base é o ponto de partida da Camada 1 do V4. Segmentos de maior risco inerente (Gateway=175, PIX Intermediário=155) partem de um score mais alto, exigindo mais dados positivos para compensar. Segmentos de menor risco (Educação=50, MPE=35) partem de um patamar mais favorável.
</InfoBox>

{/* ═══════════ SEÇÃO 3 ═══════════ */}
<H1 id="s3">3. Questionários de Compliance — Estrutura e Perguntas</H1>
<P>Cada segmento possui um template de questionário dinâmico composto por perguntas armazenadas na entidade <code>Question</code>, vinculadas a um <code>QuestionnaireTemplate</code>. As perguntas são agrupadas automaticamente em steps de 4 perguntas com títulos semânticos gerados por IA.</P>

<H2>3.1. Tipos de Perguntas Suportados</H2>
<Table
  headers={['Tipo', 'Descrição', 'Exemplo']}
  rows={[
    ['TEXT', 'Campo de texto livre', 'Descrição da atividade principal'],
    ['NUMBER', 'Valor numérico', 'Volume mensal estimado (TPV)'],
    ['DATE', 'Seletor de data', 'Data de início das atividades'],
    ['SELECT', 'Seleção única (dropdown)', 'Porte da empresa (MEI, ME, EPP, Demais)'],
    ['MULTI_SELECT', 'Seleção múltipla', 'Quais serviços de pagamento utiliza?'],
    ['BOOLEAN', 'Sim/Não', 'A empresa opera com criptomoedas?'],
    ['EMAIL', 'Campo de e-mail com validação', 'E-mail corporativo'],
    ['PHONE', 'Campo de telefone com máscara', 'Telefone principal'],
    ['CPF_CNPJ', 'Campo com validação de CPF/CNPJ + autocomplete BDC', 'CNPJ da empresa'],
    ['FILE_UPLOAD', 'Upload de arquivo (PDF, JPG, PNG)', 'Contrato social'],
  ]}
/>

<H2>3.2. Funcionalidades Avançadas do Questionário</H2>
<ul className="list-disc ml-6 space-y-1.5 mb-3">
  <Li><strong>Autocomplete de CNPJ:</strong> Ao digitar o CNPJ, o sistema consulta a API BrasilAPI em tempo real e preenche automaticamente: Razão Social, Nome Fantasia, CNAE Principal, CNAEs Secundários, Capital Social, Porte, Regime Tributário, Endereço completo (7 campos), QSA (sócios), Data de Abertura, Situação Cadastral, E-mail/Telefone da Receita. Se o CNPJ retornar situação cadastral diferente de ATIVA, o avanço é BLOQUEADO.</Li>
  <Li><strong>Autocomplete de CEP:</strong> Consulta ViaCEP e preenche logradouro, bairro, cidade e UF automaticamente.</Li>
  <Li><strong>Lógica Condicional:</strong> Perguntas podem ter <code>conditionalLogic</code> que as exibe/oculta com base na resposta de outra pergunta. Operadores: equals, not_equals, contains, greater_than, less_than, in.</Li>
  <Li><strong>Pré-preenchimento de Lead:</strong> Se o cliente já preencheu um questionário comercial (Lead), os dados são automaticamente importados para o questionário de compliance, evitando retrabalho.</Li>
  <Li><strong>Peso de Risco (riskWeight):</strong> Cada pergunta pode ter um peso de risco e valores de risco por resposta (<code>riskValues</code>), usados na Camada 2 do scoring V4.</Li>
  <Li><strong>Save & Resume:</strong> Progresso é salvo automaticamente a cada alteração (local + servidor via <code>ComplianceSession</code>). O cliente pode fechar o navegador e retomar de onde parou usando um link com token de sessão.</Li>
  <Li><strong>Screening em Background:</strong> Ao preencher o CNPJ, o sistema executa automaticamente em background: verificação CEIS (Cadastro Nacional de Empresas Inidôneas e Suspensas), CNEP, e screening de PEPs do QSA.</Li>
  <Li><strong>Compliance Flags em Tempo Real:</strong> O hook <code>useComplianceFlags</code> avalia as respostas em tempo real e gera alertas visuais quando detecta padrões de risco (ex: atividade restrita marcada como Sim, incompatibilidade CNAE vs atividade).</Li>
</ul>

<H2>3.3. Blocos de Perguntas por Segmento (Estrutura Típica)</H2>
<P>Embora cada segmento tenha perguntas específicas, a estrutura geral segue este padrão:</P>
<Table
  headers={['Bloco', 'Tema', 'Perguntas Típicas', 'Segmentos']}
  rows={[
    ['A', 'Identificação', 'CNPJ, Razão Social, Nome Fantasia, Situação Cadastral, Capital Social, Porte, CNAE, Data Abertura', 'Todos'],
    ['B', 'Endereço', 'CEP, Logradouro, Número, Complemento, Bairro, Cidade, UF', 'Todos'],
    ['C', 'Atividade e Negócio', 'Descrição do negócio, Website, Modelo (B2B/B2C), Produtos/Serviços, Canais de venda', 'Todos'],
    ['D', 'Estrutura Societária/UBO', 'Quadro societário, Beneficiários finais (≥25%), Nacionalidade, CPF dos sócios', 'FULL, STANDARD'],
    ['E', 'Volume Operacional', 'TPV mensal, Ticket médio, Transações/mês, Expectativa de crescimento', 'Todos'],
    ['F', 'Perfil de Clientes', 'Tipo de cliente (PF/PJ), Perfil demográfico, Recorrência, Internacional', 'FULL, STANDARD'],
    ['G', 'Compliance/PLD', 'Possui programa PLD? Monitoramento de transações? KYC de submerchants? Política de AML?', 'FULL, STANDARD'],
    ['H', 'PEP/Sanções', 'Sócios são PEP? Relacionamento com pessoas sancionadas? Operações em países de alto risco?', 'FULL'],
    ['I', 'Declarações', 'Atividades proibidas (jogos, armas, crypto), Veracidade, Autorização para consultas', 'Todos'],
    ['P', 'PIX Específico', 'Tipo de negócio PIX, Chave PIX, Modalidade (QR/API), Volume PIX mensal', 'PIX apenas'],
  ]}
/>

{/* ═══════════ SEÇÃO 4 ═══════════ */}
<H1 id="s4">4. Enriquecimento de Dados — BigDataCorp (BDC)</H1>
<P>A BigDataCorp é o provedor primário de dados cadastrais, regulatórios e de crédito. O sistema consulta entre 22 e 39 datasets dependendo do segmento, via endpoint <code>/empresas</code> (PJ) ou <code>/pessoas</code> (PF).</P>

<H2>4.1. Grupos de Datasets por Nível de Profundidade</H2>

<H3>FULL (39 datasets) — Gateway, Marketplace, Plataformas Verticais</H3>
<Table
  headers={['Dataset', 'O que consulta', 'Impacto no Score']}
  rows={[
    ['basic_data', 'Razão Social, Nome Fantasia, CNAE, Capital Social, Porte, Situação Cadastral, Data Abertura, Endereço, Empregados', 'B01 (Inativo), Idade < 1 ano (+25), Capital < R$1k (+15)'],
    ['registration_data', 'Inscrição Estadual, Situação Especial, Regime Tributário', 'Situação Especial (+10)'],
    ['history_basic_data', 'Série temporal de alterações cadastrais (CNAE, razão social, capital)', 'Alterações recentes > 3 (+15), Mudanças CNAE > 2 (+10)'],
    ['company_evolution', 'Evolução de capital social, empregados e sócios ao longo do tempo', 'Queda capital > 50% (+20), Queda empregados > 80% (+15)'],
    ['kyc', 'Sanções (OFAC, EU, UN, COAF, CEIS, CNEP), PEP, Status regulatório', 'B03 (Sanções=bloqueio), PEP (+40)'],
    ['owners_kyc', 'KYC individual de cada sócio: PEP, sanções, processos', 'B03 (Sócio sancionado=bloqueio), PEP sócio (+40)'],
    ['economic_group_kyc', 'KYC do grupo econômico: PEP/sanções em empresas vinculadas', 'Sanção grupo (+60), PEP grupo (+20)'],
    ['political_involvement', 'Vínculos políticos dos sócios: candidaturas, filiação, cargos', 'Envolvimento político (+20)'],
    ['government_debtors', 'Dívida ativa da União/Estados/Municípios', 'B06 (> R$500k = bloqueio), +40/+20 por faixa'],
    ['processes', 'Processos judiciais: cível, criminal, trabalhista, administrativo — com detalhes completos de partes, movimentações e valores', 'Criminal (+50), > 20 processos (+25)'],
    ['lawsuits_distribution_data', 'Distribuição agregada por tipo: criminal, cível, trabalhista, administrativo', 'Informativo para SENTINEL'],
    ['owners_lawsuits', 'Processos judiciais de cada sócio individual com detalhes completos', 'Criminal sócio (+50), > 10 processos (+20)'],
    ['owners_lawsuits_distribution', 'Distribuição de processos dos sócios por tipo', 'Informativo'],
    ['media_profile_and_exposure', 'Menções na mídia com análise de sentimento por NLP (VERY_NEGATIVE, NEGATIVE, POSITIVE)', 'B07 (Mídia VERY_NEG + fraude = bloqueio), Mídia neg (+30)'],
    ['financial_market', 'Registros BCB, CVM, SUSEP, PREVIC', 'Positivo (-20 se registrado)'],
    ['relationships', 'QSA completo: sócios, administradores, participações', 'Zero sócios (+15)'],
    ['economic_group_relationships', 'Mapa do grupo econômico com participações cruzadas', 'Participação circular (+30)'],
    ['configurable_recency_qsa', 'QSA em tempo real da Receita Federal (divergência vs padrão)', 'Divergência QSA (+5)'],
    ['owners_influence', 'Nível de influência e poder dos sócios', 'Informativo'],
    ['owners_electoral_donors', 'Doações eleitorais dos sócios ao TSE', '> R$100k (+15)'],
    ['domains', 'Domínios web: idade, SSL, plataforma, métodos de pagamento', 'Sem SSL (+15), Domínio < 1 ano (+10)'],
    ['online_ads', 'Anúncios online ativos', 'Informativo'],
    ['passages', 'Passagens web: total + últimos 12 meses', 'Zero passagens (+30), < 5 recentes (+15)'],
    ['reputations_and_reviews', 'Reclame Aqui, Google Reviews: nota, reclamações, resolução', 'Nota < 5 (+20), < 7 (+10), ≥ 7 (-10)'],
    ['awards_and_certifications', 'Prêmios e certificações', 'Positivo (-15)'],
    ['activity_indicators', 'Nível de atividade, Shell Company Score, empregados, receita', 'B05 (Shell > 80% = bloqueio), Atividade < 30% (+20)'],
    ['marketplace_data', 'Presença em marketplaces (Mercado Livre, Amazon, etc.)', 'Positivo (-10)'],
    ['collections', 'Negativação em Serasa, SPC, SCPC, Boa Vista', 'Negativado (+30)'],
    ['merchant_category_data', 'MCC real identificado pela BDC', 'Informativo para cross-validation'],
    ['economic_group', 'Tamanho e estrutura do grupo econômico', 'Grupo > 20 empresas (+15)'],
    ['emails_extended', 'E-mails associados ao CNPJ', 'Todos genéricos (+5)'],
    ['addresses_extended', 'Endereços associados ao CNPJ', 'Informativo'],
    ['phones_extended', 'Telefones com status de atividade e operadora', 'Informativo'],
    ['related_people_phones/emails/addresses', 'Contatos de pessoas vinculadas ao CNPJ', 'Informativo'],
    ['owners_industrial_property', 'Patentes e marcas dos sócios', 'Informativo'],
    ['industrial_property', 'Patentes e marcas da empresa', 'Positivo (-5)'],
    ['licenses_and_authorizations', 'Licenças regulatórias ativas', 'Positivo (-5)'],
    ['esg_and_compliance', 'Lista Suja MTE, Embargo IBAMA, Scores ESG', 'B08 (Lista Suja = bloqueio), B09 (Embargo = bloqueio)'],
    ['credit_risk + credit_score', 'Score de crédito, protestos, cheques devolvidos, falências', 'Score < 300 (+40), Falência (+50), Protestos > 5 (+20)'],
  ]}
/>

<H3>STANDARD (33 datasets) — E-commerce, SaaS, Infoprodutos, Dropshipping, Educação, Link Pgto</H3>
<P>Igual ao FULL exceto pela remoção de: <code>economic_group</code>, <code>economic_group_relationships</code>, <code>financial_market</code>, <code>online_ads</code>, <code>owners_industrial_property</code>, <code>industrial_property</code>.</P>

<H3>LITE (23 datasets) — MPE</H3>
<P>Subconjunto simplificado: <code>basic_data</code>, <code>registration_data</code>, <code>history_basic_data</code>, <code>company_evolution</code>, <code>kyc</code>, <code>owners_kyc</code>, <code>activity_indicators</code>, <code>domains</code>, <code>passages</code>, <code>collections</code>, <code>government_debtors</code>, <code>processes</code>, <code>lawsuits_distribution_data</code>, <code>merchant_category_data</code>, <code>relationships</code>, contatos estendidos, <code>esg_and_compliance</code>.</P>

<H3>SUBSELLER PF (23 datasets) — Endpoint /pessoas</H3>
<P>Datasets exclusivos para CPF: <code>basic_data</code>, <code>kyc</code>, <code>processes</code>, <code>collections</code>, contatos estendidos, <code>risk_data</code>, <code>government_debtors</code>, <code>first_level_family_kyc</code> (KYC de familiares 1º grau), <code>social_assistance</code> (programas sociais), <code>electoral_donors</code>, <code>public_servants</code>, <code>presumed_income</code> (renda estimada), <code>financial_interests</code>, <code>personal_relationships</code> (rede de relacionamentos), <code>scr_positive_score</code> (score BCB — gold standard), <code>simples_nacional_collection</code> (arrecadação MEI/Simples).</P>

<H2>4.2. Bloqueios Automáticos (B01–B10)</H2>
<P>Bloqueios são condições que forçam o score para 850 (máximo risco) independentemente dos demais indicadores. Qualquer bloqueio ativo impede a aprovação automática.</P>
<Table
  headers={['Código', 'Condição', 'Regulamentação', 'Ação']}
  rows={[
    ['B01', 'CNPJ/CPF com situação diferente de ATIVA/REGULAR', 'Circular BCB 3.978/2020 Art. 2º', 'Score → 850, Subfaixa → 5'],
    ['B03', 'Empresa OU sócio OU grupo econômico em lista de sanções', 'Lei 9.613/1998 Art. 10', 'Score → 850, Subfaixa → 5'],
    ['B05', 'Shell Company Score > 80%', 'Lei 9.613/1998 (PLD/FT)', 'Score → 850, Subfaixa → 5'],
    ['B06', 'Dívida ativa > R$500.000', 'Lei 6.830/1980', 'Score → 850, Subfaixa → 5'],
    ['B07', 'Adverse media VERY_NEGATIVE + fraude/lavagem/corrupção', 'Circular BCB 3.978/2020 Art. 2º §2', 'Score → 850, Subfaixa → 5'],
    ['B08', 'Lista Suja MTE (trabalho escravo)', 'Portaria MTE 1.293/2017', 'Score → 850, Subfaixa → 5'],
    ['B09', 'Embargo ambiental IBAMA', 'Lei 9.605/1998', 'Score → 850, Subfaixa → 5'],
    ['B10 (PF)', 'Familiar 1º grau em lista de sanções', 'Circular BCB 3.978/2020 Art. 14 §2º', 'Score → 850, Subfaixa → 5'],
  ]}
/>

{/* ═══════════ SEÇÃO 5 ═══════════ */}
<H1 id="s5">5. Validação de Identidade — CAF (Combate à Fraude)</H1>
<P>A CAF (Combate à Fraude) é o provedor de validação biométrica, documentoscopia e screening internacional. O processo é dividido em captura no dispositivo do cliente (SDK frontend) e análise pós-captura (API backend).</P>

<H2>5.1. Captura no Dispositivo (SDK Frontend)</H2>
<P>O componente <code>CafVerificationStep</code> executa 3 etapas sequenciais usando o SDK CAF:</P>
<ol className="list-decimal ml-6 space-y-1.5 mb-3">
  <Li><strong>Document Detector — Frente:</strong> Captura guiada da frente do documento (RG ou CNH). O SDK detecta automaticamente o tipo de documento, enquadra, verifica nitidez e captura. O resultado é um JPEG em alta resolução armazenado como <code>caf_doc_front</code>.</Li>
  <Li><strong>Document Detector — Verso:</strong> Mesma tecnologia para o verso do documento. Armazenado como <code>caf_doc_back</code>.</Li>
  <Li><strong>Face Liveness:</strong> Prova de vida ativa — o cliente segue instruções na tela (mover a cabeça, piscar). O SDK verifica: (a) presença de rosto real (anti-spoofing), (b) detecção de deepfake, (c) qualidade da imagem facial. Armazenado como <code>caf_selfie_liveness</code>.</Li>
</ol>

<H2>5.2. Fallback para BigDataCorp BigID</H2>
<P>Se o SDK CAF falhar (erro de CDN, incompatibilidade de navegador, câmera não disponível), o sistema ativa automaticamente o fallback <code>BdcFallbackVerification</code> que usa a API BigID da BigDataCorp:</P>
<ul className="list-disc ml-6 space-y-1 mb-3">
  <Li><strong>Upload manual de documento:</strong> O cliente faz upload de foto do documento (frente e verso) via seletor de arquivo</Li>
  <Li><strong>Upload manual de selfie:</strong> O cliente faz upload de uma selfie</Li>
  <Li><strong>Documentoscopia BDC:</strong> Análise forense do documento via API BigID — detecta adulteração, recorte, montagem</Li>
  <Li><strong>Facematch BDC:</strong> Comparação 1:1 entre a selfie e a foto do documento — retorna similaridade (0-100%)</Li>
  <Li><strong>Liveness BDC:</strong> Probabilidade de que a selfie seja de uma pessoa real (anti-foto-de-foto)</Li>
</ul>

<H2>5.3. Análise Pós-Captura (Backend — cafPostCaptureAnalysis)</H2>
<P>Após a captura, o orquestrador executa automaticamente:</P>
<Table
  headers={['Serviço', 'Tipo', 'O que faz', 'Resultado']}
  rows={[
    ['OCR Sync', 'Síncrono', 'Extrai texto do documento: nome, CPF, data nascimento, RG, nome da mãe', 'Cross-validation com dados declarados no questionário'],
    ['Documentoscopy', 'Assíncrono', 'Análise forense do documento: adulteração, fraude, recorte digital', 'APPROVED ou REPROVED (fraud=true → red flag CAF)'],
    ['Document Liveness', 'Assíncrono', 'Verifica se o documento é original (não é foto de tela/cópia)', 'decision=true → documento é cópia (red flag)'],
    ['Deepfake Detection', 'Assíncrono', 'Detecta se a selfie é um deepfake gerado por IA', 'isDeepfake=true → red flag CAF, força Revisão Manual'],
    ['Official Biometrics', 'Assíncrono', 'Compara selfie com base biométrica oficial (quando disponível)', 'confidence < 0.7 → alerta'],
    ['Private Faceset', 'Assíncrono', 'Verifica se o mesmo rosto já foi usado com outro CPF no sistema', 'personId ≠ CPF → FACE_REUSE_DIFFERENT_CPF'],
    ['Shared Faceset', 'Assíncrono', 'Verifica se o rosto consta em base de fraude compartilhada entre clientes CAF', 'Resultado positivo → FACE_IN_FRAUD_DATABASE'],
  ]}
/>

<H2>5.4. Serviços CAF Adicionais (Pipeline Completo)</H2>
<ul className="list-disc ml-6 space-y-1 mb-3">
  <Li><strong>CAF Full Enrichment (KYC/KYB):</strong> Consulta completa de KYC via CAF — segunda fonte independente para cross-validation com BDC.</Li>
  <Li><strong>CAF Credit Analysis:</strong> Análise de crédito PF/PJ via CAF — segunda fonte de crédito além do BDC credit_risk/credit_score.</Li>
  <Li><strong>CAF Screening Internacional:</strong> Verificação de PEP, sanções (OFAC, EU, UN, CEIS, CNEP) e alertas Interpol. Cross-check com dados BDC.</Li>
  <Li><strong>CAF CPF Cross-Validation:</strong> Consulta dados básicos do CPF via CAF e compara com BDC: nome, status, data nascimento, nome da mãe. Identifica divergências.</Li>
  <Li><strong>VerifAI Docs:</strong> Validação de documentos pendentes via IA da CAF — analisa autenticidade, legibilidade e conformidade de cada documento enviado.</Li>
  <Li><strong>CAF Profile Check:</strong> Verifica se o CPF/CNPJ já tem histórico cross-merchant na base CAF — detecta reuso de identidade entre diferentes empresas.</Li>
</ul>

{/* ═══════════ SEÇÃO 6 ═══════════ */}
<H1 id="s6">6. Framework de Risk Scoring V4.0</H1>
<P>O Risk Score V4 é um modelo determinístico de 3 camadas que calcula um score de 0 a 849 (onde 0 = melhor, 849 = pior). A função <code>bdcEnrichCase</code> é a FONTE ÚNICA do score — nenhum outro componente altera o score final.</P>

<H2>6.1. Camada 1 — Score Base por Segmento</H2>
<P>Ponto de partida baseado no risco inerente do tipo de negócio (ver tabela da Seção 2). Gateway = 175, Educação = 50, Subseller PF = 30.</P>

<H2>6.2. Camada 2 — Variáveis por Dimensão (Pesos Percentuais)</H2>
<P>O score V4 analisa 13 dimensões, cada uma com um peso percentual. O score de cada dimensão é multiplicado pelo seu peso e somado:</P>
<Table
  headers={['Dimensão', 'Peso', 'O que avalia', 'Principais variáveis']}
  rows={[
    ['Compliance', '20%', 'Sanções, PEP, processos judiciais, negativação, dívida ativa', 'Sanção empresa (+80), PEP (+40), Criminal (+50), Negativado (+30)'],
    ['Owners (QSA)', '18%', 'Sócios: PEP, sanções, processos, doações eleitorais, influência', 'PEP sócio (+40), Sanção sócio (+80), Criminal sócio (+50)'],
    ['Identity', '10%', 'Dados cadastrais: idade, status, capital, CNAE', 'Idade < 1 ano (+25), Capital < R$1k (+15), CNAE alto risco (+30)'],
    ['Credit Risk', '9%', 'Score crédito, protestos, falências, cheques devolvidos', 'Score < 300 (+40), Falência (+50), Protestos > 5 (+20)'],
    ['Reputation', '8%', 'Mídia, Reclame Aqui, prêmios, certificações', 'Mídia VERY_NEG (+80), Reclame Aqui < 5 (+20)'],
    ['Financial', '8%', 'Grupo econômico, participações cruzadas, MCC, licenças', 'Participação circular (+30), Grupo > 20 empresas (+15)'],
    ['Digital', '7%', 'Domínios, passagens web, nível de atividade, Shell Company', 'Zero passagens (+30), Sem SSL (+15), Shell > 50% (score alto)'],
    ['Evolution', '6%', 'Evolução cadastral: capital, empregados, alterações', 'Queda capital > 50% (+20), > 3 alterações recentes (+15)'],
    ['ESG', '5%', 'Lista Suja MTE, Embargo IBAMA, scores ESG', 'Lista Suja (+200), Embargo IBAMA (+40)'],
    ['Contacts', '3%', 'Telefones, e-mails, endereços — atividade e tipo', 'Todos e-mails genéricos (+5)'],
    ['Employees KYC', '2%', 'Verificação de funcionários-chave e RAIS', 'Zero empregados RAIS (+10)'],
    ['Sectorial', '2%', 'MCC, CNAEs financeiros, registros BCB/CVM', 'CNAEs financeiros secundários (+5)'],
    ['Assets', '2%', 'Propriedade industrial, licenças, prêmios', 'Patentes (-5), Marcas (-5), Certificações (-10)'],
  ]}
/>

<H2>6.3. Camada 3 — Fórmula Final</H2>
<InfoBox title="Fórmula do Score V4" color="green">
  <code className="block">Score Final = max(0, min(849, Score_Base + Σ(Score_Dimensão × Peso_Dimensão)))</code>
  <p className="mt-1">Se qualquer bloqueio (B01–B10) estiver ativo → Score = 850, Subfaixa = 5 (BLOQUEIO)</p>
  <p>Pontos negativos (positivos para compliance) reduzem o score. Ex: certificações (-10), presença em marketplace (-10).</p>
</InfoBox>

<H2>6.4. Tabela de Subfaixas</H2>
<Table
  headers={['Subfaixa', 'Score', 'Nome', 'Decisão', 'Rolling Reserve', 'Monitoramento']}
  rows={[
    ['1A', '0–100', 'VERDE EXPRESS', 'Aprovado automático', '0%', 'PADRÃO'],
    ['1B', '101–200', 'VERDE', 'Aprovado automático', '0%', 'PADRÃO'],
    ['2A', '201–300', 'AZUL LEVE', 'Aprovado com condições leves', '5%', 'REFORÇADO LEVE'],
    ['2B', '301–400', 'AZUL', 'Aprovado com condições', '10%', 'REFORÇADO'],
    ['3A', '401–500', 'AMARELO', 'Aprovado com condições rigorosas', '15%', 'INTENSO'],
    ['3B', '501–600', 'LARANJA', 'Aprovado com condições rigorosas', '20%', 'INTENSO PLUS'],
    ['4', '601–700', 'VERMELHO', 'Revisão Manual (único caso real)', '20%', 'MÁXIMO'],
    ['5', '701–849', 'BLOQUEIO', 'Recusado (bloqueios V4 ativos)', '20%', 'MÁXIMO'],
  ]}
/>

{/* ═══════════ SEÇÃO 7 ═══════════ */}
<H1 id="s7">7. Pipeline Automatizado (Orquestrador)</H1>
<P>O orquestrador <code>autoEnrichOnboarding</code> executa o pipeline completo em sequência, onde cada step é não-bloqueante (falha de um step não impede os demais):</P>
<Table
  headers={['Step', 'Função', 'Duração Típica', 'Descrição']}
  rows={[
    ['0', 'cafPostCaptureAnalysis', '3–8s', 'OCR síncrono + análise assíncrona (documentoscopy, deepfake, facesets)'],
    ['0.5', 'cafCheckProfile', '1–3s', 'Verificação de histórico cross-merchant no CAF'],
    ['1', 'bdcEnrichCase', '2–5s', 'Consulta BDC completa + cálculo do Score V4 determinístico'],
    ['1.5', 'cafFullEnrichment', '2–4s', 'KYC/KYB completo via CAF (segunda fonte)'],
    ['1.7', 'cafCreditAnalysis', '1–3s', 'Análise de crédito PF/PJ via CAF'],
    ['2', 'cafScreeningInternacional', '2–4s', 'PEP + Sanções + Interpol via CAF'],
    ['2.5', 'cafCpfValidation', '1–2s', 'Cross-validation CPF via CAF vs BDC'],
    ['2.7', 'cafVerifaiDocs', '1–5s por doc', 'Validação IA de documentos pendentes'],
    ['3', 'analyzeOnboarding (SENTINEL)', '15–30s', 'Análise IA com 3 LLM calls paralelas + consolidação'],
    ['4', 'Decisão Determinística', '<1s', 'Aplicação da tabela de subfaixas + verificação CAF fraud'],
    ['5', 'Slack Notification', '<1s', 'Notificação #compliance com resumo completo'],
  ]}
/>
<P>Tempo total típico do pipeline: 30–60 segundos. Todos os resultados são persistidos em <code>ComplianceScore</code>, <code>ExternalValidationResult</code>, <code>IntegrationLog</code> e <code>OnboardingCase</code>.</P>

{/* ═══════════ SEÇÃO 8 ═══════════ */}
<H1 id="s8">8. Tabela de Decisão Determinística</H1>
<P>A decisão final é 100% determinística — baseada exclusivamente na subfaixa V4 e em fraude CAF confirmada. O SENTINEL IA NÃO tem poder de decisão.</P>

<Table
  headers={['Subfaixa V4', 'Decisão Automática', 'Condições Aplicadas', 'Exceção CAF']}
  rows={[
    ['1A / 1B', 'APROVADO ⚡', 'Nenhuma', '—'],
    ['2A', 'APROVADO COM CONDIÇÕES LEVES ⚡', 'KYC completo merchants 60d, PLD trimestral', '—'],
    ['2B', 'APROVADO COM CONDIÇÕES ⚡', 'KYC 45d, PLD mensal, Monitoramento chargeback semanal', '—'],
    ['3A', 'APROVADO COM CONDIÇÕES RIGOROSAS ⚡', 'KYC 30d, PLD quinzenal, Limite TPV R$500k/mês, Revisão 90d', '—'],
    ['3B', 'APROVADO COM CONDIÇÕES RIGOROSAS ⚡', 'KYC 15d, PLD semanal, Limite TPV R$200k/mês, Revisão 60d, Antecipação bloqueada', '—'],
    ['4', 'REVISÃO MANUAL 🔍', 'Analista deve revisar dossiê completo', '—'],
    ['5', 'RECUSADO 🚫', 'Bloqueios V4 ativos impedem aprovação', '—'],
    ['Qualquer', 'Se CAF detectou fraude → REVISÃO MANUAL', '—', 'Liveness REPROVED, Documentoscopy REPROVED, Deepfake DETECTED'],
  ]}
/>

<InfoBox title="Safety Net" color="red">
  Existe uma trava de segurança: se a decisão for "Recusado" MAS não houver bloqueios V4 ativos nem fraude CAF, o sistema automaticamente rebaixa para "Revisão Manual" — evitando recusas injustas.
</InfoBox>

{/* ═══════════ SEÇÃO 9 ═══════════ */}
<H1 id="s9">9. Fluxo de Subsellers (PJ e PF)</H1>
<P>O fluxo de subsellers é usado quando um seller principal (ex: marketplace) precisa cadastrar seus sub-merchants. Cada subseller passa por um processo KYC independente vinculado ao seller principal.</P>

<H2>9.1. Geração de Links</H2>
<P>O seller gera links de onboarding tipo <code>SUBSELLER_COMPLIANCE</code> via painel administrativo. Cada link contém: <code>parentMerchantId</code> (seller), branding customizado (logo, cores), e pode ser PJ ou PF.</P>

<H2>9.2. Fluxo PJ (CNPJ)</H2>
<P>Questionário simplificado + upload de documentos + CAF. Datasets BDC: grupo <code>SUBSELLER_PJ</code> (23 datasets). Score base: 45.</P>

<H2>9.3. Fluxo PF (CPF)</H2>
<P>Questionário para pessoa física + upload de documento pessoal + CAF. Datasets BDC: grupo <code>SUBSELLER_PF</code> (23 datasets via endpoint <code>/pessoas</code>). Inclui datasets exclusivos: SCR Score BCB, KYC Familiar 1º grau, Renda Presumida, Arrecadação Simples/MEI, Rede de Relacionamentos. Score base: 30.</P>
<P>Bloqueios PF específicos: B01 (CPF não regular), B02 (menor de 18), B04 (pessoa falecida), B10 (familiar em sanções).</P>

{/* ═══════════ SEÇÃO 10 ═══════════ */}
<H1 id="s10">10. Análise SENTINEL IA (Agente Relator)</H1>
<P>O SENTINEL v7.0 é um agente de IA que cruza todas as fontes de dados e gera um relatório narrativo para o dossiê de compliance. Ele é RELATOR, não DECISOR.</P>

<H2>10.1. Arquitetura</H2>
<P>O SENTINEL executa 4 chamadas LLM (modelo <code>gemini_3_1_pro</code>):</P>
<ol className="list-decimal ml-6 space-y-1 mb-3">
  <Li><strong>Análise do Questionário</strong> — Avalia completude, consistência e perfil declarado. Pontos de atenção (NÃO red flags) para inconsistências.</Li>
  <Li><strong>Análise BDC</strong> — Interpreta os dados V4 processados, bloqueios, e dimensões. Cita fontes específicas (ex: "BDC BasicData.TaxIdStatus = ATIVA").</Li>
  <Li><strong>Análise CAF</strong> — Avalia resultados biométricos, screening, cross-validations OCR.</Li>
  <Li><strong>Consolidação</strong> — Merge das 3 análises em sumário executivo, parecer final, análise dimensional (7 dimensões), cross-validation e recomendação informativa.</Li>
</ol>

<H2>10.2. Output do SENTINEL</H2>
<P>O SENTINEL produz: sumário executivo, análise completa, parecer final, pontos positivos, pontos de atenção, red flags (somente com evidência concreta), recomendações para revisão manual, perguntas sugeridas, documentos adicionais sugeridos, nível de confiança (0-100%), análise dimensional (identidade, sócios, compliance, digital, reputação, financeiro, biometria), e cross-validation (declarado vs confirmado).</P>

{/* ═══════════ SEÇÃO 11 ═══════════ */}
<H1 id="s11">11. Monitoramento Contínuo e Revalidação</H1>
<P>Após a aprovação, o monitoramento é contínuo e proporcional à subfaixa:</P>
<Table
  headers={['Nível', 'Subfaixas', 'Frequência PLD', 'Ações']}
  rows={[
    ['PADRÃO', '1A, 1B', 'Trimestral', 'Revalidação BDC anual, monitoramento transacional padrão'],
    ['REFORÇADO LEVE', '2A', 'Trimestral', 'Revalidação BDC semestral, alerta de desvio de TPV'],
    ['REFORÇADO', '2B', 'Mensal', 'Revalidação BDC semestral, monitoramento chargeback semanal'],
    ['INTENSO', '3A', 'Quinzenal', 'Revalidação BDC trimestral, limite TPV, revisão a cada 90 dias'],
    ['INTENSO PLUS', '3B', 'Semanal', 'Revalidação BDC trimestral, limite TPV, revisão a cada 60 dias, antecipação bloqueada'],
    ['MÁXIMO', '4, 5', 'Semanal', 'Revalidação BDC mensal, todas as restrições ativas'],
  ]}
/>
<P>A revalidação reconsulta os datasets BDC e recalcula o score V4. Se houver variação &gt; 100 pontos, um alerta SCORE_DELTA é gerado automaticamente no IntegrationLog e enviado ao Slack.</P>

{/* ═══════════ SEÇÃO 12 ═══════════ */}
<H1 id="s12">12. Painel de Análise de Risco — Visão do Analista</H1>
<P>Cada caso de onboarding é acessível via o painel <strong>Cadastro → Detalhe</strong>, que apresenta uma visão unificada com as seguintes abas:</P>

<H2>12.1. Aba Overview</H2>
<P>Score V4 visual (gauge), subfaixa com cor, decisão, rolling reserve, monitoramento, condições automáticas, red flags consolidados (V4 + SENTINEL + CAF), e timeline de integrations.</P>

<H2>12.2. Aba Compliance</H2>
<P>Dossiê completo do SENTINEL: sumário executivo, análise dimensional (7 dimensões com veredicto APROVADO/ATENÇÃO/REPROVADO), cross-validation declarado vs confirmado, pontos positivos, pontos de atenção, red flags com evidência, e perguntas sugeridas ao merchant.</P>

<H2>12.3. Aba Análise BDC (Visão Microscópica)</H2>
<P>O componente <code>BdcV4AnalysisPanel</code> exibe CADA item analisado pelo V4 agrupado por dimensão. Cada item mostra: label, valor encontrado, nível de risco (CRÍTICO/ALTO/MÉDIO/BAIXO/OK/INFO), pontos impactados no score, e um botão "Por que isso importa?" que expande uma explicação didática com: o que é, por que importa, base regulatória, e faixas de risco. Para processos judiciais, há drill-down completo: número do processo, tribunal, tipo, partes, valor, movimentações recentes.</P>

<H2>12.4. Aba Documentos</H2>
<P>Todos os documentos enviados com status de validação (Pendente/Validado/Rejeitado), preview visual, e resultados de VerifAI/documentoscopia da CAF.</P>

<H2>12.5. Aba Enriquecimento</H2>
<P>Dados BDC raw organizados por dataset com explicações contextuais, alertas inteligentes, e narrativa automática gerada por IA sobre os dados encontrados.</P>

<H2>12.6. Ações do Analista</H2>
<P>Para casos em Revisão Manual (subfaixa 4), o analista pode: aprovar com condições, recusar com motivo, solicitar documentos adicionais, ou reassignar o caso. Todas as ações geram AuditLog e notificação Slack.</P>

      </div>

      {/* ══════ RODAPÉ ══════ */}
      <div className="mt-8 bg-[#002443] rounded-2xl p-6 text-center print:rounded-none print:mt-4">
        <img src={LOGO_DARK} alt="PagSmile" className="h-6 mx-auto mb-3 opacity-60" />
        <p className="text-white/30 text-xs">PagSmile — Manual de Processos KYC/KYB — Compliance V4.0</p>
        <p className="text-white/20 text-[10px] mt-1">Documento Confidencial — {new Date().toLocaleDateString('pt-BR')} — Todos os direitos reservados</p>
      </div>
    </div>
  );
}