import type { Metadata } from "next";
import Link from "next/link";
import { CloudRain, Calendar, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Lovina Ethical Marine",
  description: "Read the Refund & Cancellation Policy for Lovina Ethical Marine. Learn about our 24-hour flexible window, weather safety cancellations, and our unique Dolphin Sighting Guarantee.",
};

export default function RefundPolicyPage() {
  return (
    <main className="bg-cloud-dancer min-h-screen py-20 px-6 lg:px-12 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        {/* Breadcrumb / Back Link */}
        <Link 
          href="/" 
          className="text-[10px] font-bold text-transformative-teal hover:text-coral-pop uppercase tracking-widest inline-flex items-center gap-2 mb-10 group transition-all"
          id="back-to-home-link-refunds"
        >
          <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Elegant Header */}
        <div className="mb-14 border-b border-deep-indigo/10 pb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-coral-pop block mb-3">Lovina Ethical Marine</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-deep-indigo mb-4 tracking-tight leading-none">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-deep-indigo/50 font-medium">
            Effective Date: May 28, 2026 | Last Updated: May 28, 2026
          </p>
        </div>

        {/* Quick Read Highlights */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Calendar className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">24-Hour Window</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">Cancel more than 24 hours in advance for a 100% full refund. Late cancellations receive a 50% partial refund.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <CloudRain className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Weather Safety</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">If captains cancel due to rain, high swells, or sea safety, you receive a 100% refund or free reschedule.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Sparkles className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Sighting Guarantee</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">No dolphin sightings? Get a free 12-month voucher for a second cruise or a 50% future discount.</p>
          </div>
        </div>

        {/* Editorial Content */}
        <div className="space-y-12 text-deep-indigo/85 leading-relaxed font-light text-sm sm:text-base">
          
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              1. Weather, Safety, & Port Authority Cancellations
            </h2>
            <p>
              The microclimate of Lovina and North Bali is generally incredibly calm, featuring smooth seas and gentle breezes. However, maritime safety is our absolute, non-negotiable priority. 
            </p>
            <p>
              If our vetted captains, local port authorities, or maritime meteorologists determine that water conditions are unsafe due to incoming tropical storms, high sea swells, or dangerous surface visibility, <strong>the charter will be cancelled</strong>.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>In the event of a weather-related safety cancellation, we will offer you a **100% full refund** immediately.</li>
              <li>Alternatively, you can opt to reschedule your private cruise to any future date within your stay in Bali for free, subject to boat and captain availability.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              2. Guest Cancellation Window
            </h2>
            <p>
              Because we run an elite, vetted partner network of local captains who stage fuel, prepare organic refreshments, and turn down other bookings to reserve your specific private outrigger, we maintain a highly respectful, balanced cancellation policy:
            </p>
            <div className="bg-deep-indigo/[0.02] border border-deep-indigo/5 p-6 rounded-2xl space-y-3 mt-4">
              <ul className="space-y-3 font-medium text-xs sm:text-sm">
                <li className="flex items-center gap-3 text-transformative-teal">
                  <span className="w-2.5 h-2.5 bg-transformative-teal rounded-full"></span>
                  <div>
                    <strong className="text-deep-indigo">Cancellation &gt; 24 Hours:</strong> Eligible for a <strong>100% Full Refund</strong>.
                  </div>
                </li>
                <li className="flex items-center gap-3 text-deep-indigo/80">
                  <span className="w-2.5 h-2.5 bg-deep-indigo/40 rounded-full"></span>
                  <div>
                    <strong className="text-deep-indigo">Cancellation Between 12 to 24 Hours:</strong> Eligible for a <strong>50% Partial Refund</strong> (retaining 50% to cover captain fuel staging and reserved labor loss).
                  </div>
                </li>
                <li className="flex items-center gap-3 text-coral-pop">
                  <span className="w-2.5 h-2.5 bg-coral-pop rounded-full"></span>
                  <div>
                    <strong className="text-deep-indigo">Cancellation &lt; 12 Hours or No-Show:</strong> <strong>0% Refund</strong>.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              3. Rescheduling Policy
            </h2>
            <p>
              We understand that travel itineraries in Bali can be dynamic. You may request to reschedule your booked dolphin tour for free up to <strong>12 hours prior</strong> to your scheduled departure. Rescheduling requests made within 12 hours of the tour start time are subject to a standard $25 USD rescheduling fee to compensate the local driver and captain for their time and staged logistics.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              4. Our Unique &ldquo;Dolphin Sighting Guarantee&rdquo;
            </h2>
            <p>
              Wild spinner and bottle-nose dolphins roam freely across the Bali Sea. Because we operate an **ethical, respectful, eco-conscious charter**, we strictly refuse to chase, surround, or stress the animals to force an encounter. Our historical sighting probability stands at a phenomenal <strong>95%+</strong>, but nature remains wild.
            </p>
            <div className="bg-transformative-teal/[0.03] border border-transformative-teal/20 p-6 rounded-2xl space-y-3 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-transformative-teal">Conservation Honesty Policy</h4>
              <p className="text-xs sm:text-sm text-deep-indigo/80 leading-relaxed">
                If no dolphins are spotted during your private excursion, we do not offer cash refunds because captain labor, fuel staging, and outrigger logistics have been fully spent. 
              </p>
              <p className="text-xs sm:text-sm text-deep-indigo/80 leading-relaxed font-semibold">
                Instead, we immediately issue you a **Free Second Excursion Voucher** valid for 12 months (fully transferable to friends, family, or other travelers) or a **50% discount** applicable to any future booking request. 
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              5. Refund Processing Mechanics
            </h2>
            <p>
              All approved refunds are initiated instantly in USD and routed back to the exact credit card or payment account used during Stripe Checkout:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Stripe typically requires <strong>5 to 10 business days</strong> for the refunded balance to post to your bank or card statement.</li>
              <li>If you have not received your approved refund after 10 business days, please check with your financial institution or drop us an email with your booking ID.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              6. Claims & Customer Support
            </h2>
            <p>
              To file a cancellation, submit a reschedule request, or claim a second excursion voucher under our Dolphin Sighting Guarantee, please message our support desk directly via email at <a href="mailto:refunds@lovinaethicalmarine.com" className="text-transformative-teal font-semibold hover:text-coral-pop underline transition-all">refunds@lovinaethicalmarine.com</a>. Please include your Stripe Transaction ID or booking confirmation code.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
