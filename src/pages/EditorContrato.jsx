import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Eye, FileText, Users, Layers, DollarSign, 
  Shield, PenTool, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import ClienteForm from '@/components/contrato/ClienteForm';
import ModulosForm from '@/components/contrato/ModulosForm';
import PrecosForm from '@/components/contrato/PrecosForm';
import SLAsForm from '@/components/contrato/SLAsForm';
import AssinaturaForm from '@/components/contrato/AssinaturaForm';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';

const STATUS_CONFIG = {
  pre_generated: { label: 'Pré-gerado', color: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'Em Revisão', color: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-800' },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  signed: { label: 'Assinado', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function EditorContrato() {
  const urlParams = new URLSearchParams(window.location.search);
  const contractId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cliente');
  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const contracts = await base44.entities.Contract.filter({ id: contractId });
      return contracts?.[0] || null;
    },
    enabled: !!contractId,
  });

  useEffect(() => {
    if (contract && !formData) {
      setFormData({ ...contract });
    }
  }, [contract]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.created_date;
      delete updateData.updated_date;
      delete updateData.created_by;
      if (updateData.status === 'pre_generated') {
        updateData.status = 'under_review';
      }
      return base44.entities.Contract.update(contractId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      setHasChanges(false);
      toast.success('Contrato salvo com sucesso!');
    },
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleGenerateContract = () => {
    // Salvar primeiro, depois navegar para preview
    const updateData = { ...formData };
    delete updateData.id;
    delete updateData.created_date;
    delete updateData.updated_date;
    delete updateData.created_by;
    updateData.status = 'ready';

    base44.entities.Contract.update(contractId, updateData).then(() => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      navigate(createPageUrl(`PreviewContrato?id=${contractId}`));
    });
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  const missingCount = formData.missingFields?.length || 0;
  const preFilledCount = formData.preFilledFields?.length || 0;
  const statusCfg = STATUS_CONFIG[formData.status] || STATUS_CONFIG.pre_generated;

  const TABS = [
    { id: 'cliente', label: 'Cliente', icon: Users },
    { id: 'modulos', label: 'Módulos', icon: Layers },
    { id: 'precos', label: 'Preços', icon: DollarSign },
    { id: 'slas', label: 'SLAs', icon: Shield },
    { id: 'assinatura', label: 'Assinatura', icon: PenTool },
  ];

  return (
    <div className="flex h-screen overflow-hidden -m-4 lg:-m-8">
      {/* Left Column - Forms */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f4f4]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#002443]/5 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('GestaoContratos'))} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#002443]">Editor de Contrato</h1>
                <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
              </div>
              <p className="text-xs text-[#002443]/50">
                {formData.codigo || '---'} • {formData.clientName || 'Sem nome'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge className="bg-amber-100 text-amber-700">Alterações não salvas</Badge>
            )}
            <Button variant="outline" onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="rounded-xl border-[#002443]/10 text-sm">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
            <Button onClick={handleGenerateContract} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl px-5 font-bold">
              <Eye className="w-4 h-4 mr-2" /> Gerar Contrato
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 px-6 py-2 bg-white border-b border-[#002443]/5 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">{preFilledCount} campos preenchidos</span>
          </div>
          {missingCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">{missingCount} pendentes</span>
            </div>
          )}
          {formData.proposalLocked && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Taxas travadas</span>
            </div>
          )}
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
                <ClienteForm contract={formData} onChange={handleFieldChange} preFilledFields={formData.preFilledFields || []} />
              </TabsContent>
              <TabsContent value="modulos" className="mt-0">
                <ModulosForm contract={formData} onChange={handleFieldChange} />
              </TabsContent>
              <TabsContent value="precos" className="mt-0">
                <PrecosForm contract={formData} onChange={handleFieldChange} preFilledFields={formData.preFilledFields || []} />
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

      {/* Right Column - Preview do Contrato */}
      <div className="w-[520px] bg-white border-l border-[#002443]/10 flex flex-col shrink-0 hidden lg:flex">
        <div className="px-6 py-3 border-b border-[#002443]/5 bg-[#002443]/[0.02]">
          <h2 className="text-sm font-bold text-[#002443]">Preview do Contrato</h2>
          <p className="text-[10px] text-[#002443]/40">Atualizado em tempo real conforme preenchimento</p>
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