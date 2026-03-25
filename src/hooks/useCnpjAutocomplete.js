import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// Validação local de CNPJ (módulo 11)
function validarCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false; // Todos dígitos iguais
  
  // Primeiro dígito verificador
  let soma = 0;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) soma += parseInt(digits[i]) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(digits[12]) !== d1) return false;
  
  // Segundo dígito verificador
  soma = 0;
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) soma += parseInt(digits[i]) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(digits[13]) !== d2) return false;
  
  return true;
}

// Formatar CNPJ para exibição
export function formatCnpj(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function useCnpjAutocomplete() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const lastCnpjRef = useRef('');

  const consultarCnpj = useCallback(async (cnpjRaw) => {
    const cnpj = cnpjRaw.replace(/\D/g, '');
    
    // Evitar re-consultas do mesmo CNPJ
    if (cnpj === lastCnpjRef.current && data) return data;
    
    setError(null);
    setValidationError(null);
    setData(null);

    if (cnpj.length < 14) {
      return null;
    }

    // Validação local (módulo 11) — antes de chamar API
    if (!validarCnpj(cnpj)) {
      setValidationError('CNPJ inválido. Verifique os 14 dígitos.');
      return null;
    }

    setIsLoading(true);
    lastCnpjRef.current = cnpj;

    const response = await base44.functions.invoke('brasilApiCnpj', { cnpj });
    setIsLoading(false);
    
    if (response.data?.error) {
      setError(response.data.error);
      return null;
    }
    
    setData(response.data);
    return response.data;
  }, [data]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setValidationError(null);
    lastCnpjRef.current = '';
  }, []);

  return {
    data,
    isLoading,
    error,
    validationError,
    consultarCnpj,
    reset,
    validarCnpj,
    formatCnpj
  };
}