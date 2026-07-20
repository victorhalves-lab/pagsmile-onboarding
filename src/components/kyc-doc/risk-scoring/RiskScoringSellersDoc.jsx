import React from 'react';
import RiskDocShell from './RiskDocShell';

const TOC = [
  '1. Visão Geral & Princípios do Modelo',
  '2. Arquitetura de 3 Camadas (Score Base + Variáveis + Enriquecimento)',
  '3. Camada 1 — Score Base por Segmento (todos os segmentos calibrados)',
  '4. Camada 2 — Variáveis Aplicadas (60+ variáveis, fonte e peso)',
  '5. Camada 3 — Enriquecimento BigDataCorp (datasets, batches, retry)',
  '6. Validação CAF — KYC/KYB, Liveness, Documentoscopia, Sanções',
  '7. Bloqueios Automáticos B01 → B10 (gatilhos, evidências, decisão)',
  '8. Subfaixas 1A → 5 (decisão, monitoramento, Rolling Reserve)',
  '9. Agente IA SENTINEL — Análise Dimensional & Política de Escalação',
  '10. Tabela de Decisão Final Determinística (pseudocódigo)',
  '11. Rolling Reserve — Política, Cálculo e Reajuste',
  '12. Monitoramento Contínuo & Revalidação Periódica',
  '13. Cross-Validation Declarado vs Confirmado (campo a campo)',
  '14. Auditoria, Trilha de Decisão & LGPD',
  '15. Apêndice A — Glossário Técnico Completo',
  '16. Apêndice B — Mapeamento Regulatório (BCB, Bandeiras, OFAC)',
];

