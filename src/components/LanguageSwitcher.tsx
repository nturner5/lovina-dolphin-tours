'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'ru', label: 'Русский (RU)' },
  { code: 'zh', label: '简体中文 (ZH)' }
] as const;

export default function LanguageSwitcher() {
  const searchParams = useSearchParams();
  const [currentLang, setCurrentLang] = useState<'en' | 'ru' | 'zh'>('en');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync active language from URL query parameters or cookie on load
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam && ['en', 'ru', 'zh'].includes(langParam)) {
      setCurrentLang(langParam as any);
      return;
    }
    
    // Check cookie fallback
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    const cookieLang = match ? match[1] : null;
    if (cookieLang && ['en', 'ru', 'zh'].includes(cookieLang)) {
      setCurrentLang(cookieLang as any);
    }
  }, [searchParams]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (code: 'en' | 'ru' | 'zh') => {
    // 1. Set cookie to persist choice across sessions
    document.cookie = `lang=${code}; path=/; max-age=31536000; SameSite=Lax`;
    
    // 2. Update query params and reload to refresh Server Components
    const params = new URLSearchParams(window.location.search);
    params.set('lang', code);
    
    // Trigger window location update for synchronous reload (prevents hydration mismatch)
    window.location.search = params.toString();
    setDropdownOpen(false);
  };

  const activeLabel = LANGUAGES.find(l => l.code === currentLang)?.label.split(' ')[0] || 'English';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-cloud-dancer hover:bg-deep-indigo/5 text-deep-indigo text-xs font-bold uppercase tracking-widest border border-deep-indigo/10 shadow-sm transition-all duration-300 active:scale-95"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <svg 
          className="w-4 h-4 text-transformative-teal shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{activeLabel}</span>
        <svg 
          className={`w-3.5 h-3.5 text-deep-indigo/40 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2.5 w-48 rounded-2xl bg-white/95 backdrop-blur-md border border-deep-indigo/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-3 text-xs rounded-xl font-bold tracking-wide uppercase transition-colors duration-200 flex items-center justify-between ${
                  currentLang === lang.code 
                    ? 'bg-transformative-teal/10 text-transformative-teal font-bold' 
                    : 'text-deep-indigo/70 hover:bg-deep-indigo/5'
                }`}
                role="menuitem"
              >
                <span>{lang.label}</span>
                {currentLang === lang.code && (
                  <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
