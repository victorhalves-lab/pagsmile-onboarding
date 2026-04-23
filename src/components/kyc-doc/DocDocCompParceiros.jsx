import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Seção 18 — Doc Compliance Parceiros
 * Documentação MICROSCÓPICA extraída do código fonte real em:
 *   functions/exportPartnerComplianceDoc.js, functions/generateBankDataLink.js,
 *   functions/publicBankDataRead.js, functions/publicBankDataSubmit.js,
 *   pages/DocCompParceiros.jsx, pages/BankDataCollect.jsx,
 *   components/doc-comp-parceiros/CaseRow.jsx
 * Nenhuma linha aqui é especulação — se o código mudar, atualize aqui primeiro.
 */
export default function DocDocCompParceiros() {
  return (
    <S>
      <H1>18. Doc Compliance Parceiros — Coleta Bancária + Export "Pré KYC Pagsmile"</H1>

      <P>Esta seção descreve o módulo administrativo que produz o artefato final do ciclo de onboarding: a planilha <Bold>Pré KYC Pagsmile</Bold>, enviada aos bancos parceiros (BaaS) para abertura da conta operacional do cliente. Cada campo citado, cada ordem de prioridade, cada validação e cada sanitização foi extraída diretamente do código fonte listado no cabeçalho deste arquivo.</P>

      <InfoBox title="O problema que o módulo resolve">
        <p>Antes: um operador abria cada dossiê no CRM, copiava 15 campos (razão social, CNPJ, endereço, dados bancários…) para uma planilha Excel manual, um cliente por linha. Processo lento, sujeito a erro de digitação e sem rastreabilidade. Agora: um clique na tela <code>/DocCompParceiros</code> gera o XLSX completo, com endereço enriquecido automaticamente via BigDataCorp quando os dados declarados estão incompletos, e com dados bancários coletados via link público enviado ao cliente.</p>
      </InfoBox>

      <H2>18.1. Tela <code>/DocCompParceiros</code> — Carga de Dados</H2>

      <H3>18.1.1. Entidades consultadas no carregamento</H3>
      <P>A função <code>load()</code> do componente executa, em sequência, as queries:</P>
      <Table headers={['Ordem', 'Entidade', 'Consulta exata', 'Uso']} rows={[
        ['1', <code key="1">OnboardingCase</code>, <code key="2">list('-updated_date', 1000)</code>, 'Até 1.000 casos mais recentes.'],
        ['2', <code key="3">Merchant</code>, <span key="4"><code>get(merchantId)</code> paralelo</span>, 'Hidrata cada caso com razão social, CNPJ, tipo (PF/PJ), parentMerchantId.'],
        ['3', <code key="5">Merchant (pais)</code>, <code key="6">get(parentMerchantId)</code>, 'Busca parents de subsellers cujo merchant pai não veio no passo 2.'],
        ['4', <code key="7">BankDataCollection</code>, <code key="8">list('-created_date', 2000)</code>, 'Últimos 2.000 registros bancários. Indexados por onboardingCaseId (mais recente prevalece).'],
      ]} />

      <H3>18.1.2. Resolução assíncrona de CPF/CNPJ (<code>resolveDocsForCases</code>)</H3>
      <P>Um mesmo caso pode ter o documento em fontes diferentes — e nem todas concordam. O código executa em duas passadas:</P>
      <P><Bold>Passada 1 — determinística e síncrona.</Bold> Para cada caso:</P>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li>Classifica PJ se <code>Merchant.type === 'PJ'</code> OU <code>Merchant.cpfCnpj</code>/<code>OnboardingCase.cpfCnpj</code> tem 14 dígitos.</Li>
        <Li>Se PJ: prioriza <code>Merchant.cpfCnpj</code> válido, cai para <code>OnboardingCase.cpfCnpj</code>.</Li>
        <Li>Se PF: usa <code>onlyDigits(Merchant.cpfCnpj || OnboardingCase.cpfCnpj)</code>.</Li>
      </ol>
      <P><Bold>Passada 2 — enriquecimento em chunks de 10, paralelo.</Bold> Só para casos PJ ainda sem CNPJ válido:</P>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li>Busca <code>QuestionnaireResponse.filter({'{ onboardingCaseId }'})</code>. Varre cada resposta onde o texto da pergunta bate <code>/\bcnpj\b/</code> E <code>onlyDigits(valueText).length === 14</code> → adota.</Li>
        <Li>Sem sucesso: <code>Lead.filter({'{ email: merchant.email }'})</code>. Primeiro Lead com <code>cpfCnpj</code> de 14 dígitos → adota.</Li>
      </ol>
      <P>A UI atualiza progressivamente via <code>setResolvedDocs</code> a cada chunk. Casos que permanecem sem CNPJ válido mostram badge vermelho <code>"CNPJ não encontrado"</code>.</P>

      <H3>18.1.3. Hierarquia Seller → Subseller (função <code>groups</code>)</H3>
      <P>Agrupamento em memória com dois <code>Map</code>:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li><code>sellerCaseByMerchantId</code>: um case por seller, prevalecendo o mais recente por <code>updated_date</code>.</Li>
        <Li><code>subsellerCasesBySellerId</code>: cases com <code>merchant.isSubseller + parentMerchantId</code>, agrupados sob o parent.</Li>
      </ul>
      <Table headers={['Cenário', 'Condição', 'Renderização']} rows={[
        ['Seller com subsellers', 'Merchant tem case + tem subsellers', 'Linha expansível (ChevronDown) + sub-linhas com indent.'],
        ['Seller sem case mas com subs', 'parentMerchantId aparece mas pai não tem OnboardingCase no escopo', 'Placeholder "Seller sem caso visível" + contador de subsellers, sem checkbox.'],
        ['Hierarchy filter', 'hierarchyFilter = sellers | subsellers | all', 'Remove grupos ou zera arrays conforme escolha.'],
      ]} />

      <H3>18.1.4. Filtros da interface</H3>
      <Table headers={['Filtro', 'Valores', 'Efeito']} rows={[
        ['Status (statusFilter)', 'auto | all | Aprovado | Manual | Recusado | Docs Solicitados | Em Processamento | Pendente', '"auto" (default) mostra Aprovado + Manual — os quais são auto-selecionados.'],
        ['Hierarquia', 'all | sellers | subsellers', 'Filtra a árvore inteira ou esvazia seller/subseller conforme escolha.'],
        ['Busca (search)', 'Texto livre', 'Match case-insensitive em CNPJ/CPF resolvido, companyName, fullName, email.'],
      ]} />

      <H2>18.2. Geração de Link — <code>generateBankDataLink</code> (admin-only)</H2>

      <H3>18.2.1. Fluxo exato da função backend</H3>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li><Bold>Auth:</Bold> <code>base44.auth.me()</code> + check <code>user.role === 'admin'</code>. Não-admin → 403.</Li>
        <Li><Bold>Input:</Bold> <code>onboardingCaseId</code> (único) OU <code>onboardingCaseIds</code> (array bulk). Normalizado para array.</Li>
        <Li><Bold>Idempotência por caso:</Bold> busca último <code>BankDataCollection</code> ordenado por <code>created_date</code>. Reutiliza se existir E <code>status !== 'expirado'</code>.</Li>
        <Li><Bold>Token:</Bold> <code>crypto.getRandomValues(new Uint8Array(24))</code> → 48 chars hex (192 bits de entropia).</Li>
        <Li><Bold>Persistência inicial:</Bold> cria <code>BankDataCollection</code> com <code>status: 'pendente'</code>, <code>linkSentAt: new Date().toISOString()</code>, <code>cpfCnpj</code> copiado do caso.</Li>
        <Li><Bold>URL:</Bold> <code>{'${origin}/BankDataCollect?token=${record.token}'}</code> — <code>origin</code> lido de <code>req.headers.get('origin') || referer</code>, trailing slash removido.</Li>
      </ol>

      <InfoBox title="Entropia do token (192 bits)">
        <p>24 bytes aleatórios via Web Crypto API, codificados em hex (48 chars). Espaço: 2^192 ≈ 6,3 × 10^57. Para comparação, UUID v4 tem 122 bits. A validação mínima no backend (<code>publicBankDataRead</code>/<code>publicBankDataSubmit</code>) exige <code>token.length &gt;= 20</code> — qualquer token mais curto é rejeitado com 400.</p>
      </InfoBox>

      <H3>18.2.2. Retorno e comportamento frontend</H3>
      <Table headers={['Campo retornado', 'Uso']} rows={[
        ['caseId', 'Match com caso da lista.'],
        ['token', '48 hex chars; usado por copyLink().'],
        ['status', 'pendente | preenchido | expirado — estado do BankDataCollection.'],
        ['url', `${'${origin}'}/BankDataCollect?token=XXX`],
        ['banco, agencia, conta, filledAt', 'Reutilizados quando status=preenchido, para exibição.'],
      ]} />
      <P>No frontend: quando <code>caseIds.length === 1</code>, link vai para <code>navigator.clipboard.writeText</code> + toast "Link copiado!". Bulk: toast com a contagem — "Use Copiar em cada linha para enviar".</P>

      <H2>18.3. Página Pública <code>/BankDataCollect</code></H2>

      <H3>18.3.1. Fluxo de carregamento</H3>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li>Lê <code>?token=</code> do <code>window.location.search</code>. Sem token: "Link inválido ou incompleto".</Li>
        <Li>Invoca <code>callPublicFunction('publicBankDataRead', {'{ token }'})</code> — SDK-free, zero auth.</Li>
        <Li>Backend valida <code>token.length &gt;= 20</code>, registro existe → retorna <code>status, cpfCnpj, companyName (Merchant.companyName || fullName), filled</code>.</Li>
        <Li>Se <code>status === 'preenchido'</code>: form populado e tela de sucesso read-only.</Li>
      </ol>

      <H3>18.3.2. Campos do formulário</H3>
      <Table headers={['Campo', 'Obrigatório', 'Limite (sanitize)', 'Placeholder']} rows={[
        ['Banco', 'Sim', '80 chars', '"Ex: 237 - Bradesco, 341 - Itaú" (texto livre)'],
        ['Agência', 'Sim', '10 chars', '—'],
        ['Dígito Agência', 'Não', '2 chars', '—'],
        ['Conta', 'Sim', '20 chars', '—'],
        ['Dígito Conta', 'Não', '2 chars', '—'],
      ]} />

      <InfoBox title="O campo Banco é texto livre, não autocomplete Febraban">
        <p>O código atual aceita banco como string livre até 80 chars. Não há lista Febraban integrada no frontend nem validação de código no backend. O placeholder sugere o formato <em>"237 - Bradesco"</em>, mas qualquer texto é aceito. Se operacionalmente for necessário código Febraban padronizado, é uma melhoria futura — não estado atual.</p>
      </InfoBox>

      <H3>18.3.3. <code>publicBankDataSubmit</code> — validações e persistência</H3>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li><code>token.length &gt;= 20</code> → senão 400 <code>invalid_token</code>.</Li>
        <Li>Busca <code>BankDataCollection.filter({'{ token }'})</code>. Sem registro → 404 <code>not_found</code>.</Li>
        <Li>Se <code>status === 'expirado'</code> → 410 <code>expired</code>.</Li>
        <Li>Sanitização: <code>v.trim().slice(0, max)</code> com limites 80/10/2/20/2.</Li>
        <Li>Obrigatórios: <code>banco</code>, <code>agencia</code>, <code>conta</code>. Faltando → 400 <code>missing_required_fields</code>.</Li>
        <Li>IP do cliente: <code>x-forwarded-for</code> → <code>x-real-ip</code> → string vazia, truncado a 60 chars.</Li>
        <Li>Update com dados + <code>status: 'preenchido'</code> + <code>filledAt: now</code> + <code>clientIp</code>.</Li>
      </ol>
      <P>Retorno: <code>{'{ ok: true }'}</code>. UI mostra tela "Recebemos seus dados!" com recap read-only e disclaimer LGPD.</P>

      <H2>18.4. Export "Pré KYC Pagsmile" — <code>exportPartnerComplianceDoc</code></H2>
      <P>Invocada pelo botão "Exportar XLSX". Processa um caso por vez em loop serial. Para cada caso:</P>

      <H3>18.4.1. Montagem da linha por caso</H3>
      <ol className="list-decimal ml-6 space-y-1 mb-3">
        <Li><code>OnboardingCase.get(caseId)</code>; se não existe, pula sem lançar.</Li>
        <Li>Se tem <code>merchantId</code>, busca <code>Merchant.get</code>. Null-safe.</Li>
        <Li><code>QuestionnaireResponse.filter({'{ onboardingCaseId }'})</code> → passa pelo <code>buildAnswerIndex</code>.</Li>
        <Li>Classifica PJ/PF (critérios de 18.1.2).</Li>
        <Li>Resolve doc via <code>resolveCnpj</code> (PJ) ou <code>onlyDigits</code> direto (PF).</Li>
        <Li>Busca último <code>BankDataCollection</code> com <code>status: 'preenchido'</code>, ordenado por <code>-filledAt</code>, limite 1.</Li>
        <Li>Monta linha via <code>pick(...vals)</code> — retorna primeiro valor não-vazio, descartando <code>—</code>, <code>-</code> e strings vazias.</Li>
      </ol>

      <H3>18.4.2. Parser das respostas (<code>buildAnswerIndex</code>) — regras anti-falso-positivo</H3>
      <P>Cada pergunta é analisada por regex aplicada ao texto (lowercased). Valor extraído em ordem: <code>valueText</code> → <code>valueNumber</code> → <code>valueArray.join</code>:</P>
      <Table headers={['Campo', 'Regex ACEITA', 'Regex REJEITA', 'Validação']} rows={[
        ['cnpj', <code key="1">/\bcnpj\b/</code>, '—', 'onlyDigits(val).length === 14'],
        ['razaoSocial', <code key="2">/raz[aã]o\s*social/</code>, '—', '—'],
        ['nomeFantasia', <code key="3">/nome\s*fantasia/</code>, '—', '—'],
        ['cep', <code key="4">/\bcep\b/</code>, '—', '—'],
        ['rua', <code key="5">/(logradouro|^rua|endere[çc]o\s*.*rua|endere[çc]o\s*completo)/</code>, '—', '—'],
        ['numero', <code key="6">/(n[úu]mero)/ + /(endere[çc]o|logradouro|casa|im[óo]vel|pr[ée]dio)/</code>, <code key="7">/(s[óo]cios?|funcion[áa]rios?|cnpj|cpf|transa|telefone|celular)/ RECUSA</code>, 'Precisa das positivas E ausência das negativas.'],
        ['bairro', <code key="8">/bairro/</code>, '—', '—'],
        ['cidade', <code key="9">/(cidade|munic[íi]pio)/</code>, '—', '—'],
        ['estado', <code key="10">/\b(estado|uf)\b/</code>, '—', '—'],
      ]} />

      <InfoBox title="Por que a regra do campo 'número' é tão defensiva">
        <p>Sem os filtros negativos, perguntas como <em>"Quantos sócios?"</em>, <em>"Número de funcionários?"</em>, <em>"Número do seu CNPJ?"</em> ou <em>"Número de telefone"</em> seriam parseadas erroneamente como número do endereço, e acabariam na célula "Numero" da planilha. Os bancos parceiros receberiam um telefone no lugar do número da rua. Essa linha do parser é produto de bugs reais encontrados em versões anteriores e corrigidos cirurgicamente.</p>
      </InfoBox>

      <H3>18.4.3. Resolução de CNPJ (<code>resolveCnpj</code>)</H3>
      <Table headers={['Prioridade', 'Fonte', 'Condição', 'source retornado']} rows={[
        ['1', 'Merchant.cpfCnpj', 'isCnpj (14 dígitos)', 'merchant'],
        ['2', 'OnboardingCase.cpfCnpj', 'isCnpj', 'case'],
        ['3', 'Respostas do questionário', 'answers.cnpj válido (regex + 14 dig)', 'answers'],
        ['4', 'Lead por email do merchant', 'Lead.cpfCnpj é CNPJ válido', 'lead_email'],
        ['5', 'Lead pelo merchant.cpfCnpj', 'Lead.cpfCnpj é CNPJ válido', 'lead_cpf'],
        ['6', 'Nenhuma das anteriores', '—', 'none (linha exportada sem CNPJ)'],
      ]} />

      <H3>18.4.4. Enriquecimento BDC on-demand</H3>
      <P>Dispara somente quando as 3 condições batem: <Bold>(i)</Bold> caso é PJ, <Bold>(ii)</Bold> CNPJ válido resolvido, <Bold>(iii)</Bold> pelo menos um dos campos <code>Razão Social, Nome Fantasia, CEP, Rua, Cidade, Estado</code> está vazio.</P>
      <Table headers={['Parâmetro', 'Valor']} rows={[
        ['URL', 'https://plataforma.bigdatacorp.com.br/empresas'],
        ['Headers', 'AccessToken + TokenId (secrets BDC_ACCESS_TOKEN, BDC_TOKEN_ID)'],
        ['Datasets', <code key="ds">basic_data,addresses</code>],
        ['Query', <code key="q">{`doc{CNPJ}`}</code>],
      ]} />
      <P>Endereço preferido: aquele com <code>Type</code> contendo "MATRIZ" ou "PRINCIPAL"; senão, <code>addresses[0]</code>. Campos BDC preenchem <strong>só slots vazios</strong> — jamais sobrescrevem dados declarados. Quando BDC é acionado, <code>source</code> vira <code>merchant+bdc</code> (visível no debug).</P>

      <H3>18.4.5. Sanity checks pós-merge</H3>
      <P>Três validações defensivas antes do XLSX:</P>
      <ul className="list-disc ml-6 space-y-1 mb-3">
        <Li>Se <code>row['CEP']</code> é CNPJ (14 dígitos) → zera.</Li>
        <Li>Se <code>row['Numero']</code> é CNPJ → zera.</Li>
        <Li>Se <code>row['Rua']</code> é CNPJ → zera.</Li>
      </ul>
      <P>Esses checks cobrem o último 1% de casos em que parser + BDC produziram contaminação cruzada de colunas. Preferem célula vazia a célula com dado claramente errado.</P>

      <H3>18.4.6. Rastreamento de pendências bancárias</H3>
      <P>Qualquer linha com <code>Banco</code>, <code>Agencia</code> ou <code>Conta</code> vazios é empurrada para <code>missingBankData[]</code> contendo <code>{'{ caseId, companyName, cpfCnpj }'}</code>. O frontend exibe no toast: <em>"N registros exportados. X sem dados bancários — gere links para eles."</em></P>

      <H2>18.5. Formato da Planilha — aba única "Pré KYC"</H2>

      <H3>18.5.1. Ordem exata das colunas (código fonte)</H3>
      <Table headers={['#', 'Header', 'Origem — cadeia de fallback']} rows={[
        ['1', 'CPF/ CNPJ', 'Documento resolvido (cadeia 18.4.3) ou CPF direto do Merchant.'],
        ['2', 'Nome Fantasia', 'Merchant.companyName → answers.nomeFantasia → BDC.TradeName'],
        ['3', 'Razão Social', 'Merchant.fullName → answers.razaoSocial → BDC.OfficialName'],
        ['4', 'Agencia', 'BankDataCollection.agencia (só preenchido)'],
        ['5', 'Digito', 'BankDataCollection.digitoAgencia'],
        ['6', 'Conta', 'BankDataCollection.conta'],
        ['7', 'Digito Conta', 'BankDataCollection.digitoConta'],
        ['8', 'Banco', 'BankDataCollection.banco'],
        ['9', 'Email', 'Merchant.email (sem fallback)'],
        ['10', 'CEP', 'answers.cep → BDC (formatado 00000-000)'],
        ['11', 'Cidade', 'answers.cidade → BDC.City'],
        ['12', 'Rua', 'answers.rua → BDC.Street || AddressLine1'],
        ['13', 'Numero', 'answers.numero → BDC.Number'],
        ['14', 'Bairro', 'answers.bairro → BDC.Neighborhood'],
        ['15', 'Estado', 'answers.estado → BDC.State'],
      ]} />

      <H3>18.5.2. Formato do arquivo</H3>
      <Table headers={['Propriedade', 'Valor']} rows={[
        ['Biblioteca', 'npm:xlsx@0.18.5 (SheetJS)'],
        ['Sheet name', 'Pré KYC (única)'],
        ['bookType', 'xlsx'],
        ['Nome do arquivo', <code key="fn">PreKYC-Pagsmile-YYYY-MM-DD.xlsx</code>],
        ['Encoding', 'ArrayBuffer → Uint8Array → base64 (fileBase64 na resposta)'],
        ['Download frontend', 'atob → Blob → URL.createObjectURL → anchor.click → revokeObjectURL'],
      ]} />

      <InfoBox title="O que a planilha NÃO tem (e por quê)">
        <p>• Nenhuma aba adicional (Pendências, Auditoria) — o código gera só a sheet "Pré KYC"; pendências vão no toast.<br/>• Sem formatação condicional — output XLSX "puro", sem cellStyles.<br/>• Sem coluna "Seller Principal" nas linhas de subseller — hierarquia é visual na tela, não no export.<br/>Se algum desses recursos for necessário, é evolução futura, não estado atual.</p>
      </InfoBox>

      <H2>18.6. Resposta da função — payload completo</H2>
      <Table headers={['Campo', 'Tipo', 'Uso']} rows={[
        ['fileBase64', 'string', 'Planilha binária encoded — decodificada no front para Blob.'],
        ['fileName', 'string', 'Nome sugerido no download.'],
        ['rowCount', 'number', 'Quantos casos viraram linha (pode ser < ids enviados se case.get() falhou).'],
        ['missingBankData', 'array', 'Casos exportados sem banco/agencia/conta — para follow-up.'],
        ['debug', 'array', 'Auditoria por caso: { caseId, finalDoc, docSource, isPJ }.'],
      ]} />

      <H2>18.7. Diferença entre este módulo e o Módulo de Parceiros de Compliance (Seção 16)</H2>
      <Table headers={['Aspecto', 'Seção 16 — Parceiros Compliance', 'Seção 18 — este módulo']} rows={[
        ['Propósito', 'Parceiro externo ANALISA o dossiê e recomenda decisão.', 'Equipe interna EXTRAI dados estruturados para enviar ao banco BaaS.'],
        ['Entidades centrais', 'CompliancePartner, CompliancePartnerUser, PartnerAssignment.', 'BankDataCollection + leitura de OnboardingCase/Merchant/QuestionnaireResponse/Lead.'],
        ['Quem acessa', 'Usuário do parceiro em /ComplianceParceiro, visibilidade configurável.', 'Admin Pagsmile em /DocCompParceiros — user.role === "admin".'],
        ['Saída', 'Recomendação persistida em PartnerAssignment.recommendation.', 'Arquivo XLSX base64 baixado localmente; nada persistido além dos BankDataCollection criados.'],
        ['BDC consumido', 'Indireto via dossiê (parceiro não dispara BDC).', 'Fire-on-demand — só PJ com CNPJ válido E campos faltando.'],
        ['Rastreamento', 'PartnerAssignmentActivity registra cada ação.', 'Array debug por caso no response; sem log persistente da exportação.'],
      ]} />

      <H2>18.8. Artefatos do módulo</H2>
      <Table headers={['Arquivo', 'Tipo', 'Responsabilidade']} rows={[
        [<code key="a">pages/DocCompParceiros.jsx</code>, 'Página admin', 'Tabela hierárquica + filtros + seleção múltipla.'],
        [<code key="b">components/doc-comp-parceiros/CaseRow.jsx</code>, 'Componente', 'Linha (seller/subseller/placeholder) com badges e ações.'],
        [<code key="c">functions/generateBankDataLink.js</code>, 'Backend admin', 'Cria/reusa BankDataCollection, token 192-bit, retorna URLs.'],
        [<code key="d">functions/publicBankDataRead.js</code>, 'Backend público', 'Valida token, retorna identificação mínima.'],
        [<code key="e">functions/publicBankDataSubmit.js</code>, 'Backend público', 'Sanitiza, valida, persiste, captura IP.'],
        [<code key="f">functions/exportPartnerComplianceDoc.js</code>, 'Backend admin', 'Loop de casos, resolução CNPJ, BDC, XLSX.'],
        [<code key="g">pages/BankDataCollect.jsx</code>, 'Página pública', 'Form SDK-free via callPublicFunction.'],
        [<code key="h">BankDataCollection (entity)</code>, 'Schema', 'onboardingCaseId, merchantId, cpfCnpj, token, status, linkSentAt, filledAt, banco, agencia, digitoAgencia, conta, digitoConta, clientIp.'],
      ]} />

      <InfoBox title="Ponto de atenção operacional">
        <p>A função <code>generateBankDataLink</code> reusa o registro existente apenas se <code>status !== 'expirado'</code>. Não há rotina automatizada de expiração — um token permanece válido indefinidamente até que alguém marque manualmente como expirado. Se o requisito regulatório for "links expiram em N dias", precisa-se criar uma automação agendada que rode <code>BankDataCollection.update(..., {'{ status: "expirado" }'})</code> para registros com <code>linkSentAt &lt; now - N dias</code>. Hoje isso não existe.</p>
      </InfoBox>
    </S>
  );
}