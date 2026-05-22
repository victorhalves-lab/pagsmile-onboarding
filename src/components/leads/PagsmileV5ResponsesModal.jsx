import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Building2, User, DollarSign, MapPin, Globe, CreditCard, Briefcase,
  X, Copy, CheckCircle, FileText, Shield, TrendingUp,
  ExternalLink, AlertTriangle, Zap, Sparkles, Star
} from 'lucide-react';

const SECTIONS = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, accent: 'bg-blue-500' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, accent: 'bg-amber-500' },
  { id: 'contato', label: 'Contato', icon: User, accent: 'bg-violet-500' },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, accent: 'bg-emerald-500' },
  { id: 'financeiro', label: 'Volume & Financeiro', icon: DollarSign, accent: 'bg-cyan-500' },
  { id: 'distribuicao', label: 'Distribuição', icon: TrendingUp, accent: 'bg-indigo-500' },
  { id: 'processador', label: 'Processador Atual', icon: CreditCard, accent: 'bg-rose-500' },
  { id: 'taxas_atuais', label: 'Taxas Atuais', icon: DollarSign, accent: 'bg-pink-500' },
  { id: 'compliance', label: 'Compliance & Risco', icon: Shield, accent: 'bg-orange-500' },
  { id: 'fechamento', label: 'Fechamento', icon: Zap, accent: 'bg-teal-500' },
  { id: 'enriquecimento', label: 'Análise & Enriquecimento', icon: Sparkles, accent: 'bg-purple-500' },
];

// Helper: normaliza valor para exibição (lida com array, objeto, string vazia)
function normalizeValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value)) {
    const cleaned = value.filter(v => v !== null && v !== undefined && v !== '');
    return cleaned.length > 0 ? cleaned.join(', ') : null;
  }
  if (typeof value === 'object') return null; // não exibir objetos crus
  return value;
}

function FieldRow({ label, value, isPercent, isMoney, isLink, highlight }) {
  const [copied, setCopied] = useState(false);
  const normalized = normalizeValue(value);
  if (normalized === null) return null;

  // Detecta se o "valor" é numérico real para formatadores
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^-?\d+([.,]\d+)?$/.test(value.trim()));

  let displayValue = String(normalized);
  if (isMoney && isNumeric) {
    displayValue = `R$ ${Number(String(value).replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  if (isPercent && isNumeric) {
    displayValue = `${Number(String(value).replace(',', '.')).toFixed(2).replace('.', ',')}%`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(String(normalized));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`group flex items-start justify-between gap-4 rounded-xl px-5 py-3.5 transition-all border ${
      highlight
        ? 'bg-[#2bc196]/5 border-[#2bc196]/30 hover:border-[#2bc196]/50'
        : 'bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#2bc196]/30'
    }`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#002443]/55 font-medium mb-1 flex items-center gap-1.5">
          {highlight && <Star className="w-3 h-3 text-[#2bc196] fill-[#2bc196]" />}
          {label}
        </p>
        {isLink ? (
          <a href={String(normalized).startsWith('http') ? normalized : `https://${normalized}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#2bc196] hover:text-[#2bc196]/80 text-sm font-semibold transition-colors break-all">
            <Globe className="w-3.5 h-3.5 shrink-0" />{normalized}<ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : isMoney && isNumeric ? (
          <span className="text-lg font-bold text-emerald-600 tracking-tight">{displayValue}</span>
        ) : isPercent && isNumeric ? (
          <span className="text-lg font-bold text-indigo-600">{displayValue}</span>
        ) : (
          <p className="text-sm text-[#002443] font-semibold leading-relaxed whitespace-pre-wrap">{displayValue}</p>
        )}
      </div>
      <button onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-[#002443]/5 shrink-0 mt-0.5"
        title="Copiar">
        {copied ? <CheckCircle className="w-4 h-4 text-[#2bc196]" /> : <Copy className="w-4 h-4 text-[#002443]/25" />}
      </button>
    </div>
  );
}

function DistributionBar({ label, value }) {
  if (!value && value !== 0) return null;
  const pct = Number(value) || 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-[#002443]/70 min-w-[100px]">{label}</span>
      <div className="flex-1 max-w-[220px] h-5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#2bc196] rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-bold text-[#002443] w-12 text-right">{pct}%</span>
    </div>
  );
}

