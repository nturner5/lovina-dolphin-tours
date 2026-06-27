'use client';

import Image from 'next/image';
import { Locale } from '@/locales/translations';
import { t } from '@/locales/i18n';

interface GalleryPhoto {
  _id: string;
  url: string;
  alt: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  locale: Locale;
}

export default function PhotoGallery({ photos, locale }: PhotoGalleryProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {photos.map((photo) => (
            <div 
              key={photo._id} 
              className="break-inside-avoid group relative overflow-hidden rounded-2xl border border-deep-indigo/5 shadow-sm bg-cloud-dancer/20"
            >
              <Image
                src={photo.url}
                alt={photo.alt || 'Bali Dolphin Tour Moment'}
                width={800}
                height={1200}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {photo.caption && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-deep-indigo/80 via-deep-indigo/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6">
                  <p className="text-white text-xs font-light tracking-wide leading-relaxed transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {photo.caption}
                  </p>
                </div>
              )}
              
              {/* Subtle overlay border on hover */}
              <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
      </div>
    </div>
  );
}
