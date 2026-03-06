import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CircleDot, AlertTriangle, FileText, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MERCHANT_SECTIONS = [
  { id: 'A', title: 'Seção A – Informações Cadastrais (KYC)', objective: 'Coletar dados básicos de identificação da empresa para validação junto a bureaus, Receita Federal e provedores externos.', questions: [
    { order: 1, text: 'Razão Social', type: 'TEXT', required: true, risk: 0 },
    { order: 2, text: 'Nome Comercial / Nome Fantasia', type: 'TEXT', required: true, risk: 0 },
    { order: 3, text: 'Tipo de Empresa', type: 'SELECT', required: true, risk: 0, options: ['Sociedade Limitada', 'S.A.', 'EIRELI', 'MEI', 'Outro'] },
    { order: 4, text: 'Endereço Comercial Registrado (CNPJ)', type: 'TEXT', required: true, risk: 0 },
    { order: 5, text: 'Data Início da Atividade', type: 'DATE', required: true, risk: 0 },
    { order: 6, text: 'Endereço de demais Escritórios Físicos', type: 'TEXT', required: false, risk: 0 },
    { order: 7, text: 'Quantidade de Colaboradores', type: 'SELECT', required: true, risk: 0, options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  ]},
  { id: 'B', title: 'Seção B – Atividade e Negócios', objective: 'Entender o modelo de negócio, escopo e volumes operacionais para classificação de risco e validação cruzada com dados externos.', questions: [
    { order: 8, text: 'Escopo do Negócio (descrição detalhada)', type: 'TEXT', required: true, risk: 0 },
    { order: 9, text: 'Volume de transações financeiras (qtd/mês)', type: 'NUMBER', required: true, risk: 0 },
    { order: 10, text: 'Volume operacional por mês (R$)', type: 'NUMBER', required: true, risk: 0 },
    { order: 11, text: 'Ticket médio das transações (R$)', type: 'NUMBER', required: true, risk: 0 },
    { order: 12, text: 'Site Corporativo', type: 'TEXT', required: true, risk: 0 },
    { order: 13, text: 'Descrição detalhada de produtos/serviços oferecidos', type: 'TEXT', required: true, risk: 0 },
    { order: 14, text: 'Mercados de atuação', type: 'MULTI_SELECT', required: true, risk: 10, options: ['Brasil', 'América Latina', 'EUA/Europa', 'Ásia', 'Outros'] },
    { order: 15, text: 'Formas de pagamento aceitas', type: 'MULTI_SELECT', required: true, risk: 0, options: ['Pix', 'Cartão Crédito', 'Cartão Débito', 'Boleto', 'Transferência', 'Cripto', 'Outros'] },
    { order: 16, text: 'Moedas operadas', type: 'MULTI_SELECT', required: true, risk: 15, options: ['BRL', 'USD', 'EUR', 'Outras'] },
    { order: 17, text: 'Canais de venda', type: 'MULTI_SELECT', required: true, risk: 0, options: ['E-commerce', 'App', 'Loja física', 'Link de pagamento', 'Marketplace', 'Outros'] },
  ]},
  { id: 'C', title: 'Seção C – Estrutura Societária e UBO', objective: 'Identificar sócios, beneficiários finais (UBO) e PEPs para verificação em listas restritivas e compliance com regras BACEN.', questions: [
    { order: 18, text: 'A empresa possui um UBO (Beneficiário Final) com mais de 25% de participação societária?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 19, text: 'Se sim, informe os dados do UBO', type: 'TEXT', required: false, risk: 0 },
    { order: 20, text: 'Sócio(s) ou membro(s) do conselho são Pessoas Expostas Politicamente (PEP)?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 21, text: 'Se sim, informe detalhes', type: 'TEXT', required: false, risk: 0 },
    { order: 22, text: 'Algum sócio ou UBO possui histórico de processo judicial, falência, ou sanção?', type: 'BOOLEAN', required: true, risk: 40 },
    { order: 23, text: 'Se sim, informe detalhes', type: 'TEXT', required: false, risk: 0 },
  ]},
  { id: 'D', title: 'Seção D – Representante Legal', objective: 'Coletar dados do responsável legal que assina contratos e responde pela empresa perante a PagSmile.', questions: [
    { order: 24, text: 'Nome completo do Representante Legal', type: 'TEXT', required: true, risk: 0 },
    { order: 25, text: 'CPF do Representante Legal', type: 'CPF_CNPJ', required: true, risk: 0 },
    { order: 26, text: 'Cargo do Representante Legal', type: 'TEXT', required: true, risk: 0 },
    { order: 27, text: 'Data de nascimento', type: 'DATE', required: true, risk: 0 },
    { order: 28, text: 'Nacionalidade', type: 'TEXT', required: true, risk: 10 },
    { order: 29, text: 'E-mail do Representante Legal', type: 'EMAIL', required: true, risk: 0 },
    { order: 30, text: 'Telefone do Representante Legal', type: 'PHONE', required: true, risk: 0 },
  ]},
  { id: 'E', title: 'Seção E – Compliance e PLD/FT (Prevenção à Lavagem de Dinheiro)', objective: 'Avaliar a maturidade dos controles de PLD/FT da empresa, incluindo políticas internas, treinamentos e procedimentos obrigatórios.', questions: [
    { order: 31, text: 'A empresa possui uma Política interna de PLD/FT?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 32, text: 'Se sim, data da última atualização', type: 'DATE', required: false, risk: 0 },
    { order: 33, text: 'A empresa realiza treinamento periódico de PLD/FT para colaboradores?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 34, text: 'Se sim, qual a frequência?', type: 'SELECT', required: false, risk: 0, options: ['Mensal', 'Trimestral', 'Semestral', 'Anual'] },
    { order: 35, text: 'Existe um responsável designado para PLD/FT (Compliance Officer)?', type: 'BOOLEAN', required: true, risk: 25 },
    { order: 36, text: 'Se sim, informe o nome e cargo', type: 'TEXT', required: false, risk: 0 },
  ]},
  { id: 'F', title: 'Seção F – Sanções e Restrições', objective: 'Verificar exposição a listas de sanções internacionais e conflitos regulatórios.', questions: [
    { order: 37, text: 'A empresa ou seus sócios constam em alguma lista de sanções (OFAC, ONU, UE)?', type: 'BOOLEAN', required: true, risk: 50 },
    { order: 38, text: 'Se sim, detalhes', type: 'TEXT', required: false, risk: 0 },
    { order: 39, text: 'A empresa já foi alvo de investigação por lavagem de dinheiro ou financiamento ao terrorismo?', type: 'BOOLEAN', required: true, risk: 50 },
    { order: 40, text: 'Se sim, detalhes', type: 'TEXT', required: false, risk: 0 },
    { order: 41, text: 'A empresa possui operações ou clientes em países com alto risco (GAFI grey/black list)?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 42, text: 'Se sim, especifique os países', type: 'TEXT', required: false, risk: 0 },
  ]},
  { id: 'G', title: 'Seção G – Licenciamento e Regulação', objective: 'Verificar se a empresa opera em atividade regulada e se possui as devidas licenças.', questions: [
    { order: 43, text: 'A atividade é regulada por algum órgão (BACEN, CVM, SUSEP, etc.)?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 44, text: 'Se sim, qual órgão e número da licença?', type: 'TEXT', required: false, risk: 0 },
    { order: 45, text: 'A empresa possui certificação PCI DSS?', type: 'BOOLEAN', required: true, risk: 10 },
    { order: 46, text: 'Se sim, nível e data de validade', type: 'TEXT', required: false, risk: 0 },
  ]},
  { id: 'H', title: 'Seção H – Histórico e Reputação', objective: 'Avaliar histórico de fraudes, chargebacks e reputação da empresa no mercado.', questions: [
    { order: 47, text: 'A empresa já teve conta ou credenciamento cancelado/recusado por outra instituição de pagamento?', type: 'BOOLEAN', required: true, risk: 40 },
    { order: 48, text: 'Se sim, detalhes', type: 'TEXT', required: false, risk: 0 },
    { order: 49, text: 'Taxa média de chargeback (últimos 6 meses)', type: 'TEXT', required: true, risk: 25 },
    { order: 50, text: 'Já recebeu notificação de bandeiras (Visa/Mastercard) sobre fraude/chargeback?', type: 'BOOLEAN', required: true, risk: 40 },
  ]},
  { id: 'I', title: 'Seção I – KYC e Controles', objective: 'Avaliar os controles internos de KYC (Know Your Customer) e due diligence aplicados pela empresa nos seus próprios clientes.', questions: [
    { order: 51, text: 'Opera com produto restrito? (vide Anexo I)', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 52, text: 'Se sim, especifique', type: 'TEXT', required: false, risk: 0 },
    { order: 53, text: 'Opera com produto proibido? (vide Anexo I)', type: 'BOOLEAN', required: true, risk: 50 },
    { order: 54, text: 'Se sim, especifique', type: 'TEXT', required: false, risk: 0 },
    { order: 55, text: 'Implementa Diligência Aprimorada (EDD) para clientes de maior risco?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 56, text: 'Se sim, descreva o EDD', type: 'TEXT', required: false, risk: 0 },
    { order: 57, text: 'Procedimentos específicos para clientes de alto risco?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 58, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 59, text: 'Momento e procedimento de coleta e verificação do documento de identificação', type: 'TEXT', required: true, risk: 10 },
  ]},
  { id: 'J', title: 'Seção J – Monitoramento de Transações e Listas Restritivas', objective: 'Avaliar a capacidade da empresa de monitorar e reportar transações suspeitas conforme normas BACEN.', questions: [
    { order: 60, text: 'Triagem com listas restritivas (OFAC, COAF, ONU, UE)?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 61, text: 'Se sim, especifique', type: 'TEXT', required: false, risk: 0 },
    { order: 62, text: 'Monitoramento para transações suspeitas?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 63, text: 'Se sim, descreva o sistema', type: 'TEXT', required: false, risk: 0 },
    { order: 64, text: 'Frequência de revisão das listas', type: 'SELECT', required: true, risk: 15, options: ['Diária', 'Semanal', 'Mensal', 'Trimestral'] },
    { order: 65, text: 'Procedimento para reporte ao COAF de operações suspeitas', type: 'TEXT', required: true, risk: 20 },
  ]},
  { id: 'K', title: 'Seção K – Governança e Perfil Operacional', objective: 'Avaliar a estrutura de governança, perfil operacional e transacional para cálculo de risco.', questions: [
    { order: 66, text: 'Existe comitê ou área dedicada a compliance?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 67, text: 'Se sim, descreva a estrutura', type: 'TEXT', required: false, risk: 0 },
    { order: 68, text: 'Qual a periodicidade de revisão das políticas PLD/KYC?', type: 'SELECT', required: true, risk: 10, options: ['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Sob demanda'] },
    { order: 69, text: 'Existe canal de denúncias?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 70, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 71, text: 'Volume mensal total (R$)', type: 'SELECT', required: true, risk: 10, options: ['Até R$50k', 'R$50k-500k', 'R$500k-2M', 'R$2M-10M', '10M+'] },
    { order: 72, text: 'Quantidade total de transações/mês', type: 'SELECT', required: true, risk: 5, options: ['Até 500', '501-5k', '5k-50k', '50k-100k', '100k+'] },
    { order: 73, text: 'Ticket médio (R$)', type: 'SELECT', required: true, risk: 10 },
    { order: 74, text: 'Taxa de chargeback (últimos 3 meses)', type: 'TEXT', required: true, risk: 25 },
    { order: 75, text: 'Taxa de reembolso/cancelamento', type: 'SELECT', required: true, risk: 15, options: ['<1%', '1-3%', '3-5%', '5%+'] },
    { order: 76, text: 'Canais de atendimento ao cliente', type: 'MULTI_SELECT', required: true, risk: 5, options: ['E-mail', 'Chat', 'Telefone', 'WhatsApp', 'Portal'] },
    { order: 77, text: 'SLA de resposta ao cliente', type: 'SELECT', required: true, risk: 5, options: ['Até 2h', '2-8h', '8-24h', '24-48h', '48h+'] },
  ]},
  { id: 'DECL', title: 'PARTE IV – Declarações e Assinatura', objective: 'Colher declarações formais do responsável, consentimento para verificações e dados de quem preencheu o questionário.', questions: [
    { order: 78, text: 'Declaro informações verdadeiras e completas', type: 'BOOLEAN', required: true, risk: 0 },
    { order: 79, text: 'Declaro que a empresa não atua em atividades proibidas', type: 'BOOLEAN', required: true, risk: 0 },
    { order: 80, text: 'Autorizo a PagSmile a verificar dados junto a bureaus', type: 'BOOLEAN', required: true, risk: 0 },
    { order: 81, text: 'Nome do Responsável pelo preenchimento', type: 'TEXT', required: true, risk: 0 },
    { order: 82, text: 'Cargo', type: 'TEXT', required: true, risk: 0 },
    { order: 83, text: 'E-mail do responsável', type: 'EMAIL', required: true, risk: 0 },
    { order: 84, text: 'Data', type: 'DATE', required: true, risk: 0 },
  ]},
];

const GATEWAY_EXTRA_SECTIONS = [
  { id: 'K-GW', title: 'Seção K – Governança, Due Diligence de Sub-Merchants e Perfil Transacional (Gateway)', objective: 'Avaliar a estrutura de governança, os processos de cadastro e monitoramento de sub-merchants, segurança de dados de cartão e perfil transacional do gateway.', questions: [
    { order: 66, text: 'Comitê ou área dedicada a compliance?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 67, text: 'Se sim, descreva a estrutura', type: 'TEXT', required: false, risk: 0 },
    { order: 68, text: 'Periodicidade de revisão das políticas PLD/KYC', type: 'SELECT', required: true, risk: 10 },
    { order: 69, text: 'Canal de denúncias?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 70, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 71, text: 'Quantidade total de sub-merchants ativos', type: 'SELECT', required: true, risk: 10 },
    { order: 72, text: 'Realiza due diligence (KYC) dos sub-merchants antes do cadastro?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 73, text: 'Se sim, descreva o processo', type: 'TEXT', required: false, risk: 0 },
    { order: 74, text: 'Possui contrato padrão com sub-merchants?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 75, text: 'Se sim, descreva as cláusulas de compliance', type: 'TEXT', required: false, risk: 0 },
    { order: 76, text: 'Proíbe categorias de alto risco nos sub-merchants?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 77, text: 'Se sim, quais?', type: 'TEXT', required: false, risk: 0 },
    { order: 78, text: 'Verifica sub-merchants contra listas restritivas?', type: 'BOOLEAN', required: true, risk: 25 },
    { order: 79, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 80, text: 'Monitora transações de sub-merchants?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 81, text: 'Se sim, descreva o sistema', type: 'TEXT', required: false, risk: 0 },
    { order: 82, text: 'Gatilhos automáticos para bloqueio de sub-merchants?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 83, text: 'Se sim, quais?', type: 'TEXT', required: false, risk: 0 },
    { order: 84, text: 'Frequência de re-verificação dos sub-merchants', type: 'SELECT', required: true, risk: 15 },
    { order: 85, text: 'Possui certificação PCI DSS válida?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 86, text: 'Se sim, nível e validade', type: 'TEXT', required: false, risk: 0 },
    { order: 87, text: 'Realiza pen-tests regulares?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 88, text: 'Procedimentos para proteção de dados de cartão', type: 'TEXT', required: true, risk: 20 },
    { order: 89, text: 'Política de resposta a incidentes de segurança', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 90, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 91, text: 'Volume mensal total (R$)', type: 'SELECT', required: true, risk: 10 },
    { order: 92, text: 'Quantidade de transações/mês', type: 'SELECT', required: true, risk: 5 },
    { order: 93, text: 'Ticket médio (R$)', type: 'SELECT', required: true, risk: 10 },
    { order: 94, text: 'Taxa de chargeback (últimos 3 meses)', type: 'TEXT', required: true, risk: 25 },
    { order: 95, text: 'Taxa de reembolso/cancelamento', type: 'SELECT', required: true, risk: 15 },
  ]},
];

const MARKETPLACE_EXTRA_SECTIONS = [
  { id: 'K-MK', title: 'Seção K/M – Governança, Perfil do Marketplace e Monitoramento de Sellers', objective: 'Avaliar a estrutura de governança, processos de cadastro e onboarding de sellers, contratos, monitoramento contínuo e perfil transacional do marketplace.', questions: [
    { order: 66, text: 'Comitê ou área dedicada a compliance?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 67, text: 'Se sim, descreva a estrutura', type: 'TEXT', required: false, risk: 0 },
    { order: 68, text: 'Periodicidade de revisão das políticas PLD/KYC', type: 'SELECT', required: true, risk: 10 },
    { order: 69, text: 'Canal de denúncias?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 70, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 71, text: 'Número total de sellers ativos', type: 'SELECT', required: true, risk: 10 },
    { order: 72, text: 'Realiza due diligence (KYC) dos sellers antes do cadastro?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 73, text: 'Se sim, descreva o processo', type: 'TEXT', required: false, risk: 0 },
    { order: 74, text: 'Quais documentos coleta dos sellers?', type: 'MULTI_SELECT', required: true, risk: 10 },
    { order: 75, text: 'Verifica sellers contra listas restritivas?', type: 'BOOLEAN', required: true, risk: 25 },
    { order: 76, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 77, text: 'Possui contrato padrão com sellers?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 78, text: 'Contrato inclui cláusula de PLD/FT e compliance?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 79, text: 'Contrato prevê direito de auditoria?', type: 'BOOLEAN', required: true, risk: 10 },
    { order: 80, text: 'Principais segmentos dos sellers', type: 'MULTI_SELECT', required: true, risk: 5 },
    { order: 81, text: 'Proporção PF vs PJ dos sellers', type: 'SELECT', required: true, risk: 5 },
    { order: 82, text: 'Sellers internacionais?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 83, text: 'Se sim, países', type: 'TEXT', required: false, risk: 0 },
    { order: 84, text: 'Sellers em atividades reguladas?', type: 'BOOLEAN', required: true, risk: 15 },
    { order: 85, text: 'Se sim, quais e licenças verificadas?', type: 'TEXT', required: false, risk: 0 },
    { order: 86, text: 'Proíbe categorias de alto risco nos sellers?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 87, text: 'Se sim, quais?', type: 'TEXT', required: false, risk: 0 },
    { order: 88, text: 'Sellers em atividades classificadas como restritas (Anexo I)?', type: 'BOOLEAN', required: true, risk: 25 },
    { order: 89, text: 'Se sim, quais?', type: 'TEXT', required: false, risk: 0 },
    { order: 90, text: 'Taxa de sellers recusados no cadastro (%)', type: 'TEXT', required: true, risk: 10 },
    { order: 91, text: 'Possui processo formal de offboarding de sellers?', type: 'BOOLEAN', required: true, risk: 10 },
    { order: 92, text: 'Se sim, descreva', type: 'TEXT', required: false, risk: 0 },
    { order: 93, text: 'Quantidade de sellers bloqueados/encerrados nos últimos 12 meses', type: 'TEXT', required: true, risk: 10 },
    { order: 94, text: 'Monitora transações dos sellers?', type: 'BOOLEAN', required: true, risk: 30 },
    { order: 95, text: 'Se sim, como?', type: 'TEXT', required: false, risk: 0 },
    { order: 96, text: 'Gatilhos automáticos para revisão/bloqueio de sellers?', type: 'BOOLEAN', required: true, risk: 20 },
    { order: 97, text: 'Se sim, quais?', type: 'TEXT', required: false, risk: 0 },
    { order: 98, text: 'Frequência de re-verificação/revisão dos sellers', type: 'SELECT', required: true, risk: 15 },
    { order: 99, text: 'Volume mensal total (R$)', type: 'SELECT', required: true, risk: 10 },
    { order: 100, text: 'Quantidade de transações/mês', type: 'SELECT', required: true, risk: 5 },
    { order: 101, text: 'Ticket médio (R$)', type: 'SELECT', required: true, risk: 10 },
    { order: 102, text: 'Taxa de chargeback (últimos 3 meses)', type: 'TEXT', required: true, risk: 25 },
    { order: 103, text: 'Taxa de reembolso/cancelamento', type: 'SELECT', required: true, risk: 15 },
  ]},
];

const MERCHANT_DOCS = [
  { label: 'RG ou CNH dos sócios / Representante Legal', required: true },
  { label: 'Selfie dos sócios com documento (prova de vida via CAF)', required: true },
  { label: 'Comprovante de Endereço da Empresa (últimos 90 dias)', required: true },
  { label: 'Comprovante de Endereço do Representante Legal (últimos 90 dias)', required: true },
  { label: 'Cartão CNPJ atualizado', required: true },
  { label: 'Contrato Social e Última Alteração (ou Estatuto + Ata para S.A.)', required: true },
  { label: 'Balanço Patrimonial do último exercício (assinado)', required: true },
  { label: 'DRE do último exercício (assinado)', required: true },
  { label: 'Balancete mais recente', required: true },
  { label: 'Política de PLD/FT', required: true },
  { label: 'Política de KYC', required: true },
  { label: 'Demonstrativos financeiros 3 exercícios (preferencialmente auditados)', required: false },
  { label: 'Licença do órgão regulador (se atividade regulada)', required: false },
];

const GATEWAY_DOCS = [
  ...MERCHANT_DOCS.slice(0, 11),
  { label: 'Demonstrativos financeiros 3 exercícios (preferencialmente auditados)', required: true },
  { label: 'Licença do órgão regulador (se atividade regulada)', required: false },
  { label: 'Certificação PCI DSS válida', required: true },
  { label: 'Contrato padrão com sub-merchants', required: true },
  { label: 'Política de onboarding/cadastro de sub-merchants', required: true },
  { label: 'Relatório/amostra base ativa sub-merchants (top 10)', required: true },
  { label: 'Política de monitoramento/prevenção a fraudes', required: true },
  { label: 'Organograma da área de compliance', required: false },
];

const MARKETPLACE_DOCS = [
  ...MERCHANT_DOCS.slice(0, 11),
  { label: 'Demonstrativos financeiros 3 exercícios (preferencialmente auditados)', required: true },
  { label: 'Licença do órgão regulador (se atividade regulada)', required: false },
  { label: 'Contrato ou Termos de Adesão com sellers', required: true },
  { label: 'Política de onboarding/cadastro de sellers', required: true },
  { label: 'Relatório/amostra base ativa sellers (top 10)', required: true },
];

function SectionBlock({ section, isOpen, onToggle }) {
  const totalRisk = section.questions.reduce((s, q) => s + q.risk, 0);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge className="bg-[#002443] text-white border-0 text-[10px] shrink-0">{section.id}</Badge>
          <span className="text-xs font-bold text-[#002443] truncate">{section.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{section.questions.length} perguntas</Badge>
          {totalRisk > 0 && <Badge className="bg-red-50 text-red-600 border-0 text-[10px] shrink-0">Risco: {totalRisk}pts</Badge>}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <div className="bg-blue-50 rounded-lg p-2.5 my-2 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Objetivo da Seção</p>
            <p className="text-xs text-blue-700 leading-relaxed">{section.objective}</p>
          </div>
          <div className="space-y-1">
            {section.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs">
                <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5 font-mono w-7 justify-center">{q.order}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-[#002443]/80">{q.text}</span>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    <Badge className="text-[8px] bg-slate-100 text-slate-600 border-0">{q.type}</Badge>
                    {q.required && <Badge className="text-[8px] bg-green-50 text-green-700 border-0">Obrigatório</Badge>}
                    {!q.required && <Badge className="text-[8px] bg-slate-50 text-slate-400 border-0">Opcional</Badge>}
                    {q.risk > 0 && <Badge className="text-[8px] bg-red-50 text-red-600 border-0 flex items-center gap-0.5"><AlertTriangle className="w-2 h-2" />riskWeight: {q.risk}</Badge>}
                    {q.options && <Badge className="text-[8px] bg-purple-50 text-purple-600 border-0">{q.options.length} opções</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsList({ docs, title }) {
  return (
    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
      <h5 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />{title} ({docs.filter(d => d.required).length} obrigatórios / {docs.filter(d => !d.required).length} opcionais)
      </h5>
      <div className="space-y-1">
        {docs.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <Badge className={`text-[8px] shrink-0 mt-0.5 border-0 ${d.required ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
              {d.required ? 'OBRIG.' : 'OPC.'}
            </Badge>
            <span className="text-[#002443]/70">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestionnaireSection() {
  const [openSections, setOpenSections] = useState({});
  const [activeTab, setActiveTab] = useState('merchant');

  const toggle = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const tabs = [
    { id: 'merchant', label: 'Merchant', badge: '84 perguntas', badgeColor: 'bg-blue-100 text-blue-700', desc: 'Risco BAIXO • 12 seções • 13 docs', risk: 'BAIXO', sections: MERCHANT_SECTIONS, docs: MERCHANT_DOCS },
    { id: 'gateway', label: 'Gateway', badge: '111 perguntas', badgeColor: 'bg-red-100 text-red-700', desc: 'Risco ALTO • 12 seções + K expandida • 19 docs', risk: 'ALTO', sections: [...MERCHANT_SECTIONS.filter(s => !['K', 'DECL'].includes(s.id)), ...GATEWAY_EXTRA_SECTIONS, MERCHANT_SECTIONS.find(s => s.id === 'DECL')], docs: GATEWAY_DOCS },
    { id: 'marketplace', label: 'Marketplace', badge: '110 perguntas', badgeColor: 'bg-amber-100 text-amber-700', desc: 'Risco MÉDIO • 12 seções + K/M expandida • 16 docs', risk: 'MÉDIO', sections: [...MERCHANT_SECTIONS.filter(s => !['K', 'DECL'].includes(s.id)), ...MARKETPLACE_EXTRA_SECTIONS, MERCHANT_SECTIONS.find(s => s.id === 'DECL')], docs: MARKETPLACE_DOCS },
  ];

  const active = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setOpenSections({}); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.id ? 'bg-[#002443] text-white border-[#002443]' : 'bg-white text-[#002443] border-slate-200 hover:border-[#2bc196]'}`}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              <Badge className={`${tab.badgeColor} border-0 text-[10px]`}>{tab.badge}</Badge>
            </div>
            <p className={`text-[10px] mt-0.5 ${activeTab === tab.id ? 'text-white/60' : 'text-[#002443]/40'}`}>{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Info card */}
      <div className={`rounded-xl p-4 border ${active.risk === 'ALTO' ? 'bg-red-50 border-red-200' : active.risk === 'MÉDIO' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Hash className="w-4 h-4" />
          <h4 className="font-bold text-sm">Compliance - {active.label}</h4>
          <Badge className={`${active.risk === 'ALTO' ? 'bg-red-200 text-red-800' : active.risk === 'MÉDIO' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'} border-0 text-[10px]`}>Risco: {active.risk}</Badge>
        </div>
        <p className="text-xs text-[#002443]/60">
          {active.id === 'merchant' && 'Venda Direta ao Consumidor Final (E-commerce, Link de Pagamento, Plataformas). Seções A–K + Declarações. Limiares: Auto-Aprovar > 80 | Revisão Manual 30–80 | Auto-Rejeitar < 30.'}
          {active.id === 'gateway' && 'Gateways de Pagamento (Infoprodutos, Dropshipping, E-commerce, Cursos). Seções A–J + K expandida (Due Diligence Sub-Merchants + Segurança Cartão + Transacional) + Declarações. Limiares: Auto-Aprovar > 85 | Revisão Manual 40–85 | Auto-Rejeitar < 40.'}
          {active.id === 'marketplace' && 'Plataformas Marketplace com Sellers Cadastrados. Seções A–J + K/M expandida (Onboarding Sellers + Contratos + Monitoramento + Transacional) + Declarações. Limiares: Auto-Aprovar > 80 | Revisão Manual 35–80 | Auto-Rejeitar < 35.'}
        </p>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#002443]">Todas as Seções e Perguntas</h4>
          <button onClick={() => {
            const allOpen = {};
            active.sections.forEach(s => allOpen[s.id] = true);
            setOpenSections(allOpen);
          }} className="text-[10px] text-[#2bc196] font-bold hover:underline">Expandir todas</button>
        </div>
        {active.sections.map(section => (
          <SectionBlock key={section.id} section={section} isOpen={openSections[section.id]} onToggle={() => toggle(section.id)} />
        ))}
      </div>

      {/* Documents */}
      <DocumentsList docs={active.docs} title={`Documentos Obrigatórios — ${active.label}`} />
    </div>
  );
}