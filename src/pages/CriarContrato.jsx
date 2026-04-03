import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Eye, Loader2, Users, Layers, DollarSign, Shield, PenTool } from 'lucide-react';
import { toast } from 'sonner';

import ClienteForm from '@/components/contrato/ClienteForm';
import ModulosForm from '@/components/contrato/ModulosForm';
import PrecosForm from '@/components/contrato/PrecosForm';
import SLAsForm from '@/components/contrato/SLAsForm';
import AssinaturaForm from '@/components/contrato/AssinaturaForm';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';

const TABS = [
  { id: 'cliente', label: 'Cliente', icon: Users },
  { id: 'modulos', label: 'Módulos', icon: Layers },
  { id: 'precos', label: 'Preços', icon: DollarSign },
  { id: 'slas', label: 'SLAs', icon: Shield },
  { id: 'assinatura', label: 'Assinatura', icon: PenTool },
];

export default function CriarContrato() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cliente');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pre_generated',
    clientName: '', clientDocument: '', clientAddress: '', clientCity: '', clientState: '', clientZipCode: '',
    clientEmail: '', clientPhone: '', clientRepresentativeName: '', clientRepresentativeRole: '', clientRepresentativeCPF: '',
    modules: {}, otherModules: '',
    rates: { cartao: {}, debito: {}, pix: { tipo: 'percentual', valor: null }, boleto: null, antifraude: null, feeTransacao: null, rav: { taxa: null, prazo: '' }, percentualAntecipacao: null, alertaPreChargeback: null },
    projectedTpvMonth1: null, projectedTpvMonth2: null, projectedTpvMonth3: null,
    setupFee: 6000, paymentTerm: '', bankInstitution: '', bankAgency: '', bankAccountNumber: '',
    accountMaintenanceFee: null, cardWithdrawalFee: null, tedDocTransferFee: null, physicalCardIssuanceFee: null, physicalCard2ndCopyFee: null,
    slaUptime: '', slaResponseTime: '', supportCriticalSLA: '', supportHighSLA: '', supportMediumSLA: '', supportLowSLA: '',
    pixRiskReservePercentage: null, pixRiskReserveDays: null, cardRiskReservePercentage: null, cardRiskReserveDays: null, cardRiskReservePartialReleaseDays: null,
    chargebackFee: null, chargebackThreshold: null,
    contractDate: '', contractDurationMonths: null,
    earlyTerminationPenaltyPercentage: null, earlyTerminationPenaltyMaxAmount: null,
    pagsmileEarlyTerminationPenaltyPercentage: null, pagsmileEarlyTerminationPenaltyMaxAmount: null,
    pagsmileRepresentativeName: '', pagsmileRepresentativeRole: '', pagsmileRepresentativeCPF: '',
    witness1Name: '', witness1CPF: '', witness2Name: '', witness2CPF: '',
    customClauses: '', clientSuggestions: '',
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const gerarCodigo = () => `CONTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarPublicCode = () => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 32; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; };

  const buildContractData = async (status) => {
    const data = { ...formData };
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by;
    data.status = status;
    data.codigo = data.codigo || gerarCodigo();
    data.publicLinkCode = data.publicLinkCode || gerarPublicCode();
    data.clientCnpj = data.clientDocument?.replace(/\D/g, '') || '';
    try {
      const user = await base44.auth.me();
      if (user) {
        data.responsavelId = user.id || user.email || '';
        data.responsavelNome = user.full_name || user.email || 'sistema';
      }
    } catch {}
    return data;
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = await buildContractData('pre_generated');
    await base44.entities.Contract.create(data);
    toast.success('Rascunho de contrato salvo!');
    setSaving(false);
    navigate(createPageUrl('GestaoContratos'));
  };

  const handleGerarContrato = async () => {
    if (!formData.clientName || !formData.clientDocument) {
      toast.error('Preencha ao menos o nome e CNPJ do contratante');
      return;
    }
    setSaving(true);
    const data = await buildContractData('ready');
    const created = await base44.entities.Contract.create(data);
    toast.success('Contrato gerado com sucesso!');
    setSaving(false);
    navigate(createPageUrl(`PreviewContrato?id=${created.id}`));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Column - Forms */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f4f4]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#002443]/5 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('GestaoContratos'))} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-[#002443]">Criar Contrato Avulso</h1>
              <p className="text-xs text-[#002443]/50">Preencha os dados e veja o preview em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSalvarRascunho} disabled={saving} className="rounded-xl border-[#002443]/10 text-sm">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Rascunho
            </Button>
            <Button onClick={handleGerarContrato} disabled={saving} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl px-5 font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />} Gerar Contrato
            </Button>
          </div>
        </div>

        {/* Tabs + Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start bg-white border border-[#002443]/5 p-1 rounded-xl mb-4">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#002443] rounded-lg">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
              <TabsContent value="cliente" className="mt-0">
                <ClienteForm contract={formData} onChange={handleFieldChange} preFilledFields={[]} />
              </TabsContent>
              <TabsContent value="modulos" className="mt-0">
                <ModulosForm contract={formData} onChange={handleFieldChange} />
              </TabsContent>
              <TabsContent value="precos" className="mt-0">
                <PrecosForm contract={formData} onChange={handleFieldChange} preFilledFields={[]} />
              </TabsContent>
              <TabsContent value="slas" className="mt-0">
                <SLAsForm contract={formData} onChange={handleFieldChange} />
              </TabsContent>
              <TabsContent value="assinatura" className="mt-0">
                <AssinaturaForm contract={formData} onChange={handleFieldChange} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="w-[520px] bg-white border-l border-[#002443]/10 flex flex-col shrink-0 hidden lg:flex">
        <div className="px-6 py-3 border-b border-[#002443]/5 bg-[#002443]/[0.02]">
          <h2 className="text-sm font-bold text-[#002443]">Preview do Contrato</h2>
          <p className="text-[10px] text-[#002443]/40">Atualizado em tempo real</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="transform scale-[0.65] origin-top-left w-[154%]">
            <ConteudoContrato contract={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}