import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Dolphin & Snorkeling Tours in Lovina | Lovina Ethical Marine',
  description: 'Select between our premium 8:00 AM private dolphin watching tour or the complete wild dolphin swim and coral reef snorkeling encounter. Vetted local captains, no-chase animal welfare standards.',
};

export default function ToursPage() {
  return (
    <main className="bg-cloud-dancer min-h-screen">
      {/* Editorial Luxury Hero Section */}
      <section className="px-4 sm:px-6 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center max-w-4xl mx-auto">
        <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-[0.2em] bg-transformative-teal/5 px-4 py-1.5 rounded-full border border-transformative-teal/10 inline-block mb-4">
          Maritime Curation
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-deep-indigo mb-6 leading-tight">
          Select Your <span className="italic font-light text-transformative-teal">Private Encounter</span>
        </h1>
        <p className="text-base lg:text-lg text-deep-indigo/70 font-light leading-relaxed">
          Skip the sunrise chaos. Our private outrigger tours depart at <strong>8:00 AM</strong>—long after the 100+ mass-market tourist boats go home. Enjoy a calm, quiet sea and premium service with vetted local captains who prioritize animal welfare.
        </p>
      </section>

      {/* Visual Tour Selector Grid */}
      <section className="px-4 sm:px-6 pb-24 lg:pb-32 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Card 1: 8:00 AM Private Ethical Tour */}
          <div className="group bg-white rounded-[2.5rem] border border-deep-indigo/5 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Image Banner */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-deep-indigo/5 border-b border-deep-indigo/5">
                <Image 
                  src="/hero_dolphins.png" 
                  alt="Two wild dolphins swimming gracefully together in the glassy calm waters of Lovina, North Bali" 
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-4 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-wider text-deep-indigo shadow-sm">
                  🐬 Quiet 8:00 AM Start
                </span>
              </div>

              {/* Card Body */}
              <div className="p-8 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">8:00 AM Private Ethical Tour</h2>
                  <p className="text-xs text-deep-indigo/50 font-light uppercase tracking-widest">The crowd-free sustainable standard</p>
                </div>

                <div className="flex items-baseline gap-2 border-b border-deep-indigo/5 pb-5">
                  <span className="text-3xl font-bold text-deep-indigo">$45</span>
                  <span className="text-sm font-light text-deep-indigo/60">USD per guest</span>
                  <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                    Min. 2 guests
                  </span>
                </div>

                {/* Inclusions list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">Inclusions</span>
                  <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Private Jukung Outrigger</strong>
                        <span>Reserved strictly for your group only (up to 4 per boat).</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Vetted Local Captain</strong>
                        <span>Parallel approach cruising following strict animal welfare rules.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Post-Sunrise Glassy Sea</strong>
                        <span>Skip the 6:00 AM swarms—enjoy dolphins without 100 boats racing.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Island Refreshments</strong>
                        <span>Hot Balinese coffee, local premium tea, and fresh fruits served on board.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-8 sm:p-10 pt-0">
              <Link 
                href="/checkout?tour=eight-am-ethical"
                id="cta-select-ethical-tour"
                className="block w-full bg-deep-indigo text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-transformative-teal transition-all shadow-md active:scale-98"
              >
                Book Private Tour ($45)
              </Link>
            </div>
          </div>

          {/* Card 2: + Private Swim & Snorkel (RECOMMENDED) */}
          <div className="group bg-white rounded-[2.5rem] border-2 border-transformative-teal shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-between relative">
            
            {/* Highly Recommended Float Tag */}
            <span className="absolute top-4 right-6 bg-transformative-teal text-cloud-dancer px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md z-20">
              ✦ Highly Recommended
            </span>

            <div>
              {/* Image Banner */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-deep-indigo/5 border-b border-deep-indigo/5">
                <Image 
                  src="/snorkeling_lovina.png" 
                  alt="A traveler snorkeling alongside a wild green sea turtle in crystal clear turquoise water above a beautiful coral reef" 
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-4 left-6 bg-transformative-teal text-cloud-dancer px-4 py-1.5 rounded-xl border border-transformative-teal/20 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  🐢 Dolphin Swim & Reef Snorkel
                </span>
              </div>

              {/* Card Body */}
              <div className="p-8 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-indigo leading-tight mb-2">+ Private Swim & Snorkel</h2>
                  <p className="text-xs text-transformative-teal font-bold uppercase tracking-widest">Our signature double encounter</p>
                </div>

                <div className="flex items-baseline gap-2 border-b border-deep-indigo/5 pb-5">
                  <span className="text-3xl font-bold text-deep-indigo">$65</span>
                  <span className="text-sm font-light text-deep-indigo/60">USD per guest</span>
                  <span className="text-[9px] font-semibold text-transformative-teal uppercase bg-transformative-teal/5 px-2.5 py-1 rounded-md border border-transformative-teal/10 ml-auto">
                    Min. 2 guests
                  </span>
                </div>

                {/* Inclusions list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest block">Inclusions</span>
                  <ul className="space-y-3.5 text-xs text-deep-indigo/80 font-light leading-relaxed">
                    <li className="flex gap-3 items-start text-transformative-teal bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/10 -mx-2">
                      <span className="text-lg leading-none shrink-0">✦</span>
                      <div>
                        <strong className="block text-sm font-bold leading-tight">Coral Reef Snorkeling stop</strong>
                        <span className="text-[11px] text-transformative-teal/80 block mt-1 leading-normal">
                          Anchor at Lovina's best protected coral reefs. Swim alongside wild sea turtles, colorful reef fish, and spot wild dolphins underwater!
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Premium Sanitized Gear</strong>
                        <span>Professional-grade masks, dry snorkels, and custom fins provided.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">Underwater View Frames</strong>
                        <span>Equipped with glass-bottom outrigger view frames for spotting reef life.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                      <div>
                        <strong className="text-deep-indigo block font-bold">All 8:00 AM Tour Inclusions</strong>
                        <span>Includes private boat, vetted captain, parallel cruise, fruits, and hot Balinese coffee.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-8 sm:p-10 pt-0">
              <Link 
                href="/checkout?tour=swim-snorkel"
                id="cta-select-snorkel-tour"
                className="block w-full bg-coral-pop text-cloud-dancer py-4.5 rounded-full text-center text-sm font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-98 relative group"
              >
                <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75"></span>
                Book Swim & Snorkel ($65)
              </Link>
            </div>
          </div>

        </div>
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
              <h3 className="text-lg font-serif font-bold">100% Ethical Pledge</h3>
              <p className="text-xs text-cloud-dancer/70 font-light leading-relaxed">
                We refuse to swarm or chase. Our captains cut engines to neutral within 30 meters and sail parallel, letting the curious pods choose to approach us.
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
                <h4 className="font-bold text-base mb-2">Why depart at 8:00 AM instead of 6:00 AM?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  The 6:00 AM sunrise departures are heavily crowded, with up to 100+ outrigger boats chasing a single dolphin pod. By departing at 8:00 AM, the mass tourist boats have returned to shore, the dolphin pods are relaxed and playful, and the ocean is quiet and glassy.
                </p>
              </div>

              <div className="border-b border-cloud-dancer/10 pb-6">
                <h4 className="font-bold text-base mb-2">Is the pricing per-person or per-boat?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  Our tickets are priced per-person. However, to maintain high boat safety and our elite service standard, we guarantee that all bookings are private. You will secure your own exclusive jukung boat—we never mix bookings. A minimum of 2 guest tickets ($90 total) is required to secure the charter.
                </p>
              </div>

              <div className="pb-6">
                <h4 className="font-bold text-base mb-2">How do driver pick-ups and transfer times work?</h4>
                <p className="text-cloud-dancer/70 font-light leading-relaxed">
                  Lovina is located in North Bali. Driving from Ubud takes ~2 hours (5:30 AM pickup), Canggu/Seminyak takes ~2.5 to 3 hours (5:00 AM pickup), and Uluwatu takes ~3.5 to 4 hours (4:30 AM pickup). Your private driver will pick you up directly from your villa, wait in Lovina during your tour, and return you afterward.
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
        <a 
          href="https://wa.me/6285190422839" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-transformative-teal text-cloud-dancer px-8 py-3.5 rounded-full text-sm font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95"
        >
          <span>Chat on WhatsApp</span>
          <span className="w-1.5 h-1.5 bg-coral-pop rounded-full animate-ping" />
        </a>
      </section>
    </main>
  );
}
