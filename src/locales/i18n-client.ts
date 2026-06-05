"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isValidLocale } from './i18n';
import { Locale } from './translations';

export function useLocale(): Locale {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (isValidLocale(langParam)) {
      setLocale(langParam);
      return;
    }
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    const cookieLang = match ? match[1] : null;
    if (isValidLocale(cookieLang)) {
      setLocale(cookieLang);
    }
  }, [searchParams]);

  return locale;
}
