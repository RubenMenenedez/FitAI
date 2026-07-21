import { en as commonEn, es as commonEs } from './strings/common';
import { en as authEn, es as authEs } from './strings/auth';
import { en as tabsEn, es as tabsEs } from './strings/tabs';
import { en as socialEn, es as socialEs } from './strings/social';

export type Lang = 'en' | 'es';

export const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];

export const translations: Record<Lang, Record<string, string>> = {
  en: { ...commonEn, ...authEn, ...tabsEn, ...socialEn },
  es: { ...commonEs, ...authEs, ...tabsEs, ...socialEs },
};
