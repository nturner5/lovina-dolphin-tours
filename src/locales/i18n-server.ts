import { cookies } from 'next/headers';
import { isValidLocale } from './i18n';
import { Locale } from './translations';

// Server-side helper to get the locale from query params (resolved) or cookies
export async function getLocaleServer(searchParams?: { [key: string]: string | string[] | undefined }): Promise<Locale> {
  // 1. Try resolving from searchParams if they exist
  if (searchParams && typeof searchParams.lang === 'string' && isValidLocale(searchParams.lang)) {
    return searchParams.lang;
  }
  
  // 2. Try resolving from cookies
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get('lang')?.value;
    if (isValidLocale(langCookie)) {
      return langCookie;
    }
  } catch (error) {
    // cookies() is only available in Request context (e.g., inside layouts, page render)
  }
  
  return 'en';
}
