import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 lg:px-12 bg-soft-bone border-b border-sand-dune/10">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-volcanic-navy">
          Lovina <span className="font-light italic text-muted-slate underline decoration-sand-dune decoration-2 underline-offset-4">Ethical</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase">
        <Link href="/#ethics" className="hover:text-muted-slate transition-colors">The Protocol</Link>
        <Link href="/#tours" className="hover:text-muted-slate transition-colors">Tours</Link>
        <Link href="/#faq" className="hover:text-muted-slate transition-colors">FAQ</Link>
        <Link href="/blog" className="hover:text-muted-slate transition-colors">Journal</Link>
        <Link 
          href="/#booking" 
          className="bg-volcanic-navy text-soft-bone px-6 py-3 rounded-full hover:bg-muted-slate transition-all duration-300 shadow-sm text-center"
        >
          Book Now
        </Link>
      </div>
    </nav>
  );
}
