import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-cloud-dancer border-t border-deep-indigo/20 py-12 px-6 lg:px-12 text-sm text-deep-indigo/40">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div>
          <span className="font-serif text-xl font-bold tracking-tight text-deep-indigo opacity-100 mb-4 block">
            Lovina Ethical Marine
          </span>
          <p className="max-w-xs mb-4">North Bali’s definitive standard for respectful marine encounters.</p>
          <p>&copy; 2026 Lovina Ethical Marine. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Navigate</span>
            <Link href="/#ethics" className="hover:text-transformative-teal">Protocol</Link>
            <Link href="/#tours" className="hover:text-transformative-teal">Encounters</Link>
            <Link href="/blog" className="hover:text-transformative-teal">Journal</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Legal</span>
            <Link href="/privacy" className="hover:text-transformative-teal">Privacy</Link>
            <Link href="/terms" className="hover:text-transformative-teal">Terms</Link>
            <Link href="/refunds" className="hover:text-transformative-teal">Refund Policy</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Connect</span>
            <Link href="https://instagram.com" className="hover:text-transformative-teal">Instagram</Link>
            <Link href="https://wa.me/..." className="hover:text-transformative-teal">WhatsApp</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
