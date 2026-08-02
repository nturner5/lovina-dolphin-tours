import Link from "next/link";
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import ReelsGrid from '@/components/ReelsGrid';
import { t } from '@/locales/i18n';
import { getLocaleServer } from '@/locales/i18n-server';
import TrustCharter from "@/components/TrustCharter";
import ReviewsSection from "@/components/ReviewsSection";
import { getPricingData, getExchangeRate } from "@/lib/pricing-server";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const locale = await getLocaleServer(resolvedParams);
  const pricing = await getPricingData();
  const rate = await getExchangeRate();

  const currencyParam = resolvedParams.currency;
  const activeCurrency = typeof currencyParam === 'string' && currencyParam.toLowerCase() === 'idr' ? 'idr' : 'usd';

  // Find dynamic price values from Stripe (IDR and USD)
  const tour1 = pricing.tours.find((t: any) => t.id === 'seven-am-ethical');
  const tour1Price = tour1?.price || 812000;
  const tour1PriceUsd = tour1?.priceUsd || 45;

  const tour2 = pricing.tours.find((t: any) => t.id === 'dolphin-swim');
  const tour2Price = tour2?.price || 993000;
  const tour2PriceUsd = tour2?.priceUsd || 55;

  const tour3 = pricing.tours.find((t: any) => t.id === 'swim-snorkel');
  const tour3Price = tour3?.price || 1173000;
  const tour3PriceUsd = tour3?.priceUsd || 65;

  const hrefFor = (path: string) => {
    const [basePath, hash] = path.split('#');
    const hashPart = hash ? `#${hash}` : '';
    const cleanPath = basePath || '/';
    if (locale === 'en') return `${cleanPath}${hashPart}`;
    const separator = cleanPath.includes('?') ? '&' : '?';
    return `${cleanPath}${separator}lang=${locale}${hashPart}`;
  };

  const checkoutHrefFor = (tourKey: string) => {
    let path = `/checkout?tour=${tourKey}&currency=${activeCurrency}`;
    if (locale !== 'en') {
      path += `&lang=${locale}`;
    }
    return path;
  };

  const sanityReels = await client.fetch(groq`*[_type == "reel"] | order(_createdAt desc)[0...4]`);

  // Pre-serialize Sanity image URLs so we don't pass functions to a Client Component
  const formattedSanityReels = sanityReels.map((reel: any) => ({
    _id: reel._id,
    title: reel.title,
    url: reel.url,
    thumbnailUrl: reel.thumbnail ? urlFor(reel.thumbnail).url() : null
  }));

  // Hardcoded premium fallback reels including the user's specific Instagram Reel.
  // We omit thumbnailUrl to let them render as distinct, gorgeous brand gradients (no hero image repeat!)
  const defaultReels = [
    {
      _id: 'default-1',
      title: 'Wild Dolphins Playing in the Calm 8 AM Sea',
      url: 'https://www.instagram.com/reels/DX916fDSO6N/',
      thumbnailUrl: null
    },
    {
      _id: 'default-2',
      title: 'Quiet Snorkeling & Sea Turtles at Lovina Reef',
      url: 'https://www.instagram.com/reels/DM2I9CUOoX2/',
      thumbnailUrl: null
    },
    {
      _id: 'default-3',
      title: 'Ethical Parallel Sailing with Curated Captains',
      url: 'https://www.instagram.com/reels/DYkGQ6eM_wl/',
      thumbnailUrl: null
    },
    {
      _id: 'default-4',
      title: 'Sunrise vs 8 AM Departure Comparison',
      url: 'https://www.instagram.com/reels/DYd7i7evXhw/',
      thumbnailUrl: null
    }
  ];

  // Combine fetched reels with default reels, ensuring we always render 4 beautiful cards
  const reels = [...formattedSanityReels, ...defaultReels].slice(0, 4);

  return (
    <main className="flex-1 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-12 sm:px-6 lg:pt-14 lg:pb-24 overflow-hidden bg-cloud-dancer">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10">
          
          {/* Left Column: Brand Content & Scannable Highlights */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Elegant Tag Badge */}
            <div className="bg-transformative-teal/10 text-transformative-teal px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 mb-4 lg:mb-6 border border-transformative-teal/20">
              <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.243-6.243l-2.122 2.122M8.879 15.121l-2.122 2.122M17.243 17.243l-2.122-2.122M8.879 8.879L6.757 6.757M12 8a4 4 0 014 4H8a4 4 0 014-4zM4 20h16" />
              </svg>
              {t('heroBadge', locale)}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-deep-indigo mb-4 lg:mb-6 leading-[1.1] tracking-tight">
              {t('heroTitle', locale)}
            </h1>

            {/* Mobile-only Dolphin Image Card */}
            <div className="lg:hidden w-full my-4 relative animate-in fade-in zoom-in duration-1000 delay-200">
              <div className="aspect-[16/9] w-full rounded-[2rem] overflow-hidden bg-deep-indigo/5 shadow-xl border border-deep-indigo/10 relative group">
                <Image 
                  src="/hero_dolphins.png" 
                  alt={t('heroAltText', locale)} 
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 1px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-md flex items-center justify-between text-[10px]">
                  <span className="font-bold text-deep-indigo">{t('ratingText', locale)}</span>
                  <div className="w-1.5 h-1.5 bg-transformative-teal rounded-full animate-ping" />
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-6">
              <Link 
                href={hrefFor("/#packages")} 
                className="bg-coral-pop text-cloud-dancer px-10 py-4 rounded-full text-base font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 text-center relative group"
              >
                {/* Pulsing ring outer container */}
                <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75 pointer-events-none"></span>
                {t('btnBookTour', locale)}
              </Link>
              <Link 
                href={hrefFor("/#ethics")} 
                className="bg-white border border-deep-indigo/10 text-deep-indigo px-10 py-4 rounded-full text-base font-bold hover:bg-cloud-dancer/50 transition-all active:scale-95 text-center shadow-sm"
              >
                {t('dolphinRules', locale)}
              </Link>
            </div>

            {/* Quick Trust Seals / Badges directly under CTAs */}
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-light text-deep-indigo/60 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">✓ 100% Private Boat</span>
              <span className="text-deep-indigo/20 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">✓ Zero Chase / Swarm</span>
              <span className="text-deep-indigo/20 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">✓ Sighting Guarantee</span>
              <span className="text-deep-indigo/20 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">✓ Vetted Local Captains</span>
            </div>
          </div>
          
          {/* Right Column: Floating Visual Dolphin Card (Desktop only) */}
          <div className="hidden lg:block lg:col-span-5 w-full relative animate-in fade-in zoom-in duration-1000 delay-200">
            {/* Background glowing gradient circle */}
            <div className="absolute -inset-4 bg-transformative-teal/5 rounded-[4rem] blur-3xl -z-10" />

            <div className="aspect-[4/5] lg:aspect-square w-full rounded-[3rem] overflow-hidden bg-deep-indigo/5 shadow-2xl border border-deep-indigo/10 relative group">
              <Image 
                src="/hero_dolphins.png" 
                alt="Two sleek wild dolphins gliding peacefully in the calm, misty morning ocean of North Bali" 
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 1px"
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Elegant dark overlay gradient at bottom of image */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
              
              {/* Floating luxury-aligned overlay badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-lg flex items-center justify-between text-xs transition-transform duration-500 group-hover:translate-y-[-4px]">
                <div className="flex flex-col">
                  <span className="font-bold text-deep-indigo">★ 4.9 Guest Rating</span>
                  <span className="text-[10px] text-deep-indigo/60 font-light">{t('ratingSubtext', locale)}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-transformative-teal rounded-full animate-ping" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Tour Selection / Packages Section */}
      <section id="packages" className="py-16 lg:py-24 px-6 bg-white border-b border-deep-indigo/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">

            <h3 className="text-4xl lg:text-5xl font-serif text-deep-indigo">
              {locale === 'en' ? (
                <>Select Your <span className="italic font-light text-transformative-teal">Private Dolphin Tour</span></>
              ) : locale === 'ru' ? (
                <>Выберите свой <span className="italic font-light text-transformative-teal">частный тур к дельфинам</span></>
              ) : (
                <>选择您的<span className="italic font-light text-transformative-teal">私人海豚之旅</span></>
              )}
            </h3>

            {/* Dynamic Currency Switcher Toggle */}
            <div className="flex justify-center mt-6 animate-in fade-in duration-500">
              <div className="inline-flex bg-deep-indigo/5 p-1 rounded-full border border-deep-indigo/10 shadow-inner">
                <Link
                  href={`/?currency=usd${locale !== 'en' ? `&lang=${locale}` : ''}#packages`}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                    activeCurrency === 'usd'
                      ? 'bg-deep-indigo text-white shadow-md'
                      : 'text-deep-indigo/70 hover:text-deep-indigo'
                  }`}
                >
                  🇺🇸 USD ($)
                </Link>
                <Link
                  href={`/?currency=idr${locale !== 'en' ? `&lang=${locale}` : ''}#packages`}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                    activeCurrency === 'idr'
                      ? 'bg-deep-indigo text-white shadow-md'
                      : 'text-deep-indigo/70 hover:text-deep-indigo'
                  }`}
                >
                  🇮🇩 IDR (Rp)
                </Link>
              </div>
            </div>

            <div className="mt-8 bg-transformative-teal/5 p-4.5 rounded-2xl border border-transformative-teal/15 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-deep-indigo font-light text-center sm:text-left shadow-sm">
              <span className="text-xl shrink-0">🌴</span>
              <div>
                <strong>{locale === 'en' ? 'Staying in Ubud or South Bali?' : locale === 'ru' ? 'Остановились в Убуде или на юге Бали?' : '入住乌布或巴厘岛南部？'}</strong>{' '}
                {t("packagesBannerText", locale)}{' '}
                <Link href={hrefFor("/#scenic-stops")} className="underline text-transformative-teal hover:text-coral-pop font-bold transition-colors">
                  {t("packagesBannerLink", locale)} &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
            {/* Card 1: 7:00 AM Private Dolphin Watching Tour */}
            <div className="group bg-white rounded-[2.5rem] border border-deep-indigo/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-deep-indigo/5 border-b border-deep-indigo/5">
                  <Image 
                    src="/hero_dolphins.png" 
                    alt="Two wild dolphins swimming gracefully together in the glassy calm waters of Lovina, North Bali" 
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-4 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-wider text-deep-indigo shadow-sm">
                    🐬 {t("heroBadge", locale)}
                  </span>
                </div>

                <div className="p-8 sm:p-10 pb-0 space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour1Title", locale)}</h2>
                    <p className="text-xs text-deep-indigo/50 font-light uppercase tracking-widest">{t("tour1Subtitle", locale)}</p>
                  </div>

                  <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">
                        {activeCurrency === 'usd' ? `$${tour1PriceUsd} USD` : `Rp ${Math.round(tour1Price / 1000).toLocaleString('id-ID')}k`}
                      </span>
                      <span className="text-sm font-light text-deep-indigo/60">{t("tour1PriceDesc", locale)}</span>
                      <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                        {t("tour1MinGuests", locale)}
                      </span>
                    </div>
                    <span className="text-[10px] font-light text-deep-indigo/50">
                      {activeCurrency === 'usd' ? `(~Rp ${Math.round(tour1Price / 1000).toLocaleString('id-ID')}k)` : `(~$${tour1PriceUsd} USD)`}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                    <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1Inc1Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1Inc1Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1Inc2Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1Inc2Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1Inc3Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1Inc3Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1Inc4Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1Inc4Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("freeStopsInclusionTitle", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("freeStopsInclusionDesc", locale)}
                          </div>
                        </details>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 pt-4">
                <Link 
                  href={checkoutHrefFor("seven-am-ethical")}
                  id="cta-select-ethical-tour-home"
                  className="block w-full bg-deep-indigo text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-transformative-teal transition-all shadow-md active:scale-98"
                >
                  {t("tour1Btn", locale)} ({activeCurrency === 'usd' ? `$${tour1PriceUsd} USD` : `Rp ${Math.round(tour1Price / 1000).toLocaleString('id-ID')}k`})
                </Link>
              </div>
            </div>

            {/* Card 1.5: 7:00 AM Private Dolphin Watching & Swimming Tour */}
            <div className="group bg-white rounded-[2.5rem] border border-deep-indigo/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-deep-indigo/5 border-b border-deep-indigo/5">
                  <Image 
                    src="/dolphin_plus_swim.png" 
                    alt="A couple in Balinese waters holding a rope attached to a wooden outrigger boat, swimming with a wild dolphin nearby" 
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-1000 brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-4 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-wider text-deep-indigo shadow-sm">
                    🏊 {locale === 'en' ? 'Open Sea Swim' : locale === 'ru' ? 'Плавание в море' : '公海共游'}
                  </span>
                </div>

                <div className="p-8 sm:p-10 pb-0 space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour1_5Title", locale)}</h2>
                    <p className="text-xs text-deep-indigo/50 font-light uppercase tracking-widest">{t("tour1_5Subtitle", locale)}</p>
                  </div>

                  <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">
                        {activeCurrency === 'usd' ? `$${tour2PriceUsd} USD` : `Rp ${Math.round(tour2Price / 1000).toLocaleString('id-ID')}k`}
                      </span>
                      <span className="text-sm font-light text-deep-indigo/60">{t("tour1_5PriceDesc", locale)}</span>
                      <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                        {t("tour1_5MinGuests", locale)}
                      </span>
                    </div>
                    <span className="text-[10px] font-light text-deep-indigo/50">
                      {activeCurrency === 'usd' ? `(~Rp ${Math.round(tour2Price / 1000).toLocaleString('id-ID')}k)` : `(~$${tour2PriceUsd} USD)`}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                    <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1_5Inc1Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1_5Inc1Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1_5Inc2Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1_5Inc2Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1_5Inc3Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1_5Inc3Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour1_5Inc4Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour1_5Inc4Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("freeStopsInclusionTitle", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("freeStopsInclusionDesc", locale)}
                          </div>
                        </details>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 pt-4">
                <Link 
                  href={checkoutHrefFor("dolphin-swim")}
                  id="cta-select-swim-tour-home"
                  className="block w-full bg-deep-indigo text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-transformative-teal transition-all shadow-md active:scale-98"
                >
                  {t("tour1_5Btn", locale)} ({activeCurrency === 'usd' ? `$${tour2PriceUsd} USD` : `Rp ${Math.round(tour2Price / 1000).toLocaleString('id-ID')}k`})
                </Link>
              </div>
            </div>

            {/* Card 2: 7:00 AM Private Dolphin Watching Tour + Swim & Snorkel */}
            <div className="group bg-white rounded-[2.5rem] border-2 border-transformative-teal shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between relative">
              <span className="absolute top-4 right-6 bg-transformative-teal text-cloud-dancer px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md z-20">
                ✦ {t("recommended", locale)}
              </span>

              <div>
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-deep-indigo/5 border-b border-deep-indigo/5">
                  <Image 
                    src="/snorkeling_lovina_realistic.jpg" 
                    alt="A traveler snorkeling with a wild green sea turtle above a vibrant coral reef with tropical fish in crystal clear Lovina water" 
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                  <span className="absolute bottom-4 left-6 bg-transformative-teal text-cloud-dancer px-4 py-1.5 rounded-xl border border-transformative-teal/20 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    🐢 {t("signatureTag", locale)}
                  </span>
                </div>

                <div className="p-8 sm:p-10 pb-0 space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour2Title", locale)}</h2>
                    <p className="text-xs text-transformative-teal font-bold uppercase tracking-widest">{t("tour2Subtitle", locale)}</p>
                  </div>

                  <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">
                        {activeCurrency === 'usd' ? `$${tour3PriceUsd} USD` : `Rp ${Math.round(tour3Price / 1000).toLocaleString('id-ID')}k`}
                      </span>
                      <span className="text-sm font-light text-deep-indigo/60">{t("tour1PriceDesc", locale)}</span>
                      <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                        {t("tour1MinGuests", locale)}
                      </span>
                    </div>
                    <span className="text-[10px] font-light text-deep-indigo/50">
                      {activeCurrency === 'usd' ? `(~Rp ${Math.round(tour3Price / 1000).toLocaleString('id-ID')}k)` : `(~$${tour3PriceUsd} USD)`}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                    <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour2Inc1Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour2Inc1Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden bg-transformative-teal/5 rounded-2xl border border-transformative-teal/10 p-4 -mx-2">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between text-transformative-teal">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-lg leading-none shrink-0">✦</span>
                              <strong className="block text-xs font-bold leading-tight">{t("tour2SnorkelAdditionTitle", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-transformative-teal/50 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-2 text-[11px] text-transformative-teal/80 font-light leading-normal">
                            {t("tour2SnorkelAdditionDesc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour2Inc2Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour2Inc2Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("tour2Inc4Title", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("tour2Inc4Desc", locale)}
                          </div>
                        </details>
                      </li>
                      <li className="border-b border-deep-indigo/5 pb-3.5 last:border-b-0 last:pb-0">
                        <details className="group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-start gap-3 cursor-pointer list-none select-none justify-between">
                            <div className="flex items-start gap-3 text-left">
                              <span className="text-transformative-teal font-bold text-base leading-none shrink-0">✓</span>
                              <strong className="text-deep-indigo block font-bold text-xs">{t("freeStopsInclusionTitle", locale)}</strong>
                            </div>
                            <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-0.5 ml-2">▼</span>
                          </summary>
                          <div className="pl-6 pt-1.5 text-xs text-deep-indigo/60 font-light leading-relaxed">
                            {t("freeStopsInclusionDesc", locale)}
                          </div>
                        </details>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-8 sm:p-10 pt-4">
                <Link 
                  href={checkoutHrefFor("swim-snorkel")}
                  id="cta-select-snorkel-tour-home"
                  className="block w-full bg-coral-pop text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-98 relative group"
                >
                  <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75 pointer-events-none"></span>
                  {t("tour2Btn", locale)} ({activeCurrency === 'usd' ? `$${tour3PriceUsd} USD` : `Rp ${Math.round(tour3Price / 1000).toLocaleString('id-ID')}k`})
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reusable Ethical Charter & Safety Seal Trust Bar */}
        <TrustCharter locale={locale} />
      </section>

      {/* Tours / Itinerary Section */}
      <section id="tours" className="py-16 lg:py-28 px-6 bg-cloud-dancer/20 border-t border-b border-deep-indigo/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-transformative-teal mb-4">{t('timelineHeader', locale)}</h2>
            <h3 className="text-4xl lg:text-5xl font-serif text-deep-indigo">{t('timelineTitle', locale)}</h3>
            <p className="text-deep-indigo/60 max-w-lg mx-auto mt-4 font-light text-sm">
              {t('timelineDesc', locale)}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cloud-dancer text-deep-indigo text-xs font-semibold tracking-wide border border-deep-indigo/10 mt-6 shadow-sm">
              <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('timelinePriceBadge', locale)}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Timeline */}
            <div className="lg:col-span-7 space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-deep-indigo/10">
              {[
                {
                  time: t("time1", locale),
                  title: t("title1", locale),
                  desc: t("desc1", locale)
                },
                {
                  time: t("time2", locale),
                  title: t("title2", locale),
                  desc: t("desc2", locale)
                },
                {
                  time: t("time3", locale),
                  title: t("title3", locale),
                  desc: t("desc3", locale)
                },
                {
                  time: t("time4", locale),
                  title: t("title4", locale),
                  desc: t("desc4", locale)
                },
                {
                  time: t("time5", locale),
                  title: t("title5", locale),
                  desc: t("desc5", locale)
                }
              ].map((step, i) => (
                <details key={i} className="group [&_summary::-webkit-details-marker]:hidden relative">
                  <summary className="flex gap-8 cursor-pointer list-none select-none justify-between items-start">
                    <div className="flex gap-8 items-start flex-1">
                      {/* Timeline dot */}
                      <div className="w-9 h-9 rounded-full bg-cloud-dancer border border-deep-indigo/10 flex items-center justify-center text-xs font-bold text-transformative-teal relative z-10 group-hover:bg-transformative-teal group-hover:text-cloud-dancer transition-colors shrink-0">
                        {i + 1}
                      </div>
                      <div className="pt-1 text-left">
                        <span className="text-xs font-bold tracking-widest text-coral-pop uppercase block mb-1">{step.time}</span>
                        <h4 className="text-xl font-serif text-deep-indigo leading-tight group-hover:text-transformative-teal transition-colors">{step.title}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-deep-indigo/40 group-open:rotate-180 transition-transform duration-200 shrink-0 pt-4 ml-4">▼</span>
                  </summary>
                  <div className="pl-[68px] pt-3 text-sm text-deep-indigo/60 leading-relaxed font-light">
                    {step.desc}
                  </div>
                </details>
              ))}
            </div>

            {/* Right Column: Gear and Details */}
            <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-8 bg-cloud-dancer/30 p-10 rounded-[3rem] border border-deep-indigo/5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-deep-indigo mb-6 border-b border-deep-indigo/10 pb-3">{t("bringHeader", locale)}</h4>
                <ul className="space-y-4">
                  {[
                    { label: t("bring1Title", locale), desc: t("bring1Desc", locale) },
                    { label: t("bring2Title", locale), desc: t("bring2Desc", locale) },
                    { label: t("bring3Title", locale), desc: t("bring3Desc", locale) },
                    { label: t("bring4Title", locale), desc: t("bring4Desc", locale) }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-coral-pop font-bold text-lg leading-none">✦</span>
                      <div>
                        <span className="text-sm font-bold text-deep-indigo block leading-tight">{item.label}</span>
                        <span className="text-xs text-deep-indigo/50 font-light">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secure Booking Trust Footer */}
              <div className="border-t border-deep-indigo/10 pt-6 flex items-center gap-3 text-deep-indigo/60">
                <svg className="w-5 h-5 text-transformative-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="text-[11px] font-light leading-normal">
                  <span className="font-semibold text-deep-indigo block">{t("secureGuaranteeTitle", locale)}</span>
                  {t("secureGuaranteeDesc", locale)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Pickups & Scenic Transfers Banner */}
      <section id="scenic-stops" className="py-16 px-6 bg-white border-t border-deep-indigo/5">
        <div className="max-w-4xl mx-auto bg-deep-indigo text-cloud-dancer rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-xl">
          {/* Subtle decoration */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-transformative-teal/10 rounded-full blur-3xl" />
          
          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-6">
              <span className="text-[10px] font-bold text-sage-leaf uppercase tracking-[0.2em] bg-sage-leaf/10 px-4 py-1.5 rounded-full border border-sage-leaf/10 inline-block">
                🚗 {t("roadTripBadge", locale)}
              </span>
              <h2 className="text-3xl font-serif leading-tight">
                {t("roadTripTitle", locale)}
              </h2>
              <p className="text-xs sm:text-sm text-cloud-dancer/80 font-light leading-relaxed">
                {locale === 'en' 
                  ? "Staying in Ubud, Canggu, Seminyak, or Kuta? Secure a round-trip private driver at checkout. On your return trip from Lovina, enjoy free optional stops at Bali's iconic sights. Customize your route directly with your driver."
                  : locale === 'ru'
                  ? "Остановились в Убуде, Чангу, Семиньяке или Куте? Закажите трансфер туда и обратно при оформлении. На обратном пути из Ловины воспользуйтесь бесплатными остановками в культовых местах Бали."
                  : "入住乌布、苍古、水明漾或库塔？在结账时预订往返私人司机接送。从罗威那返回时，可免费在巴厘岛地标景点经停。"}
              </p>
            </div>
            
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-sage-leaf/60 uppercase tracking-widest block">{locale === 'en' ? "Optional Stopovers Included:" : locale === 'ru' ? "Включенные остановки на выбор:" : "可选经停景点包括："}</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: "Ulun Danu Beratan", category: "⛩️ Temple" },
                  { label: "Gitgit Waterfall", category: "🏞️ Waterfall" },
                  { label: "Coffee Plantation", category: "☕ Coffee Tour" },
                  { label: "Strawberry Picking", category: "🍓 Farm Tour" }
                ].map((stop, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-[9px] text-sage-leaf block font-bold mb-0.5">{stop.category}</span>
                    <span className="font-semibold text-white">{stop.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-cloud-dancer/50 font-light italic">
                * {locale === 'en' 
                  ? "Entrance tickets (e.g. temple entry, waterfall admission) are paid separately at each venue." 
                  : locale === 'ru'
                  ? "Входные билеты оплачиваются отдельно на месте."
                  : "景点门票需在现场自理。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Redesigned Reviews / Testimonials Section */}
      <ReviewsSection locale={locale} />

      {/* Social Proof (Reels Grid) */}
      <section className="py-16 lg:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-4">{t("socialTitle", locale)} <span className="italic font-light text-transformative-teal">{t("socialTitleItalic", locale)}</span></h2>
              <p className="text-deep-indigo/60 max-w-md text-sm">{t("socialSubtitle", locale)}</p>
            </div>
            <Link href="https://instagram.com" className="text-coral-pop hover:text-deep-indigo font-medium flex items-center gap-2 transition-colors uppercase tracking-widest text-sm">
              {t("followInstagram", locale)} <span>→</span>
            </Link>
          </div>
          
          <ReelsGrid reels={reels} />

        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-24 px-6 bg-cloud-dancer/20 border-t border-deep-indigo/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-12 lg:mb-16 text-center">{t("faqTitle", locale)}</h2>
          <div className="space-y-8 lg:space-y-12">
            {[
              {
                q: t("q1", locale),
                a: t("a1", locale)
              },
              {
                q: t("q2", locale),
                a: t("a2", locale)
              },
              {
                q: t("q3", locale),
                a: t("a3", locale)
              }
            ].map((item, i) => (
              <div key={i} className="group">
                <h4 className="text-2xl font-serif text-deep-indigo mb-4 flex items-start gap-4 group-hover:text-transformative-teal transition-colors">
                  <span className="text-coral-pop font-light serif italic">0{i+1}</span>
                  {item.q}
                </h4>
                <p className="text-deep-indigo/60 leading-relaxed font-light pl-12 border-l border-deep-indigo/10 ml-4">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA Footer */}
      <section id="booking" className="py-20 lg:py-32 px-6 text-center bg-transformative-teal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/ocean-texture.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-serif text-cloud-dancer mb-8 leading-tight">{t("ctaTitle", locale)} <span className="italic text-coral-pop">peaceful</span> {t("ctaTitleEnd", locale)}</h2>
          <p className="text-lg text-cloud-dancer/70 mb-12 font-light">
            {t("ctaDesc", locale)}
          </p>
          <Link 
            href={hrefFor("/#packages")} 
            className="bg-coral-pop text-cloud-dancer px-12 py-5 rounded-full text-xl font-medium hover:bg-deep-indigo transition-all shadow-xl inline-block active:scale-95"
          >
            {t("ctaBtn", locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
