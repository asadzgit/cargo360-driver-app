import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@cargo360:language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
    
    // Listen for language changes from i18n
    const handleLanguageChange = (lng: string) => {
      if (lng === 'en' || lng === 'ur') {
        setLanguageState(lng as Language);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage === 'en' || savedLanguage === 'ur') {
        setLanguageState(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
      setIsReady(true);
    } catch (error) {
      console.error('Failed to load language:', error);
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

