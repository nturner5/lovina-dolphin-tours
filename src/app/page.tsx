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
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 overflow-hidden">
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-6xl lg:text-8xl font-serif text-deep-indigo mb-6 leading-[1.05]">
            See Lovina’s Dolphins—<br />
            <span className="italic font-light text-transformative-teal">Without the Chase.</span>
          </h1>
          <p className="text-lg lg:text-xl text-deep-indigo/70 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Experience the ocean’s quietest encounter. Our vetted independent captains prioritize animal welfare and your peace of mind. We exclusively depart after the sunrise crowds have gone home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#booking" 
              className="bg-coral-pop text-cloud-dancer px-10 py-4 rounded-full text-lg font-medium hover:bg-deep-indigo transition-all shadow-md active:scale-95"
            >
              Book Private Ethical Tour
            </Link>
            <Link 
              href="#ethics" 
              className="bg-transparent border border-deep-indigo/20 text-deep-indigo px-10 py-4 rounded-full text-lg font-medium hover:bg-cloud-dancer/20 transition-all active:scale-95"
            >
              Our Protocol
            </Link>
          </div>
        </div>
        
        {/* Placeholder for Hero Video/Image */}
        <div className="mt-16 w-full max-w-5xl aspect-video rounded-3xl overflow-hidden bg-deep-indigo/5 shadow-2xl border border-cloud-dancer relative group">
          <div className="absolute inset-0 flex items-center justify-center text-deep-indigo/20">
            <p className="font-serif italic text-xl">Ambient, slow-motion dolphin footage goes here</p>
          </div>
        </div>
      </section>

      {/* The Ethical Difference (Moat) */}
      <section id="ethics" className="py-24 bg-deep-indigo px-6 text-cloud-dancer">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-sage-leaf mb-4">The Ethical Difference</h2>
            <h3 className="text-4xl lg:text-5xl font-serif">Why responsible travelers choose us</h3>
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
              <div key={i} className="flex flex-col items-center text-center p-10 rounded-[3rem] bg-cloud-dancer/5 border border-cloud-dancer/10 hover:border-coral-pop/30 transition-all">
                <span className="text-5xl mb-6">{item.icon}</span>
                <h4 className="text-2xl font-serif text-cloud-dancer mb-4">{item.title}</h4>
                <p className="text-cloud-dancer/70 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof (Reels Grid) */}
      <section className="py-24 px-6 bg-cloud-dancer">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-4">Real Moments. <span className="italic font-light text-transformative-teal">Real Ethics.</span></h2>
              <p className="text-deep-indigo/60 max-w-md">See why our guests and captains love the quiet mornings in North Bali.</p>
            </div>
            <Link href="https://instagram.com" className="text-coral-pop hover:text-deep-indigo font-medium flex items-center gap-2 transition-colors uppercase tracking-widest text-sm">
              Follow us on Instagram <span>→</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {reels.map((reel: any) => (
              <Link 
                key={reel._id} 
                href={reel.url || "#"} 
                target="_blank"
                className="aspect-[9/16] rounded-[2rem] bg-deep-indigo/5 overflow-hidden relative border border-deep-indigo/10 hover:border-coral-pop/50 transition-all group"
              >
                {reel.thumbnail ? (
                  <Image 
                    src={urlFor(reel.thumbnail).url()} 
                    alt={reel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <p className="text-xs font-serif italic text-deep-indigo/30 group-hover:text-deep-indigo/60">{reel.title}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-indigo/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}

            {reels.length === 0 && [1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[9/16] rounded-[2rem] bg-deep-indigo/5 flex items-center justify-center p-6 text-center border border-deep-indigo/10">
                <p className="text-xs font-serif italic text-deep-indigo/30 uppercase tracking-tighter">Reel Coming Soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-cloud-dancer border-t border-deep-indigo/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-16 text-center">Questions & Logistics</h2>
          <div className="space-y-12">
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
      <section id="booking" className="py-32 px-6 text-center bg-transformative-teal relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/ocean-texture.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-5xl lg:text-6xl font-serif text-cloud-dancer mb-8 leading-tight">Ready for a <span className="italic text-coral-pop">peaceful</span> morning?</h2>
          <p className="text-lg text-cloud-dancer/70 mb-12 font-light">
            Secure your private boat with one of Lovina’s legendary captains. 
            Limited to 5 ethical departures per day.
          </p>
          <Link 
            href="/checkout" 
            className="bg-coral-pop text-cloud-dancer px-12 py-5 rounded-full text-xl font-medium hover:bg-deep-indigo transition-all shadow-xl inline-block active:scale-95"
          >
            Book Your Experience
          </Link>
        </div>
      </section>
    </main>
  );
}
