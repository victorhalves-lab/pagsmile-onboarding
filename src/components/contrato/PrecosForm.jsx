import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RatesSourceSelector from './RatesSourceSelector';

const BANDEIRAS = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
const FAIXAS = ['avista', 'de2a6x', 'de7a12x', 'de13a21x'];
const FAIXAS_LABELS = { avista: 'À Vista', de2a6x: '2-6x', de7a12x: '7-12x', de13a21x: '13-21x' };
const BANDEIRA_LABELS = { visa: 'Visa', mastercard: 'Master', elo: 'Elo', amex: 'Amex', outras: 'Outras' };

export default function PrecosForm({ contract, onChange, preFilledFields = [] }) {
  const rates = contract.rates || {};
  const locked = contract.proposalLocked;
  const isPreFilled = (field) => preFilledFields.includes(field);

  const updateRate = (path, value) => {
    if (locked) return;
    const keys = path.split('.');
    const newRates = JSON.parse(JSON.stringify(rates));
    let obj = newRates;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value === '' ? null : parseFloat(value);
    onChange('rates', newRates);
  };

  const RateInput = ({ path, label, suffix = '%', placeholder = '0,00' }) => {
    const keys = path.split('.');
    let val = rates;
    for (const k of keys) val = val?.[k];

    return (
      <div className="space-y-1">
        {label && <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">{label}</Label>}
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            value={val ?? ''}
            onChange={e => updateRate(path, e.target.value)}
            placeholder={placeholder}
            disabled={locked}
            className={`text-right pr-8 text-sm h-9 ${locked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#0A0A0A]/30">{suffix}</span>
          {locked && <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#0A0A0A]/20" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Fonte de Taxas (Proposta Padrão / Landing Page) */}
      <RatesSourceSelector contract={contract} onChange={onChange} />

      {locked && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Lock className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-700 font-medium">Taxas travadas da proposta aceita pelo cliente. Não podem ser alteradas.</span>
        </div>
      )}

      {isPreFilled('rates') && (
        <Badge className="bg-green-100 text-green-700 text-xs">Taxas pré-preenchidas da proposta</Badge>
      )}

      {/* Taxas de Cartão Crédito */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">MDR Cartão de Crédito</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#0A0A0A]/50 uppercase">
                <th className="text-left py-1 pr-2">Bandeira</th>
                {FAIXAS.map(f => <th key={f} className="text-right px-1">{FAIXAS_LABELS[f]}</th>)}
              </tr>
            </thead>
            <tbody>
              {BANDEIRAS.map(b => (
                <tr key={b} className="border-t border-[#0A0A0A]/5">
                  <td className="py-2 pr-2 text-xs font-medium text-[#0A0A0A]/70">{BANDEIRA_LABELS[b]}</td>
                  {FAIXAS.map(f => (
                    <td key={f} className="px-1 py-1">
                      <RateInput path={`cartao.${b}.${f}`} suffix="%" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Débito */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">MDR Débito</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['visa', 'mastercard', 'elo', 'outras'].map(b => (
            <RateInput key={b} path={`debito.${b}`} label={BANDEIRA_LABELS[b]} suffix="%" />
          ))}
        </div>
      </div>

      {/* Pix */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Pix</h3>
        <div className="grid grid-cols-2 gap-3">
          <RateInput path="pix.valor" label={`Taxa Pix (${rates?.pix?.tipo === 'fixo' ? 'R$' : '%'})`} suffix={rates?.pix?.tipo === 'fixo' ? 'R$' : '%'} />
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Tipo</Label>
            <select 
              value={rates?.pix?.tipo || 'percentual'} 
              onChange={e => updateRate('pix.tipo', e.target.value)}
              disabled={locked}
              className="w-full h-9 border rounded-md px-2 text-sm bg-white"
            >
              <option value="percentual">Percentual</option>
              <option value="fixo">Fixo (R$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Outras taxas */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Outras Taxas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <RateInput path="boleto" label="Boleto" suffix="R$" />
          <RateInput path="antifraude" label="Antifraude" suffix="R$" />
          <RateInput path="feeTransacao" label="Fee p/ Transação" suffix="R$" />
          <RateInput path="rav.taxa" label="Taxa RAV" suffix="% a.m." />
          <RateInput path="percentualAntecipacao" label="% Antecipação" suffix="%" />
          <RateInput path="alertaPreChargeback" label="Alerta Pré-CB" suffix="R$" />
        </div>
      </div>

      {/* TPV Projetado */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">TPV Projetado (Substitui Mínimo Garantido)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Mês 1 (R$)</Label>
            <Input
              type="number"
              value={contract.projectedTpvMonth1 ?? ''}
              onChange={e => onChange('projectedTpvMonth1', e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="0,00"
              disabled={locked}
              className={`text-right ${locked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Mês 2 (R$)</Label>
            <Input
              type="number"
              value={contract.projectedTpvMonth2 ?? ''}
              onChange={e => onChange('projectedTpvMonth2', e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="0,00"
              disabled={locked}
              className={`text-right ${locked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Mês 3 (R$)</Label>
            <Input
              type="number"
              value={contract.projectedTpvMonth3 ?? ''}
              onChange={e => onChange('projectedTpvMonth3', e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="0,00"
              disabled={locked}
              className={`text-right ${locked ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Setup e Prazo */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Setup e Liquidação</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Taxa de Setup (R$)</Label>
            <Input
              type="number"
              value={contract.setupFee ?? ''}
              onChange={e => onChange('setupFee', e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="0,00"
              className="text-right"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Prazo de Liquidação</Label>
            <Input
              value={contract.paymentTerm || ''}
              onChange={e => onChange('paymentTerm', e.target.value)}
              placeholder="D+1, D+30..."
            />
          </div>
        </div>
      </div>

      {/* Dados bancários */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Dados Bancários para Liquidação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Instituição Bancária</Label>
            <Input
              value={contract.bankInstitution || ''}
              onChange={e => onChange('bankInstitution', e.target.value)}
              placeholder="Nome do banco"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Agência</Label>
            <Input
              value={contract.bankAgency || ''}
              onChange={e => onChange('bankAgency', e.target.value)}
              placeholder="0000"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">Conta</Label>
            <Input
              value={contract.bankAccountNumber || ''}
              onChange={e => onChange('bankAccountNumber', e.target.value)}
              placeholder="00000-0"
            />
          </div>
        </div>
      </div>

      {/* Tarifas conta */}
      <div>
        <h3 className="text-sm font-bold text-[#0A0A0A] border-b border-[#0A0A0A]/10 pb-2 mb-3">Tarifas da Conta</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { field: 'accountMaintenanceFee', label: 'Manutenção Conta' },
            { field: 'cardWithdrawalFee', label: 'Saque Cartão' },
            { field: 'tedDocTransferFee', label: 'TED/DOC' },
            { field: 'physicalCardIssuanceFee', label: 'Emissão Cartão' },
            { field: 'physicalCard2ndCopyFee', label: '2ª Via Cartão' },
          ].map(t => (
            <div key={t.field} className="space-y-1">
              <Label className="text-[10px] text-[#0A0A0A]/50 uppercase">{t.label}</Label>
              <Input
                type="number"
                step="0.01"
                value={contract[t.field] ?? ''}
                onChange={e => onChange(t.field, e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder="0,00"
                className="text-right"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}