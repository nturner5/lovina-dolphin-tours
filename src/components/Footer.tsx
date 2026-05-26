import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-soft-bone border-t border-sand-dune/20 py-12 px-6 lg:px-12 text-sm text-volcanic-navy/40">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div>
          <span className="font-serif text-xl font-bold tracking-tight text-volcanic-navy opacity-100 mb-4 block">
            Lovina Ethical
          </span>
          <p className="max-w-xs mb-4">North Bali’s premium gateway for respectful dolphin encounters.</p>
          <p>&copy; 2026 Lovina Ethical Tours. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-volcanic-navy opacity-100 font-bold uppercase tracking-widest text-[10px]">Navigate</span>
            <Link href="/#ethics" className="hover:text-muted-slate">Protocol</Link>
            <Link href="/#tours" className="hover:text-muted-slate">Tours</Link>
            <Link href="/blog" className="hover:text-muted-slate">Journal</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-volcanic-navy opacity-100 font-bold uppercase tracking-widest text-[10px]">Legal</span>
            <Link href="/privacy" className="hover:text-muted-slate">Privacy</Link>
            <Link href="/terms" className="hover:text-muted-slate">Terms</Link>
            <Link href="/refunds" className="hover:text-muted-slate">Refund Policy</Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-volcanic-navy opacity-100 font-bold uppercase tracking-widest text-[10px]">Connect</span>
            <Link href="https://instagram.com" className="hover:text-muted-slate">Instagram</Link>
            <Link href="https://wa.me/..." className="hover:text-muted-slate">WhatsApp</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
