import React from 'react';
import { CheckCircle, ShieldCheck, FileCheck, AlertTriangle } from 'lucide-react';
import FormSection from '../FormSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Step11Confirmacao({ formData, handleChange }) {
  
  const handleCheck = (field, checked) => {
    handleChange(field, checked);
  };

  return (
    <div className="space-y-8">
      <FormSection
        title="Confirmação e Declarações Finais"
        subtitle="Por favor, leia atentamente e confirme as declarações abaixo para finalizar."
        icon={CheckCircle}
      >
        <Alert className="bg-blue-50 border-blue-200 mb-6">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800 font-bold ml-2">Importante</AlertTitle>
          <AlertDescription className="text-blue-700 ml-2 mt-1">
            Ao prosseguir, você está iniciando formalmente o processo de análise de Compliance. Informações falsas ou omitidas podem levar à rejeição imediata do cadastro e inclusão em listas de restrição.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          
          {/* Termos de Uso e Privacidade */}
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="termos_uso" 
              checked={formData.aceiteTermosUso}
              onCheckedChange={(c) => handleCheck('aceiteTermosUso', c)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="termos_uso"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Li e aceito os Termos de Uso e Política de Privacidade da PagSmile
              </Label>
              <p className="text-sm text-muted-foreground">
                Concordo com o processamento dos meus dados para fins de cadastro e operação.
              </p>
            </div>
          </div>

          {/* Autorização de Consultas (CAF/BigDataCorp) */}
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="autorizacao_consulta" 
              checked={formData.aceiteAutorizacaoConsulta}
              onCheckedChange={(c) => handleCheck('aceiteAutorizacaoConsulta', c)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="autorizacao_consulta"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Autorização para Consultas de Dados (SCR, Bureaus e Fontes Públicas)
              </Label>
              <p className="text-sm text-muted-foreground">
                Autorizo a PagSmile e seus parceiros (como CAF e BigDataCorp) a consultar meus dados e dos sócios/diretores em bureaus de crédito, SCR (Sistema de Informações de Crédito) e outras fontes públicas e privadas para fins de análise de crédito e compliance.
              </p>
            </div>
          </div>

          {/* Termo de Responsabilidade e Veracidade */}
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="termo_veracidade" 
              checked={formData.aceiteVeracidade}
              onCheckedChange={(c) => handleCheck('aceiteVeracidade', c)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="termo_veracidade"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Declaração de Veracidade e Licitude
              </Label>
              <p className="text-sm text-muted-foreground">
                Declaro, sob as penas da lei, que todas as informações prestadas e documentos enviados são verdadeiros, autênticos e atualizados. Declaro também que a origem dos recursos transacionados é lícita e não provém de atividades ilegais.
              </p>
            </div>
          </div>

          {/* Declaração de PLD */}
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="termo_pld" 
              checked={formData.aceitePLD}
              onCheckedChange={(c) => handleCheck('aceitePLD', c)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="termo_pld"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Compromisso de Prevenção à Lavagem de Dinheiro
              </Label>
              <p className="text-sm text-muted-foreground">
                Comprometo-me a manter controles internos adequados para prevenir a utilização dos serviços da PagSmile para lavagem de dinheiro ou financiamento ao terrorismo.
              </p>
            </div>
          </div>

        </div>

        {/* Warning Final */}
        <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
           <AlertTriangle className="w-5 h-5 shrink-0" />
           <p>Após a confirmação, você será redirecionado para o envio dos documentos comprobatórios.</p>
        </div>

      </FormSection>
    </div>
  );
}