import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Building2, User, DollarSign, MapPin, Globe, Briefcase,
  X, Copy, CheckCircle, FileText, Rocket, Phone, Mail, ExternalLink,
  BarChart3, Percent
} from 'lucide-react';

const SECTIONS = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, accent: 'bg-blue-500' },
  { id: 'contato', label: 'Contato', icon: User, accent: 'bg-violet-500' },
  { id: 'endereco', label: 'Endereço', icon: MapPin, accent: 'bg-amber-500' },
  { id: 'volumetria', label: 'Volumetria', icon: BarChart3, accent: 'bg-emerald-500' },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, accent: 'bg-indigo-500' },
  { id: 'origem', label: 'Origem & Rastreio', icon: Rocket, accent: 'bg-rose-500' },
];

function FieldRow({ label, value, isLink, isMoney }) {
  const [copied, setCopied] = useState(false);
  if (value === null || value === undefined || value === '') return null;

  const displayValue = isMoney
    ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : String(value);

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
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {value}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : isMoney ? (
          <span className="text-lg font-bold text-emerald-600 tracking-tight">{displayValue}</span>
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

function DistributionBar({ dist }) {
  if (!dist) return null;
  const items = [
    { label: 'Cartão', value: dist.cartao, color: '#3b82f6' },
    { label: 'PIX', value: dist.pix, color: '#2bc196' },
    { label: 'Boleto', value: dist.boleto, color: '#8b5cf6' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden">
        {items.map(i => i.value > 0 && (
          <div key={i.label} style={{ width: `${i.value}%`, backgroundColor: i.color }} className="transition-all" />
        ))}
      </div>
      <div className="flex gap-4">
        {items.map(i => (
          <div key={i.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i.color }} />
            <span className="text-xs text-[#002443]/70">{i.label}: <strong>{i.value}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StandardProposalResponsesModal({ open, onClose, record }) {
  const [activeSection, setActiveSection] = useState('empresa');

  if (!record) return null;

  const addr = record.endereco || {};

  const sectionContent = {
    empresa: [
      { label: 'CNPJ', value: record.cnpj },
      { label: 'Razão Social', value: record.razaoSocial },
      { label: 'Nome Fantasia', value: record.nomeFantasia },
      { label: 'Website', value: record.website, isLink: true },
    ],
    contato: [
      { label: 'Nome do Responsável', value: record.contactName },
      { label: 'Cargo', value: record.contactRole },
      { label: 'E-mail', value: record.email },
      { label: 'Telefone', value: record.phone },
    ],
    endereco: [
      { label: 'CEP', value: addr.cep },
      { label: 'Logradouro', value: addr.logradouro },
      { label: 'Número', value: addr.numero },
      { label: 'Complemento', value: addr.complemento },
      { label: 'Bairro', value: addr.bairro },
      { label: 'Cidade', value: addr.cidade },
      { label: 'UF', value: addr.uf },
    ],
    volumetria: 'VOLUMETRIA',
    negocio: [
      { label: 'Modelo de Negócio', value: record.modeloNegocio },
      { label: 'O que os sellers/clientes vendem', value: record.sellersDescription },
      { label: 'Fornecedores', value: record.fornecedores },
    ],
    origem: [
      { label: 'Segmento da Proposta', value: record.segment },
      { label: 'Tipo de Negócio', value: record.businessSubCategory },
      { label: 'Introducer', value: record.introducerName },
      { label: 'Agente Comercial', value: record.commercialAgentName },
    ],
  };

  const countFilled = (sectionId) => {
    if (sectionId === 'volumetria') {
      return (record.tpvMensal ? 1 : 0) + (record.distribuicaoTpv ? 1 : 0);
    }
    const fields = sectionContent[sectionId];
    if (!Array.isArray(fields)) return 0;
    return fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length;
  };

  const totalFilled = SECTIONS.reduce((sum, s) => sum + countFilled(s.id), 0);
  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-white border-[#e2e8f0] max-h-[92vh] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#002443] to-[#003366]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2bc196]/20 flex items-center justify-center border border-[#2bc196]/30">
                  <Rocket className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{record.razaoSocial || record.nomeFantasia || 'Lead'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {record.cnpj && <span className="text-xs text-white/50 font-mono">{record.cnpj}</span>}
                    <Badge className="bg-[#2bc196]/15 text-[#2bc196] border-[#2bc196]/30 text-[10px] px-2 py-0.5">
                      Proposta Padrão
                    </Badge>
                    {record.segment && (
                      <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] px-2 py-0.5">
                        {record.segment}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2bc196]" />
                  <strong className="text-white/90">{totalFilled}</strong> campos preenchidos
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {SECTIONS.length} seções
                </span>
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
                {currentSection && (
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e2e8f0]">
                    <div className={`w-9 h-9 rounded-xl ${currentSection.accent} flex items-center justify-center shadow-sm`}>
                      <currentSection.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#002443]">{currentSection.label}</h3>
                      <p className="text-[11px] text-[#002443]/40">
                        {countFilled(activeSection)} campos com dados
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'volumetria' ? (
                  <div className="space-y-5">
                    <FieldRow label="TPV Mensal Estimado" value={record.tpvMensal} isMoney />
                    <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-5">
                      <p className="text-xs text-[#002443]/55 font-medium mb-3">Distribuição do TPV</p>
                      <DistributionBar dist={record.distribuicaoTpv} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(sectionContent[activeSection] || []).map((field, idx) => (
                      <FieldRow key={idx} {...field} />
                    ))}
                    {(sectionContent[activeSection] || []).every(f => !f.value) && (
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