function FlagsPanel({ flags }) {
  if (!flags || typeof flags !== 'object') return null;
  const activeFlags = Object.entries(flags).filter(([, v]) => v === true);
  if (activeFlags.length === 0) {
    return <p className="text-sm text-emerald-600 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Nenhuma flag de risco ativa</p>;
  }
  const flagLabels = {
    PERSONAL_EMAIL: 'E-mail pessoal', NO_WEBSITE: 'Sem website', NO_ANTIFRAUDE: 'Sem antifraude',
    HIGH_CHARGEBACK: 'Chargeback alto', HIGH_MED_PIX: 'MED PIX alto', TERMINATED_BEFORE: 'Já foi encerrado',
    TPV_EXCEEDS_REVENUE: 'Volume > Faturamento', NEW_MERCHANT: 'Começando agora',
    CNPJ_SITUACAO_IRREGULAR: 'CNPJ irregular', SETOR_REGULADO: 'Setor regulado',
    CNAE_MISMATCH: 'CNAE incompatível', VOLUME_INCOMPATIVEL: 'Volume incompatível',
    JUST_QUOTING: 'Apenas cotando', LOW_TICKET: 'Ticket baixo', HIGH_REFUND_POLICY: 'Garantia alta',
    EMPRESA_NOVA: 'Empresa nova (<6 meses)',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {activeFlags.map(([key]) => (
        <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-3 h-3" />{flagLabels[key] || key}
        </span>
      ))}
    </div>
  );
}

