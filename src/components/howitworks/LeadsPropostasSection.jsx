import React from 'react';
import { CircleDot, Inbox, FileText, ClipboardList, Users, Brain, ArrowRight, CheckCircle2, Zap, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LeadsPropostasSection() {
  return (
    <div className="space-y-6">
      {/* Visão Geral */}
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Módulo de Leads & Propostas</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          O módulo de Leads & Propostas é o ponto de entrada comercial da plataforma. Ele cobre todo o ciclo desde a captação inicial do lead
          através de questionários públicos, passando pela qualificação automática por IA, gestão do pipeline comercial com Kanban drag-and-drop,
          até a geração, envio e acompanhamento de propostas comerciais detalhadas com taxas, antecipação e parcelamento.
        </p>
      </div>

      {/* Fluxo de Leads */}
      <div>
        <h4 className="font-bold text-[#002443] mb-3 flex items-center gap-2"><Inbox className="w-4 h-4 text-[#2bc196]" />Fluxo de Captação e Qualificação de Leads</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#2bc196]" />Links de Questionários de Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {[
                  'Dois tipos de questionário: Completo (10 etapas, 50+ campos) e Simplificado (pós-reunião)',
                  'Questionário Completo: dados empresa, contato, modelo de negócio, financeiro, distribuição por bandeira, antecipação, processador atual, taxas praticadas, produtos desejados, confirmação',
                  'Questionário Simplificado: dados básicos + taxas + distribuição — ideal para leads captados em reuniões',
                  'Links rastreáveis com UTM (source, medium, campaign, content)',
                  'Cada link tem métricas: cliques, submissões, conversões, taxa de conversão',
                  'Links específicos por agente comercial para atribuição de performance',
                  'Geração instantânea de código único com um clique',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" />Qualificação por IA (PRISCILA + Lead Qualifier)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-[#002443]/70">
                {[
                  'PRISCILA: IA que analisa automaticamente cada lead submetido',
                  'Gera priscilaQualityScore (0-100): nota geral de qualidade/maturidade',
                  'Classifica priscilaRiskLevel: BAIXO, MÉDIO, ALTO, CRÍTICO, EM_ANÁLISE',
                  'Define priscilaDecisionPath: AUTO_APROVAR, AUTO_COM_FLAG, REVISAO_MANUAL, REJEITAR',
                  'Gera relatório detalhado (priscilaAnalysisReport) com análise de cada dimensão',
                  'Lead Qualifier (agente IA): classifica maturidade como EXCELENTE, BOM, REGULAR, FRACO, INSUFICIENTE',
                  'Score leadQualifierScore (0-100) com relatório detalhado (leadQualifierReport)',
                  'Ambas as análises alimentam o Pipeline Comercial automaticamente',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5"><CircleDot className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline Comercial */}
      <div>
        <h4 className="font-bold text-[#002443] mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#2bc196]" />Pipeline Comercial (Kanban)</h4>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-[#002443]/60 mb-3">Gestão visual de todo o funil comercial com drag-and-drop. 7 colunas representando cada estágio do ciclo de vendas.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
            {[
              { name: 'Leads (Quest. Completo)', color: '#6B7280', statuses: 'questionario_preenchido, analisado_priscila' },
              { name: 'Em Contato + Quest. Simplif.', color: '#F59E0B', statuses: 'em_contato_comercial' },
              { name: 'Proposta Enviada', color: '#3B82F6', statuses: 'proposta_enviada' },
              { name: 'Proposta Aceita', color: '#8B5CF6', statuses: 'proposta_aceita' },
              { name: 'KYC Aprovado', color: '#10B981', statuses: 'kyc_iniciado, kyc_aprovado, kyc_revisao_manual' },
              { name: 'Ativado', color: '#059669', statuses: 'ativado' },
              { name: 'Perdido', color: '#EF4444', statuses: 'perdido, proposta_recusada' },
            ].map((col, i) => (
              <div key={i} className="bg-white rounded-lg p-2 border border-slate-200">
                <div className="h-1 rounded-full mb-1.5" style={{ backgroundColor: col.color }} />
                <p className="text-[10px] font-bold text-[#002443]">{col.name}</p>
                <p className="text-[8px] text-[#002443]/40 mt-0.5">Status: {col.statuses}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-1 text-xs text-[#002443]/70">
            {[
              'Cada card mostra: nome, CNPJ, tipo negócio, TPV mensal, score PRISCILA, tempo no estágio',
              'Métricas por coluna: TPV/mês, TPV/ano, Receita estimada/mês e /ano (2.5%)',
              'Métricas globais: total leads, TPV total, receita potencial',
              'Gráfico de conversão entre estágios com taxas percentuais',
              'Alertas de aging: leads parados há mais de X dias em cada estágio',
              'Filtros por período (semana/mês/3m/6m/12m/lifetime) e busca por nome/CNPJ',
              'Drag-and-drop atualiza status automaticamente + cria registro de atividade (LeadActivity)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Propostas */}
      <div>
        <h4 className="font-bold text-[#002443] mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#2bc196]" />Gestão de Propostas — 3 Modalidades</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-2 bg-emerald-50/50">
              <CardTitle className="text-sm flex items-center gap-2">🎯 Proposta Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[#002443]/70 space-y-1.5 pt-3">
              {[
                'Vinculada a um Lead — dados pré-preenchidos',
                'Taxas editáveis por bandeira × 4 faixas de parcelamento',
                'Antecipação, PIX, boleto, fees, setup configuráveis',
                'Preview em tempo real lado a lado',
                'Seletor de Parceiro com validação de limites',
                'Simulador de Rentabilidade (drawer)',
                'Versionamento (V1, V2, V3...) com lineage',
                'Link público com aceite/recusa/contraproposta',
                'Notificação Slack ao visualizar/aceitar',
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2 bg-blue-50/50">
              <CardTitle className="text-sm flex items-center gap-2">📋 Proposta Padrão por Segmento</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[#002443]/70 space-y-1.5 pt-3">
              {[
                'LINKS RÁPIDOS: 6 cards prontos (E-commerce, Educação, Infoprodutos, SaaS, Gateway, Marketplace)',
                'Copiar link com um clique — sem criar proposta manualmente',
                '6 propostas pré-criadas com taxas oficiais Pagsmile',
                'Campo isDefaultForSegment marca a proposta padrão de cada segmento',
                'Sem dados de cliente — apenas taxas e nome do segmento',
                'Auto-preenchimento de taxas ao selecionar segmento',
                'Página pública premium: taxas, parcelas, simulador, CTA',
                'Export Buttons (PDF/Print)',
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />{item}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-cyan-200">
            <CardHeader className="pb-2 bg-cyan-50/50">
              <CardTitle className="text-sm flex items-center gap-2">💳 Proposta PIX</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[#002443]/70 space-y-1.5 pt-3">
              {[
                'Taxa PIX: percentual (%) ou fixo (R$)',
                'TPV Mínimo Garantido (3 meses)',
                'Versionamento (V1, V2...) e duplicação',
                '4 KPIs: Total, Ativas, Aceitas, Recusadas',
                'Seleção rápida de lead (últimos 6)',
                'Validação obrigatória: nome, CNPJ, taxa PIX',
                'Link público com aceite/recusa',
                'Alerta de propostas próximas da expiração',
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />{item}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Acompanhamento & Ações (Comum a Todas)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[#002443]/70 space-y-1.5">
              {[
                'Status: Rascunho, Enviada, Visualizada, Aceita, Recusada, Expirada, Contraproposta',
                'Tracking de visualizações: notifica quando o cliente abre a proposta',
                'Aceite digital: cliente aceita pelo link público com termos',
                'Recusa com motivo: cliente pode registrar o motivo da recusa',
                'Contraproposta: cliente pode sugerir alterações de taxas',
                'Histórico completo de versões e interações por proposta',
                'Expiração automática: propostas expiram após a validade',
                'Integração com Contratos: proposta aceita → geração de contrato',
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Métricas & Exportação</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-[#002443]/70 space-y-1.5">
              {[
                'ProposalMetrics: 6 métricas (total, rascunho, enviadas, aceitas, recusadas, expiradas)',
                'Propostas por Empresa: visão consolidada por CNPJ',
                'Alerta visual de propostas ≤3 dias para expirar',
                'Rentabilidade: receita MDR + antecipação + fees vs custo parceiro',
                'Export Buttons: impressão e PDF para propostas públicas',
                'CSV export para listas de leads',
              ].map((item, i) => (
                <p key={i} className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 text-[#2bc196] mt-0.5 shrink-0" />{item}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Entidades do módulo */}
      <div className="bg-[#002443]/5 rounded-xl p-4 border border-[#002443]/10">
        <h5 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Entidades do Módulo Leads & Propostas</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { name: 'Lead', desc: '30+ campos: e-mail, nome, CNPJ, telefone, status (11 valores), tipo negócio, scores PRISCILA/Lead Qualifier/Risco Avançado, TPV, ticket médio, protocolo, origem, introducer' },
            { name: 'LeadActivity', desc: 'Registro de atividades: contato iniciado, status alterado, proposta enviada, follow-up agendado, nota adicionada' },
            { name: 'Proposal', desc: 'Proposta personalizada: leadId, taxas por bandeira × 4 faixas, antecipação, PIX, boleto, status (8), versionamento, link público' },
            { name: 'StandardProposal', desc: 'Proposta padrão: templateName, segment (6 opções), isDefaultForSegment, taxas fixas auto-preenchidas, tokenPublico, dados empresa opcionais' },
            { name: 'PixProposal', desc: 'Proposta PIX: leadId, taxa PIX (% ou R$ fixo), TPV mínimo (3 meses), status (8), versionamento V1/V2/V3, link público' },
            { name: 'OnboardingLink', desc: 'Link rastreável: código único, tipo (LEAD_QUESTIONNAIRE, LEAD_SIMPLIFICADO, KYC, PROPOSAL), UTMs, métricas, expiração' },
            { name: 'QuestionarioSimplificado', desc: 'Questionário simplificado pós-reunião: dados empresa, taxas atuais, distribuição por bandeira' },
            { name: 'InternalCommercialQuestionnaire', desc: 'Questionário interno de reunião: dados empresa, negócio, volume, desafios, taxas atuais' },
            { name: 'MessageTemplate', desc: 'Templates de mensagem para comunicação automatizada: WhatsApp, e-mail, SMS' },
          ].map((e, i) => (
            <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
              <Badge className="bg-[#002443] text-white font-mono text-[10px] border-0 mb-1">{e.name}</Badge>
              <p className="text-[10px] text-[#002443]/60 leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}