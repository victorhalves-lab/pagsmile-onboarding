import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, AlertTriangle, Globe } from 'lucide-react';

const YesNoQuestion = ({ label, value, onChange, helpText, required = true }) => (
  <div className="space-y-2">
    <Label className="text-[var(--pagsmile-blue)] font-semibold">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 p-3 rounded-xl border-2 transition-all ${
          value === true
            ? 'border-red-500 bg-red-50'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <p className={`font-semibold ${value === true ? 'text-red-600' : 'text-[var(--pagsmile-blue)]'}`}>Sim</p>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 p-3 rounded-xl border-2 transition-all ${
          value === false
            ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <p className={`font-semibold ${value === false ? 'text-[var(--pagsmile-green)]' : 'text-[var(--pagsmile-blue)]'}`}>Não</p>
      </button>
    </div>
    {helpText && <p className="text-xs text-[var(--pagsmile-blue)]/60">{helpText}</p>}
  </div>
);

export default function StepL4ComplianceRisco({ formData, handleChange }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-orange-100">
          <ShieldAlert className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Compliance de Risco
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Perguntas importantes para avaliação de risco e compliance
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Atividade Ilegal */}
        <YesNoQuestion
          label="A empresa atua em alguma atividade ilegal/proibida?"
          value={formData.atividadeIlegal}
          onChange={(v) => handleChange('atividadeIlegal', v)}
        />

        {/* Licença/Regulação */}
        <YesNoQuestion
          label="A empresa comercializa produtos/serviços que exigem licença/regulação relevante?"
          value={formData.exigeLicenca}
          onChange={(v) => handleChange('exigeLicenca', v)}
          helpText="Ex.: vigilância sanitária, órgão regulador, autorização específica"
        />

        {formData.exigeLicenca === true && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Label className="text-[var(--pagsmile-blue)] font-semibold">
              Qual licença/registro? <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.qualLicenca || ''}
              onChange={(e) => handleChange('qualLicenca', e.target.value)}
              placeholder="Descreva a licença ou registro"
              className="h-12 bg-white"
            />
          </div>
        )}

        {/* PEP */}
        <YesNoQuestion
          label="Algum sócio/administrador/UBO é PEP (Pessoa Exposta Politicamente)?"
          value={formData.socioPEP}
          onChange={(v) => handleChange('socioPEP', v)}
          helpText="PEP = agentes públicos, ocupantes de cargos políticos, ou seus familiares/associados"
        />

        {/* Sanções */}
        <YesNoQuestion
          label="Algum sócio/administrador/UBO está em listas de sanções/restrições?"
          value={formData.socioSancionado}
          onChange={(v) => handleChange('socioSancionado', v)}
        />

        {/* Criptoativos */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <YesNoQuestion
            label="A empresa atua com criptoativos (compra/venda/intermediação/pagamento)?"
            value={formData.atuaCripto}
            onChange={(v) => handleChange('atuaCripto', v)}
          />
        </div>

        {/* Jogos/Apostas */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <YesNoQuestion
            label="A empresa atua com jogos/apostas/cassino?"
            value={formData.atuaJogos}
            onChange={(v) => handleChange('atuaJogos', v)}
          />
        </div>

        {/* Encerramento de Conta */}
        <YesNoQuestion
          label="Houve encerramento de conta bancária/conta de pagamento por motivo de compliance nos últimos 24 meses?"
          value={formData.encerramentoConta}
          onChange={(v) => handleChange('encerramentoConta', v)}
        />

        {/* Operação Fora do Brasil */}
        <YesNoQuestion
          label="A empresa possui sede/operação fora do Brasil?"
          value={formData.operacaoExterior}
          onChange={(v) => handleChange('operacaoExterior', v)}
        />

        {formData.operacaoExterior === true && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Label className="text-[var(--pagsmile-blue)] font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Quais países? <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.paisesOperacao || ''}
              onChange={(e) => handleChange('paisesOperacao', e.target.value)}
              placeholder="Ex: Estados Unidos, Portugal"
              className="h-12 bg-white"
            />
          </div>
        )}
      </div>

      {/* Alerta de Risco */}
      {(formData.atividadeIlegal === true || formData.socioPEP === true || formData.socioSancionado === true || formData.atuaCripto === true || formData.atuaJogos === true) && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">Atenção</p>
            <p className="text-sm text-orange-700">
              Algumas respostas indicam fatores de risco que podem requerer análise adicional. 
              Continue preenchendo o questionário normalmente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}