import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import CardDadosCliente from '@/components/proposals/CardDadosCliente';
import PartnerSelector from '@/components/proposals/PartnerSelector';
import CardTaxasCartao from '@/components/proposals/CardTaxasCartao';
import MccTabsManager from '@/components/proposals/MccTabsManager';
import { normalizeMccCartao } from '@/components/proposals/proposalMccHelpers';
import CardAntecipacao from '@/components/proposals/CardAntecipacao';
import CardOutrasTaxas from '@/components/proposals/CardOutrasTaxas';
import CardTaxasMaquininha from '@/components/proposals/CardTaxasMaquininha';
import ProfitabilityPanel from '@/components/proposals/ProfitabilityPanel';
import PropostaPreview from '@/components/proposals/PropostaPreview';
import CopyRatesModal from '@/components/proposals/CopyRatesModal';
import SegmentRatesLoader from '@/components/proposals/SegmentRatesLoader';
import FinalRateOverridesEditor from '@/components/proposals/FinalRateOverridesEditor';
import CardReservaFinanceira from '@/components/proposals/CardReservaFinanceira';
import { getReservaForSegment, getReservaWithDefaults } from '@/lib/reservaFinanceiraDefaults';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  // Remove pontos de milhar e troca vírgula decimal por ponto
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function CriarProposta() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const templateFromId = urlParams.get('templateFromId');
  const [saving, setSaving] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedBrand, setSelectedBrand] = useState('mastercard');
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [selectedMccCode, setSelectedMccCode] = useState('');

  const [form, setForm] = useState({
    clienteNome: '', clienteCnpj: '', clienteMcc: '', clienteContato: '',
    businessSubCategory: '',
    prazoRecebimento: 'D+1', usaAntecipacao: false, percentualAntecipacao: 80,
    taxaAntecipacao: '',
    dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)),
    taxaFinalOverrides: {},
    hideCalculationColumns: false,
    hideRange13a21: false,
  });

  const [rates, setRates] = useState({
    cartao: {},
    cartaoPorMcc: [],
    pix: { tipo: 'percentual', valor: '' },
    boleto: '', feeTransacao: '', antifraude: '', alertaPreChargeback: '', taxa3ds: '', setup: '', forex: '',
    minimoGarantido: { mes1: '', mes2: '', mes3: '' },
    // Reserva Financeira (Rolling Reserve) — default = sem segmento ainda (5%/1%).
    // Será sobrescrita quando o lead vier com businessSubCategory, ou quando o
    // vendedor selecionar um segmento no SegmentRatesLoader.
    reservaFinanceira: getReservaForSegment(null),
    // Maquininha (POS presencial) só existe se "Processamento com maquininha" estiver ativo.
    // Tem taxas próprias, distintas das taxas online: crédito (1x, 2-6x, 7-12x) + débito por bandeira.
    usaMaquininha: false,
    maquininha: {
      credito: {},
      debito: {},
      alugueis: {
        posComum: { valor: '', isencaoAtiva: false, faturamentoMinimoIsencao: '' },
        smartPos: { valor: '' },
      },
    },
  });

  const usePriscila = urlParams.get('usePriscila') === '1';

  const { data: templateProposal } = useQuery({
    queryKey: ['template-proposal', templateFromId],
    queryFn: async () => { const proposals = await base44.entities.Proposal.filter({ id: templateFromId }); return proposals[0] || null; },
    enabled: !!templateFromId && !editId
  });

  const applyCopiedRates = (sourceProposal) => {
    if (!sourceProposal?.rates) { toast.error(t('criar_prop.no_rates')); return; }
    const r = sourceProposal.rates;
    setForm(prev => ({
      ...prev,
      prazoRecebimento: r.rav?.prazo || prev.prazoRecebimento,
      usaAntecipacao: !!r.rav?.taxa,
      percentualAntecipacao: r.percentualAntecipacao ?? prev.percentualAntecipacao,
      taxaAntecipacao: r.rav?.taxa ?? prev.taxaAntecipacao,
    }));
    // Maquininha só vem copiada se a proposta de origem tinha maquininha explicitamente ativa.
    const hasMaquininha = r.usaMaquininha === true && r.maquininha && (
      Object.keys(r.maquininha.credito || {}).length > 0 || Object.keys(r.maquininha.debito || {}).length > 0
    );
    setRates({
      cartao: r.cartao || {},
      cartaoPorMcc: Array.isArray(r.cartaoPorMcc) ? r.cartaoPorMcc : [],
      pix: r.pix || { tipo: 'percentual', valor: '' },
      boleto: r.boleto ?? '',
      feeTransacao: r.feeTransacao ?? '',
      antifraude: r.antifraude ?? '',
      alertaPreChargeback: r.alertaPreChargeback ?? '',
      taxa3ds: r.taxa3ds ?? '',
      setup: r.setup ?? '',
      forex: r.forex ?? '',
      minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido ?? '', mes2: r.minimoGarantido ?? '', mes3: r.minimoGarantido ?? '' },
      // Reserva Financeira — copia da proposta de origem (preserva escolha do vendedor).
      // Se origem não tinha → usa default do segmento; se nem segmento → fallback (5%/1%).
      reservaFinanceira: r.reservaFinanceira
        ? getReservaWithDefaults(r)
        : getReservaForSegment(sourceProposal.businessSubCategory),
      usaMaquininha: hasMaquininha,
      maquininha: hasMaquininha
        ? {
            credito: r.maquininha.credito || {},
            debito: r.maquininha.debito || {},
            alugueis: {
              posComum: r.maquininha.alugueis?.posComum || { valor: '', isencaoAtiva: false, faturamentoMinimoIsencao: '' },
              smartPos: r.maquininha.alugueis?.smartPos || { valor: '' },
            },
          }
        : {
            credito: {}, debito: {},
            alugueis: { posComum: { valor: '', isencaoAtiva: false, faturamentoMinimoIsencao: '' }, smartPos: { valor: '' } },
          },
    });
    toast.success(t('criar_prop.rates_copied'));
  };

  useEffect(() => {
    if (templateProposal) applyCopiedRates(templateProposal);
  }, [templateProposal]);

  const { data: lead } = useQuery({
    queryKey: ['lead-for-proposal', leadId],
    queryFn: async () => { const leads = await base44.entities.Lead.filter({ id: leadId }); return leads[0] || null; },
    enabled: !!leadId && !editId
  });

  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-edit', editId],
    queryFn: async () => { const proposals = await base44.entities.Proposal.filter({ id: editId }); return proposals[0] || null; },
    enabled: !!editId
  });

  // FIX BUG #1: When editing a proposal that has no leadId but has a CNPJ,
  // try to find the matching Lead and auto-link it. Also useful when comercial
  // creates a proposal for a CNPJ that already exists as a Lead.
  const [autoLinkedLeadId, setAutoLinkedLeadId] = useState(null);
  useEffect(() => {
    const cnpj = (form.clienteCnpj || '').replace(/\D/g, '');
    const alreadyHasLead = leadId || existingProposal?.leadId || autoLinkedLeadId;
    if (alreadyHasLead || !cnpj || cnpj.length !== 14) return;
    (async () => {
      try {
        const leads = await base44.entities.Lead.filter({ cpfCnpj: cnpj });
        if (leads.length > 0) {
          setAutoLinkedLeadId(leads[0].id);
          toast.info(`Lead vinculado automaticamente: ${leads[0].fullName || leads[0].companyName || cnpj}`);
        }
      } catch {}
    })();
  }, [form.clienteCnpj, leadId, existingProposal?.leadId, autoLinkedLeadId]);

  // Effective leadId: priority URL param → existing proposal → auto-linked by CNPJ
  const effectiveLeadId = leadId || existingProposal?.leadId || autoLinkedLeadId || '';

  // Load all active partners for the selected partner
  const { data: allPartners = [] } = useQuery({
    queryKey: ['partners-active'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
  });
  const selectedPartner = allPartners.find(p => p.id === selectedPartnerId) || null;

  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '', clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '', clienteContato: existingProposal.clienteContato || '',
        businessSubCategory: existingProposal.businessSubCategory || '',
        prazoRecebimento: existingProposal.rates?.rav?.prazo || 'D+1',
        usaAntecipacao: !!existingProposal.rates?.rav?.taxa,
        percentualAntecipacao: existingProposal.rates?.percentualAntecipacao ?? 80,
        taxaAntecipacao: existingProposal.rates?.rav?.taxa || '',
        dataValidade: existingProposal.validUntil ? new Date(existingProposal.validUntil) : new Date(),
        taxaFinalOverrides: existingProposal.taxaFinalOverrides || {},
        hideCalculationColumns: existingProposal.hideCalculationColumns || false,
        hideRange13a21: existingProposal.hideRange13a21 || false,
      });
      const r = existingProposal.rates || {};
      // Maquininha só é considerada se a proposta tiver "usaMaquininha=true" gravado (novo formato).
      // Propostas antigas tinham débito automático (60% da à vista) — agora ignoramos esse campo legado.
      const hasMaquininha = r.usaMaquininha === true && r.maquininha && (
        Object.keys(r.maquininha.credito || {}).length > 0 || Object.keys(r.maquininha.debito || {}).length > 0
      );
      setRates({
        cartao: r.cartao || {},
        cartaoPorMcc: Array.isArray(r.cartaoPorMcc) ? r.cartaoPorMcc : [],
        pix: r.pix || { tipo: 'percentual', valor: '' },
        boleto: r.boleto || '', feeTransacao: r.feeTransacao || '',
        antifraude: r.antifraude || '', alertaPreChargeback: r.alertaPreChargeback || '',
        taxa3ds: r.taxa3ds || '', setup: r.setup || '', forex: r.forex || '',
        minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido || '', mes2: r.minimoGarantido || '', mes3: r.minimoGarantido || '' },
        // Reserva Financeira — usa a gravada na proposta ou cai no default do segmento.
        reservaFinanceira: r.reservaFinanceira
          ? getReservaWithDefaults(r)
          : getReservaForSegment(existingProposal.businessSubCategory),
        usaMaquininha: hasMaquininha,
        maquininha: hasMaquininha
          ? {
              credito: r.maquininha.credito || {},
              debito: r.maquininha.debito || {},
              alugueis: {
                posComum: r.maquininha.alugueis?.posComum || { valor: '', isencaoAtiva: false, faturamentoMinimoIsencao: '' },
                smartPos: r.maquininha.alugueis?.smartPos || { valor: '' },
              },
            }
          : {
              credito: {}, debito: {},
              alugueis: { posComum: { valor: '', isencaoAtiva: false, faturamentoMinimoIsencao: '' }, smartPos: { valor: '' } },
            },
      });
      if (existingProposal.chosenPartnerId) {
        setSelectedPartnerId(existingProposal.chosenPartnerId);
      }
    }
  }, [existingProposal]);

  useEffect(() => {
    if (lead && !editId) {
      setForm(prev => ({
        ...prev, clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '', clienteContato: lead.contactName || '',
        businessSubCategory: lead.businessSubCategory || prev.businessSubCategory,
      }));

      // Aplica reserva financeira default do segmento do lead (regra v2026-05-13).
      // Vendedor pode editar depois, mas o ponto de partida vem do segmento.
      if (lead.businessSubCategory) {
        setRates(prev => ({ ...prev, reservaFinanceira: getReservaForSegment(lead.businessSubCategory) }));
      }

      // Auto-preencher com taxas da PRISCILA se usePriscila=1
      if (usePriscila && lead.priscilaAnalysisReport?.taxasSugeridas) {
        const tx = lead.priscilaAnalysisReport.taxasSugeridas;
        setRates(prev => ({
          ...prev,
          cartao: tx.cartao || prev.cartao,
          pix: tx.pix || prev.pix,
          boleto: tx.boleto ?? prev.boleto,
          feeTransacao: tx.feeTransacao ?? prev.feeTransacao,
          antifraude: tx.antifraude ?? prev.antifraude,
          alertaPreChargeback: tx.alertaPreChargeback ?? prev.alertaPreChargeback,
          minimoGarantido: tx.minimoGarantido || prev.minimoGarantido,
        }));
        if (tx.rav?.prazo) setForm(prev => ({ ...prev, prazoRecebimento: tx.rav.prazo }));
        if (tx.rav?.taxa) setForm(prev => ({ ...prev, taxaAntecipacao: tx.rav.taxa, usaAntecipacao: true }));
        if (tx.percentualAntecipacao) setForm(prev => ({ ...prev, percentualAntecipacao: tx.percentualAntecipacao }));
        toast.success(t('criar_prop.priscila_applied'));
      }
    }
  }, [lead, editId, usePriscila]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    // Quando o vendedor troca o segmento manualmente, atualiza a reserva financeira
    // para o default do novo segmento — desde que ele ainda não tenha customizado.
    if (field === 'businessSubCategory' && value) {
      setRates(prev => ({ ...prev, reservaFinanceira: getReservaForSegment(value) }));
    }
  };
  const updateRates = (newRates) => setRates(newRates);

  const validate = () => {
    const newErrors = {};
    const missingLabels = [];
    if (!form.clienteNome) { newErrors.clienteNome = t('criar_prop.required'); missingLabels.push('Nome do cliente'); }
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) { newErrors.clienteCnpj = t('criar_prop.invalid_cnpj'); missingLabels.push('CNPJ válido'); }
    if (!form.clienteMcc) { newErrors.clienteMcc = t('criar_prop.required'); missingLabels.push('MCC'); }
    if (!form.clienteContato) { newErrors.clienteContato = t('criar_prop.required'); missingLabels.push('Contato'); }
    if (!form.businessSubCategory) { newErrors.businessSubCategory = t('criar_prop.select_business'); missingLabels.push('Segmento de negócio'); }
    const hasAnyCardRate = Object.values(rates.cartao || {}).some(b => b && (b.avista || b.de2a6x || b.de7a12x));
    if (!hasAnyCardRate) { newErrors.cartao = t('criar_prop.fill_card_rate'); missingLabels.push('Pelo menos uma taxa de cartão (qualquer bandeira)'); }
    if (rates.pix?.valor && isNaN(parseTaxa(rates.pix.valor))) { newErrors.pix = t('criar_prop.invalid_value'); missingLabels.push('Taxa PIX (valor inválido)'); }
    setErrors(newErrors);
    if (missingLabels.length > 0) {
      // Mostra exatamente o que falta — toast persistente até o usuário fechar.
      toast.error(`Preencha: ${missingLabels.join(' • ')}`, { duration: 8000 });
      // Faz scroll até o primeiro campo com erro (usa data-field ou class de borda vermelha).
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.querySelector(`[data-field="${firstErrorField}"], [name="${firstErrorField}"], .border-red-400, .border-red-500`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarToken = () => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 64; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; };

  const buildPropostaData = async (status) => {
    const taxasRaw = rates.cartao || {};
    // Converter TODAS as taxas de cartão de string para number
    const cartaoNumerico = {};
    const credito_1x = {}, credito_2_6x = {}, credito_7_12x = {}, credito_13_21x = {};
    ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(b => {
      const d = taxasRaw[b] || {};
      const av = parseTaxa(d.avista), p26 = parseTaxa(d.de2a6x), p712 = parseTaxa(d.de7a12x), p1321 = parseTaxa(d.de13a21x);
      cartaoNumerico[b] = { avista: av, de2a6x: p26, de7a12x: p712, de13a21x: p1321 };
      credito_1x[b] = av; credito_2_6x[b] = p26; credito_7_12x[b] = p712; credito_13_21x[b] = p1321;
    });
    // Multi-MCC: se houver cartaoPorMcc, normaliza cada entrada (string→number).
    // Em modo single, fica array vazio. O array sempre é gravado para evitar lixo legado.
    const cartaoPorMccNumerico = Array.isArray(rates.cartaoPorMcc)
      ? rates.cartaoPorMcc.map(e => ({
          mcc: String(e.mcc || ''),
          mccLabel: e.mccLabel || '',
          cartao: normalizeMccCartao(e.cartao, parseTaxa),
        }))
      : [];
    // Maquininha só é gravada se "Processamento com maquininha" estiver ativo.
    // Caso contrário, NÃO inventamos débito (era 60% da à vista — bug antigo).
    const usaMaquininha = !!rates.usaMaquininha;
    let maquininhaPayload = null;
    if (usaMaquininha) {
      const mqCredito = {};
      const mqDebito = {};
      ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(b => {
        const c = rates.maquininha?.credito?.[b] || {};
        mqCredito[b] = {
          avista: parseTaxa(c.avista),
          de2a6x: parseTaxa(c.de2a6x),
          de7a12x: parseTaxa(c.de7a12x),
        };
        mqDebito[b] = parseTaxa(rates.maquininha?.debito?.[b]);
      });
      // Aluguel de equipamentos (POS Comum + Smart POS)
      const al = rates.maquininha?.alugueis || {};
      const alugueisPayload = {
        posComum: {
          valor: parseTaxa(al.posComum?.valor),
          isencaoAtiva: !!al.posComum?.isencaoAtiva,
          faturamentoMinimoIsencao: al.posComum?.isencaoAtiva ? parseTaxa(al.posComum?.faturamentoMinimoIsencao) : 0,
        },
        smartPos: {
          valor: parseTaxa(al.smartPos?.valor),
        },
      };
      maquininhaPayload = { credito: mqCredito, debito: mqDebito, alugueis: alugueisPayload };
    }
    let criadoPor = 'sistema';
    let criadoPorNome = 'sistema';
    let criadoPorId = '';
    try { const user = await base44.auth.me(); criadoPor = user?.email || user?.id || 'sistema'; criadoPorNome = user?.full_name || user?.email || 'sistema'; criadoPorId = user?.id || ''; } catch (e) {}
    const isSending = status === 'enviada';
    return {
      leadId: effectiveLeadId || '', codigo: existingProposal?.codigo || gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`, status, origem: 'manual',
      sentDate: isSending ? (existingProposal?.sentDate || new Date().toISOString()) : (existingProposal?.sentDate || null),
      sourceFlow: templateFromId ? 'from_existing_proposal_rates' : (existingProposal?.sourceFlow || 'manual_creation'),
      businessSubCategory: form.businessSubCategory,
      chosenPartnerId: selectedPartnerId || '',
      chosenPartnerName: selectedPartner?.name || '',
      clienteNome: form.clienteNome, clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato, clienteMcc: form.clienteMcc,
      rates: {
        cartao: cartaoNumerico, cartaoPorMcc: cartaoPorMccNumerico, credito_1x, credito_2_6x, credito_7_12x, credito_13_21x,
        // Maquininha (POS presencial) só vai junto se ativada — taxas próprias.
        usaMaquininha,
        ...(usaMaquininha && maquininhaPayload ? { maquininha: maquininhaPayload } : {}),
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto), antifraude: parseTaxa(rates.antifraude),
        feeTransacao: parseTaxa(rates.feeTransacao), alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        taxa3ds: parseTaxa(rates.taxa3ds), setup: parseTaxa(rates.setup), forex: parseTaxa(rates.forex),
        minimoGarantido: { mes1: parseTaxa(rates.minimoGarantido?.mes1), mes2: parseTaxa(rates.minimoGarantido?.mes2), mes3: parseTaxa(rates.minimoGarantido?.mes3) },
        rav: { taxa: parseTaxa(form.taxaAntecipacao), prazo: form.prazoRecebimento },
        percentualAntecipacao: parseTaxa(form.percentualAntecipacao),
        // Reserva Financeira (Rolling Reserve) — sempre persistida com prazos fixos
        // (PIX 90d / Cartão 180d) e disclaimer oficial garantidos pelo helper.
        reservaFinanceira: getReservaWithDefaults({ reservaFinanceira: rates.reservaFinanceira }),
      },
      taxaFinalOverrides: form.taxaFinalOverrides || {},
      hideCalculationColumns: form.hideCalculationColumns || false,
      hideRange13a21: form.hideRange13a21 || false,
      validUntil: form.dataValidade.toISOString(),
      tokenPublico: existingProposal?.tokenPublico || gerarToken(),
      responsavelId: criadoPorId || criadoPor, responsavelNome: criadoPorNome,
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = await buildPropostaData('rascunho');
    if (editId) { await base44.entities.Proposal.update(editId, data); toast.success(t('criar_prop.draft_updated')); }
    else { await base44.entities.Proposal.create(data); toast.success(t('criar_prop.draft_saved')); }
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  const handleGerarProposta = async () => {
    if (!validate()) return; // toast detalhado já é emitido dentro de validate()
    try {
      setSaving(true);
      const data = await buildPropostaData('enviada');
      let created;
      if (editId) { await base44.entities.Proposal.update(editId, data); created = { id: editId }; }
      else { created = await base44.entities.Proposal.create(data); }
      // AuditLog não bloqueia a navegação se falhar (não-crítico).
      try {
        await base44.entities.AuditLog.create({
          entityName: 'Proposal', entityId: created.id, actionType: 'CREATE',
          actionDescription: `Proposta ${data.codigo} gerada para ${data.clienteNome}`,
          changedBy: data.responsavelNome || 'admin', changeDate: new Date().toISOString(),
          details: { codigo: data.codigo, clienteNome: data.clienteNome, status: data.status }
        });
      } catch (auditErr) { console.warn('[CriarProposta] AuditLog falhou (não-crítico):', auditErr); }
      // Vínculo com Lead também não bloqueia (não-crítico).
      if (effectiveLeadId) {
        try {
          await base44.entities.Lead.update(effectiveLeadId, { currentProposalId: created.id, status: 'proposta_enviada', lastInteractionDate: new Date().toISOString() });
          await base44.entities.LeadActivity.create({ leadId: effectiveLeadId, activityType: 'proposta_criada', description: `Proposta ${data.codigo} criada`, performedBy: data.responsavelNome || 'admin', activityDate: new Date().toISOString() });
        } catch (leadErr) { console.warn('[CriarProposta] Vínculo com Lead falhou (não-crítico):', leadErr); }
      }
      toast.success(t('criar_prop.generated'));
      navigate(createPageUrl('PropostaDetalhes') + `?id=${created.id}`);
    } catch (err) {
      console.error('[CriarProposta] Falha ao gerar proposta:', err);
      toast.error(`Erro ao gerar proposta: ${err?.message || 'tente novamente'}`, { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[#0A0A0A] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-white">{editId ? t('criar_prop.edit_title') : t('criar_prop.new_title')}</h1>
            <p className="text-xs text-[#E84B1C]/60">{t('criar_prop.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setIsCopyModalOpen(true)} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            <Copy className="w-4 h-4 mr-2" /> {t('criar_prop.copy_rates')}
          </Button>
          <Button variant="ghost" onClick={handleSalvarRascunho} disabled={saving} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('criar_prop.draft')}
          </Button>
          <Button onClick={handleGerarProposta} disabled={saving} className="bg-[#1356E2] hover:bg-[#E84B1C] text-[#0A0A0A] font-bold rounded-xl shadow-lg shadow-[#1356E2]/20 px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />} {t('criar_prop.generate')}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
          <SegmentRatesLoader onApply={(newRates, formUpdates) => {
            setRates(newRates);
            setForm(prev => ({ ...prev, ...formUpdates }));
          }} />
          <CardDadosCliente form={form} errors={errors} onUpdate={updateForm} />
          <PartnerSelector
            selectedPartnerId={selectedPartnerId}
            onSelectPartner={setSelectedPartnerId}
            selectedMccCode={selectedMccCode}
            onSelectMcc={setSelectedMccCode}
            leadMcc={form.clienteMcc}
            leadBusinessType={form.businessSubCategory}
            leadTpv={lead?.tpvMensal}
          />
          <MccTabsManager
            form={form}
            rates={rates}
            onUpdateRates={updateRates}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            partner={selectedPartner}
            hideRange13a21={form.hideRange13a21 || false}
            onToggleHideRange13a21={(v) => updateForm('hideRange13a21', v)}
          />
          <CardAntecipacao form={form} onUpdate={updateForm} />
          <CardReservaFinanceira rates={rates} onUpdateRates={updateRates} />
          <FinalRateOverridesEditor
            overrides={form.taxaFinalOverrides || {}}
            onChange={(v) => updateForm('taxaFinalOverrides', v)}
            hideCalculationColumns={form.hideCalculationColumns || false}
            onToggleHideColumns={(v) => updateForm('hideCalculationColumns', v)}
            defaultPrazo={form.prazoRecebimento || 'D+1'}
          />
          <CardTaxasMaquininha
            enabled={!!rates.usaMaquininha}
            onToggleEnabled={(v) => setRates(prev => ({
              ...prev,
              usaMaquininha: v,
              maquininha: v ? (prev.maquininha || { credito: {}, debito: {} }) : { credito: {}, debito: {} },
            }))}
            maquininha={rates.maquininha || { credito: {}, debito: {} }}
            onUpdateMaquininha={(newMaq) => setRates(prev => ({ ...prev, maquininha: newMaq }))}
          />
          <CardOutrasTaxas rates={rates} onUpdateRates={updateRates} partner={selectedPartner} />
        </div>

        {/* Right Column - Preview + Profitability */}
        <div className="w-[460px] bg-[#001a33] border-l border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <ProfitabilityPanel
              rates={rates}
              form={form}
              partner={selectedPartner}
              leadTpv={lead?.tpvMensal}
              leadTransacoes={lead?.transacoesMes}
              selectedMccCode={selectedMccCode}
            />
            <PropostaPreview form={form} rates={rates} selectedBrand={selectedBrand} onBandeiraChange={setSelectedBrand} taxaFinalOverrides={form.taxaFinalOverrides} hideRange13a21={form.hideRange13a21} />
          </div>
        </div>
      </div>

      <CopyRatesModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        currentProposalId={editId}
        onSelect={async (selectedId) => {
          setIsCopyModalOpen(false);
          const proposals = await base44.entities.Proposal.filter({ id: selectedId });
          if (proposals[0]) applyCopiedRates(proposals[0]);
        }}
      />
    </div>
  );
}