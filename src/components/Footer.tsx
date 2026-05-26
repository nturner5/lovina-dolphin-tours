import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-cloud-dancer border-t border-deep-indigo/20 py-16 px-6 lg:px-12 text-sm text-deep-indigo/40">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105 transition-all duration-500">
              <Image 
                src="/logo.svg" 
                alt="Lovina Ethical Marine Logo" 
                fill
                className="object-contain"
              />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-deep-indigo opacity-100 block">
              Lovina Ethical Marine
            </span>
          </div>
          <p className="max-w-xs leading-relaxed">
            North Bali’s definitive standard for respectful dolphin tours. 
            Dedicated to the protection and quiet observation of Lovina’s wild dolphin pods.
          </p>
          <p>&copy; 2026 Lovina Ethical Marine. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-deep-indigo opacity-100 font-bold uppercase tracking-widest text-[10px]">Navigate</span>
            <Link href="/#ethics" className="hover:text-transformative-teal">Dolphin Rules</Link>
            <Link href="/#tours" className="hover:text-transformative-teal">Tours</Link>
            <Link href="/blog" className="hover:text-transformative-teal">Blog</Link>
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
