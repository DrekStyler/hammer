import { useLanguage } from '../contexts/LanguageContext';
import translations from './translations';

// Custom hook to get translated text
const useTranslation = () => {
  const { language } = useLanguage();

  // Get the translation for a specific key
  const t = (key) => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to English if translation not found
      return translations.English[key] || key;
    }
    return translations[language][key];
  };

  return { t };
};

export default useTranslation;