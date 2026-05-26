import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 lg:px-12 bg-cloud-dancer border-b border-deep-indigo/10">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-transform duration-500 group-hover:scale-110">
            <Image 
              src="/logo.svg" 
              alt="Lovina Ethical Marine Logo" 
              fill
              className="object-contain"
            />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-deep-indigo">
            Lovina <span className="font-light italic text-transformative-teal underline decoration-coral-pop decoration-2 underline-offset-4">Ethical</span> Marine
          </span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase">
        <Link href="/#ethics" className="hover:text-transformative-teal transition-colors">The Protocol</Link>
        <Link href="/#tours" className="hover:text-transformative-teal transition-colors">Encounters</Link>
        <Link href="/#faq" className="hover:text-transformative-teal transition-colors">FAQ</Link>
        <Link href="/blog" className="hover:text-transformative-teal transition-colors">Journal</Link>
        <Link 
          href="/#booking" 
          className="bg-deep-indigo text-cloud-dancer px-6 py-3 rounded-full hover:bg-transformative-teal transition-all duration-300 shadow-sm text-center"
        >
          Book Now
        </Link>
      </div>
    </nav>
  );
}
