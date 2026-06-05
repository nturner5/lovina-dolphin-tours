import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/lib/image';
import { PortableText } from '@portabletext/react';
import { t } from '@/locales/i18n';
import { getLocaleServer } from '@/locales/i18n-server';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const locale = await getLocaleServer(resolvedParams);

  const hrefFor = (path: string) => {
    if (locale === 'en') return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}lang=${locale}`;
  };
  
  // Fetch detailed blog post including our new enriched metadata fields
  const post = await client.fetch(
    groq`*[_type == "post" && slug.current == $slug][0]`,
    { slug }
  );

  if (!post) return <div className="p-32 text-center font-serif italic text-deep-indigo/30">{t('storyNotFound', locale)}</div>;

  // Calculate Reading Time (200 words per minute average)
  const wordCount = post.body
    ? post.body
        .filter((b: any) => b._type === 'block')
        .flatMap((b: any) => b.children || [])
        .map((c: any) => c.text || '')
        .join(' ')
        .split(/\s+/).length
    : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Filter out the duplicate H1 or H2 title block from the body content
  const bodyBlocks = post.body && Array.isArray(post.body)
    ? post.body.filter((block: any, index: number) => {
        if (index === 0 && (block.style === 'h1' || block.style === 'h2')) {
          return false;
        }
        return true;
      })
    : [];

  // Parse Headings dynamically from Sanity PortableText for the Interactive TOC
  const headings: { text: string; id: string; style: string }[] = post.body
    ? post.body
        .filter((b: any) => b._type === 'block' && /^h[234]/.test(b.style || ''))
        .map((b: any) => {
          const text = b.children?.map((c: any) => c.text).join('') || '';
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          return { text, id, style: b.style || '' };
        })
    : [];

  // Custom PortableText components to automatically inject matching IDs into heading tags at runtime
  const portableTextComponents = {
    block: {
      h2: ({ children, value }: any) => {
        const text = value.children?.map((c: any) => c.text).join('') || '';
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
        return <h2 id={id} className="text-3xl font-serif text-deep-indigo mt-12 mb-4 scroll-mt-24">{children}</h2>;
      },
      h3: ({ children, value }: any) => {
        const text = value.children?.map((c: any) => c.text).join('') || '';
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
        return <h3 id={id} className="text-2xl font-serif text-deep-indigo mt-8 mb-3 scroll-mt-24">{children}</h3>;
      },
      h4: ({ children, value }: any) => {
        const text = value.children?.map((c: any) => c.text).join('') || '';
        const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
        return <h4 id={id} className="text-xl font-serif text-deep-indigo mt-6 mb-2 scroll-mt-24">{children}</h4>;
      },
    },
    types: {
      image: ({ value }: any) => {
        if (!value?.asset?._ref) return null;
        
        return (
          <figure className="not-prose my-10 space-y-2.5 mx-auto max-w-2xl">
            <div className="relative w-full aspect-[3/2] rounded-3xl overflow-hidden border border-deep-indigo/5 shadow-lg bg-deep-indigo/5">
              <Image 
                src={urlFor(value).url()} 
                alt={value.alt || 'Lovina travel scene'}
                fill
                sizes="(max-w-768px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            {(value.caption || value.alt) && (
              <figcaption className="text-center text-[10px] sm:text-xs font-serif italic text-deep-indigo/40 mt-2 block">
                {value.caption || value.alt}
              </figcaption>
            )}
          </figure>
        );
      }
    },
    marks: {
      link: ({ children, value }: any) => {
        const href = value?.href || '#';
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        return (
          <a 
            href={href} 
            target={isExternal ? '_blank' : undefined} 
            rel={isExternal ? 'noopener noreferrer' : undefined} 
            className="text-transformative-teal underline hover:text-coral-pop transition-colors duration-200 font-medium"
          >
            {children}
          </a>
        );
      }
    }
  };

  // Structured Rich JSON-LD Schema (BlogPosting Schema) for maximum indexing & crawling speeds
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || "Premium travel authority article by Bali Dolphin Tours.",
    "image": post.mainImage ? urlFor(post.mainImage).url() : "https://balidolphintours.com/hero_dolphins.png",
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author || "Bali Dolphin Tours Team",
      "url": "https://balidolphintours.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bali Dolphin Tours",
      "logo": {
        "@type": "ImageObject",
        "url": "https://balidolphintours.com/logo.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://balidolphintours.com/blog/${slug}`
    }
  };

  // Structured FAQ JSON-LD if present
  const hasFaqs = post.faqs && post.faqs.length > 0;
  const faqJsonLd = hasFaqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question || '',
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer || ''
      }
    }))
  } : null;

  return (
    <main className="bg-cloud-dancer min-h-screen">
      {/* Inject Structured Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="px-4 sm:px-6 py-16 lg:py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <header className="mb-12 lg:mb-16 text-center max-w-5xl mx-auto">
            <span className="text-[10px] font-bold text-coral-pop uppercase tracking-[0.2em] bg-coral-pop/5 px-4 py-1.5 rounded-full border border-coral-pop/10 inline-block mb-6">
              {t('travelGuide', locale)}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-deep-indigo mb-8 leading-tight">
              {post.title}
            </h1>
            
            {/* Author and Date Premium Badge */}
            <div className="flex items-center justify-center gap-3 text-xs border-y border-deep-indigo/10 py-4 max-w-lg mx-auto">
              <div className="w-8 h-8 rounded-full bg-transformative-teal/15 flex items-center justify-center font-bold text-transformative-teal select-none">
                🌴
              </div>
              <div className="text-left leading-tight">
                <span className="block font-bold text-deep-indigo">{post.author || 'Bali Dolphin Tours Team'}</span>
                <span className="text-[10px] text-deep-indigo/50 font-light">
                  {new Date(post.publishedAt).toLocaleDateString(
                    locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US', 
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                  <span className="mx-2">•</span>
                  ⏱️ {readingTime} {t('minRead', locale)}
                </span>
              </div>
            </div>
          </header>

          {/* Hero Cover Banner Image - Cinematic 16:9 Landscape */}
          {post.mainImage && (
            <div className="w-full max-w-5xl aspect-[16/9] rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden bg-deep-indigo/5 relative border border-deep-indigo/5 shadow-2xl mb-16 mx-auto">
              <Image 
                src={urlFor(post.mainImage).url()} 
                alt={post.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Core Layout Split */}
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Table of Contents (Mobile) & Article Body */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Collapsible/Box Takeaways & TOC for Mobile Screen sizes */}
              <div className="lg:hidden space-y-4">
                {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                  <div className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/15 space-y-3">
                    <span className="text-[10px] font-bold text-transformative-teal block border-b border-transformative-teal/10 pb-2 uppercase tracking-wider">
                      🎯 {t('takeawaysTitle', locale)}
                    </span>
                    <ul className="space-y-2 text-xs">
                      {post.keyTakeaways.map((takeaway: string, i: number) => {
                        const heading = headings[i];
                        return (
                          <li key={i} className="text-deep-indigo/80">
                            {heading ? (
                              <a href={`#${heading.id}`} className="hover:text-transformative-teal hover:underline flex items-start gap-1.5 font-light">
                                <span>💡</span>
                                <span>{takeaway}</span>
                              </a>
                            ) : (
                              <div className="flex items-start gap-1.5 font-light">
                                <span>💡</span>
                                <span>{takeaway}</span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {headings.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl border border-deep-indigo/5 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-deep-indigo block border-b border-deep-indigo/5 pb-2">📋 {t('tocTitle', locale)}</span>
                    <ul className="space-y-2 text-xs">
                      {headings.map((h, i) => (
                        <li key={i} className={`${h.style === 'h4' ? 'pl-4 text-deep-indigo/50' : 'font-semibold text-deep-indigo/70'}`}>
                          <a href={`#${h.id}`} className="hover:text-transformative-teal hover:underline transition-colors flex items-start gap-1">
                            <span>•</span>
                            <span>{h.text}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Main PortableText Content */}
              <div className="prose prose-xl prose-headings:font-serif prose-headings:text-deep-indigo text-deep-indigo/80 max-w-none prose-p:leading-relaxed prose-p:font-light prose-li:text-xs">
                <PortableText value={bodyBlocks} components={portableTextComponents} />
              </div>
            </div>

            {/* Right Column: Sticky Sidebar with TOC & CRO Card (Desktop only) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-6">
              
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <div className="bg-transformative-teal/5 p-6 rounded-[2rem] border border-transformative-teal/15 space-y-4">
                  <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-widest border-b border-transformative-teal/10 pb-2 block">
                    🎯 {t('takeawaysTitle', locale)}
                  </span>
                  <ul className="space-y-3 text-[11px] leading-relaxed">
                    {post.keyTakeaways.map((takeaway: string, i: number) => {
                      const heading = headings[i];
                      return (
                        <li key={i} className="text-deep-indigo/80">
                          {heading ? (
                            <a href={`#${heading.id}`} className="hover:text-transformative-teal hover:underline flex items-start gap-1.5 font-light">
                              <span>💡</span>
                              <span>{takeaway}</span>
                            </a>
                          ) : (
                            <div className="flex items-start gap-1.5 font-light">
                              <span>💡</span>
                              <span>{takeaway}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {headings.length > 0 && (
                <div className="bg-white p-6 rounded-[2rem] border border-deep-indigo/5 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-coral-pop uppercase tracking-widest border-b border-deep-indigo/5 pb-2 block">
                    📋 {t('tocTitle', locale)}
                  </span>
                  <ul className="space-y-3 text-[11px] leading-tight">
                    {headings.map((h, i) => (
                      <li key={i} className={`${h.style === 'h4' ? 'pl-3 text-deep-indigo/50 font-light' : 'font-bold text-deep-indigo/70'}`}>
                        <a href={`#${h.id}`} className="hover:text-transformative-teal hover:underline transition-all flex items-start gap-1.5">
                          <span>•</span>
                          <span>{h.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* High-Converting Sidebar Booking CTA */}
              <div className="bg-transformative-teal text-cloud-dancer p-8 rounded-[2rem] shadow-md border border-transformative-teal/20 space-y-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/ocean-texture.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 space-y-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-coral-pop bg-coral-pop/10 px-3 py-1 rounded-md border border-coral-pop/10 inline-block">
                    ✦ {t('limitedDepartures', locale)}
                  </span>
                  <h3 className="text-2xl font-serif leading-tight">{t('ctaTitleSidebar', locale)}</h3>
                  <p className="text-xs text-cloud-dancer/80 font-light leading-relaxed">
                    {t('ctaDescSidebar', locale)}
                  </p>
                  
                  <div className="border-t border-cloud-dancer/10 pt-4 space-y-2 text-[11px] font-light">
                    <div className="flex justify-between">
                      <span>• {t('tour1Title', locale)}</span>
                      <span className="font-bold">$45 USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• {t('tour2Title', locale)}</span>
                      <span className="font-bold">$65 USD</span>
                    </div>
                  </div>

                  <Link 
                    href={hrefFor('/tours')}
                    className="block w-full bg-coral-pop text-cloud-dancer py-3.5 rounded-full text-center text-xs font-bold hover:bg-white hover:text-deep-indigo transition-all shadow-md active:scale-95 relative group"
                  >
                    <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75"></span>
                    {t('choosePrivateBoat', locale)}
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Structured Premium FAQs Visual Accordion Section */}
          {post.faqs && post.faqs.length > 0 && (
            <div className="mt-20 pt-16 border-t border-deep-indigo/10 space-y-8 max-w-4xl mx-auto">
              <div className="text-center max-w-lg mx-auto mb-6">
                <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-[0.2em] bg-transformative-teal/5 px-4 py-1.5 rounded-full border border-transformative-teal/10 inline-block mb-3">
                  {t('faqBadge', locale)}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-deep-indigo">{t('faqHeading', locale)}</h2>
              </div>
              
              <div className="space-y-4">
                {post.faqs.map((faq: any, i: number) => (
                  <div key={i} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-deep-indigo/5 shadow-sm space-y-3">
                    <h4 className="text-base font-serif font-bold text-deep-indigo flex gap-2">
                      <span className="text-transformative-teal">❓</span>
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-xs text-deep-indigo/70 font-light leading-relaxed pl-6">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </article>
    </main>
  );
}

