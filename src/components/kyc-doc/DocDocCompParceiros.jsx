import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocDocCompParceiros() {
  return (
    <S>
      <H1>18. Doc Compliance Parceiros + Coleta Bancária + Export Pré-KYC</H1>

      <P>Esta seção documenta o módulo operacional de <strong>extração de dados KYC/KYB para parceiros bancários</strong> — a ponte final entre o dossiê interno de compliance (que é altamente detalhado e confidencial) e o formulário Pré-KYC Pagsmile exigido pelos nossos bancos parceiros (Celcoin, Dock, BS2, entre outros). Diferentemente do módulo "Parceiros de Compliance" (Seção 16), que serve para colaboração analítica externa, este módulo serve para <strong>produção de planilha padronizada Pré-KYC</strong> em formato XLSX.</P>

      <InfoBox title="Problema que este módulo resolve">
        <p>Bancos parceiros exigem uma planilha padronizada "Pré-KYC Pagsmile" com: dados cadastrais da empresa, endereço completo, contato, dados bancários (banco/agência/conta), volumetria, atividade, representante legal. Antes deste módulo: um operador manualmente copiava cada campo dos dossiês para uma planilha — processo lento, suscetível a erros e sem rastreabilidade. Agora: um clique gera a planilha com todos os sellers + subsellers hierarquizados, cada linha já validada contra múltiplas fontes.</p>
      </InfoBox>

      <H2>18.1. Tela <code>/DocCompParceiros</code> — Arquitetura</H2>
      <P>A tela é o centro de operação do módulo. Ela agrupa todos os casos aprovados (sellers + subsellers) em uma árvore hierárquica seller → subseller, permite filtros, seleção múltipla e dispara as duas ações principais: (a) gerar link de coleta bancária para clientes que ainda não informaram conta, (b) exportar a planilha Pré-KYC em XLSX.</P>

      <H3>18.1.1. Fontes de Dados Consultadas (Loading)</H3>
      <Table headers={['Fonte', 'O que traz', 'Quando usa']} rows={[
        ['OnboardingCase', 'Casos com status = Aprovado ou em subfaixa aprovável.', 'Base principal da lista.'],
        ['Merchant', 'Nome, CNPJ/CPF, tipo (PF/PJ), parentMerchantId, onboardingStatus.', 'Hidrata cada caso com dados do cliente e identifica pares seller↔subseller.'],
        ['BankDataCollection', 'Banco, agência, conta, dígitos, status (pendente/preenchido/expirado), token.', 'Identifica quais casos já têm conta bancária e quais precisam ser solicitados.'],
        ['QuestionnaireResponse', 'Respostas do questionário (nome, endereço, telefone, volumetria, atividade).', 'Fallback quando Merchant/OnboardingCase não têm o dado.'],
        ['Lead', 'Dados comerciais anteriores ao onboarding (e-mail, telefone, CNPJ, segmento).', 'Fallback final de contato.'],
      ]} />

      <H3>18.1.2. Resolução Determinística de CPF/CNPJ</H3>
      <P>Um dos desafios deste módulo é que o <strong>mesmo cliente pode aparecer com CNPJs inconsistentes</strong> entre os 4 fontes acima (ex: questionário preenchido com CPF do sócio mas cadastro Merchant tem CNPJ da empresa). A função resolve o CPF/CNPJ correto aplicando, em ordem:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li><Bold>Merchant.cpfCnpj</Bold> — sempre prioritário; é o dado oficial do cadastro.</Li>
        <Li><Bold>OnboardingCase.cpfCnpj</Bold> — se o merchant não trouxer, o caso pode ter gravado.</Li>
        <Li><Bold>QuestionnaireResponse</Bold> com questionId de CNPJ ou CPF — varre respostas matchando keywords ("cnpj", "cpf", "documento").</Li>
        <Li><Bold>Lead.cpfCnpj</Bold> — último fallback.</Li>
        <Li><Bold>BDC Enrichment</Bold> — se nada encontrado, aciona <code>bdcEnrichCase</code> apenas para resolver o documento.</Li>
      </ol>
      <P>A validação aplica expressão regular estrita: CNPJ deve ter exatamente 14 dígitos (<code>/^\d{`{14}`}$/</code>), CPF exatamente 11 (<code>/^\d{`{11}`}$/</code>) após remover máscara. Dígitos inválidos (como "00000000000000") são descartados.</P>

      <H3>18.1.3. Hierarquia Seller → Subseller</H3>
      <P>A tela agrupa automaticamente os casos em uma árvore de 2 níveis:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>Sellers (nível raiz):</Bold> casos onde <code>Merchant.parentMerchantId</code> é vazio E <code>OnboardingCase.isSubsellerCase</code> é false. Aparecem como linhas de cabeçalho expansíveis.</Li>
        <Li><Bold>Subsellers (nível filho):</Bold> casos onde <code>Merchant.parentMerchantId</code> aponta para um seller. Ficam indentados sob o seller pai, fundo roxo suave para distinguir visualmente.</Li>
        <Li><Bold>Sellers sem casos ativos mas com subsellers:</Bold> renderizam um placeholder agregador mostrando "X subsellers vinculados" mesmo sem caso próprio pendente — garante que nenhum subseller fique órfão.</Li>
      </ul>
      <P>O filtro hierárquico <code>hierarchyFilter</code> permite: <em>"Sellers + Subsellers"</em> (padrão), <em>"Apenas Sellers"</em> ou <em>"Apenas Subsellers"</em>. Contadores no rodapé mostram totais filtrados.</P>

      <H2>18.2. Link de Coleta Bancária — Fluxo End-to-End</H2>
      <P>Quando o compliance aprova um cliente mas esse cliente ainda não informou os dados da conta bancária que receberá os recebíveis, o módulo gera um link público seguro para o cliente preencher.</P>

      <H3>18.2.1. Geração do Link (Admin)</H3>
      <P>Na tela <code>/DocCompParceiros</code> há um botão "Solicitar Dados Bancários" em cada linha (ou em massa via seleção múltipla). O admin clica → função backend <code>generateBankDataLink</code> é invocada e:</P>
      <ol className="list-decimal ml-6 space-y-1 mb-4">
        <Li>Valida autenticação admin.</Li>
        <Li>Busca ou cria registro <code>BankDataCollection</code> para o caso.</Li>
        <Li>Gera <code>token</code> cripto-seguro (256 bits).</Li>
        <Li>Retorna URL: <code>{`{origin}/BankDataCollect?token=TOKEN`}</code>.</Li>
        <Li>Modal exibe a URL copiável + botões WhatsApp/E-mail de envio direto.</Li>
      </ol>
      <P>Em massa: admin seleciona múltiplos casos e clica "Gerar Links em Lote" → função retorna lista de URLs com identificação de cada caso, pronta para distribuição.</P>

      <H3>18.2.2. Preenchimento pelo Cliente — Página <code>/BankDataCollect</code></H3>
      <P>Página pública que valida o token via função <code>publicBankDataRead</code>. Se token inválido/expirado/já preenchido: exibe mensagem apropriada. Se válido: mostra formulário pré-preenchido com nome e CNPJ do cliente (read-only) e campos editáveis:</P>
      <Table headers={['Campo', 'Tipo', 'Validação']} rows={[
        ['Banco', 'Autocomplete com lista oficial Febraban (380 bancos)', 'Obrigatório. Formato: código + nome.'],
        ['Agência', 'Texto 4-5 dígitos', 'Obrigatório. Sem dígito verificador quando banco não exige.'],
        ['Dígito da Agência', 'Texto 1 dígito', 'Opcional (bancos sem dígito).'],
        ['Conta', 'Texto', 'Obrigatório. Deve ser conta PJ quando titular é PJ.'],
        ['Dígito da Conta', 'Texto 1-2 dígitos', 'Obrigatório.'],
      ]} />
      <P>Ao submeter, função <code>publicBankDataSubmit</code>: (a) valida token novamente, (b) grava os campos, (c) marca <code>status = "preenchido"</code>, <code>filledAt = now</code>, (d) registra IP (<code>clientIp</code>) para auditoria, (e) retorna sucesso. Cliente vê tela de confirmação "Dados recebidos com segurança".</P>

      <H2>18.3. Export XLSX — "Pré-KYC Pagsmile"</H2>
      <P>É a ação final do fluxo. Admin seleciona um lote de casos (tipicamente todos os aprovados de uma semana, ou todos os subsellers de um marketplace) e clica <strong>"Exportar Pré-KYC"</strong>. Função <code>exportPartnerComplianceDoc</code> processa e retorna planilha XLSX.</P>

      <H3>18.3.1. Processamento de Cada Caso</H3>
      <P>Para cada caso selecionado, a função executa:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li><Bold>Resolução do CPF/CNPJ</Bold> pela cadeia de prioridades descrita na 18.1.2.</Li>
        <Li><Bold>Enriquecimento BDC on-demand</Bold> quando faltam endereço/atividade/razão social: aciona <code>bdcEnrichCase</code> em modo "merge" (reutiliza datasets já consultados; só re-consulta o que está vazio). Economiza créditos BDC.</Li>
        <Li><Bold>Parse semântico de respostas</Bold>: para cada resposta do questionário, identifica o campo pela keyword (ex: pergunta com "endereço" → mapeia para coluna "Logradouro"). Validação estrita: CNPJs não podem ser parseados como "número do logradouro".</Li>
        <Li><Bold>Merge por prioridade</Bold> Merchant → Case → Response → Lead → BDC para cada campo da planilha.</Li>
        <Li><Bold>Sanity checks</Bold>: campos obrigatórios vazios são destacados na planilha em vermelho; campos bancários ausentes listados em aba "Pendências".</Li>
      </ol>

      <H3>18.3.2. Colunas da Planilha Pré-KYC</H3>
      <Table headers={['Aba', 'Colunas incluídas']} rows={[
        ['Sellers', 'Tipo (PJ/PF), Razão Social, Nome Fantasia, CNPJ/CPF, Data de Abertura, Situação Cadastral, CNAE Principal, Capital Social, Endereço completo (CEP, logradouro, número, complemento, bairro, cidade, UF), E-mail, Telefone, Nome do Representante Legal, CPF Rep. Legal, Banco, Agência, Dígito Agência, Conta, Dígito Conta, TPV mensal declarado, Ticket médio, Segmento, Score V4, Subfaixa, Data Aprovação Pagsmile.'],
        ['Subsellers', 'Mesmas colunas + coluna extra "Seller Principal (nome + CNPJ)" que identifica o parent.'],
        ['Pendências', 'Lista de casos com dados incompletos (ex: "Sem conta bancária", "Endereço sem número", "CPF rep. legal ausente"). Permite ao admin retornar e completar.'],
        ['Auditoria', 'Metadados da exportação: quem exportou, quando, quantos casos, qual versão do schema Pré-KYC. Usada em auditoria regulatória.'],
      ]} />

      <H3>18.3.3. Formato do Arquivo</H3>
      <P>Gerado via biblioteca <code>xlsx</code> (SheetJS). Nome padrão: <code>pre-kyc-pagsmile_YYYY-MM-DD_HHMM.xlsx</code>. Headers em negrito, colunas com largura otimizada, formatação condicional (vermelho para vazio obrigatório, amarelo para fallback BDC, verde para dado declarado e confirmado).</P>

      <InfoBox title="Por que o formato é Excel (XLSX) e não CSV ou PDF?">
        <p>Os bancos parceiros abrem o arquivo diretamente no Excel, filtram, validam em lote e importam para seus próprios sistemas via copy-paste ou VLOOKUP. CSV perde formatação e dígitos iniciais (contas começando em 0). PDF não permite extração automática. XLSX é o padrão de fato da indústria bancária brasileira para intercâmbio de dados KYC.</p>
      </InfoBox>

      <H2>18.4. Diferença entre este módulo e o "Módulo de Parceiros de Compliance" (Seção 16)</H2>
      <Table headers={['Característica', 'Seção 16 — Parceiros Compliance', 'Seção 18 — Doc Compliance Parceiros (este)']} rows={[
        ['Propósito', 'Colaboração analítica — parceiro analisa dossiê e recomenda decisão.', 'Extração de dados — produz planilha padronizada Pré-KYC para bancos.'],
        ['Entidades principais', 'CompliancePartner, CompliancePartnerUser, PartnerAssignment.', 'BankDataCollection + agregação OnboardingCase + Merchant.'],
        ['Nível de visibilidade', 'Configurável (full / redacted / summary_only).', 'Fixo — apenas campos necessários para Pré-KYC (sem dossiê completo).'],
        ['Quem vê os dados', 'Usuário do parceiro via login próprio em /ComplianceParceiro.', 'Equipe interna Pagsmile exporta e envia XLSX ao banco por canal próprio.'],
        ['Tipo de saída', 'Recomendação clicável dentro do sistema (approve/reject/request_docs/escalate).', 'Arquivo XLSX baixado localmente.'],
        ['Rastreamento', 'PartnerAssignmentActivity — cada visualização/recomendação logada.', 'Auditoria no export + logs de quem baixou e quando.'],
      ]} />

      <H2>18.5. Entidades e Funções do Módulo</H2>
      <Table headers={['Componente', 'Tipo', 'Papel']} rows={[
        ['/DocCompParceiros', 'Página admin', 'Interface principal — lista hierárquica, filtros, seleção múltipla, ações bulk.'],
        ['CaseRow', 'Componente', 'Renderiza cada linha (seller ou subseller) com badges de status, progresso e controles de link.'],
        ['generateBankDataLink', 'Backend function', 'Gera token cripto-seguro e URL /BankDataCollect para o cliente.'],
        ['publicBankDataRead', 'Backend function (pública)', 'Valida token e retorna dados do caso para preenchimento.'],
        ['publicBankDataSubmit', 'Backend function (pública)', 'Grava dados bancários, marca como preenchido, registra IP.'],
        ['BankDataCollection', 'Entidade', 'Armazena token + dados bancários + status de cada solicitação.'],
        ['exportPartnerComplianceDoc', 'Backend function', 'Processa casos, resolve CPF/CNPJ, enriquece BDC, gera XLSX.'],
        ['/BankDataCollect', 'Página pública', 'Formulário que o cliente preenche com os dados da conta.'],
      ]} />

      <InfoBox title="Governança e Métricas de Qualidade">
        <p>• <strong>Taxa de preenchimento do link bancário:</strong> meta ≥ 90% em até 48h da solicitação. • <strong>Casos com dados incompletos na exportação:</strong> meta &lt; 3% do total — valores maiores indicam falhas no enriquecimento BDC ou no parse de respostas. • <strong>Tempo entre aprovação Pagsmile e Pré-KYC entregue ao banco:</strong> meta &lt; 24h. Dashboards internos monitoram essas métricas semanalmente.</p>
      </InfoBox>
    </S>
  );
}