function ScoreCard({ title, score, level, levelColors, description }) {
  if (score === null || score === undefined) return null;
  const color = levelColors?.[level] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wider">{title}</p>
        {level && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${color}`}>{level}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#002443]">{Number(score).toFixed(0)}</span>
        <span className="text-xs text-[#002443]/40">/ 100</span>
      </div>
      {description && <p className="text-[11px] text-[#002443]/50 leading-relaxed">{description}</p>}
    </div>
  );
}

export default function PagsmileV5ResponsesModal({ open, onClose, lead }) {
  const [activeSection, setActiveSection] = useState('empresa');
  const qd = lead?.questionnaireData || {};
  const dist = qd.distribuicao || {};
  const flags = qd._silentFlags || {};

  // Distribution totals (alert if ≠ 100)
  const distTotal = Object.values(dist).reduce((s, v) => s + (Number(v) || 0), 0);
  const distParc = qd.distribuicaoParcelamento || {};
  const distParcTotal = Object.values(distParc).reduce((s, v) => s + (Number(v) || 0), 0);
  const distDes = qd.distribuicaoDesejada || {};
  const distDesTotal = Object.values(distDes).reduce((s, v) => s + (Number(v) || 0), 0);

  const sectionContent = {
    empresa: [
      { label: 'CNPJ', value: qd.cnpj },
      { label: 'Razão Social', value: qd.razaoSocial },
      { label: 'Nome Fantasia', value: qd.nomeFantasia },
      { label: 'Website / Presença Digital', value: qd.presencaDigital, isLink: !!qd.presencaDigital && qd.presencaDigital !== 'Não possuo' && !String(qd.presencaDigital).startsWith('@') },
      { label: 'Segmento', value: qd.segmentoLabel || qd.segmento },
      // BDC/BrasilAPI enrichment
      { label: 'CNAE Principal', value: qd.cnaeFiscal || qd.cnaePrincipal || qd.cnaePrincipalCode },
      { label: 'CNAE Descrição', value: qd.cnaeDescricao || qd.cnaePrincipalDescricao },
      { label: 'Data de Abertura', value: qd.dataAbertura || qd.dataInicioAtividade },
      { label: 'Porte da Empresa', value: qd.porteEmpresa || qd.porte },
      { label: 'Capital Social', value: qd.capitalSocial, isMoney: !!qd.capitalSocial },
      { label: 'Natureza Jurídica', value: qd.naturezaJuridica },
      { label: 'Situação Cadastral', value: qd.situacaoCadastral },
      { label: 'Regime Tributário', value: qd.regimeTributario },
    ],
    endereco: [
      { label: 'CEP', value: qd.enderecoCep },
      { label: 'Logradouro', value: qd.enderecoLogradouro },
      { label: 'Número', value: qd.enderecoNumero },
      { label: 'Complemento', value: qd.enderecoComplemento },
      { label: 'Bairro', value: qd.enderecoBairro },
      { label: 'Município', value: qd.enderecoMunicipio },
      { label: 'UF', value: qd.enderecoUf },
    ],
    contato: [
      { label: 'Nome do Contato', value: qd.contactName },
      { label: 'E-mail', value: qd.email },
      { label: 'Telefone', value: qd.phone },
      { label: 'Cargo', value: qd.cargo === '__other__' ? (qd.cargoOutro || 'Outro') : qd.cargo },
      { label: 'Cargo (detalhe)', value: qd.cargo === '__other__' ? qd.cargoOutro : null },
    ],
    negocio: [
      { label: 'Modelo de Cobrança', value: qd.modeloCobranca },
      { label: 'Breve Descrição do Negócio', value: qd.descricaoNegocio },
      { label: '⭐ Detalhamento do que vende (mix completo)', value: qd.mixProdutosServicos, highlight: true },
      { label: 'Plataforma', value: qd.plataforma },
      { label: 'Antifraude / 3DS', value: qd.antifraude },
      // Condicionais Intermediários
      { label: 'Qtd Sub-Sellers / Merchants', value: qd.qtdSubSellers },
      // Condicionais Gateway
      { label: 'Licença BCB', value: qd.licencaBCB || qd.licencaBcb },
      { label: 'Split de Pagamento', value: qd.splitPagamento },
      // Condicionais Marketplace
      { label: 'Take Rate Média', value: qd.takeRate },
      { label: 'KYC de Sub-Sellers', value: qd.kycSubSellers },
      // Condicionais SaaS
      { label: 'Churn Mensal', value: qd.churn },
      { label: 'Pricing SaaS', value: qd.pricingSaas },
      // Condicionais Infoprodutos
      { label: 'Modelo de Afiliados', value: qd.modeloAfiliados || qd.afiliados },
      { label: 'Garantia / Reembolso', value: qd.garantia },
      { label: '% do Faturamento via Afiliados', value: qd.pctAfiliados },
      // Condicionais Plataforma Vertical
      { label: 'Vertical Principal', value: qd.verticalPrincipal || qd.vertical },
      { label: 'Vertical (Outro)', value: qd.verticalOutro },
      // Condicionais E-commerce
      { label: 'Tipo de Produto (E-commerce)', value: qd.tipoProdutoEcommerce },
      { label: 'Tipo de Produto E-commerce (Outro)', value: qd.tipoProdutoEcommerceOutro },
      { label: 'Modelo de Entrega', value: qd.modeloEntrega },
      { label: 'Política de Devolução', value: qd.politicaDevolucao },
      // Condicionais Dropshipping
      { label: 'Tipo de Produto (Dropshipping)', value: qd.tipoProdutoDrop },
      { label: 'Tipo de Produto Drop (Outro)', value: qd.tipoProdutoDropOutro },
      { label: 'Origem dos Fornecedores', value: qd.origemFornecedores },
      { label: 'Prazo Médio de Entrega', value: qd.prazoEntrega },
      // Condicionais Link de Pagamento
      { label: 'Tipo Produto/Serviço (Link)', value: qd.tipoProdutoLink },
      { label: 'Tipo Produto Link (Outro)', value: qd.tipoProdutoLinkOutro },
      { label: 'Canais de Envio', value: qd.canaisLink },
      { label: 'Canais de Envio (Outro)', value: qd.canaisLinkOutro },
      // Condicionais MPE
      { label: 'Tipo de Negócio (MPE)', value: qd.tipoMpe },
      { label: 'O que Vende (MPE)', value: qd.oQueVendeMpe },
      { label: 'Modalidade Cartão', value: qd.modalidadeCartao },
    ],
    financeiro: [
      { label: 'Faturamento / Volume Total Processado no Mês', value: qd.tpvMensal, isMoney: true },
      { label: 'Faturamento Anual', value: qd.faturamentoAnual },
      { label: 'Número de Funcionários', value: qd.funcionarios },
      { label: 'Ticket Médio', value: qd.ticketMedio, isMoney: true },
      { label: 'Transações / Mês (calculado)', value: qd.transacoesMes },
    ],
    processador: [
      { label: 'Já Processa Pagamentos?', value: qd.jaProcessa },
      { label: 'Processador Atual', value: qd.processador === '__other__' ? (qd.processadorOutro || 'Outro') : qd.processador },
      { label: 'Processador (Outro)', value: qd.processador === '__other__' ? qd.processadorOutro : null },
      { label: 'Satisfação com Processador', value: qd.satisfacao },
      { label: 'Principal Dor Atual', value: qd.dorAtual },
      { label: 'Dor (Outro)', value: qd.dorOutro },
      { label: 'Usa Antecipação?', value: qd.antecipacao },
      { label: 'Sabe as Taxas?', value: qd.sabeTaxas },
    ],
    taxas_atuais: [
      { label: 'MDR Crédito à Vista (1x)', value: qd.mdrAvista, isPercent: true },
      { label: 'MDR Crédito 2-6x', value: qd.mdr2a6x, isPercent: true },
      { label: 'MDR Crédito 7-12x', value: qd.mdr7a12x, isPercent: true },
      { label: 'MDR Crédito 13-21x', value: qd.mdr13a21x, isPercent: true },
      { label: 'MDR Débito', value: qd.mdrDebito, isPercent: true },
      { label: 'Taxa PIX', value: qd.taxaPix, isPercent: true },
      { label: 'Taxa Boleto (R$)', value: qd.taxaBoleto, isMoney: true },
      { label: 'Taxa Antecipação (% a.m.)', value: qd.taxaAntecipacao, isPercent: true },
      { label: 'Custo Antifraude (R$)', value: qd.custoAntifraude, isMoney: true },
      { label: 'Fee por Transação (R$)', value: qd.feeTransacao, isMoney: true },
      { label: 'Taxa 3DS (R$)', value: qd.taxa3ds, isMoney: true },
    ],
    compliance: [
      { label: 'Já foi encerrado por algum processador?', value: qd.encerrado },
      { label: 'Taxa de Chargeback', value: qd.chargeback },
      { label: 'Taxa de MED PIX', value: qd.medPix },
    ],
    fechamento: [
      { label: 'Quando quer começar a operar', value: qd.urgencia },
      { label: 'Expectativa de Crescimento (12m)', value: qd.crescimento },
      { label: 'Como Conheceu a Pagsmile', value: qd.comoConheceu === '__other__' ? (qd.comoConheceuOutro || 'Outro') : qd.comoConheceu },
      { label: 'Como Conheceu (Outro)', value: qd.comoConheceu === '__other__' ? qd.comoConheceuOutro : null },
      { label: 'Observações Adicionais', value: qd.observacoes },
    ],
  };

  // Count filled fields per section
  const countFilled = (sectionId) => {
    if (sectionId === 'distribuicao') {
      const distFilled = Object.values(dist).filter(v => v !== null && v !== undefined && v !== 0).length;
      const parcFilled = Object.values(distParc).filter(v => v !== null && v !== undefined && v !== 0).length;
      const desFilled = Object.values(distDes).filter(v => v !== null && v !== undefined && v !== 0).length;
      return distFilled + parcFilled + desFilled;
    }
    if (sectionId === 'enriquecimento') {
      let n = 0;
      if (lead?.leadQualifierScore != null) n++;
      if (lead?.bdcLeadScore != null) n++;
      if (lead?.iaRiskScore != null) n++;
      if (lead?.priscilaQualityScore != null) n++;
      if (qd._leadScore != null) n++;
      if (Array.isArray(lead?.iaSuggestions) && lead.iaSuggestions.length > 0) n++;
      if (Array.isArray(lead?.bdcFlags) && lead.bdcFlags.length > 0) n++;
      return n;
    }
    const fields = sectionContent[sectionId] || [];
    return fields.filter(f => normalizeValue(f.value) !== null).length;
  };

  const totalFilled = SECTIONS.reduce((sum, s) => sum + countFilled(s.id), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-white border-[#e2e8f0] max-h-[92vh] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#002443] to-[#003366]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2bc196]/20 flex items-center justify-center border border-[#2bc196]/30">
                  <Building2 className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{lead?.fullName || lead?.companyName || 'Lead'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead?.cpfCnpj && <span className="text-xs text-white/50 font-mono">{lead.cpfCnpj}</span>}
                    {lead?.protocolo && (
                      <Badge className="bg-[#2bc196]/15 text-[#2bc196] border-[#2bc196]/30 text-[10px] px-2 py-0.5">{lead.protocolo}</Badge>
                    )}
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px] px-2 py-0.5">
                      Pagsmile V5
                    </Badge>
                    {qd.segmentoLabel && (
                      <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] px-2 py-0.5">{qd.segmentoLabel}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2bc196]" />
                  <strong className="text-white/90">{totalFilled}</strong> campos preenchidos
                </span>
                {lead?.tpvMensal > 0 && (
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <DollarSign className="w-3.5 h-3.5" />
                    Volume R$ {lead.tpvMensal.toLocaleString('pt-BR')}/mês
                  </span>
                )}
                {qd._leadScore > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Score: {qd._leadScore}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onClose(false)}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl -mt-1 -mr-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex max-h-[calc(92vh-120px)]">
          {/* Sidebar */}
          <div className="w-56 shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] flex flex-col">
            <ScrollArea className="flex-1 py-2">
              <nav className="space-y-0.5 px-2">
                {SECTIONS.map(sec => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  const count = countFilled(sec.id);
                  return (
                    <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-white text-[#002443] font-bold shadow-sm border border-[#e2e8f0]'
                          : 'text-[#002443]/60 hover:text-[#002443] hover:bg-white/60'
                      }`}>
                      <div className={`w-6 h-6 rounded-lg ${sec.accent} flex items-center justify-center shrink-0 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="flex-1 text-left truncate">{sec.label}</span>
                      <span className={`text-[10px] tabular-nums font-semibold ${isActive ? 'text-[#2bc196]' : 'text-[#002443]/30'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 bg-white">
            <ScrollArea className="h-full">
              <div className="p-6">
                {/* Section header */}
                {(() => {
                  const sec = SECTIONS.find(s => s.id === activeSection);
                  if (!sec) return null;
                  const Icon = sec.icon;
                  return (
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e2e8f0]">
                      <div className={`w-9 h-9 rounded-xl ${sec.accent} flex items-center justify-center shadow-sm`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#002443]">{sec.label}</h3>
                        <p className="text-[11px] text-[#002443]/40">{countFilled(activeSection)} campos com dados</p>
                      </div>
                    </div>
                  );
                })()}

                {/* DISTRIBUIÇÃO */}
                {activeSection === 'distribuicao' ? (
                  <div className="space-y-6">
                    {/* Distribuição atual por meio de pagamento */}
                    {distTotal > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-[#002443]/55 uppercase tracking-wider">Meio de Pagamento (Atual)</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            Math.round(distTotal) === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            Total: {Math.round(distTotal)}%
                          </span>
                        </div>
                        <div className="space-y-3">
                          <DistributionBar label="Crédito" value={dist.credito} />
                          <DistributionBar label="Débito" value={dist.debito} />
                          <DistributionBar label="PIX" value={dist.pix} />
                          <DistributionBar label="Boleto" value={dist.boleto} />
                        </div>
                      </div>
                    )}

                    {/* Distribuição por parcelamento */}
                    {distParcTotal > 0 && (
                      <div className="pt-4 border-t border-[#e2e8f0]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-[#002443]/55 uppercase tracking-wider">Parcelamento (Cartão Crédito)</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            Math.round(distParcTotal) === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            Total: {Math.round(distParcTotal)}%
                          </span>
                        </div>
                        <div className="space-y-3">
                          <DistributionBar label="À Vista (1x)" value={distParc.avista} />
                          <DistributionBar label="2 a 6x" value={distParc.de2a6x} />
                          <DistributionBar label="7 a 12x" value={distParc.de7a12x} />
                          <DistributionBar label="13 a 21x" value={distParc.de13a21x} />
                        </div>
                      </div>
                    )}

                    {/* Distribuição desejada */}
                    {distDesTotal > 0 && (
                      <div className="pt-4 border-t border-[#e2e8f0]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-[#002443]/55 uppercase tracking-wider">Distribuição Desejada</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            Math.round(distDesTotal) === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            Total: {Math.round(distDesTotal)}%
                          </span>
                        </div>
                        <div className="space-y-3">
                          <DistributionBar label="Crédito" value={distDes.credito} />
                          <DistributionBar label="Débito" value={distDes.debito} />
                          <DistributionBar label="PIX" value={distDes.pix} />
                          <DistributionBar label="Boleto" value={distDes.boleto} />
                        </div>
                      </div>
                    )}

                    {/* Mix de Operação (composição estimada) */}
                    {qd.mixOperacao && (() => {
                      const m = qd.mixOperacao;
                      const fixed = [
                        { label: 'E-commerce', value: m.ecommerce },
                        { label: 'Dropshipping', value: m.dropshipping },
                        { label: 'Infoproduto', value: m.infoproduto },
                        { label: 'SaaS', value: m.saas },
                        { label: 'Educação', value: m.educacao },
                      ];
                      const outros = Array.isArray(m.outros) ? m.outros : [];
                      const total = fixed.reduce((s, f) => s + (Number(f.value) || 0), 0)
                        + outros.reduce((s, o) => s + (Number(o?.percentual) || 0), 0);
                      if (total === 0) return null;
                      return (
                        <div className="pt-4 border-t border-[#e2e8f0]">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-[#002443]/55 uppercase tracking-wider">Composição da Operação</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              Math.round(total) === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              Total: {Math.round(total)}%
                            </span>
                          </div>
                          <div className="space-y-3">
                            {fixed.map(f => <DistributionBar key={f.label} label={f.label} value={f.value} />)}
                            {outros.map((o, i) => (
                              <DistributionBar key={`outros-${i}`} label={o?.nome || `Outro ${i+1}`} value={o?.percentual} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {distTotal === 0 && distParcTotal === 0 && distDesTotal === 0 && !qd.mixOperacao && (
                      <p className="text-sm text-[#002443]/40 italic text-center py-8">Nenhuma distribuição informada</p>
                    )}
                  </div>
                ) : activeSection === 'compliance' ? (
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      {(sectionContent.compliance || []).map((field, i) => (
                        <FieldRow key={i} {...field} />
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                      <p className="text-xs text-[#002443]/55 font-medium mb-3">Flags Silenciosas Calculadas</p>
                      <FlagsPanel flags={flags} />
                    </div>
                  </div>
                ) : activeSection === 'enriquecimento' ? (
                  /* SEÇÃO NOVA: ANÁLISE & ENRIQUECIMENTO BACKEND */
                  <div className="space-y-5">
                    {/* Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ScoreCard
                        title="Lead Score (Questionário)"
                        score={qd._leadScore}
                        description="Score calculado a partir das respostas do questionário (0-100)"
                      />
                      <ScoreCard
                        title="Lead Qualifier"
                        score={lead?.leadQualifierScore}
                        level={lead?.leadQualifierLevel}
                        levelColors={{
                          EXCELENTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          BOM: 'bg-blue-50 text-blue-700 border-blue-200',
                          REGULAR: 'bg-amber-50 text-amber-700 border-amber-200',
                          FRACO: 'bg-orange-50 text-orange-700 border-orange-200',
                          INSUFICIENTE: 'bg-red-50 text-red-700 border-red-200',
                          PENDENTE: 'bg-slate-100 text-slate-600 border-slate-200',
                        }}
                        description="Qualificação automática do lead"
                      />
                      <ScoreCard
                        title="BDC Lead Score"
                        score={lead?.bdcLeadScore}
                        level={lead?.bdcScoreLevel}
                        levelColors={{
                          EXCELENTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          BOM: 'bg-blue-50 text-blue-700 border-blue-200',
                          REGULAR: 'bg-amber-50 text-amber-700 border-amber-200',
                          FRACO: 'bg-orange-50 text-orange-700 border-orange-200',
                          INSUFICIENTE: 'bg-red-50 text-red-700 border-red-200',
                        }}
                        description="Score baseado em enriquecimento BigDataCorp"
                      />
                      <ScoreCard
                        title="IA Risk Score (Helena)"
                        score={lead?.iaRiskScore}
                        level={lead?.iaPriority}
                        levelColors={{
                          URGENTE: 'bg-red-50 text-red-700 border-red-200',
                          ALTA: 'bg-orange-50 text-orange-700 border-orange-200',
                          MEDIA: 'bg-amber-50 text-amber-700 border-amber-200',
                          BAIXA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        }}
                        description="Análise de risco IA + decisão recomendada"
                      />
                      <ScoreCard
                        title="Priscila Quality"
                        score={lead?.priscilaQualityScore}
                        level={lead?.priscilaRiskLevel}
                        levelColors={{
                          BAIXO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          MEDIO: 'bg-amber-50 text-amber-700 border-amber-200',
                          ALTO: 'bg-orange-50 text-orange-700 border-orange-200',
                          CRITICO: 'bg-red-50 text-red-700 border-red-200',
                          EM_ANALISE: 'bg-slate-100 text-slate-600 border-slate-200',
                        }}
                        description={lead?.priscilaDecisionPath ? `Decisão sugerida: ${lead.priscilaDecisionPath}` : null}
                      />
                    </div>

                    {/* Decisão IA */}
                    {lead?.iaDecision && lead.iaDecision !== 'PENDENTE' && (
                      <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                        <p className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wider mb-2">Decisão IA Recomendada</p>
                        <p className="text-sm font-bold text-[#002443]">{lead.iaDecision}</p>
                        {lead.iaAnalysisReport && (
                          <p className="text-xs text-[#002443]/70 mt-2 whitespace-pre-wrap leading-relaxed">{lead.iaAnalysisReport}</p>
                        )}
                      </div>
                    )}

                    {/* Sugestões IA */}
                    {Array.isArray(lead?.iaSuggestions) && lead.iaSuggestions.length > 0 && (
                      <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                        <p className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wider mb-3">Sugestões da IA</p>
                        <ul className="space-y-2">
                          {lead.iaSuggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#002443]/80 leading-relaxed">
                              <Sparkles className="w-3 h-3 text-[#2bc196] shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* BDC Flags */}
                    {Array.isArray(lead?.bdcFlags) && lead.bdcFlags.length > 0 && (
                      <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                        <p className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wider mb-3">BDC Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {lead.bdcFlags.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                              <AlertTriangle className="w-3 h-3" />{f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Datas dos enriquecimentos */}
                    <div className="text-[10px] text-[#002443]/40 space-y-1 pt-2 border-t border-[#e2e8f0]">
                      {lead?.bdcEnrichmentDate && <p>BDC enriquecido em: {new Date(lead.bdcEnrichmentDate).toLocaleString('pt-BR')}</p>}
                      {lead?.iaAnalysisDate && <p>IA analisada em: {new Date(lead.iaAnalysisDate).toLocaleString('pt-BR')}</p>}
                      {lead?.leadQualifierDate && <p>Qualifier rodado em: {new Date(lead.leadQualifierDate).toLocaleString('pt-BR')}</p>}
                    </div>

                    {countFilled('enriquecimento') === 0 && (
                      <div className="text-center py-12">
                        <Sparkles className="w-10 h-10 mx-auto text-[#002443]/10 mb-3" />
                        <p className="text-[#002443]/40 text-sm">Análises de enriquecimento ainda não disponíveis</p>
                        <p className="text-[10px] text-[#002443]/30 mt-1">BDC + IA processam em segundo plano após a submissão</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(sectionContent[activeSection] || []).map((field, i) => (
                      <FieldRow key={i} {...field} />
                    ))}
                    {(sectionContent[activeSection] || []).every(f => normalizeValue(f.value) === null) && (
                      <div className="text-center py-12">
                        <FileText className="w-10 h-10 mx-auto text-[#002443]/10 mb-3" />
                        <p className="text-[#002443]/30 text-sm">Nenhum dado nesta seção</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}