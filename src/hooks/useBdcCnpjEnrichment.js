import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for BDC CNPJ enrichment on lead forms.
 * Calls bdcEnrichLead backend function with fallback to existing CNPJ autocomplete.
 */
export default function useBdcCnpjEnrichment() {
  const [bdcData, setBdcData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const enrichCnpj = useCallback(async (cnpj, level = 'quick') => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('bdcEnrichLead', { cnpj: digits, level });
      const data = response.data;

      if (data.success) {
        setBdcData(data);
        setIsLoading(false);
        return data;
      } else {
        setError(data.error || 'Erro no enriquecimento BDC');
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      console.warn('BDC enrichment failed, will use fallback:', err.message);
      setError('BDC indisponível — usando dados básicos');
      setIsLoading(false);
      return null;
    }
  }, []);

  // Convert BDC data to legacy cnpjData format for compatibility
  const toLegacyCnpjData = useCallback((data) => {
    if (!data?.autoFill) return null;
    const af = data.autoFill;
    const addr = data.endereco;
    return {
      razao_social: af.razaoSocial,
      nome_fantasia: af.nomeFantasia,
      capital_social: af.capitalSocial,
      porte: af.porte,
      data_inicio_atividade: af.fundacao,
      data_abertura: af.fundacao,
      situacao_cadastral: af.situacaoCadastral,
      cnae_fiscal: af.cnaePrincipal,
      cnae_descricao: af.cnaeDescricao,
      natureza_juridica: af.naturezaJuridica,
      site_sugerido: data.domains?.[0]?.domain || '',
      endereco: addr ? {
        cep: addr.cep,
        logradouro: addr.logradouro,
        numero: addr.numero,
        complemento: addr.complemento,
        bairro: addr.bairro,
        municipio: addr.municipio,
        uf: addr.uf,
      } : null,
    };
  }, []);

  const reset = useCallback(() => {
    setBdcData(null);
    setError(null);
  }, []);

  return {
    bdcData,
    isLoading,
    error,
    enrichCnpj,
    toLegacyCnpjData,
    reset,
  };
}