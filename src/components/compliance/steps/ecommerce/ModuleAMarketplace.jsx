import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Store } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DADOS_COLETADOS_SELLER = [
  { id: 'cpf_cnpj', label: 'CPF/CNPJ' },
  { id: 'razao_social', label: 'Razão social/nome' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'representante', label: 'Representante legal' },
  { id: 'conta_bancaria', label: 'Conta bancária / titularidade' },
  { id: 'contato', label: 'Contato (e-mail/telefone)' }
];

export default function ModuleAMarketplace({ formData, handleChange }) {
  const dadosColetados = formData.dadosColetadosSeller || [];

  const toggleDadoColetado = (id) => {
    if (dadosColetados.includes(id)) {
      handleChange('dadosColetadosSeller', dadosColetados.filter(d => d !== id));
    } else {
      handleChange('dadosColetadosSeller', [...dadosColetados, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-violet-100">
          <Store className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)]">Módulo Marketplace</h2>
          <p className="text-sm text-[var(--pinbank-blue)]/60">Compliance dos seus sellers</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label>Sellers passam por KYC/KYB? *</Label>
          <Select
            value={formData.sellersKYC || ''}
            onValueChange={(value) => handleChange('sellersKYC', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Como é o processo de KYC/KYB (QIC/QIB) dos sellers? *</Label>
          <Select
            value={formData.processoKYCSellers || ''}
            onValueChange={(value) => handleChange('processoKYCSellers', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Automatizado">Automatizado</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Misto">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Quais dados mínimos são coletados do seller? *</Label>
          <div className="grid grid-cols-2 gap-2">
            {DADOS_COLETADOS_SELLER.map((dado) => (
              <div key={dado.id} className="flex items-center space-x-2">
                <Checkbox
                  id={dado.id}
                  checked={dadosColetados.includes(dado.id)}
                  onCheckedChange={() => toggleDadoColetado(dado.id)}
                />
                <Label htmlFor={dado.id} className="text-sm cursor-pointer">
                  {dado.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="outroDadoSeller">Outro (especifique)</Label>
            <Input
              id="outroDadoSeller"
              value={formData.outroDadoSeller || ''}
              onChange={(e) => handleChange('outroDadoSeller', e.target.value)}
              placeholder="Outros dados coletados"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Existe política/rotina de bloqueio/suspensão de seller? *</Label>
          <Select
            value={formData.politicaBloqueioSeller || ''}
            onValueChange={(value) => handleChange('politicaBloqueioSeller', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Existe monitoramento básico de risco/fraude dos sellers? *</Label>
          <Select
            value={formData.monitoramentoRiscoSellers || ''}
            onValueChange={(value) => handleChange('monitoramentoRiscoSellers', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t pt-4 space-y-4">
          <Label className="font-semibold">Responsável interno por compliance de sellers *</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={formData.responsavelSellersNome || ''}
              onChange={(e) => handleChange('responsavelSellersNome', e.target.value)}
              placeholder="Nome"
            />
            <Input
              type="email"
              value={formData.responsavelSellersEmail || ''}
              onChange={(e) => handleChange('responsavelSellersEmail', e.target.value)}
              placeholder="E-mail"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Existe política/termos de sellers (pública ou interna)? *</Label>
          <Select
            value={formData.existePoliticaSellers || ''}
            onValueChange={(value) => handleChange('existePoliticaSellers', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.existePoliticaSellers === 'Sim' && (
          <div className="space-y-2">
            <Label htmlFor="urlPoliticaSellers">Link da política de sellers (opcional)</Label>
            <Input
              id="urlPoliticaSellers"
              type="url"
              value={formData.urlPoliticaSellers || ''}
              onChange={(e) => handleChange('urlPoliticaSellers', e.target.value)}
              placeholder="https://"
            />
          </div>
        )}
      </div>
    </div>
  );
}