import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { t } from '@/locales/i18n';
import { getLocaleServer } from '@/locales/i18n-server';
import WhatsAppTrackedLink from '@/components/WhatsAppTrackedLink';
import TrustCharter from '@/components/TrustCharter';
import { getPricingData } from '@/lib/pricing-server';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Private Dolphin Watching & Snorkeling Tours | Bali Dolphin Tours',
  description: 'Choose between our private 7:00 AM dolphin watching tour or the complete private dolphin watching + coral reef snorkeling boat tour. Vetted local captains, and respectful wildlife viewing guidelines.',
};

export default async function ToursPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const locale = await getLocaleServer(resolvedParams);
  const pricing = await getPricingData();

  // Find dynamic price values from Stripe
  const tour1Price = pricing.tours.find((t: any) => t.id === 'seven-am-ethical')?.price || 45;
  const tour2Price = pricing.tours.find((t: any) => t.id === 'dolphin-swim')?.price || 55;
  const tour3Price = pricing.tours.find((t: any) => t.id === 'swim-snorkel')?.price || 65;
  
  const hrefFor = (path: string) => {
    if (locale === 'en') return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}lang=${locale}`;
  };
  return (
    <main className="bg-cloud-dancer min-h-screen">
      {/* Editorial Luxury Hero Section */}
      <section className="px-4 sm:px-6 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center max-w-4xl mx-auto">
        <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-[0.2em] bg-transformative-teal/5 px-4 py-1.5 rounded-full border border-transformative-teal/10 inline-block mb-4">
          {t("privateBoatTours", locale)}
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-deep-indigo mb-6 leading-tight">
          {locale === 'en' ? (
    <>Select Your <span className="italic font-light text-transformative-teal">Private Dolphin Tour</span></>
  ) : locale === 'ru' ? (
    <>Выберите свой <span className="italic font-light text-transformative-teal">частный тур к дельфинам</span></>
  ) : (
    <>选择您的<span className="italic font-light text-transformative-teal">私人海豚之旅</span></>
  )}
        </h1>
        <p className="text-base lg:text-lg text-deep-indigo/70 font-light leading-relaxed">
          {locale === 'en' ? (
    <>Skip the sunrise chaos. Our private dolphin watching boat tours depart at <strong>7:00 AM</strong>—as the early crowded tourist boats return to shore. Enjoy a calm, quiet sea and excellent service with vetted local captains who prioritize dolphin welfare.</>
  ) : locale === 'ru' ? (
    <>Избегайте утреннего хаоса. Наши частные туры к дельфинам отправляются в <strong>7:00 утра</strong> — когда ранние переполненные туристические лодки возвращаются на берег. Наслаждайтесь спокойным морем и отличным сервисом с проверенными местными капитанами.</>
  ) : (
    <>避开日出的混乱。我们的私人海豚观赏船游于<strong>上午7:00</strong>出发——此时早起拥挤的旅游船正返回岸边。与优先考虑海豚福利的经审核的当地船长一起，享受风平浪静的海面和优质的服务。</>
  )}
        </p>
      </section>

      <section className="px-4 sm:px-6 pb-24 lg:pb-32 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 1: 7:00 AM Private Dolphin Watching Tour */}
          <div className="group bg-white rounded-[2.5rem] border border-deep-indigo/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Image Banner */}
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

              {/* Card Body */}
              <div className="p-8 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour1Title", locale)}</h2>
                  <p className="text-xs text-deep-indigo/50 font-light uppercase tracking-widest">{t("tour1Subtitle", locale)}</p>
                </div>

                <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">Rp {tour1Price.toLocaleString('id-ID')}</span>
                    <span className="text-sm font-light text-deep-indigo/60">{t("tour1PriceDesc", locale)}</span>
                    <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                      {t("tour1MinGuests", locale)}
                    </span>
                  </div>
                  <span className="text-[10px] font-light text-deep-indigo/50">(~${Math.round(tour1Price / 18053)} USD)</span>
                </div>

                {/* Inclusions list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                  <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1Inc1Title", locale)}</strong>
                        <span>{t("tour1Inc1Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1Inc2Title", locale)}</strong>
                        <span>{t("tour1Inc2Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1Inc3Title", locale)}</strong>
                        <span>{t("tour1Inc3Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1Inc4Title", locale)}</strong>
                        <span>{t("tour1Inc4Desc", locale)}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-8 sm:p-10 pt-0">
              <Link 
                href={hrefFor("/checkout?tour=seven-am-ethical")}
                id="cta-select-ethical-tour"
                className="block w-full bg-deep-indigo text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-transformative-teal transition-all shadow-md active:scale-98"
              >
                {t("tour1Btn", locale)} (Rp {tour1Price.toLocaleString('id-ID')})
              </Link>
            </div>
          </div>

          {/* Card 1.5: 7:00 AM Private Dolphin Watching & Swimming Tour */}
          <div className="group bg-white rounded-[2.5rem] border border-deep-indigo/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Image Banner */}
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

              {/* Card Body */}
              <div className="p-8 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour1_5Title", locale)}</h2>
                  <p className="text-xs text-deep-indigo/50 font-light uppercase tracking-widest">{t("tour1_5Subtitle", locale)}</p>
                </div>

                <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">Rp {tour2Price.toLocaleString('id-ID')}</span>
                    <span className="text-sm font-light text-deep-indigo/60">{t("tour1_5PriceDesc", locale)}</span>
                    <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                      {t("tour1_5MinGuests", locale)}
                    </span>
                  </div>
                  <span className="text-[10px] font-light text-deep-indigo/50">(~${Math.round(tour2Price / 18053)} USD)</span>
                </div>

                {/* Inclusions list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                  <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1_5Inc1Title", locale)}</strong>
                        <span>{t("tour1_5Inc1Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1_5Inc2Title", locale)}</strong>
                        <span>{t("tour1_5Inc2Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1_5Inc3Title", locale)}</strong>
                        <span>{t("tour1_5Inc3Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour1_5Inc4Title", locale)}</strong>
                        <span>{t("tour1_5Inc4Desc", locale)}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-8 sm:p-10 pt-0">
              <Link 
                href={hrefFor("/checkout?tour=dolphin-swim")}
                id="cta-select-swim-tour"
                className="block w-full bg-deep-indigo text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-transformative-teal transition-all shadow-md active:scale-98"
              >
                {t("tour1_5Btn", locale)} (Rp {tour2Price.toLocaleString('id-ID')})
              </Link>
            </div>
          </div>

          {/* Card 2: 7:00 AM Private Dolphin Watching Tour + Swim & Snorkel (RECOMMENDED) */}
          <div className="group bg-white rounded-[2.5rem] border-2 border-transformative-teal shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between relative">
            
            {/* Highly Recommended Float Tag */}
            <span className="absolute top-4 right-6 bg-transformative-teal text-cloud-dancer px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md z-20">
              ✦ {t("recommended", locale)}
            </span>

            <div>
              {/* Image Banner */}
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

              {/* Card Body */}
              <div className="p-8 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">{t("tour2Title", locale)}</h2>
                  <p className="text-xs text-transformative-teal font-bold uppercase tracking-widest">{t("tour2Subtitle", locale)}</p>
                </div>

                <div className="flex flex-col gap-0.5 border-b border-deep-indigo/5 pb-5 w-full">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-deep-indigo whitespace-nowrap">Rp {tour3Price.toLocaleString('id-ID')}</span>
                    <span className="text-sm font-light text-deep-indigo/60">{t("tour1PriceDesc", locale)}</span>
                    <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                      {t("tour1MinGuests", locale)}
                    </span>
                  </div>
                  <span className="text-[10px] font-light text-deep-indigo/50">(~${Math.round(tour3Price / 18053)} USD)</span>
                </div>

                {/* Inclusions list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">{t("inclusions", locale)}</span>
                  <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour2Inc1Title", locale)}</strong>
                        <span>{t("tour2Inc1Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start text-transformative-teal bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/10 -mx-2">
                      <span className="text-lg leading-none shrink-0">✦</span>
                      <div>
                        <strong className="block text-sm font-bold leading-tight">{t("tour2SnorkelAdditionTitle", locale)}</strong>
                        <span className="text-[11px] text-transformative-teal/80 block mt-1 leading-normal">
                          {t("tour2SnorkelAdditionDesc", locale)}
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour2Inc2Title", locale)}</strong>
                        <span>{t("tour2Inc2Desc", locale)}</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">{t("tour2Inc4Title", locale)}</strong>
                        <span>{t("tour2Inc4Desc", locale)}</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-8 sm:p-10 pt-0">
              <Link 
                href={hrefFor("/checkout?tour=swim-snorkel")}
                id="cta-select-snorkel-tour"
                className="block w-full bg-coral-pop text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-98 relative group"
              >
                <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75 pointer-events-none"></span>
                {t("tour2Btn", locale)} (Rp {tour3Price.toLocaleString('id-ID')})
              </Link>
            </div>
          </div>

        </div>

        {/* Reusable Ethical Charter & Safety Seal Trust Bar */}
        <TrustCharter locale={locale} />
      </section>

      {/* Value Objections & Trust Guarantee Section */}
      <section className="bg-deep-indigo px-4 sm:px-6 py-20 lg:py-28 text-cloud-dancer">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-leaf mb-3 block">Guaranteed Peace of Mind</span>
            <h2 className="text-3xl sm:text-4xl font-serif">Why Conscious Travelers Choose Us</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 border-b border-cloud-dancer/10 pb-16 mb-16">
            <div className="space-y-3">
              <span className="text-3xl select-none block">🐬</span>
              <h3 className="text-lg font-serif font-bold">85% Sighting Guarantee</h3>
              <p className="text-xs text-cloud-dancer/70 font-light leading-relaxed">
                Dolphins are wild animals, and their migration changes daily. If they do not appear on your tour, join us on a second morning cruise absolutely free.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-3xl select-none block">🛡️</span>
              <h3 className="text-lg font-serif font-bold">Respectful Approach</h3>
              <p className="text-xs text-cloud-dancer/70 font-light leading-relaxed">
                We avoid swarming the dolphins. Our captains prioritize the animals' comfort, maintaining a safe parallel distance and sailing slowly so you get a peaceful, natural view.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-3xl select-none block">🚗</span>
              <h3 className="text-lg font-serif font-bold">Seamless Private Transfers</h3>
              <p className="text-xs text-cloud-dancer/70 font-light leading-relaxed">
                Staying in Ubud or South Bali? Avoid transport stress. Add our comfortable, air-conditioned round-trip driver service directly on the checkout screen.
              </p>
            </div>
          </div>

          {/* Quick FAQ / Objection Handling */}
          <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-2xl font-serif text-center mb-10">Frequently Asked Booking Questions</h3>
            
            <div className="space-y-6 text-sm">
              <div className="border-b border-cloud-dancer/10 pb-6">
                <h4 className="font-bold text-base mb-2">Why depart at 7:00 AM instead of 6:00 AM?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  The 6:00 AM sunrise departures are heavily crowded, with up to 100+ outrigger boats chasing a single dolphin pod. By departing at 7:00 AM, the early sunrise boats have begun to clear out and return to shore, leaving the ocean quiet, glassy, and peaceful.
                </p>
              </div>

              <div className="border-b border-cloud-dancer/10 pb-6">
                <h4 className="font-bold text-base mb-2">Is the pricing per-person or per-boat?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  Our tickets are priced per-person. However, to maintain high boat safety and our elite service standard, we guarantee that all bookings are private. You will secure your own exclusive private boat—we never mix bookings. A minimum of 2 guest tickets ($90 total) is required to secure the charter.
                </p>
              </div>

              <div className="pb-6">
                <h4 className="font-bold text-base mb-2">How do driver pick-ups and transfer times work?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  Lovina is located in North Bali. Driving from Ubud takes ~2 hours (4:30 AM pickup), Canggu/Seminyak takes ~2.5 to 3 hours (4:00 AM pickup), and Uluwatu takes ~3.5 to 4 hours (3:30 AM pickup). Your private driver will pick you up directly from your villa, wait in Lovina during your tour, and return you afterward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Immediate Support Footer call to action */}
      <section className="bg-cloud-dancer py-16 px-4 text-center border-t border-deep-indigo/10">
        <h3 className="text-2xl font-serif text-deep-indigo mb-2">Need a Custom Event or Large Group Charter?</h3>
        <p className="text-sm text-deep-indigo/60 mb-6 font-light">We arrange tailored team builds, sunset cruises, and family packages.</p>
        <WhatsAppTrackedLink 
          href="https://wa.me/6285190422839" 
          label="Tours Page Group Charter CTA"
          className="inline-flex items-center gap-2.5 bg-transformative-teal text-cloud-dancer px-8 py-3.5 rounded-full text-sm font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95"
        >
          <span>Chat on WhatsApp</span>
          <span className="w-1.5 h-1.5 bg-coral-pop rounded-full animate-ping" />
        </WhatsAppTrackedLink>
      </section>
    </main>
  );
}
