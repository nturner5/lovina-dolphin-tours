import Link from "next/link";
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import ReelsGrid from '@/components/ReelsGrid';


export const revalidate = 60;

export default async function Home() {
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
      <section className="relative px-6 pt-10 pb-20 lg:pt-14 lg:pb-24 overflow-hidden bg-cloud-dancer">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* Left Column: Brand Content & Scannable Highlights */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Elegant Tag Badge */}
            <div className="bg-transformative-teal/10 text-transformative-teal px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 mb-6 border border-transformative-teal/20">
              <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.243-6.243l-2.122 2.122M8.879 15.121l-2.122 2.122M17.243 17.243l-2.122-2.122M8.879 8.879L6.757 6.757M12 8a4 4 0 014 4H8a4 4 0 014-4zM4 20h16" />
              </svg>
              Skip the Sunrise Boat Crowds
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-deep-indigo mb-6 leading-[1.1] tracking-tight">
              See Lovina’s Dolphins—<br />
              <span className="italic font-light text-transformative-teal">Without the Chase.</span>
            </h1>

            {/* Mobile-only Dolphin Image Card */}
            <div className="lg:hidden w-full my-6 relative animate-in fade-in zoom-in duration-1000 delay-200">
              <div className="aspect-[16/9] w-full rounded-[2rem] overflow-hidden bg-deep-indigo/5 shadow-xl border border-deep-indigo/10 relative group">
                <Image 
                  src="/hero_dolphins.png" 
                  alt="Two sleek wild dolphins gliding peacefully in the calm, misty morning ocean of North Bali" 
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 1px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/40 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-md flex items-center justify-between text-[10px]">
                  <span className="font-bold text-deep-indigo">★ 4.9 Guest Rating</span>
                  <div className="w-1.5 h-1.5 bg-transformative-teal rounded-full animate-ping" />
                </div>
              </div>
            </div>

            <p className="text-base lg:text-lg text-deep-indigo/70 max-w-xl mb-10 leading-relaxed font-light">
              Enjoy a peaceful morning on the water. Book a private, comfortable outrigger boat with our professional local captains. By departing after the sunrise rush, you skip the chaotic boat crowds and enjoy the wild dolphin pods in a much quieter, peaceful setting.
            </p>

            {/* Three Scannable Promise Highlights */}
            <div className="space-y-6 mb-10 w-full max-w-lg">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8 text-deep-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6h2.25l5.03-5.03c.37-.37.97-.11.97.41v14.14c0 .52-.6.78-.97.41L11.25 15.75H9A3 3 0 016 12.75v-1.5A3 3 0 019 9.75z" />
                    </svg>
                  ),
                  title: "Zero Swarming",
                  desc: "We maintain a respectful parallel distance and neutral engines."
                },
                {
                  icon: (
                    <svg className="w-8 h-8 text-deep-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.243-6.243l-2.122 2.122M8.879 15.121l-2.122 2.122M17.243 17.243l-2.122-2.122M8.879 8.879L6.757 6.757M12 8a4 4 0 014 4H8a4 4 0 014-4zM4 20h16" />
                    </svg>
                  ),
                  title: "No Crowds or Chaos",
                  desc: "We sail out when the 100+ sunrise tourist boats go home, giving you a quiet sea."
                },
                {
                  icon: (
                    <svg className="w-8 h-8 text-deep-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5m0-13.5L5.25 14.25H12m0-11.25l6.75 11.25H12m-9 3h18c-1.5 3-4.5 3-9 3s-7.5 0-9-3z" />
                    </svg>
                  ),
                  title: "Private Comfort",
                  desc: "Your own premium, hand-restored outrigger with comfortable seating."
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-center group">
                  <div className="text-deep-indigo shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-deep-indigo tracking-tight">{item.title}</h3>
                    <p className="text-xs text-deep-indigo/60 font-light leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/tours" 
                className="bg-coral-pop text-cloud-dancer px-10 py-4 rounded-full text-base font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 text-center relative group"
              >
                {/* Pulsing ring outer container */}
                <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75"></span>
                Book Dolphin Watching Tour
              </Link>
              <Link 
                href="#ethics" 
                className="bg-white border border-deep-indigo/10 text-deep-indigo px-10 py-4 rounded-full text-base font-bold hover:bg-cloud-dancer/50 transition-all active:scale-95 text-center shadow-sm"
              >
                Dolphin Rules
              </Link>
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
                  <span className="text-[10px] text-deep-indigo/60 font-light">From premium villa travelers</span>
                </div>
                <div className="w-1.5 h-1.5 bg-transformative-teal rounded-full animate-ping" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* The Ethical Difference (Moat) */}
      <section id="ethics" className="py-16 lg:py-24 bg-deep-indigo px-6 text-cloud-dancer">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-sage-leaf mb-4">What Makes Us Different</h2>
            <h3 className="text-4xl lg:text-5xl font-serif">Why travelers choose our tours</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Skip the Sunrise Rush",
                desc: "While 100+ boats chase dolphins at sunrise, we wait until the crowds go home. You get a calm, empty ocean where the dolphins are still active and playful.",
                icon: (
                  <svg className="w-12 h-12 text-sage-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.243-6.243l-2.122 2.122M8.879 15.121l-2.122 2.122M17.243 17.243l-2.122-2.122M8.879 8.879L6.757 6.757M12 8a4 4 0 014 4H8a4 4 0 014-4zM4 20h16" />
                  </svg>
                )
              },
              {
                title: "Engines in Neutral",
                desc: "Our captains follow a strict 'No-Chase' rule. We move parallel to pods and switch to neutral within 30 meters, letting the dolphins come to us.",
                icon: (
                  <svg className="w-12 h-12 text-sage-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6h2.25l5.03-5.03c.37-.37.97-.11.97.41v14.14c0 .52-.6.78-.97.41L11.25 15.75H9A3 3 0 016 12.75v-1.5A3 3 0 019 9.75z" />
                  </svg>
                )
              },
              {
                title: "Our Local Captains",
                desc: "We operate with a dedicated team of Lovina's most respected local captains, chosen for their experience, safety record, and love for the ocean.",
                icon: (
                  <svg className="w-12 h-12 text-sage-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-10 rounded-[3rem] bg-cloud-dancer/5 border border-cloud-dancer/10 hover:border-coral-pop/30 transition-all">
                <div className="mb-6">{item.icon}</div>
                <h4 className="text-2xl font-serif text-cloud-dancer mb-4">{item.title}</h4>
                <p className="text-cloud-dancer/70 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tours / Itinerary Section */}
      <section id="tours" className="py-16 lg:py-28 px-6 bg-white border-t border-b border-deep-indigo/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-20">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-transformative-teal mb-4">The Itinerary</h2>
            <h3 className="text-4xl lg:text-5xl font-serif text-deep-indigo">Your Morning Schedule</h3>
            <p className="text-deep-indigo/60 max-w-lg mx-auto mt-4 font-light text-sm">
              Our schedule is designed to keep the dolphins safe and make you comfortable. Here is what to expect.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cloud-dancer text-deep-indigo text-xs font-semibold tracking-wide border border-deep-indigo/10 mt-6 shadow-sm">
              <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              From $45 USD • Private Wooden Boat
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Timeline */}
            <div className="lg:col-span-7 space-y-12 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-deep-indigo/10">
              {[
                {
                  time: "07:30 AM",
                  title: "Meet Up & Coffee",
                  desc: "Meet at our quiet beach spot in Lovina. Enjoy a hot local coffee or tea while your captain explains our simple boat safety and dolphin-friendly rules."
                },
                {
                  time: "08:00 AM",
                  title: "Start Your Tour",
                  desc: "Step onto your private wooden boat. While the 100+ crowded sunrise boats return to shore, we head out into a quiet, calm sea."
                },
                {
                  time: "08:30 AM",
                  title: "Watch Dolphins Play",
                  desc: "We drive slowly alongside active dolphin families. When they swim near, we turn our engines to neutral so it is completely quiet, letting the curious dolphins swim right next to us."
                },
                {
                  time: "10:00 AM",
                  title: "Snorkeling & Fresh Fruits",
                  desc: "We anchor near Lovina's vibrant coral reefs. Swim and snorkel with local sea turtles and colorful reef fish in the crystal-clear water, then enjoy fresh seasonal local fruits along with hot coffee and tea."
                },
                {
                  time: "11:00 AM",
                  title: "Back to the Beach",
                  desc: "Return to the beach with beautiful memories and the good feeling of having respected Bali's wild marine life."
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 relative group">
                  {/* Timeline dot */}
                  <div className="w-9 h-9 rounded-full bg-cloud-dancer border border-deep-indigo/10 flex items-center justify-center text-xs font-bold text-transformative-teal relative z-10 group-hover:bg-transformative-teal group-hover:text-cloud-dancer transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="text-xs font-bold tracking-widest text-coral-pop uppercase block mb-1">{step.time}</span>
                    <h4 className="text-xl font-serif text-deep-indigo mb-2">{step.title}</h4>
                    <p className="text-sm text-deep-indigo/60 leading-relaxed font-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Gear and Details */}
            <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-8 bg-cloud-dancer/30 p-10 rounded-[3rem] border border-deep-indigo/5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-deep-indigo mb-6 border-b border-deep-indigo/10 pb-3">What's Included</h4>
                <ul className="space-y-4">
                  {[
                    { label: "Our Professional Captains", desc: "Vetted local experts from our dedicated team." },
                    { label: "Private Dolphin Boat", desc: "Comfortable seating and private space for your group." },
                    { label: "Snorkel Gear", desc: "Standard masks and snorkels for exploring the reef." },
                    { label: "Safety Vests", desc: "Standard safety jackets for your peace of mind." },
                    { label: "Island Refreshments", desc: "Fresh seasonal fruits along with hot coffee and tea." }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-transformative-teal font-bold text-lg leading-none">✓</span>
                      <div>
                        <span className="text-sm font-bold text-deep-indigo block leading-tight">{item.label}</span>
                        <span className="text-xs text-deep-indigo/50 font-light">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-deep-indigo mb-6 border-b border-deep-indigo/10 pb-3">What to Bring</h4>
                <ul className="space-y-4">
                  {[
                    { label: "Swimsuit", desc: "Essential for snorkeling and swimming near the reef." },
                    { label: "Reef-Safe Sunscreen & Hat", desc: "Protect your skin and Lovina's coral ecosystems." },
                    { label: "Light Windbreaker", desc: "Early mornings on the open sea can be breezy and fresh." },
                    { label: "Polarized Sunglasses (Optional)", desc: "Helpful for spotting dolphins swimming beneath the surface." }
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
                  <span className="font-semibold text-deep-indigo block">Secure Booking Guarantee</span>
                  Secure payment in USD with Stripe Checkout. Immediate confirmation via email and WhatsApp.
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Brand Promise & CTA Conversion Banner */}
          <div className="mt-16 pt-12 border-t border-deep-indigo/10 text-center space-y-8 animate-in fade-in duration-700">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-start gap-3 text-left">
                <span className="text-transformative-teal font-bold text-lg leading-none mt-0.5">✦</span>
                <div>
                  <span className="text-xs font-bold text-deep-indigo block uppercase tracking-wider">The 8:00 AM Sea</span>
                  <span className="text-[11px] text-deep-indigo/60 font-light leading-normal">Sail in total peace after the 100+ sunrise tourist boats go home.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="text-transformative-teal font-bold text-lg leading-none mt-0.5">✦</span>
                <div>
                  <span className="text-xs font-bold text-deep-indigo block uppercase tracking-wider">Strict No-Chase</span>
                  <span className="text-[11px] text-deep-indigo/60 font-light leading-normal">We turn off our engines when dolphins are close and never chase them.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <span className="text-transformative-teal font-bold text-lg leading-none mt-0.5">✦</span>
                <div>
                  <span className="text-xs font-bold text-deep-indigo block uppercase tracking-wider">Friendly Local Team</span>
                  <span className="text-[11px] text-deep-indigo/60 font-light leading-normal">Book directly with our own team of trusted, professional local captains.</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link 
                href="/tours" 
                className="inline-block bg-coral-pop text-cloud-dancer px-12 py-4 rounded-full text-base font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 text-center relative group"
              >
                <span className="absolute -inset-1 rounded-full border border-coral-pop/30 animate-pulse opacity-75"></span>
                Book Your Private Boat Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Emotional Storytelling Section */}
      <section id="story" className="py-16 sm:py-24 lg:py-32 px-6 bg-cloud-dancer/40 border-t border-deep-indigo/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center mb-12 lg:mb-24">
            <div className="lg:col-span-7">
              <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-transformative-teal mb-6">The Lovina Experience</h2>
              <h3 className="text-5xl lg:text-7xl font-serif text-deep-indigo leading-[1.1] mb-8">
                A Peaceful Morning:<br />
                <span className="italic font-light text-transformative-teal">The 8:00 AM Sea</span>
              </h3>
            </div>
            <div className="lg:col-span-5">
              <p className="text-xl text-deep-indigo/80 font-light leading-relaxed italic border-l-2 border-coral-pop pl-6">
                "By 8:00 AM, the crowded sunrise boats have returned to shore. What remains is a perfectly calm, glassy sea."
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start mt-12 lg:mt-16">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-base text-deep-indigo/70 font-light leading-relaxed">
                Lovina dolphin trips do not require waking up in the dark! While over a hundred noisy tourist boats launch at 6:00 AM—crowding the dolphins, filling the air with diesel fumes, and making loud underwater noise that scares the animals—we choose a different path. We believe that the best way to see wild dolphins is with respect, keeping them happy and safe.
              </p>
              <p className="text-base text-deep-indigo/70 font-light leading-relaxed">
                By 8:00 AM, the crowded sunrise boats have returned to the beach for hotel breakfast. The ocean becomes completely quiet. The volcanic black sand beneath reflects the blue sky, turning the sea into a vast, glassy mirror. The giant mountains of Bali stand clear on the horizon, and there is no sound except for the water splashing gently against our wooden boat. It is a magical, peaceful morning.
              </p>
            </div>
            <div className="lg:col-span-5 bg-transformative-teal/5 p-8 sm:p-10 rounded-[3rem] border border-transformative-teal/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 text-transformative-teal/5 text-9xl font-serif select-none pointer-events-none">“</div>
              <p className="text-sm sm:text-base text-deep-indigo/80 font-light leading-relaxed italic relative z-10">
                "When we turn off the engine, the loud noise stops. Dolphins are naturally friendly and curious. In the quiet 8:00 AM water, they often choose to swim right next to our boat, rolling on their sides to look up at us. It is a wonderful, personal connection that you can never experience if you are chasing them."
              </p>
              <div className="flex items-center gap-3 pt-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-deep-indigo/5 border border-deep-indigo/10 flex items-center justify-center text-lg">⛵</div>
                <div>
                  <span className="text-xs font-bold text-deep-indigo block leading-none">Our Safety Protocol</span>
                  <span className="text-[10px] text-deep-indigo/50 font-light">We turn off engines when dolphins are close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof (Reels Grid) */}
      <section className="py-16 lg:py-24 px-6 bg-cloud-dancer">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-4">Real Moments. <span className="italic font-light text-transformative-teal">Real Ethics.</span></h2>
              <p className="text-deep-indigo/60 max-w-md text-sm">See why our guests and captains love the quiet mornings in North Bali.</p>
            </div>
            <Link href="https://instagram.com" className="text-coral-pop hover:text-deep-indigo font-medium flex items-center gap-2 transition-colors uppercase tracking-widest text-sm">
              Follow us on Instagram <span>→</span>
            </Link>
          </div>
          
          <ReelsGrid reels={reels} />

        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-24 px-6 bg-cloud-dancer border-t border-deep-indigo/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-12 lg:mb-16 text-center">Questions & Logistics</h2>
          <div className="space-y-8 lg:space-y-12">
            {[
              {
                q: "Will we still see dolphins at 8:00 AM?",
                a: "Yes. Dolphins in Lovina are active and look for food until mid-morning. While the 6:00 AM 'sunrise rush' is crowded, the 8:00 AM window gives you a much quieter experience with 90% fewer boats."
              },
              {
                q: "Why is the price higher than the beach touts?",
                a: "You are paying for a private boat, a professional local captain, and our strict 'No-Chase' promise. We also share a part of your booking directly with our local community to protect the ocean."
              },
              {
                q: "What if we don't see any dolphins?",
                a: "While they are wild animals and we cannot promise 100% that we will see them, we have an 85% success rate. If we don't see any, you can join us on another day for free."
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
          <h2 className="text-5xl lg:text-6xl font-serif text-cloud-dancer mb-8 leading-tight">Ready for a <span className="italic text-coral-pop">peaceful</span> morning?</h2>
          <p className="text-lg text-cloud-dancer/70 mb-12 font-light">
            Secure your private boat with one of Lovina’s legendary captains. 
            Limited to 5 ethical departures per day.
          </p>
          <Link 
            href="/tours" 
            className="bg-coral-pop text-cloud-dancer px-12 py-5 rounded-full text-xl font-medium hover:bg-deep-indigo transition-all shadow-xl inline-block active:scale-95"
          >
            Book Your Experience
          </Link>
        </div>
      </section>
    </main>
  );
}
