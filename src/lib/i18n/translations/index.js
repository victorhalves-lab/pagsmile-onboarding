import { pt } from './pt';
import { en } from './en';
import { zh } from './zh';
import { globalTranslations } from './global';

// Mescla traduções do módulo Propostas Global nos dicionários principais.
// Mantém os arquivos pt/en/zh sob 2000 linhas (limite de edição).
export const translations = {
  pt: { ...pt, ...globalTranslations.pt },
  en: { ...en, ...globalTranslations.en },
  zh: { ...zh, ...globalTranslations.zh },
};