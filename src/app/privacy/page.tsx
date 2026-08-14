import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Bali Dolphin Tours",
  description: "Learn how Bali Dolphin Tours collects, protects, and uses guest and captain information to deliver premium, ethical marine experiences in North Bali.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-cloud-dancer min-h-screen py-20 px-6 lg:px-12 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        {/* Breadcrumb / Back Link */}
        <Link 
          href="/" 
          className="text-[10px] font-bold text-transformative-teal hover:text-coral-pop uppercase tracking-widest inline-flex items-center gap-2 mb-10 group transition-all"
          id="back-to-home-link"
        >
          <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Elegant Editorial Header */}
        <div className="mb-14 border-b border-deep-indigo/10 pb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-coral-pop block mb-3">Bali Dolphin Tours</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-deep-indigo mb-4 tracking-tight leading-none">
            Privacy Policy
          </h1>
          <p className="text-xs text-deep-indigo/50 font-medium">
            Effective Date: May 28, 2026 | Last Updated: May 28, 2026
          </p>
        </div>

        {/* Premium Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Shield className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Secure Operations</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">Stripe payments and secure SSL encryption protect all guest transactions in USD.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Eye className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Vetted Access</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">Guest phone and hotel details are strictly locked until your captain signs the behavioral contract.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-deep-indigo/5 flex flex-col gap-3">
            <Lock className="w-6 h-6 text-transformative-teal" />
            <h3 className="text-xs font-bold text-deep-indigo uppercase tracking-wider">Zero Spam</h3>
            <p className="text-[11px] text-deep-indigo/60 leading-relaxed font-light">We do not sell your personal data. We only use WhatsApp for direct booking coordination.</p>
          </div>
        </div>

        {/* Editorial Content Layout */}
        <div className="space-y-12 text-deep-indigo/85 leading-relaxed font-light text-sm sm:text-base">
          
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              1. Our Ethical Commitment
            </h2>
            <p>
              At <strong>Bali Dolphin Tours</strong>, our mission is to establish the absolute standard for premium, respectful marine encounters in North Bali. Operating under an integrated brand model, we coordinate elite outrigger excursions that protect natural dolphin habitats and respect local marine regulations. 
            </p>
            <p>
              We believe privacy is an extension of respect. Whether you are a traveler booking a private tour or a certified local captain joining our vetted fleet, we secure and manage your personal data with the highest standards of maritime professionalism.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              2. Information We Collect
            </h2>
            <p>
              We only collect information that is strictly necessary to schedule, confirm, and coordinate your private dolphin experience.
            </p>
            <ul className="space-y-3 pl-2 mt-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-transformative-teal shrink-0 mt-1" />
                <div>
                  <strong className="font-semibold text-deep-indigo">Guest Booking Information:</strong> Full name, email address, WhatsApp phone number (critical for Bali-based pickup dispatch), tour date, number of guests, and specific hotel/villa address for return transport coordination.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-transformative-teal shrink-0 mt-1" />
                <div>
                  <strong className="font-semibold text-deep-indigo">Captain Network Data:</strong> Captain name, WhatsApp number, and digital logs of signed <em>Captain Behavioral Agreements</em> (recording rules compliance like parallel dolphin approach and maintaining a safe 30-meter buffer).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-transformative-teal shrink-0 mt-1" />
                <div>
                  <strong className="font-semibold text-deep-indigo">Transaction Metadata:</strong> Stripe checkout tokens. All financial payments are processed off-site via SSL-secured Stripe Checkout. Bali Dolphin Tours does not store, see, or hold credit card details.
                </div>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              3. The Automated &ldquo;Vetted Unlock&rdquo; Dispatch Flow
            </h2>
            <p>
              To maintain the premium &ldquo;Four Seasons&rdquo; style caliber of our services and strictly prevent captains from subcontracting rides to unvetted local boats, we operate a secure, automated dispatch pipeline powered by webhook engines (n8n.io):
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Upon Stripe Checkout success, a placeholder booking is created.</li>
              <li>A digital <strong>Captain Behavioral Contract</strong> is prepared and dispatched to the assigned captain via secure WhatsApp template notification.</li>
              <li><strong>Importantly:</strong> Your private contact details (name, WhatsApp number, and hotel address) remain strictly locked and invisible to the captain until they click the link and digitally sign their compliance contract.</li>
              <li>Once signed, the webhook engine automatically unlocks the pickup details and dispatches them to the captain&apos;s private dashboard to initiate direct, real-time morning coordination.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              4. Data Retention & Sharing
            </h2>
            <p>
              We do not sell, rent, or trade your personal information with external marketers or advertising agencies. We only share details under the following absolute operational conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Vetted Captain Network:</strong> Your designated guide/captain receives your hotel address and WhatsApp number solely to carry out the dolphin encounter and pickup logistics.</li>
              <li><strong>Legal Compliance:</strong> We may disclose information if required by Indonesian maritime authorities or when necessary to protect traveler safety.</li>
            </ul>
            <p>
              We retain guest and captain data for a maximum of 24 months to support recurring booking updates, brand inquiries, and internal safety audits, after which all phone numbers and villa addresses are securely anonymized.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              5. Cookies & Tracking Technologies
            </h2>
            <p>
              We use functional and analytical cookies to support the core booking flow and secure transactions:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Functional Cookies:</strong> We store a small language preference cookie (<code>lang</code>) to preserve your preferred language choice across pages.</li>
              <li><strong>Secure Transactions:</strong> Stripe Checkout relies on third-party security and verification cookies to identify browser sessions and prevent fraudulent transactions during payment checkout.</li>
            </ul>
            <p>
              You can choose to disable cookies through your browser settings or decline non-essential cookies via our consent banner. However, doing so may prevent you from checking out securely.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              6. Your Legal Rights
            </h2>
            <p>
              Under global data protection standards (including GDPR compliance for our European travelers), you have the following rights regarding your personal records:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>The right to request a digital transcript of all details stored in our databases.</li>
              <li>The right to demand immediate correction of inaccurate contact numbers or hotel addresses.</li>
              <li>The right to request immediate and permanent deletion of your customer history (the &ldquo;Right to be Forgotten&rdquo;).</li>
            </ul>
            <p>
              To exercise any of these rights, please contact our legal desk directly via email at <a href="mailto:nthn6828@gmail.com" className="text-transformative-teal font-semibold hover:text-coral-pop underline transition-all">nthn6828@gmail.com</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif text-deep-indigo font-bold tracking-tight border-b border-deep-indigo/5 pb-2">
              7. Contact Our Marine Desk
            </h2>
            <p>
              For general inquiries regarding our visual guidelines, ethical captain contract, automated data routing, or this Privacy Policy, please reach out to us:
            </p>
            <div className="bg-deep-indigo/[0.02] border border-deep-indigo/5 p-6 rounded-2xl space-y-2 text-xs sm:text-sm font-medium">
              <p><span className="text-deep-indigo/40 uppercase font-bold text-[9px] block">Operator Brand</span> Bali Dolphin Tours</p>
              <p><span className="text-deep-indigo/40 uppercase font-bold text-[9px] block">Base of Operations</span> Lovina Beach Road, Kalibukbuk, North Bali, Indonesia</p>
              <p><span className="text-deep-indigo/40 uppercase font-bold text-[9px] block">Primary Inquiries</span> <a href="mailto:nthn6828@gmail.com" className="text-transformative-teal hover:underline">nthn6828@gmail.com</a></p>
              <p><span className="text-deep-indigo/40 uppercase font-bold text-[9px] block">Legal & Privacy desk</span> <a href="mailto:nthn6828@gmail.com" className="text-transformative-teal hover:underline">nthn6828@gmail.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
