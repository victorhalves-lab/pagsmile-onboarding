import React from 'react';
import { CircleDot, ArrowRight, FileText, Stamp, Eye, Send, CheckCircle2, XCircle, Pencil, AlertTriangle, Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PageDoc = ({ name, route, description, purpose, access, funcionalidades, subAbas, fluxo, entidadesAfetadas }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
    <div className="bg-gradient-to-r from-[#002443] to-[#003a66] p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-bold text-sm">{name}</h4>
        <div className="flex items-center gap-2">
          <Badge className="bg-white/10 text-white/80 border-0 text-[10px] font-mono">{route}</Badge>
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] border-0 text-[10px]">{access}</Badge>
        </div>
      </div>
      <p className="text-white/60 text-xs mt-1">{description}</p>
    </div>
    <div className="p-4 space-y-4">
      <div>
        <h5 className="text-xs font-bold text-[#002443] uppercase tracking-wider mb-1.5">🎯 Para que serve</h5>
        <p className="text-xs text-[#002443]/70 leading-relaxed">{purpose}</p>
      </div>
      <div>
        <h5 className="text-xs font-bold text-[#002443] uppercase tracking-wider mb-1.5">⚙️ Funcionalidades ({funcionalidades.length})</h5>
        <ul className="space-y-1">
          {funcionalidades.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#002443]/70">
              <CircleDot className="w-2.5 h-2.5 text-[#2bc196] mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      {subAbas?.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#002443] uppercase tracking-wider mb-1.5">📑 Seções Internas ({subAbas.length})</h5>
          <div className="space-y-1.5">
            {subAbas.map((s, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <p className="text-[11px] text-[#002443]/80">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {fluxo?.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#002443] uppercase tracking-wider mb-2">🔀 Fluxograma</h5>
          <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-200 space-y-3">
            {fluxo.map((f, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-bold text-[#002443]/50 uppercase">{f.titulo}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {f.steps.map((s, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                        s.type === 'action' ? 'bg-[#2bc196]/10 text-[#2bc196] border-[#2bc196]/20' :
                        s.type === 'decision' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        s.type === 'result' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>{s.text}</div>
                      {j < f.steps.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {entidadesAfetadas?.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#002443] uppercase tracking-wider mb-1.5">🗄️ Entidades</h5>
          <div className="flex flex-wrap gap-1">
            {entidadesAfetadas.map((e, i) => (
              <Badge key={i} className="bg-[#002443] text-white font-mono text-[9px] border-0">{e}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default function ContratosSection() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Módulo de Contratos — Catálogo Microscópico</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Ciclo completo de contratos: geração automática a partir de proposta aceita, editor com 6 seções, preview formatado, link público e assinatura digital.
        </p>
      </div>

      <PageDoc
        name="Gestão de Contratos"
        route="/GestaoContratos"
        access="Admin"
        description="Lista de todos os contratos com 6 status, filtros, métricas por status e link para editor."
        purpose="Visão geral de todos os contratos gerados, permitindo filtrar por status, buscar por nome/CNPJ/código e acessar rapidamente o editor de cada contrato."
        funcionalidades={[
          '6 cards de métricas: Total, Pré-gerado, Em Revisão, Pronto, Enviado, Assinado',
          'Filtros: busca por nome/CNPJ/código + filtro de status (6 opções)',
          'Lista de contratos em cards: ícone, nome cliente, badge status colorido, código, CNPJ, data criação',
          'Indicador de campos pendentes (⚠️ X campos) e preenchidos (✓ Y campos) por contrato',
          'Click em card navega para EditorContrato?id=ID',
          'Status: pre_generated (pré-gerado pela backend function), under_review (em revisão comercial), ready (pronto para envio), sent (enviado ao cliente), signed (assinado), cancelled (cancelado)',
          'Backend function preGenerateContract: gera contrato automaticamente quando proposta é aceita, pré-preenchendo dados do Lead/Proposal/Merchant'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo 1 — Contrato gerado automaticamente',
            steps: [
              { type: 'result', text: 'Proposta aceita pelo cliente' },
              { type: 'result', text: 'Backend preGenerateContract dispara' },
              { type: 'result', text: 'Contract criado status=pre_generated' },
              { type: 'result', text: 'Dados pré-preenchidos do Lead + Proposal' },
              { type: 'result', text: 'Aparece em GestaoContratos' },
              { type: 'action', text: 'Comercial abre para completar' },
            ]
          },
          {
            titulo: 'Fluxo 2 — Buscar e filtrar',
            steps: [
              { type: 'action', text: 'Digita nome ou CNPJ no campo de busca' },
              { type: 'action', text: 'Seleciona status desejado' },
              { type: 'result', text: 'Lista filtrada em tempo real' },
              { type: 'action', text: 'Clica no card do contrato' },
              { type: 'result', text: 'Navega → EditorContrato' },
            ]
          }
        ]}
        entidadesAfetadas={['Contract', 'Proposal', 'Lead', 'Merchant']}
      />

      <PageDoc
        name="Editor de Contrato"
        route="/EditorContrato?id=ID"
        access="Admin"
        description="Editor completo do contrato com 6 seções de formulário, preview em tempo real e gestão de status. Pré-preenche dados da proposta aceita."
        purpose="Permitir ao time comercial/jurídico completar, revisar e finalizar contratos antes de enviar ao cliente. Inclui todos os campos jurídicos, SLAs, reservas de risco, multas e testemunhas."
        funcionalidades={[
          'Seção 1 — Cliente (ClienteForm): razão social, CNPJ, endereço completo (rua, cidade, UF, CEP), e-mail, telefone, representante legal (nome, cargo, CPF)',
          'Seção 2 — Módulos (ModulosForm): toggles para módulos contratados (conta pagamento, subadquirência cartão, PIX recebimentos, PIX pagamentos, boleto, gateway), campo texto livre para módulos adicionais',
          'Seção 3 — Preços (PrecosForm): taxas de cartão por bandeira × 4 faixas, débito, PIX (% ou fixo), boleto, antifraude, fee transação, antecipação, mínimo garantido 3 meses, setup, alerta pré-chargeback',
          'Seção 4 — SLAs (SLAsForm): uptime (%), tempo resposta suporte, SLAs por severidade (crítico/alto/médio/baixo), prazo liquidação (D+N), dados bancários (instituição, agência, conta), tarifas (manutenção, saque, TED, cartão)',
          'Seção 5 — Anexos e Cláusulas (ContratoAnexos): reserva risco PIX (% e dias), reserva risco cartão (% e dias + liberação parcial), chargeback (taxa R$ e threshold %), duração contrato (meses), multa rescisão (% e valor máx), dados Pagsmile (representante, cargo, CPF), testemunhas (2 nomes + CPFs), cláusulas customizadas',
          'Seção 6 — Preview (PreviewContrato): renderização completa do contrato com ConteudoContrato (27 cláusulas jurídicas formatadas)',
          'Indicador de campos pendentes vs preenchidos',
          'Botões: Salvar Rascunho, Marcar como Pronto, Enviar ao Cliente, botão de preview',
          'Ao enviar: atualiza status para "sent", registra sentDate',
          'Link público: /ContratoPublico?code=CODE para assinatura digital'
        ]}
        subAbas={[
          'Cliente: dados completos do contratante e representante legal',
          'Módulos: serviços de pagamento contratados',
          'Preços: todas as taxas comerciais (espelhadas da proposta)',
          'SLAs: níveis de serviço, dados bancários, tarifas',
          'Anexos: reservas de risco, chargeback, multas, duração, testemunhas',
          'Preview: visualização formatada com 27 cláusulas jurídicas'
        ]}
        fluxo={[
          {
            titulo: 'Fluxo — Completar e enviar contrato',
            steps: [
              { type: 'action', text: 'Abre contrato pré-gerado' },
              { type: 'action', text: 'Completa campos pendentes (endereço, SLAs, etc)' },
              { type: 'action', text: 'Revisa no Preview' },
              { type: 'action', text: 'Marca como "Pronto"' },
              { type: 'result', text: 'Status → ready' },
              { type: 'action', text: 'Clica "Enviar ao Cliente"' },
              { type: 'result', text: 'Status → sent + sentDate' },
              { type: 'result', text: 'Link público gerado para assinatura' },
            ]
          }
        ]}
        entidadesAfetadas={['Contract', 'AuditLog']}
      />

      <PageDoc
        name="Contrato Público (Assinatura)"
        route="/ContratoPublico?code=CODE"
        access="Público"
        description="Página pública onde o cliente visualiza e assina digitalmente o contrato."
        purpose="Permitir que o cliente revise o contrato completo e assine digitalmente, com validação de dados e aceite dos termos."
        funcionalidades={[
          'Carrega contrato pelo publicLinkCode',
          'ConteudoContrato: renderização completa com 27 cláusulas jurídicas',
          'AssinaturaForm: formulário de confirmação de identidade + aceite digital',
          'Ao assinar: status → signed + signedDate',
          'Responsivo e imprimível',
          'Design premium institucional'
        ]}
        subAbas={[]}
        fluxo={[
          {
            titulo: 'Fluxo — Assinatura digital',
            steps: [
              { type: 'action', text: 'Cliente abre link público' },
              { type: 'action', text: 'Revisa cláusulas do contrato' },
              { type: 'action', text: 'Preenche AssinaturaForm' },
              { type: 'action', text: 'Aceita termos e assina' },
              { type: 'result', text: 'Contract.status → signed' },
              { type: 'result', text: 'signedDate registrada' },
              { type: 'result', text: 'AuditLog de assinatura criado' },
            ]
          }
        ]}
        entidadesAfetadas={['Contract', 'AuditLog']}
      />

      <PageDoc
        name="Criar Contrato Manual"
        route="/CriarContrato"
        access="Admin"
        description="Fluxo para criar contrato manualmente sem proposta prévia."
        purpose="Permitir criar contrato diretamente quando não há proposta formal ou quando o fluxo comercial foi feito fora da plataforma."
        funcionalidades={[
          'Seleciona Lead ou preenche dados do zero',
          'Mesmo editor do EditorContrato com todas as 6 seções',
          'Gera código CONTR-YYYY-NNNNN automaticamente',
          'Gera publicLinkCode para acesso público'
        ]}
        subAbas={[]}
        fluxo={[]}
        entidadesAfetadas={['Contract', 'Lead']}
      />

      {/* Entidades */}
      <div className="bg-[#002443]/5 rounded-xl p-4 border border-[#002443]/10">
        <h5 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Entidade Principal: Contract</h5>
        <p className="text-[10px] text-[#002443]/60 leading-relaxed">
          50+ campos: leadId, proposalId, merchantId, clientCnpj (âncora), código, status (6), publicLinkCode, dados completos do cliente (endereço, representante, CPF), módulos contratados (6 toggles), taxas (cartão 5 bandeiras × 4 faixas + débito + PIX + boleto + fees), TPV mínimo garantido (3 meses), setup, prazo liquidação, dados bancários, SLAs (4 níveis), reserva risco PIX/cartão, chargeback (taxa + threshold), duração contrato, multa rescisão, dados Pagsmile, testemunhas (2), cláusulas customizadas, campos pendentes/preenchidos, datas (contrato, envio, assinatura).
        </p>
      </div>
    </div>
  );
}