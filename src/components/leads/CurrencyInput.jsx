import React from 'react';
import { Input } from '@/components/ui/input';

function formatCurrency(value) {
  if (value === null || value === undefined) value = 0;
  const number = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function parseCurrency(formattedValue) {
  const digits = String(formattedValue).replace(/\D/g, '');
  if (digits === '') return 0;
  return parseInt(digits, 10);
}

export const CurrencyInput = React.forwardRef(({ value, onValueChange, className, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(formatCurrency(value));

  // Update internal value when prop changes
  React.useEffect(() => {
    setInternalValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setInternalValue(inputValue);
    const parsedValue = parseCurrency(inputValue);
    if (onValueChange) {
      onValueChange(parsedValue);
    }
  };

  const handleBlur = (e) => {
     setInternalValue(formatCurrency(value));
  }

  return (
    <Input
      ref={ref}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;