import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="bg-soft-bone min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center p-12 bg-white rounded-3xl shadow-sm border border-sand-dune/20 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-sage-leaf/20 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
          🐬
        </div>
        <h1 className="text-4xl font-serif text-volcanic-navy mb-4">Payment Confirmed</h1>
        <p className="text-volcanic-navy/60 mb-10 leading-relaxed font-light">
          Your ethical dolphin tour is secured. We are now dispatching your booking details directly to our team of captains. 
          <br /><br />
          You will receive a confirmation via email and a WhatsApp message within the next few hours.
        </p>
        <Link 
          href="/" 
          className="bg-volcanic-navy text-soft-bone px-10 py-4 rounded-full text-lg font-medium hover:bg-muted-slate transition-all inline-block"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
