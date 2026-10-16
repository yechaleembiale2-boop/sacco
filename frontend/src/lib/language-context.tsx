'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Dict, Language } from './i18n';
import { DICTIONARIES } from './i18n';

interface LanguageContextValue {
  lang: Language;
  t: (key: keyof Dict) => string;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Language | null;
    if (stored === 'en' || stored === 'am') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((next: Language) => {
    localStorage.setItem('lang', next);
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'am' : 'en');
  }, [lang, setLang]);

  const t = useCallback(
    (key: keyof Dict) => DICTIONARIES[lang][key],
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return ctx;
}