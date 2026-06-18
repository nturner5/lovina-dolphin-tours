'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackWhatsAppClick } from '@/lib/analytics';

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const pathname = usePathname();
  const isCheckoutPage = pathname === '/checkout';
  
  // Official Balinese phone number
  const phoneNumber = '18018556266';
  const prefilledMessage = encodeURIComponent("Hi Bali Dolphin Tours! I'd like to inquire about booking a private dolphin tour.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${prefilledMessage}`;

  return (
    <div className={`fixed right-8 z-50 flex items-center gap-3 transition-all duration-300 ${
      isCheckoutPage ? 'bottom-24 md:bottom-8' : 'bottom-8'
    }`}>
      {/* Tooltip message */}
      <div 
        className={`bg-deep-indigo text-cloud-dancer px-4 py-2.5 rounded-2xl shadow-xl border border-cloud-dancer/10 text-xs font-medium tracking-wide transition-all duration-300 transform origin-right ${
          hovered ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-75 translate-x-4 pointer-events-none'
        }`}
      >
        <div className="flex flex-col">
          <span className="font-bold text-coral-pop uppercase tracking-widest text-[9px] mb-0.5">Bali Support</span>
          <span>Chat with a Captain</span>
        </div>
      </div>

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => trackWhatsAppClick('Floating Button')}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-transformative-teal text-cloud-dancer shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-cloud-dancer/10 transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Chat on WhatsApp"
      >
        {/* Pulsing ring outer container */}
        <span className="absolute -inset-1.5 rounded-full border-2 border-transformative-teal/20 animate-ping opacity-75 group-hover:animate-none"></span>
        
        {/* WhatsApp Custom SVG Path (high resolution & official) */}
        <svg 
          className="w-7 h-7 fill-current transition-transform duration-300 group-hover:rotate-12"
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.03 14.07 1.012 11.452 1.01c-5.436 0-9.862 4.37-9.866 9.801-.002 1.905.525 3.76 1.523 5.376l-.999 3.648 3.737-.981zm11.387-5.464c-.301-.15-1.78-.879-2.056-.979-.275-.1-.475-.15-.675.15-.1.15-.776.979-.951 1.178-.175.2-.35.225-.65.075-.3-.15-1.268-.467-2.417-1.492-.892-.796-1.495-1.78-1.67-2.08-.175-.3-.019-.462.13-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.925-2.228-.243-.583-.489-.504-.674-.513-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.22 5.116 4.521.715.31 1.273.495 1.708.633.718.228 1.37.195 1.887.118.575-.085 1.78-.727 2.03-1.429.25-.7.25-1.3.175-1.429-.075-.13-.275-.205-.575-.355z"/>
        </svg>
      </a>
    </div>
  );
}
