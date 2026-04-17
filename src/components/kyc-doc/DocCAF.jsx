import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocCAF() {
  return (
    <S>
      <H1>6. Validação de Identidade — CAF (Combate à Fraude)</H1>

      <P>A CAF é o provedor de verificação biométrica, análise de documentos e screening internacional. O processo combina uma etapa presencial (captura no dispositivo do cliente) com análises automatizadas no backend. A CAF é a ÚNICA fonte com poder de veto biométrico: se detectar fraude confirmada, o caso vai para revisão manual independentemente do score V4.</P>

      <H2>6.1. Captura no Dispositivo do Cliente — SDK CAF</H2>
      <P>O componente <code>CafVerificationStep</code> integra o SDK JavaScript da CAF diretamente no navegador do cliente. O processo é composto por 3 etapas sequenciais, cada uma com um SDK específico:</P>

      <H3>Etapa 1 — Captura do Documento (Frente)</H3>
      <P>O SDK "DocumentDetector" abre a câmera do dispositivo e guia o cliente para posicionar a FRENTE do documento de identidade (RG ou CNH). O SDK automaticamente: (a) detecta o tipo de documento (RG, CNH, passaporte), (b) verifica o enquadramento (documento centralizado, sem cortes), (c) verifica a nitidez (focado, sem borrão), (d) verifica a iluminação (sem reflexos, sem sombras excessivas), (e) captura automaticamente quando todas as condições são atendidas. A imagem resultante é um JPEG em alta resolução (mínimo 1920x1080) que é salvo no servidor como <code>caf_doc_front</code>.</P>

      <H3>Etapa 2 — Captura do Documento (Verso)</H3>
      <P>Mesmo processo do SDK "DocumentDetector" para o VERSO do documento. Captura dados como: número do RG, órgão emissor, data de expedição, nome dos pais (para RG). Salvo como <code>caf_doc_back</code>.</P>

      <H3>Etapa 3 — Prova de Vida (Face Liveness)</H3>
      <P>O SDK "FaceLiveness" realiza a prova de vida ativa do cliente. O processo funciona assim: (a) a câmera frontal é ativada, (b) o SDK pede ao cliente que realize ações como mover a cabeça para os lados, piscar e abrir a boca, (c) durante todo o processo, verifica-se se é uma pessoa REAL (não uma foto, vídeo ou deepfake), (d) ao final, captura uma selfie em alta resolução para o facematch. O SDK implementa: detecção anti-spoofing (rejeta fotos impressas e vídeos), detecção de profundidade (diferencia rosto 3D de imagem 2D), e análise de textura da pele (detecta máscaras de silicone). A imagem é salva como <code>caf_selfie_liveness</code>.</P>

      <InfoBox title="Interface de Acompanhamento" color="blue">
        <p>Durante a prova de vida, o componente <code>CafLivenessOverlay</code> exibe instruções progressivas ao cliente: "Centralize seu rosto" → "Movimente a cabeça lentamente" → "Olhe para a câmera" → "Aguarde a verificação". Se o processo ultrapassar 30 segundos, um botão "Estou com dificuldade" aparece, oferecendo ajuda ou a opção de usar o fallback BDC BigID.</p>
      </InfoBox>

      <H2>6.2. Fallback Automático para BigDataCorp BigID</H2>
      <P>Se o SDK da CAF não conseguir inicializar (erro de CDN, navegador incompatível, câmera não disponível, permissão negada), o sistema ativa automaticamente o componente <code>BdcFallbackVerification</code>. Este fallback usa a API BigID da BigDataCorp como alternativa completa:</P>

      <Table headers={['Etapa Fallback', 'Como funciona', 'Equivalente CAF']} rows={[
        ['Upload de Documento (Frente)', 'O cliente seleciona manualmente a foto da frente do documento via seletor de arquivo do dispositivo. Aceita JPG, JPEG e PNG com até 10MB.', 'Document Detector — Frente'],
        ['Upload de Documento (Verso)', 'Mesmo processo para o verso do documento.', 'Document Detector — Verso'],
        ['Upload de Selfie', 'O cliente tira uma selfie ou seleciona uma foto do rosto. A foto deve mostrar claramente o rosto da pessoa.', 'Face Liveness'],
        ['Documentoscopia BDC', 'As imagens do documento são enviadas para a API BigID que realiza análise forense: detecta adulteração digital, recorte, colagem, Photoshop, montagem, e verifica marcas de segurança do documento.', 'Documentscopy CAF'],
        ['Facematch BDC', 'A selfie é comparada com a foto do documento usando algoritmo de similaridade facial. Retorna um percentual de similaridade (0-100%). Threshold mínimo: 70%.', 'Face Authentication CAF'],
        ['Liveness BDC', 'Analisa a selfie para estimar a probabilidade de ser uma pessoa real (não uma foto-de-foto, tela de computador, ou impressão). Retorna probabilidade de 0 a 100%.', 'Face Liveness CAF'],
      ]} />

      <H2>6.3. Análise Pós-Captura — Backend (cafPostCaptureAnalysis)</H2>
      <P>Assim que as imagens são capturadas (seja pelo SDK CAF ou pelo fallback BDC), o orquestrador automaticamente aciona a análise pós-captura completa. Esta análise roda inteiramente no backend, sem qualquer interação do cliente:</P>

      <H3>Passo 1 — OCR Síncrono (Extração de Dados)</H3>
      <P>As imagens do documento (frente e verso) são enviadas para a API CAF com o serviço <code>ocr_sync</code>. A API extrai: nome completo, CPF, RG, data de nascimento, nome da mãe, data de expedição, órgão emissor. O resultado do OCR é IMEDIATAMENTE cruzado com os dados declarados no questionário: se o nome no documento é "João da Silva" e o nome declarado é "José da Silva", gera-se o flag <code>OCR_NAME_MISMATCH</code>. Se o CPF do documento difere do CPF declarado, gera-se <code>OCR_CPF_MISMATCH</code>. Se a data de nascimento difere, gera-se <code>OCR_BIRTHDATE_MISMATCH</code>. Se o nome da mãe difere, gera-se <code>OCR_MOTHER_MISMATCH</code>. Cada mismatch reduz o score de confiança OCR em 25 pontos (base 100).</P>

      <H3>Passo 2 — Análise Assíncrona Completa</H3>
      <P>Em paralelo ao OCR, a API CAF recebe as imagens para uma bateria de verificações avançadas:</P>
      <Table headers={['Serviço', 'Síncrono/Assíncrono', 'O que verifica em detalhe', 'Red Flag gerado se falhar']} rows={[
        ['documentscopy', 'Assíncrono', 'Análise forense pixel-por-pixel do documento: detecta adulteração digital (Photoshop, GIMP), recorte de foto, colagem de dados, impressão em papel comum (vs papel moeda/segurança), e modificação de texto. Usa IA treinada com milhões de documentos reais e fraudulentos.', 'DOCUMENTSCOPY_FRAUD_DETECTED → caso vai para Revisão Manual.'],
        ['documentLiveness', 'Assíncrono', 'Verifica se o documento apresentado é o ORIGINAL físico (não uma foto de tela, impressão, ou cópia xerox). Analisa textura, reflexos e padrões de moiré típicos de cópias.', 'DOCUMENT_IS_COPY → ponto de atenção.'],
        ['deepfakeDetection', 'Assíncrono', 'Analisa a selfie do liveness procurando sinais de deepfake gerado por IA: artefatos de rendering, inconsistências de iluminação, padrões de GANs, bordas artificiais entre rosto e fundo.', 'DEEPFAKE_DETECTED → caso vai OBRIGATORIAMENTE para Revisão Manual.'],
        ['officialData (Official Biometrics)', 'Assíncrono', 'Compara a selfie do cliente com a base biométrica oficial (quando disponível para o CPF). Retorna um nível de confiança (confidence) de 0 a 1. Nem todos os CPFs têm dados biométricos oficiais.', 'confidence < 0.7 → OFFICIAL_BIOMETRICS_LOW_MATCH.'],
        ['privateFaceset', 'Assíncrono', 'Verifica se o MESMO rosto já foi cadastrado no sistema da PagSmile com um CPF diferente. Detecta reuso de identidade — uma pessoa usando múltiplos CPFs para abrir contas.', 'FACE_REUSE_DIFFERENT_CPF → red flag grave, indica fraude de identidade.'],
        ['sharedFaceset', 'Assíncrono', 'Verifica se o rosto consta na base de fraude compartilhada entre TODOS os clientes da CAF (milhares de empresas). Se um rosto foi marcado como fraudulento em qualquer outro cliente CAF, aparece aqui.', 'FACE_IN_FRAUD_DATABASE → red flag gravíssimo, indica fraudador conhecido.'],
      ]} />

      <H2>6.4. Serviços CAF Adicionais Executados pelo Pipeline</H2>
      <Table headers={['Serviço', 'Função', 'O que retorna', 'Quando é executado']} rows={[
        ['CAF Full Enrichment', 'KYC/KYB completo — segunda fonte independente de dados cadastrais para cross-validation com BDC.', 'Dados cadastrais, sócios, endereços, situação cadastral — tudo via CAF.', 'Step 1.5 do pipeline'],
        ['CAF Credit Analysis', 'Análise de crédito PF/PJ — segunda fonte de score de crédito independente da BDC.', 'Score de crédito CAF, histórico de pagamentos, probabilidade de inadimplência.', 'Step 1.7 do pipeline'],
        ['CAF Screening Internacional', 'Verificação completa de PEP e sanções via base internacional da CAF: OFAC SDN, EU Consolidated, UN Security Council, Interpol Red Notices, CEIS, CNEP.', 'Lista de hits com detalhes: fonte, nome matcheado, score de similaridade, país, lista de origem.', 'Step 2 do pipeline'],
        ['CAF CPF Cross-Validation', 'Consulta dados básicos do CPF via CAF e compara com dados da BDC. Identifica divergências entre as duas fontes.', 'Nome, status CPF, data nascimento, nome da mãe — com flag de divergência para cada campo.', 'Step 2.5 do pipeline (apenas PF)'],
        ['CAF VerifAI Docs', 'Validação automatizada de cada documento enviado usando IA da CAF. Analisa autenticidade, legibilidade, conformidade e sinais de adulteração.', 'APPROVED ou PENDING_REVIEW por documento, com motivos detalhados.', 'Step 2.7 do pipeline'],
        ['CAF Profile Check', 'Verifica se o CPF/CNPJ já tem histórico prévio na base cross-merchant da CAF — se já abriu conta em outro cliente CAF, qual foi o resultado.', 'profileExists (true/false), histórico de transações anteriores, flags de verificações passadas.', 'Step 0.5 do pipeline'],
      ]} />
    </S>
  );
}