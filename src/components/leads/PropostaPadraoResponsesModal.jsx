import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Building2, User, DollarSign, MapPin, Globe, CreditCard,
  X, Copy, CheckCircle, FileText, Rocket, Phone, Mail, ExternalLink
} from 'lucide-react';

const SECTIONS = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, accent: 'bg-blue-500' },
  { id: 'contato', label: 'Contato', icon: User, accent: 'bg-violet-500' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, accent: 'bg-amber-500' },
  { id: 'taxas', label: 'Taxas Aceitas', icon: CreditCard, accent: 'bg-emerald-500' },
  { id: 'origem', label: 'Origem & Rastreio', icon: Rocket, accent: 'bg-indigo-500' },
];

function formatRate(val) {
  if (val === null || val === undefined) return null;
  return `${Number(val).toFixed(2).replace('.', ',')}%`;
}

function formatMoney(val) {
  if (val === null || val === undefined) return null;
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`;
}

function FieldRow({ label, value, isMoney, isPercent, isLink }) {
  const [copied, setCopied] = useState(false);

  if (value === null || value === undefined || value === '') return null;

  const displayValue = isMoney ? formatMoney(value) : isPercent ? formatRate(value) : String(value);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start justify-between gap-4 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#1356E2]/30 px-5 py-3.5 transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#0A0A0A]/55 font-medium mb-1">{label}</p>
        {isLink ? (
          <a href={String(value).startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#1356E2] hover:text-[#1356E2]/80 text-sm font-semibold transition-colors break-all">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {value}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : isMoney ? (
          <span className="text-lg font-bold text-emerald-600 tracking-tight">{displayValue}</span>
        ) : isPercent ? (
          <span className="text-lg font-bold text-indigo-600">{displayValue}</span>
        ) : (
          <p className="text-sm text-[#0A0A0A] font-semibold leading-relaxed">{displayValue}</p>
        )}
      </div>
      <button onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-[#0A0A0A]/5 shrink-0 mt-0.5"
        title="Copiar">
        {copied ? <CheckCircle className="w-4 h-4 text-[#1356E2]" /> : <Copy className="w-4 h-4 text-[#0A0A0A]/25" />}
      </button>
    </div>
  );
}

function RatesGrid({ taxas }) {
  if (!taxas || typeof taxas !== 'object') return <p className="text-sm text-[#0A0A0A]/40 italic">Nenhuma taxa registrada</p>;

  const rateEntries = [
    { label: 'MDR à Vista (1x)', key: 'mdrAvista', isPercent: true },
    { label: 'MDR 2-6x', key: 'mdr2a6x', isPercent: true },
    { label: 'MDR 7-12x', key: 'mdr7a12x', isPercent: true },
    { label: 'MDR 13-21x', key: 'mdr13a21x', isPercent: true },
    { label: 'Antecipação', key: 'antecipacao', isPercent: true },
    { label: 'Fee por Transação', key: 'feeTransacao', isMoney: true },
    { label: 'Antifraude', key: 'antifraude', isMoney: true },
    { label: '3DS', key: 'taxa3ds', isMoney: true },
    { label: 'PIX Percentual', key: 'pixPercentual', isPercent: true },
    { label: 'PIX Fixo', key: 'pixFixa', isMoney: true },
  ];

  const filled = rateEntries.filter(r => taxas[r.key] !== null && taxas[r.key] !== undefined);
  if (filled.length === 0) return <p className="text-sm text-[#0A0A0A]/40 italic">Nenhuma taxa registrada</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {filled.map(r => (
        <div key={r.key} className="bg-white rounded-xl px-4 py-3 border border-[#e2e8f0] hover:border-[#1356E2]/30 transition-colors">
          <span className="text-[10px] text-[#0A0A0A]/45 block font-medium">{r.label}</span>
          {r.isPercent ? (
            <span className="text-base font-bold text-indigo-600">{formatRate(taxas[r.key])}</span>
          ) : (
            <span className="text-base font-bold text-emerald-600">{formatMoney(taxas[r.key])}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PropostaPadraoResponsesModal({ open, onClose, lead }) {
  const [activeSection, setActiveSection] = useState('empresa');
  const qd = lead?.questionnaireData || {};
  const endereco = qd.endereco || {};
  const taxas = qd.taxasAceitas || {};

  const sectionContent = {
    empresa: [
      { label: 'CNPJ', value: qd.cnpj },
      { label: 'Razão Social', value: qd.razaoSocial },
      { label: 'Nome Fantasia', value: qd.nomeFantasia },
      { label: 'Website', value: qd.website, isLink: true },
      { label: 'Segmento', value: qd.segment },
      { label: 'Segmento da Proposta Padrão', value: qd.standardProposalSegment },
    ],
    contato: [
      { label: 'Nome do Contato', value: qd.contactName },
      { label: 'E-mail', value: qd.email },
      { label: 'Telefone', value: qd.phone },
    ],
    endereco: [
      { label: 'CEP', value: endereco.cep },
      { label: 'Logradouro', value: endereco.logradouro },
      { label: 'Número', value: endereco.numero },
      { label: 'Complemento', value: endereco.complemento },
      { label: 'Bairro', value: endereco.bairro },
      { label: 'Cidade', value: endereco.cidade },
      { label: 'UF', value: endereco.uf },
    ],
    taxas: 'RATES_GRID',
    origem: [
      { label: 'Origem do Fechamento', value: qd.origemFechamento },
      { label: 'Introducer ID', value: qd.introducerId },
      { label: 'Introducer Ref', value: qd.introducerRef },
    ],
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  // Count filled fields per section
  const countFilled = (sectionId) => {
    if (sectionId === 'taxas') {
      return Object.values(taxas).filter(v => v !== null && v !== undefined).length;
    }
    const fields = sectionContent[sectionId];
    if (!Array.isArray(fields)) return 0;
    return fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length;
  };

  const totalFilled = SECTIONS.reduce((sum, s) => sum + countFilled(s.id), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-white border-[#e2e8f0] max-h-[92vh] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#0A0A0A] to-[#003366]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#1356E2]/20 flex items-center justify-center border border-[#1356E2]/30">
                  <Rocket className="w-5 h-5 text-[#1356E2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{lead?.fullName || lead?.companyName || 'Lead'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead?.cpfCnpj && <span className="text-xs text-white/50 font-mono">{lead.cpfCnpj}</span>}
                    <Badge className="bg-[#1356E2]/15 text-[#1356E2] border-[#1356E2]/30 text-[10px] px-2 py-0.5">
                      Proposta Padrão
                    </Badge>
                    {lead?.businessSubCategory && (
                      <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] px-2 py-0.5">
                        {lead.businessSubCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1356E2]" />
                  <strong className="text-white/90">{totalFilled}</strong> campos preenchidos
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {SECTIONS.length} seções
                </span>
                {qd.segment && (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <CreditCard className="w-3.5 h-3.5" />
                    Segmento: {qd.segment}
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
                          ? 'bg-white text-[#0A0A0A] font-bold shadow-sm border border-[#e2e8f0]'
                          : 'text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-white/60'
                      }`}>
                      <div className={`w-6 h-6 rounded-lg ${sec.accent} flex items-center justify-center shrink-0 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="flex-1 text-left truncate">{sec.label}</span>
                      <span className={`text-[10px] tabular-nums font-semibold ${isActive ? 'text-[#1356E2]' : 'text-[#0A0A0A]/30'}`}>
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
                {currentSection && (
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e2e8f0]">
                    <div className={`w-9 h-9 rounded-xl ${currentSection.accent} flex items-center justify-center shadow-sm`}>
                      <currentSection.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0A0A0A]">{currentSection.label}</h3>
                      <p className="text-[11px] text-[#0A0A0A]/40">
                        {countFilled(activeSection)} campos com dados
                      </p>
                    </div>
                  </div>
                )}

                {/* Taxas section — special grid */}
                {activeSection === 'taxas' ? (
                  <RatesGrid taxas={taxas} />
                ) : (
                  /* Regular fields */
                  <div className="space-y-2.5">
                    {(sectionContent[activeSection] || []).map((field, idx) => (
                      <FieldRow key={idx} {...field} />
                    ))}
                    {(sectionContent[activeSection] || []).every(f => !f.value) && (
                      <div className="text-center py-12">
                        <FileText className="w-10 h-10 mx-auto text-[#0A0A0A]/10 mb-3" />
                        <p className="text-[#0A0A0A]/30 text-sm">Nenhum dado nesta seção</p>
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