"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ur from '@/locales/ur.json';

const translations = { en, hi, ur };

type Language = 'en' | 'hi' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: typeof en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && translations[storedLanguage]) {
      setLanguageState(storedLanguage);
    }
  }, []);
  
  const setLanguage = (lang: Language) => {
    if (language !== lang) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
        window.location.reload(); 
      }
    } else {
        setLanguageState(lang);
    }
  };

  const value = {
    language,
    setLanguage,
    translations: translations[language] || en, // Fallback to English
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
