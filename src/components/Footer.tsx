'use client';

import Link from "next/link";
import Image from "next/image";
import { trackWhatsAppClick } from "@/lib/analytics";
import { useLocale } from "@/locales/i18n-client";

export default function Footer() {
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
    <footer className="bg-cloud-dancer border-t border-deep-indigo/20 py-16 px-6 lg:px-12 text-sm text-deep-indigo/40">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center">
            <div className="relative w-[210px] h-[70px] opacity-80 hover:opacity-100 hover:scale-[1.02] transition-all duration-500">
              <Image 
                src="/balidolphinlogo.svg" 
                alt="Bali Dolphin Tours Logo" 
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="max-w-xs leading-relaxed">
            North Bali’s definitive standard for respectful dolphin tours. 
            Dedicated to the protection and quiet observation of Lovina’s wild dolphin pods.
          </p>
          <p>&copy; 2026 Bali Dolphin Tours. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Navigate</span>
            <Link href={hrefFor("/#ethics")} className="hover:text-transformative-teal">Dolphin Rules</Link>
            <Link href={hrefFor("/#packages")} className="hover:text-transformative-teal">Tours</Link>
            <Link href={hrefFor("/blog")} className="hover:text-transformative-teal">Blog</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Legal</span>
            <Link href={hrefFor("/privacy")} className="hover:text-transformative-teal">Privacy</Link>
            <Link href={hrefFor("/terms")} className="hover:text-transformative-teal">Terms</Link>
            <Link href={hrefFor("/refunds")} className="hover:text-transformative-teal">Refund Policy</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Connect</span>
            <Link href="https://instagram.com" className="hover:text-transformative-teal">Instagram</Link>
            <Link 
              href="https://wa.me/6285190422839" 
              onClick={() => trackWhatsAppClick('Footer Link')}
              className="hover:text-transformative-teal"
            >
              WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
