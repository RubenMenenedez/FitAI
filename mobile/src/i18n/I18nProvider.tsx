import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, type Lang } from './translations';

const STORAGE_KEY = 'fitai.lang';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

// App-wide language. Defaults to English; the user can switch to Spanish and
// the choice is persisted (best-effort — SecureStore is unavailable on web,
// so persistence is skipped there rather than crashing).
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === 'en' || saved === 'es') setLangState(saved);
      } catch {
        // storage not available (e.g. web) — keep the default
      }
    })();
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}

// Convenience hook for components that only need the translate function.
export function useT(): (key: string) => string {
  return useI18n().t;
}
