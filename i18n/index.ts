import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// @ts-ignore - JSON imports are valid in React Native/Metro bundler
import en from './locales/en.json';
import ur from './locales/ur.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: {
        translation: en,
      },
      ur: {
        translation: ur,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

