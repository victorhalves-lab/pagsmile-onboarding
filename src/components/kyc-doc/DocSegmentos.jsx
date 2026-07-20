import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocSegmentos() {
  return (
    <S>
      <H1>2. Segmentação por Tipo de Negócio</H1>

      <P>O sistema segmenta cada cliente em um tipo de negócio para adequar a profundidade da análise ao risco inerente daquela atividade. Existem 3 grandes famílias de fluxos: <strong>Cartão</strong> (11 segmentos V4), <strong>PIX</strong> (3 modelos — Intermediário, Merchant e API Enterprise) e <strong>Subsellers</strong> (2 tipos: PJ e PF). Cada segmento determina automaticamente: (a) qual questionário será exibido, (b) quantos e quais datasets serão consultados na BigDataCorp, (c) qual é o score base do V4, e (d) quais documentos serão solicitados.</P>

      <P><strong>A visão microscópica de cada template</strong> (com todas as perguntas, todos os documentos, tamanhos máximos, formatos aceitos, integrações CAF SDK e lógica condicional) está disponível na <strong>aba "Templates Microscópico"</strong> no topo desta página — aquela aba é a fonte única da verdade sobre o que é pedido em cada segmento. Esta seção 2 é o <em>resumo executivo</em>.</P>

      <H2>2.1. Segmentos de Cartão — 10 Modelos</H2>
      <P>Os segmentos de cartão são usados para empresas que desejam processar pagamentos via cartão de crédito/débito. Cada segmento tem um nível de risco diferente, o que afeta diretamente o score base do V4 (quanto maior o score base, mais pontos de risco a empresa já "carrega" desde o início da análise).</P>

      <Table
        headers={['Segmento', 'Por que esse nível de risco?', 'Score Base V4', 'Grupo BDC', 'Datasets']}
        rows={[
          ['Gateway / PSP', 'Intermediário de pagamentos que processa transações de terceiros. Risco máximo porque um gateway pode ser usado para mascarar atividades ilícitas. Exige análise do grupo econômico completo, financial market, propriedade industrial e todas as 39 fontes de dados.', '175', 'FULL', '39'],
          ['Marketplace', 'Plataforma que conecta vendedores e compradores. Alto risco pela presença de sub-merchants que podem ter atividades irregulares. Exige verificação de sellers, grupo econômico e credit risk.', '140', 'FULL', '39'],
          ['Plataformas Verticais', 'Plataformas verticais de nicho (saúde, educação, logística). Risco moderado-alto por operar com segmentos regulados. Grupo FULL de datasets.', '120', 'FULL', '39'],
          ['Dropshipping', 'Venda sem estoque próprio, produto enviado direto do fornecedor. Risco elevado por alta taxa de chargeback (produto não entregue, produto diferente do anunciado). Documentos adicionais específicos: print de rastreamento, loja e política de reembolso.', '110', 'STANDARD', '33'],
          ['Infoprodutos', 'Produtos digitais (cursos, e-books, mentorias). Risco médio por ser produto intangível com alta taxa de reembolso. Documentos adicionais: print da entrega digital, página de vendas, política de garantia.', '90', 'STANDARD', '33'],
          ['E-commerce', 'Loja virtual com estoque próprio. Risco médio padrão. Documentos adicionais: print da loja, comprovante de envio, nota fiscal de mercadoria.', '80', 'STANDARD', '33'],
          ['SaaS / Recorrência', 'Software como serviço com cobrança recorrente. Risco médio-baixo pela previsibilidade da receita. Documentos adicionais: print do dashboard, termos de uso, comprovante de entrega do serviço.', '70', 'STANDARD', '33'],
          ['Link de Pagamento', 'Emissão de links de pagamento avulsos. Risco médio-baixo. Grupo STANDARD de datasets.', '60', 'STANDARD', '33'],
          ['Educação', 'Instituições de ensino (escolas, universidades, cursos). Menor risco entre os segmentos STANDARD por ser setor regulado pelo MEC.', '50', 'STANDARD', '33'],
          ['MPE', 'Micro e Pequenas Empresas. Menor nível de risco e análise simplificada. Grupo LITE de datasets (23), sem grupo econômico, sem financial market, sem credit risk.', '35', 'LITE', '23'],
        ]}
      />

      <H2>2.2. Segmentos PIX — 3 Modelos</H2>
      <P>Os segmentos PIX são usados para empresas que desejam processar apenas pagamentos via PIX. O questionário é diferente do de cartão, com perguntas específicas sobre modalidade PIX (QR Code, API, Link), chave PIX e volume de transações PIX.</P>

      <Table
        headers={['Segmento PIX', 'Descrição', 'Score Base V4', 'Grupo BDC', 'Datasets']}
        rows={[
          ['PIX Intermediário', 'Empresa que intermedia pagamentos PIX para terceiros (ex: PSPs PIX, aggregators). Score base alto (155) porque intermediários PIX podem ser usados para lavagem de dinheiro via transações fracionadas. Consulta grupo econômico, credit risk, owners completo e financial market.', '155', 'PIX_INTERMEDIARIO', '31'],
          ['PIX Merchant', 'Empresa que recebe pagamentos PIX diretos (ex: loja, restaurante, prestador de serviço). Risco moderado. Datasets focados em basic_data, KYC, processos, atividade e contatos.', '65', 'PIX_MERCHANT', '22'],
          ['PIX API Enterprise', 'Grandes empresas com integração PIX API direta (enterprise). Questionário simplificado + autocomplete BDC agressivo + enriquecimento completo ao fundo para o time de compliance. Requer apenas selfie segurando documento — demais dados são buscados via BDC.', '—', 'FULL', '39'],
        ]}
      />

      <H2>2.3. Segmentos Subseller — 2 Tipos</H2>
      <P>Subsellers são sub-merchants vinculados a um seller principal (marketplace, gateway ou plataforma). Cada subseller passa por um processo KYC independente, mas o caso é vinculado ao seller principal via <code>parentMerchantId</code>.</P>

      <Table
        headers={['Tipo', 'Endpoint BDC', 'Score Base', 'Datasets', 'Particularidades']}
        rows={[
          ['Subseller PJ (CNPJ)', '/empresas', '45', '23 (SUBSELLER_PJ)', 'Questionário inteligente com perguntas dinâmicas por sub-segmento (E-commerce, SaaS, Infoprodutos, Dropshipping). Documentos específicos por sub-segmento. Inclui reputations_and_reviews e media_profile.'],
          ['Subseller PF (CPF)', '/pessoas', '30', '23 (SUBSELLER_PF)', 'Questionário para pessoa física. Consulta datasets exclusivos de CPF: SCR Score BCB (gold standard de crédito), KYC de familiares 1º grau, renda presumida, programas sociais, arrecadação MEI/Simples, rede de relacionamentos pessoais.'],
        ]}
      />

      <InfoBox title="Como o segmento é determinado automaticamente" color="blue">
        <p>Quando o lead preenche o questionário comercial, ele seleciona seu segmento. Esse segmento é mapeado automaticamente para o modelo de compliance correspondente pela função <code>resolveComplianceModel</code>. Se o lead veio do questionário Pin Bank V5, o segmento granular é usado. Se veio da landing page de um introducer, o segmento da landing é mapeado. Se nenhum segmento é identificado, o fallback é E-commerce (ComplianceEcommerceV4).</p>
      </InfoBox>

      <InfoBox title="Subsellers NÃO recebem todos os 11 segmentos" color="amber">
        <p>Subsellers PJ podem escolher entre <strong>9 dos 11 segmentos V4 disponíveis para sellers</strong>. Os segmentos <strong>PIX Merchant</strong> e <strong>PIX Intermediário</strong> NÃO são ofertados para subcontas — se o subseller precisa operar PIX, ele precisa se cadastrar como seller direto. Detalhes completos na Seção 10 (Fluxo de Subsellers).</p>
      </InfoBox>
    </S>
  );
}