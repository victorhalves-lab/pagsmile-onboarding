import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, DollarSign, TrendingUp, Calculator as Calc } from 'lucide-react';
import { toast } from 'sonner';
import { INTERCHANGE_OPTIONS, MCC_OPTIONS } from '@/lib/global/interchangeData';
import InterchangeSelector from '@/components/global/InterchangeSelector';
import CountrySelector from '@/components/global/public/CountrySelector';

/**
 * Editor de Proposta Global. Permite criar uma proposta em USD com:
 * - Interchange (Visa/Mastercard low/avg/high/combined/custom)
 * - Markup
 * - Fixed fee por transação
 * - Outros fees, rolling reserve, settlement
 * - Vinculação a um GlobalQuestionnaire opcional
 */
export default function GlobalProposalCreation() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    questionnaire_id: '',
    client_name: '',
    contact_name: '',
    contact_email: '',
    language: 'en',
    mccs: [],
    target_markets: [],
    base_cost_percentage: 0.5,
    selected_interchange_type: 'combined_avg',
    interchange_percentage: 0,
    interchange_fixed: 0,
    markup_percentage: 1.0,
    fixed_fee_per_transaction: 0.30,
    setup_fee: 0,
    refund_fee: 0.50,
    chargeback_fee: 15.00,
    risk_control_fee: 0,
    rolling_reserve_percentage: 5,
    rolling_reserve_days: 90,
    settlement_days: 'D+2',
    valid_until: '',
  });

  // Pré-carrega quando vem ?createGlobalFor=<questId> na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qid = params.get('createGlobalFor');
    if (qid) setForm(f => ({ ...f, questionnaire_id: qid }));
  }, []);

  const { data: questionnaires = [] } = useQuery({
    queryKey: ['globalQuestionnaires', 'forCreation'],
    queryFn: () => base44.entities.GlobalQuestionnaire.list('-created_date', 300),
    initialData: [],
  });

  // Quando muda o questionário vinculado, pré-popula client_name, contato e mercados.
  useEffect(() => {
    if (!form.questionnaire_id) return;
    const q = questionnaires.find(x => x.id === form.questionnaire_id);
    if (!q) return;
    setForm(f => ({
      ...f,
      client_name: f.client_name || q.company_name || '',
      contact_name: f.contact_name || q.contact_name || '',
      contact_email: f.contact_email || q.contact_email || '',
      target_markets: f.target_markets.length ? f.target_markets : (q.target_markets || []),
      mccs: f.mccs.length ? f.mccs : (q.mcc ? [q.mcc] : []),
    }));
  }, [form.questionnaire_id, questionnaires]);

  // Quando muda o tipo de interchange, recalcula percentage/fixed.
  useEffect(() => {
    const opt = INTERCHANGE_OPTIONS.find(o => o.value === form.selected_interchange_type);
    if (opt && opt.value !== 'custom') {
      setForm(f => ({
        ...f,
        interchange_percentage: Number(opt.data.percentage.toFixed(3)),
        interchange_fixed: Number(opt.data.fixed.toFixed(3)),
      }));
    }
  }, [form.selected_interchange_type]);

  // Final rate = base_cost + interchange + markup
  const finalRate = useMemo(() => {
    return (Number(form.base_cost_percentage) || 0)
         + (Number(form.interchange_percentage) || 0)
         + (Number(form.markup_percentage) || 0);
  }, [form.base_cost_percentage, form.interchange_percentage, form.markup_percentage]);

  const finalFixed = useMemo(() => {
    return (Number(form.interchange_fixed) || 0)
         + (Number(form.fixed_fee_per_transaction) || 0);
  }, [form.interchange_fixed, form.fixed_fee_per_transaction]);

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.client_name || !form.contact_email || !form.mccs.length) {
        throw new Error('Preencha cliente, e-mail e ao menos um MCC.');
      }
      const payload = {
        ...form,
        final_rate_percentage: Number(finalRate.toFixed(3)),
        final_fixed_fee: Number(finalFixed.toFixed(3)),
        status: 'sent',
        public_link_token: `gp_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
      };
      return base44.entities.GlobalProposal.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['globalProposals'] });
      toast.success('Proposta global criada!');
      setForm(f => ({ ...f, client_name: '', contact_name: '', contact_email: '', questionnaire_id: '' }));
    },
    onError: (e) => toast.error(e.message || 'Erro ao criar proposta'),
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f,
    [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Coluna principal — formulário */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-[#2bc196]" /> Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Vincular Questionário (opcional)</Label>
              <Select value={form.questionnaire_id || 'none'} onValueChange={v => setF('questionnaire_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo (cliente novo)</SelectItem>
                  {questionnaires.slice(0, 100).map(q => (
                    <SelectItem key={q.id} value={q.id}>{q.company_name} · {q.contact_email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cliente *</Label>
                <Input value={form.client_name} onChange={e => setF('client_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Contato</Label>
                <Input value={form.contact_name} onChange={e => setF('contact_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" value={form.contact_email} onChange={e => setF('contact_email', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Idioma da Proposta</Label>
                <Select value={form.language} onValueChange={v => setF('language', v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-base">MCCs & Mercados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">MCCs *</Label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                {MCC_OPTIONS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleArr('mccs', m)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      form.mccs.includes(m)
                        ? 'bg-[#2bc196] text-white border-[#2bc196]'
                        : 'bg-white text-[#002443]/70 border-[#002443]/10 hover:bg-[#2bc196]/10'
                    }`}
                  >{m}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Mercados-alvo</Label>
              <div className="mt-1">
                <CountrySelector
                  value={form.target_markets}
                  onChange={(arr) => setF('target_markets', arr)}
                  lang="pt"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#2bc196]" /> Composição da Taxa</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Interchange (escolha o tier ou personalize)</Label>
              <InterchangeSelector
                value={form.selected_interchange_type}
                onChange={v => setF('selected_interchange_type', v)}
                customPct={form.interchange_percentage}
                customFixed={form.interchange_fixed}
                onCustomChange={(field, val) => {
                  if (field === 'pct') setF('interchange_percentage', val);
                  else setF('interchange_fixed', val);
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#002443]/5">
              <div>
                <Label className="text-xs">Custo Base (%)</Label>
                <Input type="number" step="0.01" value={form.base_cost_percentage} onChange={e => setF('base_cost_percentage', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Markup (%)</Label>
                <Input type="number" step="0.01" value={form.markup_percentage} onChange={e => setF('markup_percentage', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Fixed Fee Trx (USD)</Label>
                <Input type="number" step="0.01" value={form.fixed_fee_per_transaction} onChange={e => setF('fixed_fee_per_transaction', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-base">Outras Taxas & Reserva</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Setup Fee (USD)</Label><Input type="number" step="0.01" value={form.setup_fee} onChange={e => setF('setup_fee', e.target.value)} /></div>
            <div><Label className="text-xs">Refund Fee (USD)</Label><Input type="number" step="0.01" value={form.refund_fee} onChange={e => setF('refund_fee', e.target.value)} /></div>
            <div><Label className="text-xs">Chargeback Fee (USD)</Label><Input type="number" step="0.01" value={form.chargeback_fee} onChange={e => setF('chargeback_fee', e.target.value)} /></div>
            <div><Label className="text-xs">Risk Control Fee (USD)</Label><Input type="number" step="0.01" value={form.risk_control_fee} onChange={e => setF('risk_control_fee', e.target.value)} /></div>
            <div><Label className="text-xs">Rolling Reserve (%)</Label><Input type="number" step="0.1" value={form.rolling_reserve_percentage} onChange={e => setF('rolling_reserve_percentage', e.target.value)} /></div>
            <div><Label className="text-xs">Rolling Reserve (dias)</Label><Input type="number" value={form.rolling_reserve_days} onChange={e => setF('rolling_reserve_days', e.target.value)} /></div>
            <div>
              <Label className="text-xs">Settlement</Label>
              <Select value={form.settlement_days} onValueChange={v => setF('settlement_days', v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['D+1','D+2','D+7','D+15','D+30'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Válida até</Label><Input type="date" value={form.valid_until} onChange={e => setF('valid_until', e.target.value)} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna direita — sumário e ação */}
      <div className="space-y-4">
        <Card className="border-[#2bc196]/30 bg-gradient-to-br from-white to-[#2bc196]/5 sticky top-4">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calc className="w-4 h-4 text-[#2bc196]" /> Sumário da Proposta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Summary label="Taxa Final (%)" value={`${finalRate.toFixed(3)}%`} highlight />
            <Summary label="Fixo Final por Trx" value={`$${finalFixed.toFixed(2)}`} highlight />
            <div className="h-px bg-[#002443]/10 my-2" />
            <Summary label="Custo Base" value={`${Number(form.base_cost_percentage).toFixed(3)}%`} />
            <Summary label="Interchange" value={`${Number(form.interchange_percentage).toFixed(3)}% + $${Number(form.interchange_fixed).toFixed(2)}`} />
            <Summary label="Markup" value={`${Number(form.markup_percentage).toFixed(3)}%`} />
            <div className="h-px bg-[#002443]/10 my-2" />
            <Summary label="Setup" value={`$${Number(form.setup_fee).toFixed(2)}`} />
            <Summary label="Rolling Reserve" value={`${form.rolling_reserve_percentage}% por ${form.rolling_reserve_days}d`} />
            <Summary label="Settlement" value={form.settlement_days} />
            <Button className="w-full mt-3" onClick={() => saveM.mutate()} disabled={saveM.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveM.isPending ? 'Salvando...' : 'Criar Proposta'}
            </Button>
            <p className="text-[10px] text-[#002443]/50 text-center">
              Será gerada como <strong>sent</strong> e receberá um link público.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Summary({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#002443]/60">{label}</span>
      <span className={`font-mono ${highlight ? 'text-[#2bc196] font-bold' : 'text-[#002443]'}`}>{value}</span>
    </div>
  );
}