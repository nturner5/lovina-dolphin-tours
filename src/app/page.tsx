import Link from "next/link";
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

export const revalidate = 60;

export default async function Home() {
  const reels = await client.fetch(groq`*[_type == "reel"] | order(_createdAt desc)[0...4]`);

  return (
    <main className="flex-1 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 overflow-hidden bg-[url('/hero-mesh.svg')] bg-cover">
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl lg:text-7xl font-serif text-volcanic-navy mb-6 leading-[1.1]">
            See Lovina’s Dolphins—<br />
            <span className="italic font-light">Without the Chase.</span>
          </h1>
          <p className="text-lg lg:text-xl text-volcanic-navy/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Experience a quieter, more respectful encounter. Our vetted independent captains prioritize animal welfare and your peace of mind. We exclusively depart after the sunrise crowds have gone home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#booking" 
              className="bg-volcanic-navy text-soft-bone px-10 py-4 rounded-full text-lg font-medium hover:bg-muted-slate transition-all shadow-md active:scale-95"
            >
              Book Private Ethical Tour
            </Link>
            <Link 
              href="#ethics" 
              className="bg-transparent border border-volcanic-navy/20 text-volcanic-navy px-10 py-4 rounded-full text-lg font-medium hover:bg-sand-dune/20 transition-all active:scale-95"
            >
              Our Protocol
            </Link>
          </div>
        </div>
        
        {/* Placeholder for Hero Video/Image */}
        <div className="mt-16 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-volcanic-navy/5 shadow-2xl border border-soft-bone relative group">
          <div className="absolute inset-0 flex items-center justify-center text-volcanic-navy/20">
            <p className="font-serif italic text-xl">Ambient, slow-motion dolphin footage goes here</p>
          </div>
        </div>
      </section>

      {/* The Ethical Difference (Moat) */}
      <section id="ethics" className="py-24 bg-sand-dune/10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-muted-slate mb-4">The Ethical Difference</h2>
            <h3 className="text-4xl font-serif text-volcanic-navy">Why conscious travelers choose us</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "8:00 AM Departures",
                desc: "While 100 boats crowd the sunrise, we wait. By 8:00 AM, the dolphins are still active, but the 'mob' has gone home. You get the ocean to yourself.",
                icon: "🌅"
              },
              {
                title: "Engines in Neutral",
                desc: "Our captains follow a strict 'No-Chase' protocol. We move parallel to pods and switch to neutral within 30 meters, letting the dolphins come to us.",
                icon: "🔇"
              },
              {
                title: "Vetted Local Legends",
                desc: "We don't book random boats. We work with a small circle of Lovina's most respected independent captains, chosen for their experience and ethics.",
                icon: "🎖️"
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl bg-soft-bone border border-sand-dune/20 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-4xl mb-6">{item.icon}</span>
                <h4 className="text-xl font-serif text-volcanic-navy mb-4">{item.title}</h4>
                <p className="text-volcanic-navy/70 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof (Reels Grid Placeholder) */}
      <section className="py-24 px-6 bg-soft-bone">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-serif text-volcanic-navy mb-4">Real Moments. <span className="italic font-light">Real Ethics.</span></h2>
              <p className="text-volcanic-navy/60 max-w-md">See why our guests and captains love the quiet mornings in North Bali.</p>
            </div>
            <Link href="https://instagram.com" className="text-muted-slate hover:text-volcanic-navy font-medium flex items-center gap-2">
              Follow us on Instagram <span>→</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reels.map((reel: any) => (
              <Link 
                key={reel._id} 
                href={reel.url || "#"} 
                target="_blank"
                className="aspect-[9/16] rounded-2xl bg-volcanic-navy/5 overflow-hidden relative border border-sand-dune/10 hover:border-muted-slate/30 transition-all group"
              >
                {reel.thumbnail ? (
                  <Image 
                    src={urlFor(reel.thumbnail).url()} 
                    alt={reel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <p className="text-xs font-serif italic text-volcanic-navy/30 group-hover:text-volcanic-navy/60">{reel.title}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-volcanic-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}

            {reels.length === 0 && [1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[9/16] rounded-2xl bg-volcanic-navy/5 flex items-center justify-center p-6 text-center border border-sand-dune/10">
                <p className="text-xs font-serif italic text-volcanic-navy/30">Reel Coming Soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-volcanic-navy text-soft-bone">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-serif mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {[
              {
                q: "Will we still see dolphins at 8:00 AM?",
                a: "Yes. Dolphins in Lovina are active feeders until mid-morning. While the 6:00 AM 'sunrise rush' is popular for photos, the 8:00 AM window often offers more intimate sightings with 90% fewer boats."
              },
              {
                q: "Why is the price higher than the beach touts?",
                a: "You are paying for a private boat, a vetted ethical captain, and our strict 'No-Chase' guarantee. A portion of your fee also goes directly into our local sustainability fund."
              },
              {
                q: "What if we don't see any dolphins?",
                a: "While they are wild animals and sightings aren't 100% guaranteed, we have an 85% success rate. If you don't see any, you can join us the following day for free."
              }
            ].map((item, i) => (
              <div key={i} className="border-b border-soft-bone/10 pb-8">
                <h4 className="text-xl font-serif mb-4 flex items-start gap-4">
                  <span className="text-sand-dune font-light">0{i+1}</span>
                  {item.q}
                </h4>
                <p className="text-soft-bone/60 leading-relaxed font-light pl-10">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA Footer */}
      <section id="booking" className="py-32 px-6 text-center bg-[url('/footer-mesh.svg')] bg-cover relative overflow-hidden">
        <div className="absolute inset-0 bg-sand-dune/10 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-5xl font-serif text-volcanic-navy mb-8">Ready for a <span className="italic">peaceful</span> morning?</h2>
          <p className="text-lg text-volcanic-navy/70 mb-12 font-light">
            Secure your private boat with one of Lovina’s legendary captains. 
            Limited to 5 ethical departures per day.
          </p>
          <Link 
            href="/checkout" 
            className="bg-volcanic-navy text-soft-bone px-12 py-5 rounded-full text-xl font-medium hover:bg-muted-slate transition-all shadow-xl inline-block"
          >
            Book Your Experience
          </Link>
        </div>
      </section>
    </main>
  );
}
