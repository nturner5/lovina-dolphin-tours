'use client';

import { ReactNode } from 'react';
import { trackWhatsAppClick } from '@/lib/analytics';

interface WhatsAppTrackedLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  label: string;
  target?: string;
  rel?: string;
}

export default function WhatsAppTrackedLink({
  href,
  className,
  children,
  label,
  target = '_blank',
  rel = 'noopener noreferrer',
}: WhatsAppTrackedLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackWhatsAppClick(label)}
    >
      {children}
    </a>
  );
}
