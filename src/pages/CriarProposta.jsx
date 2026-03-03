import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import CardDadosCliente from '@/components/proposals/CardDadosCliente';
import CardTaxasCartao from '@/components/proposals/CardTaxasCartao';
import CardAntecipacao from '@/components/proposals/CardAntecipacao';
import CardOutrasTaxas from '@/components/proposals/CardOutrasTaxas';
import PropostaPreview from '@/components/proposals/PropostaPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(num) ? 0 : num;
};

export default function CriarProposta() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedBrand, setSelectedBrand] = useState('mastercard');

  // Form State
  const [form, setForm] = useState({
    clienteNome: '',
    clienteCnpj: '',
    clienteMcc: '',
    clienteContato: '',
    prazoRecebimento: 'D+1',
    usaAntecipacao: false,
    percentualAntecipacao: '',
    taxaAntecipacao: '', // RAV
    dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)),
  });

  const [rates, setRates] = useState({
    cartao: {}, // { mastercard: { avista: '', de2a6x: '', de7a12x: '' }, ... }
    pix: { tipo: 'percentual', valor: '' },
    boleto: '',
    feeTransacao: '',
    alertaPreChargeback: '',
    minimoGarantido: { mes1: '', mes2: '', mes3: '' },
  });

  // Fetch lead if coming from a lead
  const { data: lead } = useQuery({
    queryKey: ['lead-for-proposal', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0] || null;
    },
    enabled: !!leadId && !editId
  });

  // Fetch existing proposal for edit mode
  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-edit', editId],
    queryFn: async () => {
      const proposals = await base44.entities.Proposal.filter({ id: editId });
      return proposals[0] || null;
    },
    enabled: !!editId
  });

  // Pre-fill form from existing proposal (edit mode)
  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '',
        clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '',
        clienteContato: existingProposal.clienteContato || '',
        prazoRecebimento: existingProposal.rates?.rav?.prazo || 'D+1',
        usaAntecipacao: !!existingProposal.rates?.rav?.taxa,
        percentualAntecipacao: existingProposal.rates?.percentualAntecipacao || '',
        taxaAntecipacao: existingProposal.rates?.rav?.taxa || '',
        dataValidade: existingProposal.validUntil ? new Date(existingProposal.validUntil) : new Date(),
      });
      
      const r = existingProposal.rates || {};
      
      // Reconstruct cartao rates structure if needed
      let cartaoRates = r.cartao || {};
      
      setRates({
        cartao: cartaoRates,
        pix: r.pix || { tipo: 'percentual', valor: '' },
        boleto: r.boleto || '',
        feeTransacao: r.feeTransacao || '',
        alertaPreChargeback: r.alertaPreChargeback || r.antifraude || '',
        minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido || '', mes2: r.minimoGarantido || '', mes3: r.minimoGarantido || '' },
      });
    }
  }, [existingProposal]);

  // Pre-fill form from lead
  useEffect(() => {
    if (lead && !editId) {
      setForm(prev => ({
        ...prev,
        clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '',
        clienteContato: lead.contactName || '',
      }));
    }
  }, [lead, editId]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateRates = (newRates) => {
    setRates(newRates);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = 'Obrigatório';
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) {
      newErrors.clienteCnpj = 'CNPJ inválido (14 dígitos)';
    }
    if (!form.clienteMcc) newErrors.clienteMcc = 'Obrigatório';
    if (!form.clienteContato) newErrors.clienteContato = 'Obrigatório';

    // Validate at least one card rate if any card rate is filled
    const hasAnyCardRate = Object.values(rates.cartao || {}).some(b =>
      b && (b.avista || b.de2a6x || b.de7a12x)
    );
    if (!hasAnyCardRate) newErrors.cartao = 'Preencha ao menos uma taxa de cartão';

    // Validate PIX if filled
    if (rates.pix?.valor && isNaN(parseTaxa(rates.pix.valor))) newErrors.pix = 'Valor inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `PROP-${year}-${seq}`;
  };

  const gerarToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  };

  const buildPropostaData = async (status) => {
    const taxas = rates.cartao || {};

    // Build granular credit rates per bandeira for backend compatibility
    const credito_1x = {};
    const credito_2_6x = {};
    const credito_7_12x = {};
    const debito = {};

    ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(bandeira => {
      const b = taxas[bandeira] || {};
      credito_1x[bandeira] = parseTaxa(b.avista);
      credito_2_6x[bandeira] = parseTaxa(b.de2a6x);
      credito_7_12x[bandeira] = parseTaxa(b.de7a12x);
      // Estimate debit as 60% of credit sight if not provided (logic kept from previous version)
      debito[bandeira] = Math.round(parseTaxa(b.avista) * 0.6 * 100) / 100;
    });

    let criadoPor = 'sistema';
    try {
      const user = await base44.auth.me();
      criadoPor = user?.email || user?.id || 'sistema';
    } catch (e) { /* ignore */ }

    return {
      leadId: leadId || '',
      codigo: existingProposal?.codigo || gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`,
      status,
      origem: 'manual',
      clienteNome: form.clienteNome,
      clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato,
      clienteMcc: form.clienteMcc,
      rates: {
        cartao: taxas,
        credito_1x,
        credito_2_6x,
        credito_7_12x,
        debito,
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto),
        antifraude: parseTaxa(rates.alertaPreChargeback),
        feeTransacao: parseTaxa(rates.feeTransacao),
        alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        minimoGarantido: {
          mes1: parseTaxa(rates.minimoGarantido?.mes1),
          mes2: parseTaxa(rates.minimoGarantido?.mes2),
          mes3: parseTaxa(rates.minimoGarantido?.mes3)
        },
        rav: { taxa: parseTaxa(form.taxaAntecipacao), prazo: form.prazoRecebimento },
        percentualAntecipacao: parseTaxa(form.percentualAntecipacao),
      },
      validUntil: form.dataValidade.toISOString(),
      tokenPublico: existingProposal?.tokenPublico || gerarToken(),
      responsavelId: criadoPor,
      responsavelNome: criadoPor,
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    try {
      const data = await buildPropostaData('rascunho');
      if (editId) {
        await base44.entities.Proposal.update(editId, data);
        toast.success('Rascunho atualizado!');
      } else {
        await base44.entities.Proposal.create(data);
        toast.success('Rascunho salvo!');
      }
      navigate(createPageUrl('GestaoPropostas'));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  };

  const handleGerarProposta = async () => {
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const data = await buildPropostaData('rascunho'); // Initially draft/waiting validation logic
      let created;
      if (editId) {
        await base44.entities.Proposal.update(editId, data);
        created = { id: editId };
      } else {
        created = await base44.entities.Proposal.create(data);
      }

      // Audit Log
      await base44.entities.AuditLog.create({
        entityName: 'Proposal',
        entityId: created.id,
        actionType: 'CREATE',
        actionDescription: `Proposta ${data.codigo} gerada para ${data.clienteNome}`,
        changedBy: data.responsavelNome || 'admin',
        changeDate: new Date().toISOString(),
        details: { codigo: data.codigo, clienteNome: data.clienteNome, status: data.status }
      });

      if (leadId) {
        await base44.entities.Lead.update(leadId, {
          currentProposalId: created.id,
          status: 'proposta_enviada',
          lastInteractionDate: new Date().toISOString()
        });
        await base44.entities.LeadActivity.create({
          leadId,
          activityType: 'proposta_criada',
          description: `Proposta ${data.codigo} criada`,
          performedBy: data.responsavelNome || 'admin',
          activityDate: new Date().toISOString()
        });
      }

      toast.success('Proposta gerada com sucesso!');
      navigate(createPageUrl('GestaoPropostas'));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar proposta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 font-sans">
      <style>{`
        /* Dark Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #18181b; 
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }
        
        /* Input autofill fix for dark mode */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #18181b inset !important;
            -webkit-text-fill-color: white !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#09090b] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            {editId ? 'Editar Proposta' : 'Criar Nova Proposta'}
          </h1>
        </div>
        <Button 
          variant="outline" 
          onClick={handleSalvarRascunho} 
          disabled={saving}
          className="bg-transparent border-white/20 text-white hover:bg-white/10"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Rascunho
        </Button>
      </div>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Column - Form */}
        <ScrollArea className="flex-1 border-r border-white/10">
          <div className="p-6 space-y-6 pb-32">
            <CardDadosCliente 
              form={form} 
              errors={errors} 
              onUpdate={updateForm} 
            />
            
            <CardTaxasCartao 
              rates={rates} 
              onUpdateRates={updateRates} 
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
            />
            
            <CardAntecipacao 
              form={form} 
              onUpdate={updateForm} 
            />
            
            <CardOutrasTaxas 
              rates={rates} 
              onUpdateRates={updateRates} 
            />
          </div>
        </ScrollArea>

        {/* Right Column - Preview */}
        <div className="w-[480px] bg-[#0c0c0e] border-l border-white/5 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
             <PropostaPreview 
               form={form} 
               rates={rates} 
               selectedBrand={selectedBrand}
               onBandeiraChange={setSelectedBrand}
             />
             
             {/* Analysis Placeholder (since user asked to exclude logic but keep layout, we can show empty state or just the summary) */}
             <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
               <div className="flex items-center gap-2 text-yellow-500 mb-2">
                 <AlertTriangle className="w-4 h-4" />
                 <h3 className="text-sm font-semibold">Análise de Rentabilidade</h3>
               </div>
               <p className="text-xs text-slate-400">
                 A análise de rentabilidade será calculada após a geração da proposta.
               </p>
             </div>
          </div>
          
          <div className="p-6 border-t border-white/10 bg-[#0c0c0e]">
             <div className="grid grid-cols-2 gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => navigate(-1)}
                 className="border-white/20 text-white hover:bg-white/10 hover:text-white"
               >
                 Cancelar
               </Button>
               <Button
                 onClick={handleGerarProposta}
                 disabled={saving}
                 className="bg-[#2bc196] hover:bg-[#25a983] text-white"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                 Gerar Proposta
               </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}