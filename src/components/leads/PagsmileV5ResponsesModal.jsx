import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Building2, User, DollarSign, MapPin, Globe, CreditCard, Briefcase,
  X, Copy, CheckCircle, FileText, Shield, TrendingUp, Phone, Mail,
  ExternalLink, AlertTriangle, Zap
} from 'lucide-react';

const SECTIONS = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, accent: 'bg-blue-500' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, accent: 'bg-amber-500' },
  { id: 'contato', label: 'Contato', icon: User, accent: 'bg-violet-500' },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, accent: 'bg-emerald-500' },
  { id: 'financeiro', label: 'Volume & Financeiro', icon: DollarSign, accent: 'bg-cyan-500' },
  { id: 'distribuicao', label: 'Distribuição TPV', icon: TrendingUp, accent: 'bg-indigo-500' },
  { id: 'processador', label: 'Processador Atual', icon: CreditCard, accent: 'bg-rose-500' },
  { id: 'compliance', label: 'Compliance & Risco', icon: Shield, accent: 'bg-orange-500' },
  { id: 'fechamento', label: 'Fechamento', icon: Zap, accent: 'bg-teal-500' },
];

function FieldRow({ label, value, isPercent, isMoney, isLink }) {
  const [copied, setCopied] = useState(false);
  if (value === null || value === undefined || value === '') return null;

  let displayValue = String(value);
  if (isMoney) displayValue = `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (isPercent) displayValue = `${Number(value).toFixed(2).replace('.', ',')}%`;

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#2bc196]/30 px-5 py-3.5 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#002443]/55 font-medium mb-1">{label}</p>
        {isLink ? (
          <a href={String(value).startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#2bc196] hover:text-[#2bc196]/80 text-sm font-semibold transition-colors break-all">
            <Globe className="w-3.5 h-3.5 shrink-0" />{value}<ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : isMoney ? (
          <span className="text-lg font-bold text-emerald-600 tracking-tight">{displayValue}</span>
        ) : isPercent ? (
          <span className="text-lg font-bold text-indigo-600">{displayValue}</span>
        ) : (
          <p className="text-sm text-[#002443] font-semibold leading-relaxed">{displayValue}</p>
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
      <span className="text-xs font-medium text-[#002443]/70 min-w-[80px]">{label}</span>
      <div className="flex-1 max-w-[200px] h-5 bg-slate-100 rounded-full overflow-hidden">
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
    TPV_EXCEEDS_REVENUE: 'TPV > Faturamento', NEW_MERCHANT: 'Começando agora',
    CNPJ_SITUACAO_IRREGULAR: 'CNPJ irregular', SETOR_REGULADO: 'Setor regulado',
    CNAE_MISMATCH: 'CNAE incompatível', VOLUME_INCOMPATIVEL: 'Volume incompatível',
    JUST_QUOTING: 'Apenas cotando', LOW_TICKET: 'Ticket baixo', HIGH_REFUND_POLICY: 'Garantia alta',
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

export default function PagsmileV5ResponsesModal({ open, onClose, lead }) {
  const [activeSection, setActiveSection] = useState('empresa');
  const qd = lead?.questionnaireData || {};
  const dist = qd.distribuicao || {};
  const flags = qd._silentFlags || {};

  const sectionContent = {
    empresa: [
      { label: 'CNPJ', value: qd.cnpj },
      { label: 'Razão Social', value: qd.razaoSocial },
      { label: 'Nome Fantasia', value: qd.nomeFantasia },
      { label: 'Website / Presença Digital', value: qd.presencaDigital, isLink: !!qd.presencaDigital && qd.presencaDigital !== 'Não possuo' },
      { label: 'Segmento', value: qd.segmentoLabel || qd.segmento },
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
      { label: 'Cargo', value: qd.cargo },
    ],
    negocio: [
      { label: 'Modelo de Cobrança', value: qd.modeloCobranca },
      { label: 'Descrição do Negócio', value: qd.descricaoNegocio },
      { label: 'Plataforma', value: qd.plataforma },
      { label: 'Antifraude', value: qd.antifraude },
      { label: 'Qtd Sub-Sellers', value: qd.qtdSubSellers },
      { label: 'Licença BCB', value: qd.licencaBcb },
      { label: 'Split Pagamento', value: qd.splitPagamento },
      { label: 'Take Rate', value: qd.takeRate },
      { label: 'KYC Sub-Sellers', value: qd.kycSubSellers },
      { label: 'Churn', value: qd.churn },
      { label: 'Pricing SaaS', value: qd.pricingSaas },
      { label: 'Afiliados', value: qd.afiliados },
      { label: 'Garantia', value: qd.garantia },
      { label: '% Afiliados', value: qd.pctAfiliados },
      { label: 'Vertical', value: qd.vertical },
    ],
    financeiro: [
      { label: 'Faturamento Anual', value: qd.faturamentoAnual },
      { label: 'Funcionários', value: qd.funcionarios },
      { label: 'Ticket Médio', value: qd.ticketMedio, isMoney: true },
      { label: 'TPV Mensal', value: qd.tpvMensal, isMoney: true },
      { label: 'Transações / Mês', value: qd.transacoesMes },
    ],
    processador: [
      { label: 'Já Processa?', value: qd.jaProcessa },
      { label: 'Processador Atual', value: qd.processador },
      { label: 'Satisfação', value: qd.satisfacao },
      { label: 'Dor Atual', value: qd.dorAtual },
      { label: 'Antecipação', value: qd.antecipacao },
      { label: 'Sabe as Taxas?', value: qd.sabeTaxas },
    ],
    compliance: [
      { label: 'Já foi encerrado?', value: qd.encerrado },
      { label: 'Chargeback', value: qd.chargeback },
      { label: 'MED PIX', value: qd.medPix },
    ],
    fechamento: [
      { label: 'Urgência', value: qd.urgencia },
      { label: 'Crescimento Esperado', value: qd.crescimento },
      { label: 'Como Conheceu', value: qd.comoConheceu },
    ],
  };

  // Count filled fields
  const countFilled = (sectionId) => {
    if (sectionId === 'distribuicao') return Object.values(dist).filter(v => v !== null && v !== undefined).length;
    const fields = sectionContent[sectionId] || [];
    return fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length;
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
                    TPV R$ {lead.tpvMensal.toLocaleString('pt-BR')}
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
          <div className="w-52 shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] flex flex-col">
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

                {/* Distribution section */}
                {activeSection === 'distribuicao' ? (
                  <div className="space-y-3">
                    <DistributionBar label="Crédito" value={dist.credito} />
                    <DistributionBar label="Débito" value={dist.debito} />
                    <DistributionBar label="PIX" value={dist.pix} />
                    <DistributionBar label="Boleto" value={dist.boleto} />
                    {Object.values(dist).every(v => !v && v !== 0) && (
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
                      <p className="text-xs text-[#002443]/55 font-medium mb-3">Flags Silenciosas</p>
                      <FlagsPanel flags={flags} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(sectionContent[activeSection] || []).map((field, i) => (
                      <FieldRow key={i} {...field} />
                    ))}
                    {(sectionContent[activeSection] || []).every(f => !f.value && f.value !== 0) && (
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