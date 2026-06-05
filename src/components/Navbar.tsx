'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { t } from "@/locales/i18n";
import { useLocale } from "@/locales/i18n-client";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();

  // Helper to persist language query param during navigation
  const hrefFor = (path: string) => {
    if (locale === 'en') return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}lang=${locale}`;
  };

  return (
    <nav className="relative flex items-center justify-between px-6 py-4 lg:px-12 bg-cloud-dancer border-b border-deep-indigo/10 z-40">
      <div className="flex items-center gap-4">
        <Link href={hrefFor("/")} className="flex items-center gap-3 group">
          <div className="relative w-[60px] h-[60px] transition-transform duration-500 group-hover:scale-110">
            <Image 
              src="/logo.svg" 
              alt="Bali Dolphin Tours Logo" 
              fill
              className="object-contain"
            />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-deep-indigo">
            Bali <span className="font-light italic text-transformative-teal underline decoration-coral-pop decoration-2 underline-offset-4">Dolphin</span> Tours
          </span>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium tracking-wide uppercase">
        <Link href={hrefFor("/#ethics")} className="hover:text-transformative-teal transition-colors">{t('dolphinRules', locale)}</Link>
        <Link href={hrefFor("/tours")} className="hover:text-transformative-teal transition-colors">{t('tours', locale)}</Link>
        <Link href={hrefFor("/#faq")} className="hover:text-transformative-teal transition-colors">{t('faq', locale)}</Link>
        <Link href={hrefFor("/blog")} className="hover:text-transformative-teal transition-colors">{t('blog', locale)}</Link>
        
        {/* Language Switcher next to the Call to Action */}
        <LanguageSwitcher />

        <Link 
          href={hrefFor("/tours")} 
          className="bg-deep-indigo text-cloud-dancer px-6 py-3 rounded-full hover:bg-transformative-teal transition-all duration-300 shadow-sm text-center font-bold tracking-wider"
        >
          {t('bookNow', locale)}
        </Link>
      </div>

      {/* Mobile Menu Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-deep-indigo relative z-50 hover:text-transformative-teal focus:outline-none"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6 animate-in spin-in-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 animate-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-cloud-dancer border-b border-deep-indigo/10 shadow-2xl flex flex-col p-6 gap-4 z-40 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <Link 
            href={hrefFor("/#ethics")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('dolphinRules', locale)}
          </Link>
          <Link 
            href={hrefFor("/tours")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('tours', locale)}
          </Link>
          <Link 
            href={hrefFor("/#faq")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('faq', locale)}
          </Link>
          <Link 
            href={hrefFor("/blog")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('blog', locale)}
          </Link>
          
          <div className="flex items-center justify-between py-2 border-b border-deep-indigo/5">
            <span className="text-sm font-medium text-deep-indigo/60 uppercase">Language</span>
            <LanguageSwitcher />
          </div>

          <Link 
            href={hrefFor("/tours")} 
            onClick={() => setIsOpen(false)}
            className="bg-deep-indigo text-cloud-dancer px-6 py-4 rounded-full hover:bg-transformative-teal transition-all duration-300 shadow-sm text-center font-bold mt-2"
          >
            {t('bookNow', locale)}
          </Link>
        </div>
      )}
    </nav>
  );
}
