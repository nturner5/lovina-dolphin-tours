'use client';

import { useEffect, useRef, useState } from 'react';

interface Reel {
  _id: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface ReelsGridProps {
  reels: Reel[];
}

export default function ReelsGrid({ reels }: ReelsGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Helper to extract the Instagram post code and format the embed URL
  const getEmbedUrl = (url: string) => {
    try {
      const match = url.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        return `https://www.instagram.com/p/${match[1]}/embed/`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Load once and stay loaded
        }
      },
      { rootMargin: '300px' } // Pre-load 300px before scrolling into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // 328px card width + 24px gap = 352px scroll step
      const scrollStep = 352; 
      const scrollAmount = direction === 'left' ? -scrollStep : scrollStep;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-4">
      {/* Left Glassmorphic Scroll Arrow (Desktop only) */}
      <button
        onClick={() => scrollCarousel('left')}
        className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-deep-indigo hover:text-transformative-teal hover:bg-white/40 shadow-xl hidden md:flex items-center justify-center z-30 transition-all active:scale-90"
        aria-label="Scroll left"
      >
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right Glassmorphic Scroll Arrow (Desktop only) */}
      <button
        onClick={() => scrollCarousel('right')}
        className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-deep-indigo hover:text-transformative-teal hover:bg-white/40 shadow-xl hidden md:flex items-center justify-center z-30 transition-all active:scale-90"
        aria-label="Scroll right"
      >
        <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Horizontal Carousel Track */}
      <div 
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-4 px-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.map((reel) => {
          const embedUrl = getEmbedUrl(reel.url);

          return (
            <div 
              key={reel._id} 
              className="w-[328px] h-[583px] shrink-0 snap-start rounded-2xl bg-deep-indigo/5 overflow-hidden border border-deep-indigo/10 shadow-lg relative group flex flex-col justify-between"
              style={{ minWidth: '328px', minHeight: '583px' }}
            >
              {isVisible && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-none rounded-2xl"
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              ) : (
                // Editorial skeleton loader while waiting for scroll or load
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-deep-indigo via-[#1b2b32] to-transformative-teal">
                  <div className="absolute inset-0 bg-[url('/ocean-texture.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                  <div className="w-10 h-10 rounded-full border-2 border-transformative-teal border-t-transparent animate-spin mb-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-coral-pop block mb-1">Instagram Reel</span>
                  <p className="text-xs font-serif italic text-cloud-dancer/40 leading-snug">{reel.title}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
