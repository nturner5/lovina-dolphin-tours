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

  // Helper to persist language query param during navigation, supporting hash anchors
  const hrefFor = (path: string) => {
    const [basePath, hash] = path.split('#');
    const hashPart = hash ? `#${hash}` : '';
    if (locale === 'en') return `${basePath}${hashPart}`;
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}lang=${locale}${hashPart}`;
  };

  return (
    <>
      {/* Sighting Guarantee Top-Header Banner */}
      <div className="bg-deep-indigo text-cloud-dancer text-center px-4 py-2.5 md:py-3 text-xs sm:text-sm tracking-wide font-medium flex items-center justify-center gap-2 relative z-50 border-b border-white/5 shadow-inner">
        <span className="animate-pulse">🐬</span>
        <span className="flex items-center flex-wrap justify-center gap-y-1">
          <span className="font-bold bg-coral-pop text-white uppercase tracking-widest text-[9px] sm:text-[10px] mr-2 px-2 py-0.5 rounded shadow-sm">
            {t("guaranteeBannerBadge", locale)}
          </span>
          <Link href={hrefFor("/#ethics")} className="hover:underline transition-all inline-flex flex-wrap items-center justify-center gap-1 group font-semibold text-white/90 hover:text-white">
            {locale === 'en' ? (
              <>See wild dolphins or ride again completely free! <span className="text-coral-pop font-bold group-hover:text-white transition-colors ml-1.5">Learn More →</span></>
            ) : locale === 'ru' ? (
              <>Увидите дельфинов или следующая поездка бесплатно! <span className="text-coral-pop font-bold group-hover:text-white transition-colors ml-1.5">Подробнее →</span></>
            ) : (
              <>看见野生海豚，否则免费再玩一次！ <span className="text-coral-pop font-bold group-hover:text-white transition-colors ml-1.5">了解更多 →</span></>
            )}
          </Link>
        </span>
      </div>
      <nav className="relative flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12 bg-cloud-dancer border-b border-deep-indigo/10 z-40 max-w-full overflow-hidden">
      <div className="flex items-center">
        <Link href={hrefFor("/")} className="flex items-center group">
          <div className="relative w-[190px] h-[63px] sm:w-[260px] sm:h-[87px] md:w-[300px] md:h-[100px] transition-transform duration-500 group-hover:scale-[1.02]">
            <Image 
              src="/balidolphinlogo.svg" 
              alt="Bali Dolphin Tours Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium tracking-wide uppercase">
        <Link href={hrefFor("/#ethics")} className="hover:text-transformative-teal transition-colors">{t('dolphinRules', locale)}</Link>
        <Link href={hrefFor("/#packages")} className="hover:text-transformative-teal transition-colors">{t('tours', locale)}</Link>
        <Link href={hrefFor("/gallery")} className="hover:text-transformative-teal transition-colors">{t('gallery', locale)}</Link>
        <Link href={hrefFor("/#faq")} className="hover:text-transformative-teal transition-colors">{t('faq', locale)}</Link>
        <Link href={hrefFor("/blog")} className="hover:text-transformative-teal transition-colors">{t('blog', locale)}</Link>
        
        {/* Language Switcher next to the Call to Action */}
        <LanguageSwitcher />

        <Link 
          href={hrefFor("/#packages")} 
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
            href={hrefFor("/#packages")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('tours', locale)}
          </Link>
          <Link 
            href={hrefFor("/gallery")} 
            onClick={() => setIsOpen(false)}
            className="text-base font-medium text-deep-indigo py-2 border-b border-deep-indigo/5 hover:text-transformative-teal transition-colors"
          >
            {t('gallery', locale)}
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
            href={hrefFor("/#packages")} 
            onClick={() => setIsOpen(false)}
            className="bg-deep-indigo text-cloud-dancer px-6 py-4 rounded-full hover:bg-transformative-teal transition-all duration-300 shadow-sm text-center font-bold mt-2"
          >
            {t('bookNow', locale)}
          </Link>
        </div>
      )}
    </nav>
    </>
  );
}
