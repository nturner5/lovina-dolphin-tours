import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Anchor, LifeBuoy } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Bali Dolphin Tours",
  description: "Read the Terms of Service for Bali Dolphin Tours. Learn about our strict wildlife-first policies, guest responsibilities, and booking conditions in North Bali.",
};

export default function TermsOfServicePage() {
  return (
    <main className="bg-cloud-dancer min-h-screen py-20 px-6 lg:px-12 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        {/* Breadcrumb / Back Link */}
        <Link 
          href="/" 
          className="text-[10px] font-bold text-transformative-teal hover:text-coral-pop uppercase tracking-widest inline-flex items-center gap-2 mb-10 group transition-all"
          id="back-to-home-link-terms"
        >
          <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Elegant Header */}
        <div className="mb-14 border-b border-deep-indigo/10 pb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-coral-pop block mb-3">Bali Dolphin Tours</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-deep-indigo mb-4 tracking-tight leading-none">
            Terms of Service
          </h1>
          <p className="text-xs text-deep-indigo/50 font-medium">
            Effective Date: May 28, 2026 | Last Updated: May 28, 2026
          </p>
        </div>

        {/* Quick Read Highlights */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Anchor className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Wildlife First</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">Captains follow a quiet, respectful wildlife viewing protocol. Wildlife safety is key to our mission.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <LifeBuoy className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Safety Standards</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">Life jackets are mandatory for all guests. Snorkeling requires basic swimming competency.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Scale className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Agreement Terms</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">By booking, you agree to respect our captain&apos;s maritime authority and environmental mandates.</p>
          </div>
        </div>

        {/* Editorial Content */}
        <div className="space-y-12 text-deep-indigo/85 leading-relaxed font-light text-sm sm:text-base">
          
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              1. Acceptance of Contract
            </h2>
            <p>
              Welcome to the digital portal of <strong>Bali Dolphin Tours</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing our website, completing a booking request, or paying via Stripe Checkout, you enter into a legally binding contract governed by these Terms of Service. If you do not agree to these terms, please do not book a tour or engage our fleet.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              2. Wildlife Conservation & Respectful Viewing Rules
            </h2>
            <p>
              We pride ourselves on providing a high standard for ethical dolphin encounters in North Bali. We are committed to a marine charter that prioritizes the acoustic and physical safety of Lovina&apos;s wild cetacean pods.
            </p>
            <div className="bg-transformative-teal/[0.03] border-l-2 border-transformative-teal p-6 rounded-r-2xl space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-transformative-teal">Environmental Protection Mandate</h4>
              <p className="text-xs sm:text-sm text-deep-indigo/80 leading-relaxed">
                All captains within our vetted network have digitally signed a **Behavioral Agreement** requiring them to maintain a parallel sailing trajectory, keep a respectful distance from the pods, and avoid chasing, boxing in, or cornering dolphins.
              </p>
              <p className="text-xs sm:text-sm text-deep-indigo/80 leading-relaxed font-semibold">
                Crucial Guest Policy: Guests cannot instruct, bribe, or demand that their captain chase or accelerate toward dolphins. If a guest acts in a hostile manner or demands a violation of our wildlife safety guidelines, the captain is authorized to immediately terminate the charter and return to shore. In this event, no refunds will be issued.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              3. Guest Health, Conduct, & Safety
            </h2>
            <p>
              Your safety is our absolute priority. While North Bali waters are naturally calm and shielded, private outrigger travel carries inherent risks associated with open-water maritime activities.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Life Jackets:</strong> Certified adult and child life jackets are provided on every outrigger boat. They are mandatory during vessel transit and snorkeling.</li>
              <li><strong>Physical Capability:</strong> Guests booking snorkeling activities must possess basic swimming competency. Guests are responsible for assessing their own fitness levels and notifying the captain of any cardiovascular conditions or mobility issues.</li>
              <li><strong>Vessel Limitations:</strong> Outrigger boats are rated for a strict capacity. Under no circumstances may guests exceed the booked and certified number of passengers.</li>
              <li><strong>Substance Policy:</strong> Consumption of alcohol or illicit substances immediately prior to or during the cruise is strictly prohibited. The captain reserves the right to deny boarding to any guest showing signs of intoxication.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              4. Bookings, Payments, & Add-ons
            </h2>
            <p>
              We operate an integrated premium brand with clean, transparent, and direct booking guidelines:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Payment Currency:</strong> All bookings are billed in United States Dollars (USD) via secure Stripe Checkout.</li>
              <li><strong>Add-on Pickups:</strong> Return transportation add-ons from Ubud ($42 USD), Canggu/Seminyak/Kuta ($60 USD), or Uluwatu ($78 USD) must be arranged at checkout. Pickups are subject to specific hotel address verification.</li>
              <li><strong>WhatsApp Coordination:</strong> Guests must provide an active, monitored WhatsApp number. Our dispatch automation dispatches local coordination texts, and captains use this to finalize morning pickup timing.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              5. Intellectual Property
            </h2>
            <p>
              The visual identity, single-line dolphin silhouette logo, typography mappings, digital layouts, automated dispatch logic, and custom written content contained on balidolphintours.com are protected brand assets of Bali Dolphin Tours. Unauthorized reproduction or reverse engineering of our brand assets is strictly prohibited.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              6. Limitation of Liability
            </h2>
            <p>
              Bali Dolphin Tours and its network of certified local captains shall not be held liable for any loss of personal items, camera gear, or personal injuries resulting from rough sea swells, failure to wear life jackets, or non-compliance with the captain&apos;s safety directions. By boarding the outrigger boat, you voluntarily assume all standard open-water recreation risks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              7. Amendments & Jurisdictional Scope
            </h2>
            <p>
              We reserve the right to amend these terms at any time to reflect changing Bali maritime regulations, environmental guidelines, or local port authority safety rules. These terms are governed under the jurisdiction of the Republic of Indonesia.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
