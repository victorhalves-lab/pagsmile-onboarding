import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocBDC() {
  return (
    <S>
      <H1>5. Enriquecimento de Dados — BigDataCorp (BDC)</H1>

      <P>A BigDataCorp (BDC) é o provedor primário de dados cadastrais, regulatórios e de crédito do processo KYC/KYB. O sistema consulta entre 22 e 39 datasets simultaneamente em uma única chamada API, dependendo do grupo definido pelo segmento. A resposta é processada pela função <code>bdcEnrichCase</code> que analisa cada dataset individualmente, identifica bloqueios automáticos, calcula pontuações por dimensão e produz o Risk Score V4 final.</P>

      <H2>5.1. Explicação Detalhada de Cada Dataset — Grupo FULL (39 datasets)</H2>
      <P>O grupo FULL é o mais completo e é usado para Gateway, Marketplace e Plataformas Verticais. Abaixo está a descrição microscópica de cada dataset, explicando exatamente o que é consultado, como é interpretado e qual o impacto no score:</P>

      <H3>Bloco A — Dados Cadastrais Básicos</H3>
      <Table headers={['Dataset', 'Descrição detalhada do que é consultado', 'Como é interpretado', 'Impacto no score V4']} rows={[
        ['basic_data', 'Consulta os dados oficiais do CNPJ na Receita Federal: razão social, nome fantasia, data de abertura, situação cadastral (Ativa/Suspensa/Inapta/Baixada), porte da empresa, capital social registrado, regime tributário (Simples/Lucro Presumido/Lucro Real), natureza jurídica, CNAE principal com descrição, CNAEs secundários, endereço completo, e-mail e telefone registrados, número de empregados (RAIS/CAGED).', 'Cada campo é analisado individualmente. Situação ≠ ATIVA gera bloqueio B01. Idade < 1 ano gera +25 pontos. Capital < R$1.000 gera +15 pontos. CNAE em lista de alto risco (jogos, armas, tabaco, financeiros não regulados) gera +30 pontos.', 'Bloqueio B01 (status não ativo) → 850 pts. Idade < 1 ano: +25. Capital < R$1k: +15. CNAE alto risco: +30.'],
        ['registration_data', 'Inscrição estadual, situação especial (recuperação judicial, falência), dados complementares de registro.', 'Situação especial ≠ vazio indica problemas graves. Cross-validado com processos judiciais.', 'Situação especial: +10 pts.'],
        ['history_basic_data', 'Série temporal completa de todas as alterações cadastrais da empresa: mudanças de razão social, mudanças de CNAE, mudanças de endereço, mudanças de capital social, com data de cada alteração e valores anterior/novo.', 'Conta o número de alterações nos últimos 12 meses. Mais de 3 alterações recentes indica instabilidade. Mudanças de CNAE frequentes podem indicar tentativa de mascarar atividade irregular.', '> 3 alterações em 12 meses: +15. > 2 mudanças de CNAE: +10.'],
        ['company_evolution', 'Série temporal de capital social ao longo dos anos, número de empregados ao longo dos anos, número de sócios ao longo dos anos. Permite detectar tendências de crescimento ou deterioração.', 'Compara o primeiro e último valor da série temporal. Queda de capital > 50% indica possível esvaziamento patrimonial. Queda de empregados > 80% do pico indica crise operacional grave.', 'Queda capital > 50%: +20. Queda empregados > 80%: +15.'],
      ]} />

      <H3>Bloco B — KYC e Sanções</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['kyc', 'Verificação da empresa contra todas as listas de sanções nacionais e internacionais: OFAC SDN List (EUA), EU Consolidated Sanctions, UN Security Council, COAF, CEIS (Cadastro de Empresas Inidôneas e Suspensas da CGU), CNEP (Cadastro Nacional de Empresas Punidas). Também verifica se a empresa é classificada como PEP (Pessoa Politicamente Exposta).', 'Se qualquer sanção for encontrada, gera bloqueio automático B03 (score → 850). Se a empresa for PEP, gera +40 pontos e exige Enhanced Due Diligence conforme Circular BCB 3.978/2020 Art. 14.', 'Sanção: Bloqueio B03 → 850. PEP empresa: +40.'],
        ['owners_kyc', 'KYC individual de CADA sócio/administrador do QSA: verifica se cada pessoa é PEP, se consta em listas de sanções, e o status de seus documentos pessoais.', 'Se qualquer sócio for sancionado, gera bloqueio B03. Se qualquer sócio for PEP, gera +40 pontos e exige monitoramento reforçado.', 'Sócio sancionado: Bloqueio B03 → 850. Sócio PEP: +40.'],
        ['economic_group_kyc', 'KYC de todas as empresas do grupo econômico: verifica PEP e sanções em cada entidade vinculada societariamente à empresa analisada.', 'Sanção em qualquer empresa do grupo gera +60 pontos. PEP no grupo gera +20 pontos. Identifica riscos indiretos via cadeia societária.', 'Sanção grupo: +60. PEP grupo: +20.'],
      ]} />

      <H3>Bloco C — Processos Judiciais e Dívidas</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['processes', 'Lista completa de TODOS os processos judiciais em que a empresa é parte (autora ou ré), em todas as esferas: cível, criminal, trabalhista e administrativa. Para cada processo: número do processo, tribunal, tipo de ação, valor da causa, data de início, última movimentação, partes envolvidas com CPF/CNPJ, e status atual. O sistema detalha até 50 processos com drill-down completo.', 'Processos criminais são o dado mais grave — geram +50 pontos. Volume total > 20 processos gera +25 pontos. O SENTINEL IA analisa os assuntos dos processos para identificar padrões (ex: múltiplas ações de consumidores indicam problemas de produto/serviço).', 'Criminal: +50. > 20 processos: +25. 1-20: +10.'],
        ['lawsuits_distribution_data', 'Distribuição agregada dos processos por tipo (criminal, cível, trabalhista, administrativo). Permite visualização rápida da concentração de processos sem carregar todos os detalhes.', 'Usado como pre-filter para identificar rapidamente se há processos criminais antes de analisar o detalhe completo.', 'Informativo — alimenta o relatório SENTINEL.'],
        ['owners_lawsuits', 'Processos judiciais de CADA sócio individual, com mesmo nível de detalhe do dataset processes. Permite identificar sócios com pendências jurídicas pessoais graves.', 'Sócio com processo criminal gera +50 pontos. Mais de 10 processos de sócios gera +20 pontos. Cross-validado com o QSA para identificar sócios problemáticos.', 'Criminal sócio: +50. > 10: +20. 1-10: +10.'],
        ['owners_lawsuits_distribution', 'Distribuição dos processos dos sócios por tipo — mesma lógica do lawsuits_distribution_data mas para pessoas físicas do QSA.', 'Informativo — identifica rapidamente se algum sócio tem processos criminais.', 'Informativo.'],
        ['government_debtors', 'Inscrição na dívida ativa da União (PGFN), Estados e Municípios. Informa o valor total inscrito e as fontes (PGFN federal, procuradorias estaduais, etc.).', 'Dívida > R$500.000 gera bloqueio automático B06 (score → 850). Faixas intermediárias: > R$100k gera +40 pontos, < R$100k gera +20 pontos.', 'Bloqueio B06 (> R$500k) → 850. > R$100k: +40. < R$100k: +20.'],
        ['collections', 'Registros de negativação em bureaus de crédito: Serasa, SPC, SCPC, Boa Vista. Indica se a empresa tem dívidas não pagas que foram registradas por credores. Detalha valor total, número de registros e credores.', 'Qualquer registro de negativação gera +30 pontos. Indica incapacidade de honrar compromissos financeiros. Cross-validado com dívida ativa e processos.', 'Negativado: +30.'],
      ]} />

      <H3>Bloco D — Sócios, Política e Influência</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['relationships', 'Quadro de Sócios e Administradores (QSA) completo: nome, CPF/CNPJ, qualificação (sócio administrador, sócio quotista, diretor, etc.), percentual de participação, e data de entrada.', 'Zero sócios registrados gera +15 pontos (empresa irregular). Usado para identificar beneficiários finais (UBOs) com participação ≥ 25% conforme Circular BCB 3.978/2020 Art. 16.', 'Zero sócios: +15.'],
        ['configurable_recency_qsa', 'QSA consultado em tempo real diretamente na Receita Federal — pode divergir do QSA "padrão" da BDC se houve alteração societária recente que ainda não foi indexada.', 'Compara QSA padrão vs QSA tempo real. Divergência (ex: sócio saiu mas ainda aparece no padrão) gera +5 pontos e flag de atenção para alteração societária recente.', 'Divergência QSA: +5.'],
        ['political_involvement', 'Verifica se algum sócio tem vínculos políticos: candidatura a cargo eletivo, filiação partidária, ocupação de cargo público (comissionado ou efetivo).', 'Vínculos políticos detectados geram +20 pontos e exigem monitoramento reforçado por exposição PEP indireta.', 'Envolvimento político: +20.'],
        ['owners_influence', 'Nível de influência e poder dos sócios — posições em conselhos, participações em outras empresas, alcance de rede de relacionamentos empresariais.', 'Informativo — alimenta o relatório SENTINEL para contextualizar o perfil dos sócios.', 'Informativo.'],
        ['owners_electoral_donors', 'Total de doações eleitorais registradas no TSE (Tribunal Superior Eleitoral) por cada sócio. Detalha valor total doado e partidos/candidatos beneficiados.', 'Doações > R$100.000 geram +15 pontos por indicar alta exposição política. Doações menores geram +5 pontos como ponto de atenção.', 'Doações > R$100k: +15. < R$100k: +5.'],
      ]} />

      <H3>Bloco E — Pegada Digital</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['domains', 'Domínios web registrados pela empresa: URL, idade do domínio (em dias), presença de certificado SSL (HTTPS), plataforma tecnológica (WordPress, Shopify, etc.), métodos de pagamento aceitos, tipo de site (e-commerce, institucional, blog).', 'Sem SSL gera +15 pontos (empresa não investe em segurança). Domínio com menos de 1 ano de idade gera +10 pontos (site recente, pode não ter operação consolidada).', 'Sem SSL: +15. Domínio < 1 ano: +10.'],
        ['passages', 'Passagens web: quantas vezes a empresa foi mencionada em websites, diretórios, redes sociais e outras fontes online. Total histórico e últimos 12 meses.', 'ZERO passagens web totais é extremamente suspeito para uma empresa que pretende processar pagamentos — gera +30 pontos. Menos de 5 passagens nos últimos 12 meses gera +15 pontos.', 'Zero passagens: +30. < 5 recentes: +15.'],
        ['activity_indicators', 'Indicadores de atividade real da empresa: nível de atividade (0-100%), Shell Company Score (probabilidade de ser empresa de fachada), faixa de empregados, faixa de receita, presença de domínio ativo.', 'Shell Company Score > 80% gera bloqueio automático B05 (score → 850). Nível de atividade < 30% gera +20 pontos. < 60% gera +10 pontos. O Shell Company Score combina: zero empregados + sem domínio + sem passagens web + endereço virtual + capital mínimo + CNAE genérico.', 'Bloqueio B05 (Shell > 80%) → 850. Atividade < 30%: +20. < 60%: +10.'],
        ['online_ads', 'Anúncios online ativos da empresa em plataformas de publicidade (Google Ads, Facebook Ads, etc.).', 'Informativo — presença de anúncios indica investimento em marketing, o que é positivo para validar operação real.', 'Informativo.'],
        ['marketplace_data', 'Presença em marketplaces: Mercado Livre, Amazon, Shopee, Magalu, etc. Indica se a empresa vende através de plataformas terceiras.', 'Presença em marketplace é positivo (-10 pontos) — indica operação real de vendas validada por plataforma terceira.', 'Positivo: -10.'],
      ]} />

      <H3>Bloco F — Reputação e Mídia</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['media_profile_and_exposure', 'Análise de todas as menções da empresa na mídia usando NLP (processamento de linguagem natural). Cada menção é classificada por sentimento: VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE. Extrai headlines e tópicos principais.', 'Mídia com sentimento VERY_NEGATIVE associada a fraude, lavagem ou corrupção gera bloqueio automático B07 (score → 850). Mídia negativa (sem fraude) gera +30 pontos. Mídia positiva é registrada como ponto favorável.', 'Bloqueio B07 (VERY_NEG + fraude) → 850. Mídia negativa: +30. Mídia VERY_NEG (sem fraude): +80.'],
        ['reputations_and_reviews', 'Nota e reclamações em plataformas de consumidores: Reclame Aqui (nota 0-10, total de reclamações, % resolvidas), Google Reviews, e outras plataformas avaliativas.', 'Nota < 5/10 gera +20 pontos. Nota entre 5 e 7 gera +10 pontos. Nota ≥ 7 é positivo (-10 pontos). Também analisa taxa de resolução — taxa < 50% é ponto de atenção.', 'Nota < 5: +20. 5-7: +10. ≥ 7: -10.'],
        ['awards_and_certifications', 'Prêmios, selos e certificações da empresa: Great Place to Work, certificações ISO, prêmios setoriais, etc.', 'Qualquer prêmio/certificação é positivo (-15 pontos) — indica reconhecimento externo de qualidade e conformidade.', 'Positivo: -15.'],
      ]} />

      <H3>Bloco G — Financeiro e Grupo Econômico</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['financial_market', 'Registros em órgãos reguladores do mercado financeiro: BCB (Banco Central), CVM (Comissão de Valores Mobiliários), SUSEP (Superintendência de Seguros), PREVIC (Previdência Complementar).', 'Registro em regulador é fortemente positivo (-20 pontos) — significa que a empresa é supervisionada por um órgão estatal, reduzindo risco regulatório.', 'Positivo: -20.'],
        ['economic_group', 'Tamanho e composição do grupo econômico — quantas empresas estão societariamente vinculadas à empresa analisada.', 'Grupo com mais de 20 empresas gera +15 pontos — estruturas complexas são difíceis de monitorar e podem mascarar beneficiários finais.', 'Grupo > 20: +15.'],
        ['economic_group_relationships', 'Mapa completo de participações societárias entre as empresas do grupo: empresa A tem X% de B, B tem Y% de C, etc. Permite detectar participações circulares.', 'Participação circular (A → B → C → A) gera +30 pontos — é uma estrutura clássica de lavagem de dinheiro e ocultação de beneficiários finais.', 'Participação circular: +30.'],
        ['merchant_category_data', 'MCC (Merchant Category Code) real identificado pela BDC a partir da atividade econômica da empresa. Cross-validado com o MCC declarado pelo cliente.', 'Divergência entre MCC real e MCC declarado é ponto de atenção para o SENTINEL. Pode indicar tentativa de evasão de regras por segmento.', 'Informativo para cross-validation.'],
      ]} />

      <H3>Bloco H — ESG, Crédito e Contatos</H3>
      <Table headers={['Dataset', 'Descrição detalhada', 'Interpretação', 'Impacto']} rows={[
        ['esg_and_compliance', 'Verificação da empresa contra: Lista Suja do MTE (trabalho escravo), embargos IBAMA (infrações ambientais), alertas de desmatamento, e scores ESG (ambiental, social, governança).', 'Lista Suja MTE gera bloqueio automático B08 (score → 850) — empresa com trabalho escravo tem REJEIÇÃO IMEDIATA. Embargo IBAMA gera bloqueio B09 (score → 850). Scores ESG baixos são informativos.', 'Bloqueio B08 (Lista Suja) → 850. Bloqueio B09 (Embargo) → 850.'],
        ['credit_risk + credit_score', 'Score de crédito da empresa calculado por bureaus (Serasa/SPC/Boa Vista) de 0 a 1000, protestos em cartórios, cheques devolvidos (CCF), falências e recuperações judiciais, probabilidade de inadimplência.', 'Score < 300 = inadimplente provável (+40 pontos). Falências geram +50 pontos. Protestos > 5 geram +20 pontos. Score > 700 é positivo (-10 pontos).', 'Score < 300: +40. 300-500: +20. Falência: +50. Protestos > 5: +20. Score > 700: -10.'],
        ['phones/emails/addresses_extended', 'Telefones com status de atividade e operadora. E-mails com identificação genérico vs corporativo. Endereços associados ao CNPJ com coordenadas.', 'Todos os e-mails genéricos (Gmail/Hotmail) gera +5 pontos. Telefones inativos são ponto de atenção. Informativo para cross-validation com dados declarados.', 'E-mails todos genéricos: +5.'],
        ['related_people_*', 'Telefones, e-mails e endereços de pessoas vinculadas ao CNPJ (sócios, representantes, procuradores). Permite contato independente e verificação cruzada.', 'Informativo — usado pelo SENTINEL para cross-validation dos contatos declarados.', 'Informativo.'],
        ['industrial_property', 'Patentes, marcas registradas e desenhos industriais da empresa no INPI.', 'Positivo (-5 pontos por categoria) — ativos de propriedade intelectual indicam investimento real e operação legítima.', 'Patentes: -5. Marcas: -5.'],
        ['licenses_and_authorizations', 'Licenças regulatórias ativas (Anvisa, Ibama, CVM, BCB, etc.).', 'Positivo (-5 pontos) — licença ativa confirma que a empresa é regulada e supervisionada.', 'Positivo: -5.'],
      ]} />

      <H2>5.2. Datasets Exclusivos para Pessoa Física (CPF) — Subseller PF</H2>
      <P>Quando o subseller é PF (CPF), a consulta é feita no endpoint <code>/pessoas</code> da BDC. Além dos datasets básicos (basic_data, kyc, processes, collections), são consultados datasets exclusivos de CPF que não existem para CNPJ:</P>
      <Table headers={['Dataset PF', 'O que consulta em detalhe', 'Impacto no score']} rows={[
        ['scr_positive_score', 'Score de crédito do SCR (Sistema de Informações de Crédito) do Banco Central — é o "gold standard" de crédito no Brasil, calculado com base em TODAS as operações de crédito acima de R$200 reportadas ao BCB por todas as instituições financeiras. Também retorna valor de operações vencidas (inadimplidas) e exposição total.', 'Score < 300: +40 pts (inadimplência confirmada). 300-500: +20. 500-700: +5. > 700: -10 (bom pagador). Valor vencido > R$50k: +25 pts.'],
        ['first_level_family_kyc', 'Verificação de KYC (PEP e sanções) de TODOS os familiares de 1º grau: cônjuge, pais e filhos. É o que a regulamentação chama de "PEP por extensão" — familiares de PEPs também requerem Enhanced Due Diligence.', 'Familiar em sanções: Bloqueio B10 → 850 pts. Familiar PEP: +30 pts e exige EDD conforme Circular BCB 3.978/2020 Art. 14 §2º.'],
        ['social_assistance', 'Verifica se a pessoa é beneficiária de programas sociais: Bolsa Família, BPC (Benefício de Prestação Continuada), CadÚnico, etc.', 'Beneficiário de programa social operando pagamentos de alto valor = perfil incompatível: +25 pts. Pode indicar uso de "laranja".'],
        ['presumed_income', 'Estimativa de renda mensal da pessoa baseada em dados cadastrais, patrimônio e movimentação financeira. Retorna valor estimado ou faixa de renda.', 'Informativo — usado para cross-validation: renda presumida de R$3k vs TPV declarado de R$200k/mês = desproporção grave.'],
        ['financial_interests', 'Participações em fundos de investimento, seguros, previdência, consórcios e outros produtos financeiros da pessoa.', 'Zero interesses financeiros = perfil sem vida financeira ativa (+5 pts). Pode indicar CPF de pessoa não envolvida com atividades financeiras.'],
        ['personal_relationships', 'Rede de relacionamentos pessoais: vínculos familiares, profissionais, coabitação. Identifica quantas pessoas compartilham o mesmo endereço.', '3+ pessoas no mesmo endereço com atividades comerciais: +15 pts (possível rede de laranjas). 5+ pessoas: +25 pts (CRÍTICO).'],
        ['simples_nacional_collection', 'Histórico de arrecadação do Simples Nacional ou MEI. Retorna valores mensais pagos — permite calcular a média de faturamento real.', 'Se é MEI e a média mensal de arrecadação > R$6.750 (teto legal de R$81k/ano), gera +20 pts — está em situação fiscal irregular.'],
        ['electoral_donors', 'Doações eleitorais da pessoa física ao TSE.', 'Doações > R$100k: +20 pts. Indica vínculos políticos e possível PEP por extensão.'],
        ['public_servants', 'Verifica se a pessoa tem vínculo funcional ativo com órgão público (federal, estadual ou municipal). Retorna cargo e órgão.', 'Servidor público ativo: +15 pts. Pode ter vedação legal para atividade empresarial e conflito de interesses conforme Lei 8.112/1990 Art. 117.'],
        ['risk_data', 'Indicadores de risco agregados da PF: presença em cobranças, nível de risco calculado.', 'Em cobrança: +15 pts. Nível de risco alto/crítico é registrado como ponto de atenção.'],
      ]} />

      <InfoBox title="Retry e Resiliência" color="amber">
        <p>Cada consulta BDC tem retry automático com backoff exponencial: se a API retornar erro 500/502/503/504/429, o sistema tenta novamente até 3 vezes com intervalos de 1.5s, 3s e 4.5s. Isso garante resiliência contra instabilidades temporárias da API.</p>
      </InfoBox>

      <H2>5.3. Fila de Retry Persistente (BdcRetryQueue)</H2>
      <P>Além do retry inline dentro de uma única chamada, o sistema mantém uma <strong>fila persistente</strong> de retries para lotes de datasets que falharam mesmo após as 3 tentativas iniciais. A entidade <code>BdcRetryQueue</code> armazena cada caso pendente com seus lotes de datasets divididos em 3 níveis de prioridade:</P>

      <Table headers={['Prioridade', 'Datasets (CNPJ)', 'Datasets (CPF)', 'Política de retry']} rows={[
        ['CRITICAL', 'basic_data, kyc, owners_kyc, processes, government_debtors, activity_indicators, esg_and_compliance', 'basic_data, kyc, scr_positive_score, processes, first_level_family_kyc, collections', 'Até 5 tentativas com backoff exponencial 2m/5m/15m/45m/120m. Se falhar todas, caso vai para "giving_up" e dispara alerta Slack.'],
        ['IMPORTANT', 'relationships, collections, credit_risk, media_profile_and_exposure, reputations_and_reviews, domains, passages', 'presumed_income, social_assistance, financial_interests, personal_relationships, simples_nacional_collection', 'Até 3 tentativas com backoff 5m/20m/60m. Caso continua para decisão mesmo sem esses dados (são enriquecimentos relevantes mas não críticos).'],
        ['COMPLEMENTARY', 'online_ads, marketplace_data, awards_and_certifications, industrial_property, licenses_and_authorizations, political_involvement, owners_electoral_donors, economic_group, economic_group_relationships', 'electoral_donors, public_servants, risk_data', 'Até 2 tentativas com backoff 10m/60m. Não bloqueia a decisão.'],
      ]} />

      <H2>5.4. Worker de Retry (bdcRetryWorker)</H2>
      <P>A cada 5 minutos, a função <code>bdcRetryWorker</code> (agendada como automation) varre a <code>BdcRetryQueue</code> buscando registros com <code>next_retry_at</code> ≤ agora e <code>status</code> = "pending". Para cada um:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>Identifica o próximo lote pendente (CRITICAL primeiro, depois IMPORTANT, depois COMPLEMENTARY).</Li>
        <Li>Executa a chamada BDC apenas para os datasets daquele lote específico (economiza requests).</Li>
        <Li>Se o lote voltou com sucesso, marca como "success", mescla os datasets ao <code>merged_result</code> do caso e dispara re-cálculo do Score V4 via <code>bdcEnrichCase</code> em modo "merge".</Li>
        <Li>Se o lote falhou novamente, incrementa <code>attempts</code>, calcula o próximo <code>next_retry_at</code> (backoff exponencial com jitter de ±20% para evitar thundering herd), e volta ao status "pending".</Li>
        <Li>Se esgotou o número máximo de tentativas, marca o lote como "degraded" (IMPORTANT/COMPLEMENTARY) ou o caso inteiro como "giving_up" (CRITICAL).</Li>
      </ul>

      <InfoBox title="Por que fila persistente e não só retry inline?" color="blue">
        <p>Uma indisponibilidade de 1–2 horas da BDC (já aconteceu em produção) bloquearia dezenas de onboardings se dependêssemos só de retry inline. A fila permite que: (a) o cliente finalize o onboarding sem esperar a BDC se recuperar, (b) a decisão preliminar seja calculada com os dados disponíveis, (c) quando a BDC voltar, os dados complementares sejam automaticamente mesclados e o score recalculado — sem nenhuma ação humana necessária.</p>
      </InfoBox>
    </S>
  );
}