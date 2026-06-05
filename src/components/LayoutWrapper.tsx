'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Complete full-screen workspace inside Sanity Studio (/admin) or SEO Writer dashboard
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={<div className="h-[73px] bg-white border-b border-deep-indigo/5 animate-pulse" />}>
        <Navbar />
      </Suspense>
      {children}
      <Footer />
      <WhatsAppButton />
    </>
  );
}

