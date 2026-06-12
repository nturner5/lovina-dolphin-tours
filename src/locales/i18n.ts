import { translations, Locale, TranslationKey } from './translations';

// Supported locales
export const locales = ['en', 'ru', 'zh'] as const;

// Helper to validate locale string
export function isValidLocale(lang: any): lang is Locale {
  return typeof lang === 'string' && locales.includes(lang as any);
}

// Shared helper to translate keys
export function translate(key: TranslationKey, locale: Locale): string {
  return (translations[locale] as any)[key] || translations['en'][key] || String(key);
}

// Short alias
export const t = translate;