export default function RiskScoringSellersDoc() {
  return (
    <RiskDocShell
      id="risk-scoring-sellers-doc"
      title="Modelo de Risk Scoring — Sellers Diretos"
      subtitle="Especificação Técnica Completa para Auditoria de Bandeiras e Reguladores"
      audience="Visa • Mastercard • Elo • Amex • BCB • Auditores Externos"
      version="4.0 (Modelo de 3 Camadas)"
      toc={TOC}
    >
      {/* SECTION 1 */}
      <section className="risk-section">
        <h1>1. Visão Geral & Princípios do Modelo</h1>

        <h2>1.1 Objetivo</h2>
        <p>
          O modelo de Risk Scoring Pin Bank V4.0 quantifica o risco operacional, regulatório, financeiro e
          reputacional de cada candidato a Seller que pretende processar pagamentos via gateway Pin Bank,
          produzindo uma decisão <strong>determinística, auditável e regulatoriamente defensável</strong>.
          Aplica-se ao onboarding inicial e a toda revalidação periódica obrigatória.
        </p>

        <h2>1.2 Princípios Fundamentais</h2>
        <ol className="risk-list">
          <li><strong>Determinismo:</strong> dado o mesmo conjunto de inputs (respostas, BDC, CAF), o output é sempre o mesmo. A IA SENTINEL pode <em>escalar</em> a severidade — nunca reduzi-la.</li>
          <li><strong>Auditabilidade total:</strong> cada decisão gera trilha imutável em <code>ComplianceScore</code>, <code>IntegrationLog</code>, <code>AuditLog</code>, <code>HelenaAnalysis</code>, <code>QuestionnaireResponse</code> e <code>DocumentUpload</code>.</li>
          <li><strong>Defesa em profundidade:</strong> 3 camadas independentes + agente IA + revisão humana opcional + parceiros de compliance externos.</li>
          <li><strong>Conservadorismo:</strong> em empate ou ambiguidade, o sistema sempre escolhe o caminho mais restritivo.</li>
          <li><strong>Cross-validation:</strong> tudo o que o cliente declara é cruzado com fontes externas (BDC, CAF). Divergências geram red flags ponderados.</li>
          <li><strong>Privacy by design:</strong> documentos PII em storage privado, signed URLs (TTL 300s), mascaramento por perfil, conformidade integral com LGPD.</li>
          <li><strong>Reprodutibilidade:</strong> framework versionado (<code>framework_version: v4.0</code>) — qualquer caso pode ser reprocessado e validado historicamente.</li>
        </ol>

        <h2>1.3 Score Final — Escala 0 a 849 (invertida)</h2>
        <p>
          O score final é um inteiro de <strong>0 a 849</strong> onde <strong>0 = melhor</strong> (menor
          risco) e <strong>849 = pior</strong> (maior risco). A escala invertida foi escolhida para alinhar
          com convenções de risco financeiro e tornar intuitivo que <em>somar</em> red flags aumente o número.
        </p>
        <table className="risk-table">
          <thead><tr><th>Faixa de Score</th><th>Subfaixa</th><th>Decisão Padrão</th><th>Monitoramento</th><th>Rolling Reserve</th></tr></thead>
          <tbody>
            <tr><td>0 — 99</td><td>1A — VERDE EXPRESS</td><td>Auto-aprovado</td><td>PADRÃO</td><td>0%</td></tr>
            <tr><td>100 — 199</td><td>1B — VERDE</td><td>Auto-aprovado</td><td>PADRÃO</td><td>0%</td></tr>
            <tr><td>200 — 299</td><td>2A — AZUL</td><td>Aprovado com ressalva leve</td><td>REFORÇADO_LEVE</td><td>2%</td></tr>
            <tr><td>300 — 399</td><td>2B — AZUL+</td><td>Aprovado com ressalvas</td><td>REFORÇADO</td><td>5%</td></tr>
            <tr><td>400 — 499</td><td>3A — AMARELO</td><td>Revisão manual recomendada</td><td>INTENSO</td><td>8%</td></tr>
            <tr><td>500 — 599</td><td>3B — LARANJA</td><td>Revisão manual obrigatória</td><td>INTENSO_PLUS</td><td>10%</td></tr>
            <tr><td>600 — 749</td><td>4 — VERMELHO</td><td>Revisão + condições especiais</td><td>MAXIMO</td><td>15%</td></tr>
            <tr><td>750 — 849</td><td>5 — PRETO</td><td>Recusado</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>

        <h2>1.4 Stack Técnico</h2>
        <table className="risk-table">
          <thead><tr><th>Componente</th><th>Tecnologia</th><th>Função</th></tr></thead>
          <tbody>
            <tr><td>Captura</td><td>React + base44 SDK</td><td>Questionário V4 dinâmico, autosave, retomada via link</td></tr>
            <tr><td>Persistência</td><td>base44 entities + RLS</td><td>OnboardingCase, ComplianceScore, IntegrationLog</td></tr>
            <tr><td>Enriquecimento</td><td>BigDataCorp REST API</td><td>30+ datasets PJ/PF (KYC, processos, sanções, MCC, domínios)</td></tr>
            <tr><td>Identidade</td><td>CAF Combate à Fraude</td><td>KYC/KYB, Liveness, Facematch, Documentoscopia, Verifai, screening internacional</td></tr>
            <tr><td>Orquestração</td><td>Deno backend functions</td><td>autoEnrichOnboarding, bdcEnrichCase, cafWebhookHandler, bdcRetryWorker</td></tr>
            <tr><td>IA</td><td>Agente SENTINEL (LLM)</td><td>Análise dimensional 7 eixos, red flags qualitativos, escalação</td></tr>
            <tr><td>UI Decisão</td><td>Painel de Análise unificado</td><td>Visão consolidada V4 + SENTINEL + CAF + BDC para o analista humano</td></tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 2 */}
      <section className="risk-section risk-break">
        <h1>2. Arquitetura de 3 Camadas</h1>
        <p>O score final é a soma determinística de três camadas independentes:</p>
        <pre className="risk-formula">
{`score_final = score_base_segmento + Σ(score_variaveis) + Σ(score_enriquecimento_bdc)
            ∈ [0, 849]`}
        </pre>

        <h2>2.1 Camada 1 — Score Base por Segmento</h2>
        <p>
          Cada segmento de negócio começa com um <strong>score base</strong> que reflete o risco intrínseco
          do modelo de negócio (independente do cliente específico). Calibrado historicamente com dados de
          chargeback, fraude declarada, taxa de PLD-FT por mercado e exposição regulatória.
        </p>

        <h2>2.2 Camada 2 — Variáveis Aplicadas</h2>
        <p>
          Mais de 60 variáveis são aplicadas com base nas respostas do questionário. Variáveis com peso
          negativo (boas práticas declaradas e verificadas) reduzem o score; variáveis com peso positivo
          (red flags declarados ou inferidos) aumentam.
        </p>

        <h2>2.3 Camada 3 — Enriquecimento BigDataCorp</h2>
        <p>
          Após a captura, o orquestrador <code>autoEnrichOnboarding</code> dispara o pipeline BDC. Os
          datasets retornados aplicam ajustes adicionais — sempre conservadores: BDC confirmando o
          declarado reduz o score; BDC contradizendo o declarado aumenta significativamente.
        </p>

        <h2>2.4 Bloqueios Automáticos (B01–B10)</h2>
        <p>
          Independente do score numérico final, certas condições disparam <strong>bloqueios automáticos</strong>
          que sobrepõem a decisão e forçam Recusa imediata ou Revisão Manual obrigatória — detalhe na Seção 7.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="risk-section risk-break">
        <h1>3. Camada 1 — Score Base por Segmento</h1>
        <p>
          Valores fixos e versionados. Alterações geram entrada em <code>CodeChangelog</code> com severidade
          mínima HIGH e revisão obrigatória pelo time de Compliance + Risk.
        </p>
        <table className="risk-table">
          <thead><tr><th>Segmento</th><th>Score Base</th><th>Justificativa Calibrada</th></tr></thead>
          <tbody>
            <tr><td>Gateway / PSP / Subadquirente</td><td>180</td><td>MCCs variados, fan-out de subsellers, exposição multi-modelo, exigência regulatória BCB</td></tr>
            <tr><td>Marketplace</td><td>170</td><td>Risco intermediário; depende fortemente de KYC subseller e governança da plataforma</td></tr>
            <tr><td>Plataforma Vertical (saúde, educação)</td><td>140</td><td>Foco em nicho regulado reduz volatilidade; setor já carrega compliance próprio</td></tr>
            <tr><td>Dropshipping</td><td>260</td><td>Histórico alto de chargeback "produto não recebido"; logística terceirizada e cross-border</td></tr>
            <tr><td>Infoprodutos / Educação Digital</td><td>240</td><td>Alta incidência de "não reconheço a compra" e disputas pós-venda</td></tr>
            <tr><td>E-commerce físico</td><td>150</td><td>Modelo tradicional, NF, rastreio de entrega, Procon como mitigador</td></tr>
            <tr><td>SaaS B2B (assinatura)</td><td>110</td><td>Receita recorrente previsível, baixa fraude, ticket B2B</td></tr>
            <tr><td>Link de Pagamento</td><td>200</td><td>Falta antifraude robusto da plataforma origem, checkout fora do contexto</td></tr>
            <tr><td>Educação Presencial</td><td>120</td><td>CNPJ regulado, MEC quando aplicável, recorrência previsível</td></tr>
            <tr><td>MPE — Pequeno Varejo</td><td>160</td><td>Volatilidade financeira mas modelo simples, ticket previsível</td></tr>
            <tr><td>PIX Merchant Final</td><td>100</td><td>PIX irrevogável; risco menor que cartão</td></tr>
            <tr><td>PIX Intermediário (subadquirente PIX)</td><td>200</td><td>Fan-out PIX exige KYC mais rigoroso e licenciamento BCB de IP</td></tr>
            <tr><td>Foodtech / Delivery</td><td>140</td><td>Tickets baixos, alta frequência, baixa fraude líquida</td></tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 4 — Variables */}
      <section className="risk-section risk-break">
        <h1>4. Camada 2 — Variáveis Aplicadas (60+)</h1>
        <p>
          As variáveis abaixo são aplicadas após o questionário ser preenchido. <em>Pesos negativos = bom
          (reduz score); positivos = risco (aumenta score)</em>. Lista mantida em <code>functions/bdcEnrichCase.js</code>
          e <code>components/case-analysis/UnifiedRiskAnalysis.jsx</code>; alterações são auditadas em <code>CodeChangelog</code>.
        </p>

        <h2>4.1 Variáveis Cadastrais</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V01</td><td>Idade da empresa</td><td>BDC basic_data + declarado</td><td>&lt;1 ano: +60 • 1-3a: +30 • 3-5a: 0 • 5-10a: -10 • &gt;10a: -25</td></tr>
            <tr><td>V02</td><td>Capital social</td><td>BDC kyc + declarado</td><td>&lt;R$10k: +40 • 10-100k: +10 • 100k-1M: 0 • &gt;1M: -20</td></tr>
            <tr><td>V03</td><td>Estrutura societária complexa</td><td>BDC QSA</td><td>&gt;5 sócios ou holding chain: +25 (exige UBO completo)</td></tr>
            <tr><td>V04</td><td>UBO identificado e KYC concluído</td><td>CAF + declarado</td><td>Sim: -15 • Não: +50</td></tr>
            <tr><td>V05</td><td>PEP</td><td>BDC pep_international + autodeclaração</td><td>Declarado e validado: +40 • Omitido (descoberto): +120 + B01</td></tr>
            <tr><td>V06</td><td>Sanções (OFAC/ONU/Interpol)</td><td>BDC sanctions + CAF</td><td>Hit confirmado: +200 + B02 (Recusa)</td></tr>
            <tr><td>V07</td><td>CNAE coerente com atividade declarada</td><td>BDC vs declarado</td><td>Coerente: -10 • Divergente: +35</td></tr>
            <tr><td>V08</td><td>Endereço operacional confirmado</td><td>BDC addresses</td><td>Confirmado: -5 • Não confirmado: +20</td></tr>
            <tr><td>V09</td><td>E-mail e telefone confirmados</td><td>BDC contacts</td><td>Confirmados: -5 cada • Não: +10 cada</td></tr>
            <tr><td>V10</td><td>Domínio próprio com idade ≥2 anos</td><td>BDC domains</td><td>Sim: -15 • Não: +20</td></tr>
          </tbody>
        </table>

        <h2>4.2 Variáveis Financeiras & Volumetria</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V11</td><td>TPV mensal declarado</td><td>Step 5</td><td>&lt;50k: +10 • 50-500k: 0 • 500k-5M: -10 • &gt;5M: -20 (requer doc)</td></tr>
            <tr><td>V12</td><td>Ticket médio</td><td>Questionário</td><td>&lt;R$50: +15 • 50-500: 0 • &gt;500: -5</td></tr>
            <tr><td>V13</td><td>Coerência TPV vs (ticket × tx/mês)</td><td>Cálculo automático</td><td>±10%: 0 • ±30%: +20 • &gt;30%: +60</td></tr>
            <tr><td>V14</td><td>Histórico chargeback declarado</td><td>Step PLD</td><td>&lt;0,5%: -10 • 0,5-1%: 0 • 1-2%: +30 • &gt;2%: +80 + B03</td></tr>
            <tr><td>V15</td><td>% recorrência (assinaturas)</td><td>Questionário</td><td>&gt;70%: -15 • 30-70%: -5 • &lt;30%: 0</td></tr>
            <tr><td>V16</td><td>Internacional (cross-border)</td><td>Questionário</td><td>&gt;30%: +35 • &lt;30%: +15 • Não: 0</td></tr>
            <tr><td>V17</td><td>Forex declarado e licenciado</td><td>Doc + autodeclaração</td><td>Licenciado BCB: -10 • Aplicável e não licenciado: +90</td></tr>
            <tr><td>V18</td><td>% antecipação solicitada</td><td>Proposta</td><td>0%: 0 • 1-50%: 0 • 51-100%: +5</td></tr>
          </tbody>
        </table>

        <h2>4.3 Variáveis PLD/FT</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V19</td><td>Política PLD-FT formalizada</td><td>Step 10a + Doc</td><td>Sim com manual: -20 • Declarado sem doc: +10 • Não: +50</td></tr>
            <tr><td>V20</td><td>KYC interno de clientes finais</td><td>Step 10b</td><td>Robusto: -15 • Básico: 0 • Inexistente: +40</td></tr>
            <tr><td>V21</td><td>Monitoramento transacional</td><td>Step 10c</td><td>Automatizado: -15 • Manual: +5 • Inexistente: +50</td></tr>
            <tr><td>V22</td><td>Compliance Officer designado</td><td>Step 10d</td><td>Sim: -10 • Não: +20</td></tr>
            <tr><td>V23</td><td>Reporte ao COAF</td><td>Step 10d</td><td>Histórico: 0 • Nunca reportou (deveria): +30</td></tr>
            <tr><td>V24</td><td>Treinamento PLD da equipe</td><td>Step 10d</td><td>Anual: -5 • Eventual: 0 • Inexistente: +15</td></tr>
          </tbody>
        </table>

        <h2>4.4 Variáveis Operacionais</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V25</td><td>Antifraude próprio (3DS, score)</td><td>Step 8</td><td>3DS + score externo: -20 • 3DS apenas: -10 • Sem antifraude: +40</td></tr>
            <tr><td>V26</td><td>SAC formalizado e canais ativos</td><td>Step 7c</td><td>Múltiplos + SLA: -10 • Só e-mail: +5 • Inexistente: +30</td></tr>
            <tr><td>V27</td><td>Política de cancelamento e reembolso</td><td>Step 19d</td><td>Clara, no site: -5 • Existe não pública: +5 • Inexistente: +20</td></tr>
            <tr><td>V28</td><td>Reputação digital (RA, Procon)</td><td>BDC + análise</td><td>RA &gt;7: -10 • RA &lt;5: +30 • Sem registro: 0</td></tr>
            <tr><td>V29</td><td>Logística/entrega</td><td>Step 19c</td><td>Própria/regulada: -5 • Correios + rastreio: 0 • Sem rastreio: +25</td></tr>
            <tr><td>V30</td><td>Modalidade de venda</td><td>Step 4f</td><td>B2B recorrente: -10 • E-commerce com NF: 0 • Sem NF: +30</td></tr>
          </tbody>
        </table>

        <h2>4.5 Variáveis de Marketplace / Subsellers</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V31</td><td>KYC obrigatório de subsellers</td><td>Step 7 (marketplace)</td><td>Com biometria: -25 • Doc only: -10 • Não: +60 + B04</td></tr>
            <tr><td>V32</td><td>Volume de subsellers ativos</td><td>Declarado</td><td>&lt;100: 0 • 100-1k: +5 • 1k-10k: +15 • &gt;10k: +25</td></tr>
            <tr><td>V33</td><td>Política de offboarding fraudulento</td><td>Step 7</td><td>Documentada: -10 • Reativa: +5 • Inexistente: +20</td></tr>
            <tr><td>V34</td><td>Atividades reguladas entre subsellers</td><td>Step 19e</td><td>Existem licenciadas: 0 • Não verificadas: +60 + B05</td></tr>
          </tbody>
        </table>

        <h2>4.6 Variáveis de Reputação & Cross-Validation</h2>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Variável</th><th>Fonte</th><th>Valores & Pesos</th></tr></thead>
          <tbody>
            <tr><td>V35</td><td>Processos judiciais ativos</td><td>BDC processos</td><td>Nenhum: 0 • 1-3 cíveis: +10 • &gt;3 ou tributários: +40 • Criminais: +120 + B06</td></tr>
            <tr><td>V36</td><td>Restrições financeiras (Serasa, SCR)</td><td>BDC credit</td><td>Limpo: -10 • Leves: +20 • Graves: +60</td></tr>
            <tr><td>V37</td><td>Sócio ou empresa em massa falida/RJ</td><td>BDC kyc + processos</td><td>Sim: +90 + B07</td></tr>
            <tr><td>V38</td><td>Razão social vs nome fantasia</td><td>BDC + declarado</td><td>Coerente: 0 • Divergência grande: +25 • RS genérica em nicho regulado: +50</td></tr>
            <tr><td>V39</td><td>Indicador "shell company" BDC</td><td>BDC activity_indicators</td><td>Inativos &gt;6 meses: +60 + B08</td></tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 5 — BDC */}
      <section className="risk-section risk-break">
        <h1>5. Camada 3 — Enriquecimento BigDataCorp</h1>

        <h2>5.1 Datasets Consultados (PJ)</h2>
        <table className="risk-table">
          <thead><tr><th>Dataset</th><th>Batch</th><th>Função</th><th>Variáveis afetadas</th></tr></thead>
          <tbody>
            <tr><td>basic_data</td><td>CRITICAL</td><td>Razão social, CNAE, situação cadastral</td><td>V07, V38</td></tr>
            <tr><td>kyc</td><td>CRITICAL</td><td>QSA, sócios, capital, situação</td><td>V02, V03, V04, V37</td></tr>
            <tr><td>owners_kyc</td><td>CRITICAL</td><td>KYC dos sócios identificados</td><td>V04, V05</td></tr>
            <tr><td>relationships</td><td>IMPORTANT</td><td>Vínculos com outras PJs</td><td>V37, V39</td></tr>
            <tr><td>addresses</td><td>IMPORTANT</td><td>Endereço operacional</td><td>V08</td></tr>
            <tr><td>phones</td><td>IMPORTANT</td><td>Telefones registrados</td><td>V09</td></tr>
            <tr><td>emails</td><td>IMPORTANT</td><td>E-mails registrados</td><td>V09</td></tr>
            <tr><td>activity_indicators</td><td>IMPORTANT</td><td>Sinais fiscais e trabalhistas</td><td>V39</td></tr>
            <tr><td>domains</td><td>IMPORTANT</td><td>Domínios associados</td><td>V10</td></tr>
            <tr><td>mcc</td><td>IMPORTANT</td><td>MCC inferido por atividade</td><td>V07</td></tr>
            <tr><td>credit_report</td><td>COMPLEMENTARY</td><td>Restrições financeiras, score</td><td>V36</td></tr>
            <tr><td>kyb_business_identity</td><td>COMPLEMENTARY</td><td>Identidade reforçada do negócio</td><td>V07, V08, V38</td></tr>
            <tr><td>warnings_interpol</td><td>COMPLEMENTARY</td><td>Alertas internacionais</td><td>V06</td></tr>
            <tr><td>pep_international + sanctions_international</td><td>COMPLEMENTARY</td><td>Listas globais</td><td>V05, V06</td></tr>
          </tbody>
        </table>

        <h2>5.2 Política de Batches & Retry</h2>
        <ul className="risk-list">
          <li><strong>CRITICAL:</strong> bloqueia o pipeline. Após 3 tentativas (backoff 2s/5s/15s + jitter), caso vai para <code>BdcRetryQueue</code> e fica EM_PROCESSAMENTO.</li>
          <li><strong>IMPORTANT:</strong> não bloqueia, executa em até 60s do CRITICAL. Falha individual gera flag <em>BDC_PARTIAL</em> (V39 +20).</li>
          <li><strong>COMPLEMENTARY:</strong> assíncrono. Worker <code>bdcRetryWorker</code> processa em até 24h, FIFO + severidade.</li>
        </ul>

        <h2>5.3 Cross-Validation Algorítmico</h2>
        <pre className="risk-formula">
{`for campo in [razao_social, cnae, endereco, telefone, email, qsa, capital_social]:
    if !match(declarado[campo], bdc[campo]):
        red_flags.append("CROSS_DIVERGENCE_" + campo)
        score += peso_divergencia[campo]`}
        </pre>
      </section>

      {/* SECTION 6 — CAF */}
      <section className="risk-section risk-break">
        <h1>6. Validação CAF — Identidade & Antifraude</h1>

        <h2>6.1 Serviços Consumidos</h2>
        <table className="risk-table">
          <thead><tr><th>Serviço CAF</th><th>Aplicação</th><th>Decisão</th></tr></thead>
          <tbody>
            <tr><td>liveness</td><td>Selfie do representante legal/UBO</td><td>Score &lt;70 → recaptura • &lt;50 → B09</td></tr>
            <tr><td>facematch</td><td>Selfie vs documento oficial</td><td>Similaridade &lt;80% → recaptura • &lt;65% → B09</td></tr>
            <tr><td>document_detector_front + back</td><td>RG/CNH frente e verso</td><td>Detecção automática + qualidade ≥80</td></tr>
            <tr><td>documentscopy / verifai_docs</td><td>Documentoscopia forense</td><td>FRAUD_DETECTED → B10 (Recusa automática)</td></tr>
            <tr><td>kyb_company_search + kyb_business_identity</td><td>Identidade reforçada PJ</td><td>Compõe V07, V38</td></tr>
            <tr><td>pep_international + sanctions_international</td><td>Screening global</td><td>Hit → B02</td></tr>
            <tr><td>cpf_cross_validation</td><td>CPF do representante legal</td><td>Inconsistência → +50</td></tr>
            <tr><td>warnings_interpol</td><td>Alertas internacionais</td><td>Hit → B02</td></tr>
            <tr><td>private_faceset / shared_faceset</td><td>Reuso de face em outros sellers</td><td>Hit em shared faceset suspeito → +120</td></tr>
            <tr><td>face_authentication / deepfake_detection</td><td>Anti-deepfake</td><td>Suspeita → recaptura forçada</td></tr>
          </tbody>
        </table>

        <h2>6.2 Política de Recaptura Automática</h2>
        <ul className="risk-list">
          <li>Liveness 50–70 ou Facematch 65–80%: solicita recaptura (até 3 tentativas).</li>
          <li>Cliente recebe e-mail + WhatsApp (opt-in) com novo link CAF.</li>
          <li>Falha após 3 tentativas: escala para Revisão Manual com motivo <em>CAF_QUALITY</em>.</li>
        </ul>

        <h2>6.3 Webhook Handler & Idempotência</h2>
        <p>
          Todo evento CAF chega em <code>cafWebhookHandler</code> validado por HMAC com <code>CAF_WEBHOOK_SECRET</code>.
          Cada <em>transactionId</em> é processado exatamente uma vez — duplicatas detectadas via
          <code> IntegrationLog.transaction_id</code>.
        </p>
      </section>

      {/* SECTION 7 — Blocks */}
      <section className="risk-section risk-break">
        <h1>7. Bloqueios Automáticos B01 → B10</h1>
        <p>
          Bloqueios são gatilhos <strong>determinísticos</strong> que sobrepõem o score numérico.
          Forçam Recusa imediata ou Revisão Manual obrigatória, conforme severidade.
        </p>
        <table className="risk-table">
          <thead><tr><th>ID</th><th>Nome</th><th>Gatilho</th><th>Decisão Forçada</th><th>Evidência Persistida</th></tr></thead>
          <tbody>
            <tr><td>B01</td><td>PEP omitido</td><td>BDC sanctions confirma PEP que cliente declarou "não"</td><td>REVISÃO MANUAL</td><td>BDC pep_international + autodeclaração</td></tr>
            <tr><td>B02</td><td>Sanção / Interpol</td><td>Hit em OFAC/ONU/Interpol</td><td>RECUSA</td><td>BDC + CAF screening payload</td></tr>
            <tr><td>B03</td><td>Chargeback histórico &gt;2%</td><td>Declarado ou inferido</td><td>REVISÃO MANUAL</td><td>Step 19d + cálculo</td></tr>
            <tr><td>B04</td><td>Marketplace sem KYC subseller</td><td>V31 = "não"</td><td>REVISÃO MANUAL</td><td>Resposta Step 7</td></tr>
            <tr><td>B05</td><td>Atividade regulada não licenciada</td><td>V34 = "sim, sem licença"</td><td>RECUSA</td><td>Step 19e + verif. BCB/Anvisa/CVM</td></tr>
            <tr><td>B06</td><td>Processo criminal ativo</td><td>BDC processos = criminal_active</td><td>RECUSA</td><td>BDC processos payload</td></tr>
            <tr><td>B07</td><td>Massa falida / RJ</td><td>BDC kyc + processos</td><td>RECUSA</td><td>BDC kyb payload</td></tr>
            <tr><td>B08</td><td>Shell company suspeita</td><td>activity_indicators inativos &gt;6m + capital baixo</td><td>REVISÃO MANUAL</td><td>BDC activity_indicators</td></tr>
            <tr><td>B09</td><td>Falha biométrica grave</td><td>Liveness &lt;50 ou Facematch &lt;65 (após 3 recapturas)</td><td>REVISÃO MANUAL</td><td>CAF transaction payload</td></tr>
            <tr><td>B10</td><td>Documentoscopia detecta fraude</td><td>verifai_docs = FRAUD_DETECTED</td><td>RECUSA AUTOMÁTICA</td><td>CAF documentscopy payload</td></tr>
          </tbody>
        </table>
        <div className="risk-note">
          <strong>B10 é o único bloqueio que recusa automaticamente sem possibilidade de override humano</strong>,
          pois constitui evidência objetiva de fraude documental. Os demais permitem reversão pelo analista
          com justificativa formal registrada em <code>overrides_aplicados</code>.
        </div>
      </section>

      {/* SECTION 8 — Subfaixas */}
      <section className="risk-section risk-break">
        <h1>8. Subfaixas 1A → 5 — Decisão & Monitoramento</h1>
        <table className="risk-table">
          <thead><tr><th>Subfaixa</th><th>Score</th><th>Decisão</th><th>Monitoramento</th><th>Rolling Reserve</th><th>Condições</th></tr></thead>
          <tbody>
            <tr><td>1A — VERDE EXPRESS</td><td>0-99</td><td>Auto-aprovado</td><td>PADRÃO</td><td>0%</td><td>Nenhuma</td></tr>
            <tr><td>1B — VERDE</td><td>100-199</td><td>Auto-aprovado</td><td>PADRÃO</td><td>0%</td><td>Nenhuma</td></tr>
            <tr><td>2A — AZUL</td><td>200-299</td><td>Aprovado c/ ressalva leve</td><td>REFORÇADO_LEVE</td><td>2%</td><td>Revisão 12 meses</td></tr>
            <tr><td>2B — AZUL+</td><td>300-399</td><td>Aprovado c/ ressalvas</td><td>REFORÇADO</td><td>5%</td><td>Revisão 6m + relatório trimestral</td></tr>
            <tr><td>3A — AMARELO</td><td>400-499</td><td>Revisão manual recomendada</td><td>INTENSO</td><td>8%</td><td>Aprovação humana + condições</td></tr>
            <tr><td>3B — LARANJA</td><td>500-599</td><td>Revisão manual obrigatória</td><td>INTENSO_PLUS</td><td>10%</td><td>Aprovação + plano de mitigação</td></tr>
            <tr><td>4 — VERMELHO</td><td>600-749</td><td>Revisão + condições especiais</td><td>MAXIMO</td><td>15%</td><td>Aprovação executiva + monit. mensal</td></tr>
            <tr><td>5 — PRETO</td><td>750-849</td><td>Recusado</td><td>—</td><td>—</td><td>Recurso só com novos elementos</td></tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 9 — SENTINEL */}
      <section className="risk-section risk-break">
        <h1>9. Agente IA SENTINEL — Análise Dimensional</h1>

        <h2>9.1 7 Dimensões Analisadas</h2>
        <ol className="risk-list">
          <li><strong>Cadastral:</strong> coerência razão social, CNAE, endereço, sócios, vínculos.</li>
          <li><strong>Financeira:</strong> capital, TPV declarado, ticket, antecipação, restrições.</li>
          <li><strong>PLD/FT:</strong> políticas, KYC interno, monitoramento, COAF.</li>
          <li><strong>Documental:</strong> qualidade, completude, autenticidade dos uploads.</li>
          <li><strong>Validações Externas:</strong> coerência BDC + CAF.</li>
          <li><strong>Consistência Declarado-Verificado:</strong> cross-validation por campo.</li>
          <li><strong>Reputação Digital:</strong> Reclame Aqui, Procon, redes sociais, histórico.</li>
        </ol>

        <h2>9.2 Política de Escalação (NUNCA REBAIXA)</h2>
        <p>
          O SENTINEL pode <strong>aumentar</strong> a severidade da decisão V4 se identificar red flags
          qualitativos não capturados pelas variáveis numéricas (ex: padrão de fraude conhecido, narrativa
          inconsistente entre seções, perfil suspeito do sócio em redes sociais). <strong>Nunca reduz</strong>:
          se V4 disse "Revisão Manual", SENTINEL não pode auto-aprovar.
        </p>

        <h2>9.3 Confiança da IA</h2>
        <p>
          Cada análise SENTINEL produz <code>nivel_confianca_ia</code> (0–100). Análises com confiança &lt;70
          são marcadas para revisão obrigatória do analista, mesmo se a recomendação for aprovação.
        </p>
      </section>

      {/* SECTION 10 — Decision Table */}
      <section className="risk-section risk-break">
        <h1>10. Tabela de Decisão Final Determinística</h1>
        <pre className="risk-formula">
{`def decisao_final(score_v4, bloqueios, sentinel_recommendation, sentinel_confidence):
    # 1) Bloqueios graves sempre vencem
    if any(b in bloqueios for b in ["B02","B05","B06","B07","B10"]):
        return "RECUSADO"

    # 2) Calcula subfaixa V4 e decisão base
    subfaixa = calcular_subfaixa(score_v4)
    decisao = mapear_decisao(subfaixa)
    # 1A,1B → Aprovado | 2A,2B → Aprovado c/ Condições
    # 3A,3B → Revisão Manual | 4 → Revisão + Condições | 5 → Recusado

    # 3) SENTINEL pode escalar (nunca rebaixar)
    if sentinel_recommendation in ["Revisão Manual", "Recusado"]:
        decisao = max(decisao, sentinel_recommendation)

    # 4) Bloqueios médios forçam revisão se decisão era aprovação
    if decisao in ["Aprovado", "Aprovado com Condições"]:
        if any(b in bloqueios for b in ["B01","B03","B04","B08","B09"]):
            decisao = "Revisão Manual"

    # 5) Confiança baixa do SENTINEL força revisão
    if sentinel_confidence < 70 and decisao == "Aprovado":
        decisao = "Revisão Manual"

    return decisao`}
        </pre>
      </section>

      {/* SECTION 11 — Rolling Reserve */}
      <section className="risk-section risk-break">
        <h1>11. Rolling Reserve — Política & Cálculo</h1>
        <p>
          Rolling Reserve (RR) é a reserva financeira retida temporariamente para cobrir potenciais
          chargebacks futuros. O percentual é calculado a partir da subfaixa final do seller (Seção 8) e
          a retenção segue padrão de 90 dias rolantes.
        </p>
        <pre className="risk-formula">
{`reserve_held(t) = Σ(volume_processed[t-90 ... t]) × rolling_reserve_percent
release(t)      = reserve_held(t-90) liberado em t`}
        </pre>
        <p>
          Sellers que alterem materialmente seu perfil (TPV +50%, novo MCC, novo país de operação) disparam
          revalidação automática que pode reajustar RR <em>para cima</em>. Redução exige aprovação executiva
          manual e nova análise SENTINEL completa.
        </p>
      </section>

      {/* SECTION 12 — Monitoring */}
      <section className="risk-section risk-break">
        <h1>12. Monitoramento Contínuo & Revalidação</h1>

        <h2>12.1 Cadência de Revalidação por Subfaixa</h2>
        <table className="risk-table">
          <thead><tr><th>Subfaixa</th><th>Frequência</th><th>Escopo</th></tr></thead>
          <tbody>
            <tr><td>1A, 1B</td><td>Anual</td><td>BDC quick refresh + verificação status cadastral</td></tr>
            <tr><td>2A, 2B</td><td>Semestral</td><td>BDC full refresh + revisão de KPIs operacionais</td></tr>
            <tr><td>3A, 3B</td><td>Trimestral</td><td>BDC full + CAF re-screening sanções/PEP</td></tr>
            <tr><td>4</td><td>Mensal</td><td>BDC full + CAF + relatório de chargeback</td></tr>
          </tbody>
        </table>

        <h2>12.2 Triggers de Revalidação Antecipada</h2>
        <ul className="risk-list">
          <li>Aumento de TPV &gt; 50% mês a mês.</li>
          <li>Mudança de QSA / sócios.</li>
          <li>Mudança de MCC ou de modelo de negócio declarado.</li>
          <li>Spike de chargeback acima do threshold da subfaixa.</li>
          <li>Hit em watchlist atualizada (sanções, PEP, processos novos).</li>
          <li>Reclamações graves no Reclame Aqui / Procon (auto-monitorado).</li>
        </ul>

        <h2>12.3 Comparação Histórica</h2>
        <p>
          Cada revalidação cria nova versão de <code>ComplianceScore</code> ligada à anterior. O painel de
          revalidação compara delta de score, novas variáveis ativadas e novos red flags, gerando relatório
          com diff colorido.
        </p>
      </section>

      {/* SECTION 13 — Cross-Validation */}
      <section className="risk-section risk-break">
        <h1>13. Cross-Validation Declarado vs Confirmado</h1>
        <table className="risk-table">
          <thead><tr><th>Campo</th><th>Fonte declarada</th><th>Fonte confirmada</th><th>Tolerância</th><th>Peso divergência</th></tr></thead>
          <tbody>
            <tr><td>Razão social</td><td>Step 1</td><td>BDC basic_data</td><td>0% (exato)</td><td>+30</td></tr>
            <tr><td>CNAE principal</td><td>Step 4a</td><td>BDC basic_data + mcc</td><td>família CNAE igual</td><td>+25</td></tr>
            <tr><td>Endereço operacional</td><td>Step 3a</td><td>BDC addresses</td><td>CEP igual + nº ±5</td><td>+20</td></tr>
            <tr><td>Telefone</td><td>Step 1</td><td>BDC phones</td><td>número igual</td><td>+10</td></tr>
            <tr><td>E-mail</td><td>Step 1</td><td>BDC emails</td><td>domínio igual</td><td>+10</td></tr>
            <tr><td>QSA</td><td>Step 5 (sócios)</td><td>BDC kyc + owners_kyc</td><td>nomes idênticos</td><td>+40 / sócio omitido</td></tr>
            <tr><td>Capital social</td><td>Step 1 opcional</td><td>BDC basic_data</td><td>±5%</td><td>+15</td></tr>
            <tr><td>Data constituição</td><td>Step 1</td><td>BDC basic_data</td><td>idêntica</td><td>+10</td></tr>
            <tr><td>MCC declarado</td><td>Lead form</td><td>BDC mcc inferido</td><td>família igual</td><td>+25</td></tr>
            <tr><td>Domínio próprio</td><td>Step 1 (site)</td><td>BDC domains</td><td>matching</td><td>+15 se ausente</td></tr>
          </tbody>
        </table>
      </section>

      {/* SECTION 14 — Audit & LGPD */}
      <section className="risk-section risk-break">
        <h1>14. Auditoria, Trilha de Decisão & LGPD</h1>

        <h2>14.1 Trilha Completa de Cada Decisão</h2>
        <p>Cada caso gera os seguintes registros imutáveis:</p>
        <ul className="risk-list">
          <li><code>OnboardingCase</code> — estado do caso e snapshots de decisão.</li>
          <li><code>ComplianceScore</code> — score V4 detalhado por camada + framework_version.</li>
          <li><code>IntegrationLog</code> — todas as chamadas BDC/CAF com payload completo.</li>
          <li><code>HelenaAnalysis</code> — análise SENTINEL, breakdown e recomendação.</li>
          <li><code>QuestionnaireResponse</code> — respostas históricas do cliente.</li>
          <li><code>DocumentUpload</code> — todos os documentos com signed URL e hash.</li>
          <li><code>AuditLog</code> — toda ação humana sobre o caso.</li>
          <li><code>AccessAudit</code> — toda visualização do caso (quem, quando, perfil).</li>
        </ul>

        <h2>14.2 LGPD & Privacidade</h2>
        <ul className="risk-list">
          <li>Documentos PII em <strong>storage privado</strong> (URI-based) com signed URL temporária (TTL 300s).</li>
          <li>RLS por entidade restringe leitura ao admin ou ao próprio usuário.</li>
          <li>Analistas externos (parceiros de compliance) veem campos mascarados (CPF, endereço, telefone).</li>
          <li>Direito ao esquecimento: caso aprovado pode ter PII anonimizada após 5 anos (retenção PLD-FT).</li>
        </ul>
      </section>

      {/* APPENDIX A */}
      <section className="risk-section risk-break">
        <h1>15. Apêndice A — Glossário Técnico Completo</h1>
        <dl className="risk-dl">
          <dt>BDC</dt><dd>BigDataCorp — provedor de enriquecimento de dados PJ/PF.</dd>
          <dt>CAF</dt><dd>Combate à Fraude — provedor de KYC/biometria/documentoscopia.</dd>
          <dt>SENTINEL</dt><dd>Agente IA Pin Bank que faz análise dimensional qualitativa.</dd>
          <dt>UBO</dt><dd>Ultimate Beneficial Owner — beneficiário final.</dd>
          <dt>PEP</dt><dd>Pessoa Exposta Politicamente.</dd>
          <dt>PLD/FT</dt><dd>Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo (Lei 9.613/98 + Circular BCB 3.978).</dd>
          <dt>MCC</dt><dd>Merchant Category Code — categoria de comércio para bandeiras.</dd>
          <dt>QSA</dt><dd>Quadro de Sócios e Administradores.</dd>
          <dt>RR</dt><dd>Rolling Reserve — reserva técnica de 90 dias.</dd>
          <dt>TPV</dt><dd>Total Payment Volume — volume mensal processado.</dd>
          <dt>3DS</dt><dd>3-D Secure — autenticação adicional do portador (EMV 3DS 2.x).</dd>
          <dt>Liveness</dt><dd>Verificação biométrica de pessoa viva (anti-foto/anti-deepfake).</dd>
          <dt>Facematch</dt><dd>Comparação de selfie com foto do documento oficial.</dd>
          <dt>Documentoscopia</dt><dd>Análise forense de documento (microimpressão, holograma, fonte).</dd>
          <dt>Subfaixa</dt><dd>Categoria de risco V4 (1A, 1B, 2A, 2B, 3A, 3B, 4, 5).</dd>
          <dt>Bloqueio (B01-B10)</dt><dd>Gatilho determinístico que sobrepõe o score numérico.</dd>
          <dt>RLS</dt><dd>Row Level Security — controle de acesso por linha no banco.</dd>
          <dt>Idempotência</dt><dd>Garantia de que processar o mesmo evento N vezes equivale a processá-lo uma vez.</dd>
        </dl>
      </section>

      {/* APPENDIX B */}
      <section className="risk-section risk-break">
        <h1>16. Apêndice B — Mapeamento Regulatório</h1>
        <table className="risk-table">
          <thead><tr><th>Norma</th><th>Aplicação no Modelo</th></tr></thead>
          <tbody>
            <tr><td>Lei 9.613/1998 (PLD)</td><td>Variáveis V19-V24, COAF reporting, monitoramento contínuo</td></tr>
            <tr><td>Circular BCB 3.978/2020</td><td>KYC robusto, identificação UBO, PEP screening (V04, V05)</td></tr>
            <tr><td>Resolução BCB 96/2021 (IPs)</td><td>Sellers que sejam PSP/IP — exige licenciamento (V17)</td></tr>
            <tr><td>Resolução BCB 264/2022 (PIX)</td><td>PIX merchants e intermediários — score base segmento PIX</td></tr>
            <tr><td>LGPD 13.709/2018</td><td>Privacy by design — Seção 14.2</td></tr>
            <tr><td>Bandeiras (Visa, Mastercard, Elo, Amex)</td><td>MCC, threshold de chargeback, antifraude 3DS, monitoramento contínuo</td></tr>
            <tr><td>EMV 3DS 2.x</td><td>Variável V25</td></tr>
            <tr><td>OFAC, ONU, Interpol</td><td>Screening obrigatório — bloqueio B02</td></tr>
          </tbody>
        </table>
      </section>
    </RiskDocShell>
  );
}