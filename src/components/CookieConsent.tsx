'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/locales/i18n-client';

export default function CookieConsent() {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Simple translations object for Cookie Banner
  const content = {
    en: {
      msg: 'We use cookies to improve your booking experience, analyze site traffic, and support secure Stripe payments. Learn more in our ',
      privacyLink: 'Privacy Policy',
      accept: 'Accept All',
      decline: 'Decline',
    },
    ru: {
      msg: 'Мы используем файлы cookie для улучшения работы сайта, анализа трафика и безопасных платежей Stripe. Узнайте больше в нашей ',
      privacyLink: 'Политике конфиденциальности',
      accept: 'Принять все',
      decline: 'Отклонить',
    },
    zh: {
      msg: '我们使用 Cookie 来优化您的预订体验、分析网站流量并支持安全的 Stripe 支付。阅读我们的 ',
      privacyLink: '隐私政策',
      accept: '接受全部',
      decline: '拒绝',
    },
  };

  const activeLang = content[locale as 'en' | 'ru' | 'zh'] || content.en;

  // Helper to persist language query param during navigation, supporting hash anchors
  const privacyHref = () => {
    if (locale === 'en') return '/privacy';
    return `/privacy?lang=${locale}`;
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-8 md:right-auto md:max-w-md bg-deep-indigo/95 backdrop-blur-md text-cloud-dancer p-5 rounded-[2rem] border border-cloud-dancer/10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-coral-pop uppercase tracking-widest block">Cookie Settings</span>
        <p className="text-xs font-light leading-relaxed text-cloud-dancer/90">
          {activeLang.msg}
          <Link href={privacyHref()} className="underline hover:text-transformative-teal font-medium transition-colors">
            {activeLang.privacyLink}
          </Link>
          .
        </p>
      </div>
      
      <div className="flex items-center gap-3 self-end md:self-auto">
        <button
          onClick={handleDecline}
          className="px-4 py-2 rounded-full text-xs font-semibold text-cloud-dancer/70 hover:text-cloud-dancer hover:bg-white/5 transition-all cursor-pointer"
        >
          {activeLang.decline}
        </button>
        <button
          onClick={handleAccept}
          className="bg-transformative-teal text-cloud-dancer px-5 py-2 rounded-full text-xs font-bold hover:bg-coral-pop transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {activeLang.accept}
        </button>
      </div>
    </div>
  );
}
