import React from 'react';
import RiskDocShell from './RiskDocShell';

const TOC = [
  '1. Visão Geral — Subsellers no Modelo Pagsmile',
  '2. Diferença entre Seller Pai e Subseller / Subconta',
  '3. Responsabilidade do Seller Pai pelo KYC dos Subsellers',
  '4. Fluxo Operacional Completo (PJ e PF)',
  '5. Modelo de Captura — Questionário Subseller V2',
  '6. Documentos Solicitados ao Subseller (PJ e PF)',
  '7. Modelo de Score do Subseller (escala 0-1000, simplificada)',
  '8. Variáveis Aplicadas ao Subseller (PJ)',
  '9. Variáveis Aplicadas ao Subseller (PF)',
  '10. Enriquecimento BDC para Subseller',
  '11. Validação Biométrica CAF do Subseller',
  '12. Bloqueios Específicos para Subsellers',
  '13. Tabela de Decisão Subseller',
  '14. Limites Operacionais por Faixa',
  '15. Herança e Risco do Seller Pai',
  '16. Monitoramento, Revalidação e Offboarding',
  '17. Apêndice — Glossário Subseller',
];

export default function RiskScoringSubsellersDoc() {
  return (
    <RiskDocShell
      id="risk-scoring-subsellers-doc"
      title="Modelo de Risk Scoring — Subsellers & Subcontas"
      subtitle="Especificação Técnica para Marketplaces, Plataformas e Subcontas (PJ/PF)"
      audience="Visa • Mastercard • Elo • Amex • BCB • Auditores Externos"
      version="4.0 (Subseller V2)"
      toc={TOC}
    >
      {/* 1 */}
      <section className="risk-section">
        <h1>1. Visão Geral — Subsellers no Modelo Pagsmile</h1>
        <p>
          <strong>Subseller</strong> (também chamado de <em>subconta</em> ou <em>seller secundário</em>) é
          uma pessoa jurídica (PJ) ou pessoa física (PF) que vende dentro da plataforma de um Seller pai já
          aprovado (tipicamente um Marketplace, Gateway ou Plataforma Vertical). Cada subseller possui
          KYC/KYB independente, score de risco próprio e decisão isolada — porém o <strong>Seller pai é
          formalmente responsável</strong> pela curadoria, monitoramento e offboarding dos seus subsellers.
        </p>

        <h2>1.1 Onde Subsellers se Encaixam</h2>
        <ul className="risk-list">
          <li><strong>Marketplace:</strong> lojas vendem dentro do app/site do Seller pai (e-commerce horizontal).</li>
          <li><strong>Plataforma Vertical:</strong> profissionais de um nicho (saúde, educação, eventos) vendem na plataforma.</li>
          <li><strong>Gateway / Subadquirente:</strong> sellers terminais conectam-se via API do gateway.</li>
          <li><strong>Foodtech, EaaS, ride-hailing:</strong> motoristas, restaurantes, tutores são subsellers PF/PJ.</li>
        </ul>

        <h2>1.2 Princípios do Modelo Subseller</h2>
        <ol className="risk-list">
          <li><strong>KYC/KYB sempre obrigatório:</strong> Pagsmile não permite subseller sem KYC, mesmo com volume baixo.</li>
          <li><strong>Score independente, decisão isolada:</strong> um subseller recusado não impacta diretamente o seller pai (mas afeta sua score de governança).</li>
          <li><strong>Herança parcial de risco:</strong> sellers pai com subfaixa pior recebem subsellers com escrutínio mais rigoroso.</li>
          <li><strong>Monitoramento contínuo:</strong> chargeback do subseller, revalidação periódica, lista de sanções.</li>
          <li><strong>Limites por faixa:</strong> cada faixa de subseller define TPV, ticket máximo, MCCs permitidos.</li>
        </ol>
      </section>

      {/* 2 */}
      <section className="risk-section risk-break">
        <h1>2. Diferença entre Seller Pai e Subseller</h1>
        <table className="risk-table">
          <thead><tr><th>Dimensão</th><th>Seller Pai (Direto)</th><th>Subseller / Subconta</th></tr></thead>
          <tbody>
            <tr><td>Contrato</td><td>Direto com Pagsmile</td><td>Indireto — via plataforma do Seller pai</td></tr>
            <tr><td>Onboarding</td><td>Compliance V4 completo (10–13 steps)</td><td>Subseller V2 simplificado (4–5 steps)</td></tr>
            <tr><td>Score</td><td>Escala 0–849 (V4 — 3 camadas)</td><td>Escala 0–1000 (Subseller — modelo proprietário simplificado)</td></tr>
            <tr><td>Tipo de Pessoa</td><td>PJ ou PF</td><td>PJ ou PF (subseller_v2 ou subseller_pf)</td></tr>
            <tr><td>Documentação</td><td>Completa (CNPJ, contrato social, balanço, comp. residência)</td><td>Reduzida (CNPJ ou CPF + ID + selfie + comp. residência)</td></tr>
            <tr><td>Biometria</td><td>Liveness + Facematch + Documentoscopia (representante)</td><td>Liveness + Facematch + Documentoscopia (titular)</td></tr>
            <tr><td>Política PLD</td><td>Exigida (V19-V24)</td><td>Herdada do Seller pai</td></tr>
            <tr><td>Rolling Reserve</td><td>0–15% por subfaixa</td><td>Aplicado dentro do volume do Seller pai</td></tr>
            <tr><td>Responsabilidade Operacional</td><td>Direta com Pagsmile</td><td>Solidária — Seller pai responde por subseller fraudulento</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3 */}
      <section className="risk-section risk-break">
        <h1>3. Responsabilidade do Seller Pai pelo KYC dos Subsellers</h1>
        <p>
          A Pagsmile <strong>processa o KYC/KYB do subseller</strong> mas o Seller pai <strong>permanece
          formalmente responsável</strong> pela presença ativa, monitoramento e offboarding rápido em caso
          de fraude. Esta responsabilidade é capturada no questionário V4 do Seller pai (variáveis V31–V34)
          e revisitada em toda revalidação periódica.
        </p>

        <h2>3.1 Obrigações Contratuais do Seller Pai</h2>
        <ul className="risk-list">
          <li>Manter política documentada de aceite e offboarding de subsellers.</li>
          <li>Reportar à Pagsmile qualquer atividade suspeita identificada (canal de denúncia).</li>
          <li>Aceitar offboarding compulsório de subsellers que a Pagsmile recuse.</li>
          <li>Assumir chargeback de subseller quando a fraude for detectável pela governança esperada.</li>
          <li>Permitir auditoria periódica das suas políticas de subseller.</li>
        </ul>

        <h2>3.2 Score de Governança do Seller Pai</h2>
        <p>
          A Pagsmile mantém um <code>SubsellerGovernanceScore</code> agregado por Seller pai, calculado a
          partir do desempenho dos seus subsellers (chargeback, fraude, recusas). Este score é uma das
          entradas da revalidação periódica do Seller pai e pode mover sua subfaixa.
        </p>
      </section>

      {/* 4 */}
      <section className="risk-section risk-break">
        <h1>4. Fluxo Operacional Completo</h1>
        <ol className="risk-list">
          <li><strong>Seller pai aprovado</strong> gera link de onboarding de subseller via página <code>/GerenciarSubsellerLinks</code> (token único, validade configurável).</li>
          <li><strong>Subseller acessa o link</strong> (PJ ou PF), preenche o questionário <em>Subseller V2</em> e faz upload dos documentos.</li>
          <li><strong>Liveness + Facematch CAF</strong> obrigatórios (titular PJ ou subseller PF).</li>
          <li><strong>Enriquecimento BDC</strong> automático: pessoas_kyc (PF) ou kyc + basic_data (PJ).</li>
          <li><strong>Cálculo de score</strong> (escala 0–1000) e classificação em faixa.</li>
          <li><strong>Decisão automática</strong> (Aprovado / Revisão / Recusado) — Seller pai é notificado.</li>
          <li><strong>Subseller ativado</strong> com limites operacionais conforme faixa.</li>
          <li><strong>Monitoramento contínuo</strong> de chargeback, sanções, revalidação periódica.</li>
        </ol>
      </section>

      {/* 5 */}
      <section className="risk-section risk-break">
        <h1>5. Modelo de Captura — Questionário Subseller V2</h1>
        <p>
          Templates ativos: <code>subseller_v2</code> (PJ) e <code>subseller_pf</code> (PF). Mantidos na
          entidade <code>QuestionnaireTemplate</code> com category=COMPLIANCE.
        </p>

        <h2>5.1 Steps do Subseller V2 (PJ)</h2>
        <ol className="risk-list">
          <li><strong>Step 1 — Identificação:</strong> CNPJ (com autocomplete BDC), razão social, nome fantasia, e-mail, telefone.</li>
          <li><strong>Step 2 — Endereço operacional:</strong> CEP autocomplete, número, complemento.</li>
          <li><strong>Step 3 — Atividade & volumetria:</strong> CNAE, descrição, MCC, TPV mensal estimado, ticket médio.</li>
          <li><strong>Step 4 — Representante legal:</strong> CPF, nome, data de nascimento, e-mail, telefone, foto biométrica (CAF SDK).</li>
          <li><strong>Step 5 — Confirmação:</strong> aceite de termos, declaração de exatidão.</li>
        </ol>

        <h2>5.2 Steps do Subseller PF (subseller_pf)</h2>
        <ol className="risk-list">
          <li><strong>Step 1 — Identificação pessoal:</strong> CPF, nome completo, data de nascimento, nome da mãe, nacionalidade, e-mail, telefone.</li>
          <li><strong>Step 2 — Endereço residencial.</strong></li>
          <li><strong>Step 3 — Atividade econômica:</strong> tipo de serviço, MCC, TPV estimado, ticket médio.</li>
          <li><strong>Step 4 — Biometria:</strong> Liveness + Facematch (CAF SDK).</li>
          <li><strong>Step 5 — Confirmação:</strong> aceite e declaração.</li>
        </ol>
      </section>

      {/* 6 */}
      <section className="risk-section risk-break">
        <h1>6. Documentos Solicitados ao Subseller</h1>

        <h2>6.1 Subseller PJ</h2>
        <table className="risk-table">
          <thead><tr><th>Documento</th><th>Obrigatório</th><th>Formatos</th><th>Tamanho</th><th>Observações</th></tr></thead>
          <tbody>
            <tr><td>Cartão CNPJ (atualizado &lt;90 dias)</td><td>Sim</td><td>PDF</td><td>≤ 5 MB</td><td>Pode ser substituído por consulta BDC se passar limpo</td></tr>
            <tr><td>Comprovante de endereço operacional (≤90 dias)</td><td>Sim</td><td>PDF, JPG, PNG</td><td>≤ 5 MB</td><td>Conta de luz, água, telefone fixo, contrato de aluguel</td></tr>
            <tr><td>Documento de identidade do representante (RG/CNH)</td><td>Sim</td><td>JPG, PNG</td><td>≤ 5 MB</td><td>Capturado via CAF SDK (frente + verso)</td></tr>
            <tr><td>Selfie do representante (Liveness + Facematch)</td><td>Sim</td><td>—</td><td>—</td><td>CAF SDK Liveness + Facematch obrigatório</td></tr>
            <tr><td>Contrato social (último consolidado)</td><td>Condicional</td><td>PDF</td><td>≤ 10 MB</td><td>Solicitado se capital declarado &gt; R$100k ou 3+ sócios</td></tr>
            <tr><td>Procuração</td><td>Condicional</td><td>PDF</td><td>≤ 5 MB</td><td>Se representante não consta no QSA</td></tr>
          </tbody>
        </table>

        <h2>6.2 Subseller PF</h2>
        <table className="risk-table">
          <thead><tr><th>Documento</th><th>Obrigatório</th><th>Formatos</th><th>Tamanho</th><th>Observações</th></tr></thead>
          <tbody>
            <tr><td>Documento de identidade (RG ou CNH)</td><td>Sim</td><td>JPG, PNG</td><td>≤ 5 MB</td><td>Capturado via CAF SDK (frente + verso)</td></tr>
            <tr><td>Selfie (Liveness + Facematch)</td><td>Sim</td><td>—</td><td>—</td><td>CAF SDK Liveness + Facematch obrigatório</td></tr>
            <tr><td>Comprovante de residência (≤90 dias)</td><td>Sim</td><td>PDF, JPG, PNG</td><td>≤ 5 MB</td><td>Conta consumo, contrato aluguel, declaração próprio punho com dois testemunhos</td></tr>
            <tr><td>Comprovante de atividade autônoma</td><td>Condicional</td><td>PDF, JPG</td><td>≤ 5 MB</td><td>MEI, registro profissional, contrato de prestação</td></tr>
          </tbody>
        </table>
      </section>

      {/* 7 */}
      <section className="risk-section risk-break">
        <h1>7. Modelo de Score do Subseller — Escala 0–1000</h1>
        <p>
          Diferente do Seller pai (V4, escala 0–849), o subseller utiliza modelo simplificado <strong>0 a 1000
          onde 1000 = melhor</strong> (alinhado com convenção de score positivo). Foi escolhida escala
          diferente porque o subseller possui menor superfície de coleta e o modelo é mais binário.
        </p>
        <pre className="risk-formula">
{`subseller_score = score_base_inicial
                + Σ(boost_positivo)
                - Σ(penalidade)
                - Σ(red_flag_severo)
                ∈ [0, 1000]

# Score base inicial (PJ): 700
# Score base inicial (PF): 650
# Herança do Seller pai: -50 a +30 dependendo da subfaixa do pai`}
        </pre>

        <h2>7.1 Faixas de Decisão Subseller</h2>
        <table className="risk-table">
          <thead><tr><th>Faixa</th><th>Score</th><th>Decisão</th><th>Limite Mensal Inicial</th><th>Monitoramento</th></tr></thead>
          <tbody>
            <tr><td>EXCELENTE</td><td>800–1000</td><td>Auto-aprovado</td><td>R$ 100.000</td><td>Padrão</td></tr>
            <tr><td>BOM</td><td>650–799</td><td>Auto-aprovado</td><td>R$ 50.000</td><td>Padrão</td></tr>
            <tr><td>REGULAR</td><td>500–649</td><td>Aprovado com restrição</td><td>R$ 20.000</td><td>Reforçado</td></tr>
            <tr><td>FRACO</td><td>350–499</td><td>Revisão manual</td><td>R$ 5.000 (cap)</td><td>Intenso</td></tr>
            <tr><td>RECUSAR</td><td>0–349</td><td>Recusado</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
      </section>

      {/* 8 */}
      <section className="risk-section risk-break">
        <h1>8. Variáveis Aplicadas ao Subseller PJ</h1>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>SS-PJ-01</td><td>Idade da empresa</td><td>BDC</td><td>&lt;6m: -150 • 6m-1a: -80 • 1-3a: -20 • &gt;3a: +30</td></tr>
            <tr><td>SS-PJ-02</td><td>Capital social</td><td>BDC kyc</td><td>&lt;R$5k: -60 • 5-50k: 0 • &gt;50k: +20</td></tr>
            <tr><td>SS-PJ-03</td><td>Situação cadastral RFB</td><td>BDC basic_data</td><td>Ativa: 0 • Suspensa: -300 • Inapta/baixada: RECUSA automática</td></tr>
            <tr><td>SS-PJ-04</td><td>CNAE coerente com MCC</td><td>BDC + declarado</td><td>Coerente: 0 • Divergente: -50</td></tr>
            <tr><td>SS-PJ-05</td><td>Endereço confirmado BDC</td><td>BDC addresses</td><td>Confirmado: +20 • Não confirmado: -40</td></tr>
            <tr><td>SS-PJ-06</td><td>Sanções (OFAC/PEP/Interpol)</td><td>BDC + CAF</td><td>Hit: RECUSA automática (B-S02)</td></tr>
            <tr><td>SS-PJ-07</td><td>Processos criminais ativos</td><td>BDC processos</td><td>Hit: RECUSA automática (B-S03)</td></tr>
            <tr><td>SS-PJ-08</td><td>Restrições financeiras graves</td><td>BDC credit</td><td>Limpo: +20 • Negativações graves: -100</td></tr>
            <tr><td>SS-PJ-09</td><td>Massa falida / RJ</td><td>BDC kyc</td><td>RECUSA automática (B-S04)</td></tr>
            <tr><td>SS-PJ-10</td><td>Liveness CAF do representante</td><td>CAF</td><td>≥80: +30 • 50-79: 0 • &lt;50: -200 + revisão</td></tr>
            <tr><td>SS-PJ-11</td><td>Facematch CAF</td><td>CAF</td><td>≥85%: +30 • 70-85%: 0 • &lt;70%: -200 + revisão</td></tr>
            <tr><td>SS-PJ-12</td><td>Documentoscopia (Verifai)</td><td>CAF</td><td>OK: 0 • FRAUD: RECUSA automática (B-S05)</td></tr>
            <tr><td>SS-PJ-13</td><td>TPV declarado coerente com MCC</td><td>Análise</td><td>Coerente: 0 • Inflado para MCC: -60</td></tr>
            <tr><td>SS-PJ-14</td><td>Domínio próprio (se e-commerce)</td><td>BDC domains</td><td>Sim: +20 • Não para e-commerce: -30</td></tr>
            <tr><td>SS-PJ-15</td><td>Reuso de face em outros subsellers</td><td>CAF shared_faceset</td><td>Hit suspeito: -200 + revisão (B-S06)</td></tr>
            <tr><td>SS-PJ-16</td><td>Herança do Seller pai (subfaixa)</td><td>ComplianceScore pai</td><td>1A/1B: +30 • 2A/2B: 0 • 3A/3B: -30 • 4: -80</td></tr>
          </tbody>
        </table>
      </section>

      {/* 9 */}
      <section className="risk-section risk-break">
        <h1>9. Variáveis Aplicadas ao Subseller PF</h1>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>SS-PF-01</td><td>Idade do CPF (anos desde emissão)</td><td>BDC pessoas_kyc</td><td>&lt;1a: -100 • 1-5a: -30 • &gt;5a: +20</td></tr>
            <tr><td>SS-PF-02</td><td>Idade do titular</td><td>Cálculo</td><td>&lt;18: RECUSA • 18-21: -50 • 22-65: 0 • &gt;65: -20</td></tr>
            <tr><td>SS-PF-03</td><td>CPF coerente com nome (BDC)</td><td>BDC pessoas_kyc</td><td>Coerente: +30 • Divergente: RECUSA automática</td></tr>
            <tr><td>SS-PF-04</td><td>Endereço residencial confirmado</td><td>BDC addresses</td><td>Confirmado: +20 • Não confirmado: -40</td></tr>
            <tr><td>SS-PF-05</td><td>PEP / Sanções</td><td>BDC + CAF</td><td>Hit: RECUSA automática (B-S02)</td></tr>
            <tr><td>SS-PF-06</td><td>Processos criminais ativos</td><td>BDC processos</td><td>Hit relevante: RECUSA automática (B-S03)</td></tr>
            <tr><td>SS-PF-07</td><td>Restrições financeiras (Serasa, SCR)</td><td>BDC credit</td><td>Limpo: +20 • Restrições: -50</td></tr>
            <tr><td>SS-PF-08</td><td>Liveness CAF</td><td>CAF</td><td>≥80: +50 • 50-79: 0 • &lt;50: -300 + revisão</td></tr>
            <tr><td>SS-PF-09</td><td>Facematch CAF</td><td>CAF</td><td>≥85%: +50 • 70-85%: 0 • &lt;70%: -300 + revisão</td></tr>
            <tr><td>SS-PF-10</td><td>Documentoscopia (Verifai)</td><td>CAF</td><td>OK: 0 • FRAUD: RECUSA automática (B-S05)</td></tr>
            <tr><td>SS-PF-11</td><td>Reuso de face em outros subsellers</td><td>CAF shared_faceset</td><td>Hit suspeito: -300 + revisão (B-S06)</td></tr>
            <tr><td>SS-PF-12</td><td>Coerência atividade declarada x MCC</td><td>Análise</td><td>Coerente: 0 • Divergente: -50</td></tr>
            <tr><td>SS-PF-13</td><td>TPV declarado vs perfil de renda</td><td>BDC + análise</td><td>Compatível: 0 • Inflado: -80</td></tr>
            <tr><td>SS-PF-14</td><td>Vínculo empregatício ativo (BDC)</td><td>BDC</td><td>Sim: +30 • Sem vínculo + sem MEI: -30</td></tr>
            <tr><td>SS-PF-15</td><td>MEI ativo coerente</td><td>BDC pessoas_kyc</td><td>Sim e ativo: +50 • Não aplicável: 0</td></tr>
            <tr><td>SS-PF-16</td><td>Herança do Seller pai</td><td>ComplianceScore pai</td><td>1A/1B: +30 • 2A/2B: 0 • 3A/3B: -30 • 4: -80</td></tr>
          </tbody>
        </table>
      </section>

      {/* 10 */}
      <section className="risk-section risk-break">
        <h1>10. Enriquecimento BDC para Subseller</h1>

        <h2>10.1 Subseller PJ — Datasets</h2>
        <table className="risk-table">
          <thead><tr><th>Dataset</th><th>Função</th></tr></thead>
          <tbody>
            <tr><td>basic_data</td><td>Razão social, situação cadastral RFB, CNAE</td></tr>
            <tr><td>kyc</td><td>QSA, capital social, sócios</td></tr>
            <tr><td>addresses</td><td>Confirmação de endereço operacional</td></tr>
            <tr><td>activity_indicators</td><td>Sinais fiscais e trabalhistas</td></tr>
            <tr><td>credit_report</td><td>Restrições financeiras leves (não bloqueia, pondera)</td></tr>
            <tr><td>processos (resumo)</td><td>Hits criminais ativos = recusa</td></tr>
          </tbody>
        </table>

        <h2>10.2 Subseller PF — Datasets</h2>
        <table className="risk-table">
          <thead><tr><th>Dataset</th><th>Função</th></tr></thead>
          <tbody>
            <tr><td>pessoas_kyc</td><td>Nome, idade, CPF coerente, vínculos empregatícios, MEI</td></tr>
            <tr><td>addresses (PF)</td><td>Confirmação residencial</td></tr>
            <tr><td>credit_report (PF)</td><td>Restrições</td></tr>
            <tr><td>pep_international + sanctions_international</td><td>Listas globais</td></tr>
            <tr><td>processos (PF)</td><td>Criminais ativos</td></tr>
            <tr><td>biometria_facial / prova_de_vida (CAF)</td><td>Validação biométrica complementar</td></tr>
          </tbody>
        </table>

        <p className="risk-note">
          Subsellers usam BDC <strong>STANDARD</strong> (ou <strong>PF-specific</strong> para PF) — versão
          mais econômica que a usada para Sellers pai. Para subsellers com TPV declarado &gt; R$50k/mês o
          sistema escala automaticamente para BDC FULL.
        </p>
      </section>

      {/* 11 */}
      <section className="risk-section risk-break">
        <h1>11. Validação Biométrica CAF do Subseller</h1>
        <p>
          A captura biométrica é <strong>obrigatória</strong> para todo subseller (titular PJ ou pessoa
          física PF) e é a maior fonte de score do modelo subseller — biometria responde por ~30% do peso
          total da decisão.
        </p>

        <h2>11.1 Serviços CAF Aplicados</h2>
        <table className="risk-table">
          <thead><tr><th>Serviço</th><th>Aplicação</th><th>Threshold</th></tr></thead>
          <tbody>
            <tr><td>liveness</td><td>Selfie do titular</td><td>&lt;50 → revisão • &lt;30 → RECUSA</td></tr>
            <tr><td>facematch</td><td>Selfie vs documento</td><td>&lt;70% → revisão • &lt;55% → RECUSA</td></tr>
            <tr><td>document_detector front + back</td><td>RG/CNH</td><td>Qualidade ≥75</td></tr>
            <tr><td>verifai_docs</td><td>Documentoscopia forense</td><td>FRAUD → RECUSA imediata (B-S05)</td></tr>
            <tr><td>cpf_cross_validation (PF)</td><td>CPF do titular</td><td>Inconsistência → RECUSA</td></tr>
            <tr><td>shared_faceset</td><td>Reuso de face em outros subsellers</td><td>Hit suspeito → revisão obrigatória (B-S06)</td></tr>
            <tr><td>deepfake_detection</td><td>Anti-deepfake</td><td>Suspeita alta → recaptura forçada</td></tr>
          </tbody>
        </table>

        <h2>11.2 Detecção Anti-Sybil</h2>
        <p>
          A Pagsmile mantém um <code>shared_faceset</code> CAF cross-tenant: se a mesma pessoa tentar criar
          múltiplos subsellers (próprios ou em sellers pais distintos) o sistema detecta e bloqueia. Esta é
          uma defesa específica contra fraude de "subsellers fantasma" que tipicamente serve para lavagem
          ou cash-out de cartão fraudado.
        </p>
      </section>

      {/* 12 */}
      <section className="risk-section risk-break">
        <h1>12. Bloqueios Específicos para Subsellers (B-S01 → B-S08)</h1>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Nome</th><th>Gatilho</th><th>Decisão Forçada</th></tr></thead>
          <tbody>
            <tr><td>B-S01</td><td>Idade titular &lt;18 anos</td><td>Cálculo data de nascimento</td><td>RECUSA</td></tr>
            <tr><td>B-S02</td><td>Sanções / PEP confirmados</td><td>BDC + CAF</td><td>RECUSA</td></tr>
            <tr><td>B-S03</td><td>Processo criminal ativo</td><td>BDC processos</td><td>RECUSA</td></tr>
            <tr><td>B-S04</td><td>PJ com situação RFB inapta/baixada/falida</td><td>BDC basic_data + processos</td><td>RECUSA</td></tr>
            <tr><td>B-S05</td><td>Documentoscopia detecta fraude</td><td>verifai_docs = FRAUD</td><td>RECUSA AUTOMÁTICA</td></tr>
            <tr><td>B-S06</td><td>Reuso suspeito de face</td><td>shared_faceset hit</td><td>REVISÃO MANUAL</td></tr>
            <tr><td>B-S07</td><td>CPF não coerente com nome (BDC pessoas_kyc)</td><td>BDC validation</td><td>RECUSA</td></tr>
            <tr><td>B-S08</td><td>Tentativa de criar 3+ subsellers no mesmo Seller pai com falhas anteriores</td><td>histórico de tentativas</td><td>RECUSA + flag fraud-attempt</td></tr>
          </tbody>
        </table>
      </section>

      {/* 13 */}
      <section className="risk-section risk-break">
        <h1>13. Tabela de Decisão Subseller</h1>
        <pre className="risk-formula">
{`def decisao_subseller(score, bloqueios, herance_pai):
    # 1) Bloqueios graves vencem sempre
    if any(b in bloqueios for b in ["B-S01","B-S02","B-S03","B-S04","B-S05","B-S07","B-S08"]):
        return "RECUSADO"

    # 2) Score gera faixa
    if score >= 800:    decisao = "Auto-aprovado"
    elif score >= 650:  decisao = "Auto-aprovado"
    elif score >= 500:  decisao = "Aprovado com restrição"
    elif score >= 350:  decisao = "Revisão Manual"
    else:                decisao = "Recusado"

    # 3) B-S06 (reuso de face) força revisão manual
    if "B-S06" in bloqueios and decisao.startswith("Auto"):
        decisao = "Revisão Manual"

    # 4) Seller pai em subfaixa 4 força revisão manual de subseller acima de regular
    if herance_pai_subfaixa == "4" and decisao == "Auto-aprovado":
        decisao = "Aprovado com restrição"

    return decisao`}
        </pre>
      </section>

      {/* 14 */}
      <section className="risk-section risk-break">
        <h1>14. Limites Operacionais por Faixa</h1>
        <table className="risk-table">
          <thead><tr><th>Faixa</th><th>TPV Mensal</th><th>Ticket Máximo</th><th>MCCs Permitidos</th><th>Antecipação</th></tr></thead>
          <tbody>
            <tr><td>EXCELENTE</td><td>R$ 100.000</td><td>R$ 5.000</td><td>Todos do Seller pai</td><td>Até 100%</td></tr>
            <tr><td>BOM</td><td>R$ 50.000</td><td>R$ 3.000</td><td>Todos do Seller pai exceto restritos</td><td>Até 80%</td></tr>
            <tr><td>REGULAR</td><td>R$ 20.000</td><td>R$ 1.000</td><td>Apenas baixo risco (não infoprodutos, não jogos)</td><td>Até 50%</td></tr>
            <tr><td>FRACO</td><td>R$ 5.000 (cap)</td><td>R$ 300</td><td>Lista restrita explícita</td><td>0%</td></tr>
          </tbody>
        </table>
        <p className="risk-note">
          Os limites são revistos a cada revalidação. Aumentos exigem comportamento estável (chargeback &lt; threshold da faixa por &gt;90 dias).
        </p>
      </section>

      {/* 15 */}
      <section className="risk-section risk-break">
        <h1>15. Herança e Risco do Seller Pai</h1>
        <p>
          O Seller pai contribui ao score do subseller pela variável <code>SS-XX-16</code> (herança da
          subfaixa do pai). A lógica é:
        </p>
        <ul className="risk-list">
          <li>Pai 1A/1B → boost de +30 ao subseller (boa governança presumida).</li>
          <li>Pai 2A/2B → neutro (0).</li>
          <li>Pai 3A/3B → penalidade de -30 (governança questionável).</li>
          <li>Pai 4 → penalidade de -80 + revisão obrigatória de qualquer subseller acima de "REGULAR".</li>
          <li>Pai 5 (recusado) → impossível ter subsellers ativos.</li>
        </ul>
        <p>
          Adicionalmente, se o Seller pai entrar em Revalidação Antecipada (Seção 12 do doc Sellers), todos
          os seus subsellers <em>com volume mensal &gt; R$10k</em> são re-avaliados em paralelo.
        </p>
      </section>

      {/* 16 */}
      <section className="risk-section risk-break">
        <h1>16. Monitoramento, Revalidação e Offboarding</h1>

        <h2>16.1 Cadência de Revalidação</h2>
        <table className="risk-table">
          <thead><tr><th>Faixa</th><th>Frequência</th><th>Escopo</th></tr></thead>
          <tbody>
            <tr><td>EXCELENTE / BOM</td><td>Anual</td><td>BDC quick refresh + sanctions screening</td></tr>
            <tr><td>REGULAR</td><td>Semestral</td><td>BDC full + revisão chargeback</td></tr>
            <tr><td>FRACO</td><td>Trimestral</td><td>BDC full + CAF re-screening</td></tr>
          </tbody>
        </table>

        <h2>16.2 Triggers de Revalidação Antecipada</h2>
        <ul className="risk-list">
          <li>Chargeback acima do threshold da faixa por 30 dias rolantes.</li>
          <li>Hit em watchlist (sanções, PEP, novo processo criminal).</li>
          <li>Reclamação grave registrada pelo Seller pai ou consumidor final.</li>
          <li>Tentativa de mudar MCC para fora da faixa permitida.</li>
          <li>TPV processado &gt; 200% do limite da faixa.</li>
        </ul>

        <h2>16.3 Offboarding</h2>
        <ol className="risk-list">
          <li>Subseller pode ser desativado pelo Seller pai a qualquer momento (offboarding voluntário).</li>
          <li>Pagsmile pode forçar offboarding (compulsório) em caso de fraude detectada — Seller pai é obrigado contratualmente a executar.</li>
          <li>Volumes em curso entram em hold de 90 dias para cobrir potenciais chargebacks.</li>
          <li>Caso de fraude grave (B-S05, B-S08) pode resultar em add do CPF/CNPJ do subseller a uma blocklist interna que impede recriação em outros sellers pai.</li>
        </ol>
      </section>

      {/* 17 */}
      <section className="risk-section risk-break">
        <h1>17. Apêndice — Glossário Subseller</h1>
        <dl className="risk-dl">
          <dt>Subseller</dt><dd>PJ ou PF que vende dentro da plataforma de um Seller pai aprovado.</dd>
          <dt>Seller pai</dt><dd>Marketplace, Gateway, Plataforma Vertical ou similar que tem subsellers.</dd>
          <dt>Subconta</dt><dd>Sinônimo operacional de Subseller.</dd>
          <dt>Herança de risco</dt><dd>Mecanismo que faz a subfaixa do Seller pai impactar o score do subseller.</dd>
          <dt>shared_faceset</dt><dd>Galeria CAF cross-tenant que detecta reuso de face em múltiplos subsellers.</dd>
          <dt>Anti-Sybil</dt><dd>Defesa contra criação de múltiplas identidades fictícias por uma mesma pessoa.</dd>
          <dt>SubsellerGovernanceScore</dt><dd>Score agregado mantido pela Pagsmile sobre a qualidade da curadoria de subsellers do Seller pai.</dd>
          <dt>Blocklist interna</dt><dd>Lista de CPFs/CNPJs banidos por fraude — bloqueia tentativa de recriação em qualquer outro Seller pai.</dd>
          <dt>Hold de 90 dias</dt><dd>Retenção financeira após offboarding para cobrir chargebacks remanescentes.</dd>
          <dt>Cap de TPV</dt><dd>Limite máximo absoluto de volume processável dado a faixa do subseller.</dd>
        </dl>
      </section>
    </RiskDocShell>
  );
}