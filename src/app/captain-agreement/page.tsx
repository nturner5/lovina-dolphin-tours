'use client';

import { useState, useEffect, Suspense } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

function CaptainAgreementContent() {
  const [bookingId, setBookingId] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rules, setRules] = useState({
    personalBoat: false,
    noChasing: false,
    neutralEngines: false,
    cleanliness: false,
    refreshments: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setBookingId(params.get('bookingId') || 'LEM-TEMP');
      setCaptainName(params.get('name') || '');
      setCaptainPhone(params.get('phone') || '');
    }
  }, []);

  const handleRuleToggle = (key: keyof typeof rules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allAgreed = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAgreed) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/captain-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          captainName,
          captainPhone,
          signedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Gagal mengirim persetujuan. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim persetujuan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="bg-deep-indigo text-cloud-dancer min-h-screen px-6 py-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Soft elegant ambient background glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-transformative-teal/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-coral-pop/5 blur-3xl pointer-events-none" />

        <div className="w-24 h-24 bg-transformative-teal/20 border border-transformative-teal/40 text-transformative-teal rounded-full flex items-center justify-center mb-8 relative z-10 shadow-lg shadow-transformative-teal/20 animate-pulse">
          <Check className="w-12 h-12" strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-serif mb-4 relative z-10 tracking-tight leading-tight">Persetujuan Diterima!</h1>
        <p className="text-sm font-light leading-relaxed max-w-md text-cloud-dancer/80 relative z-10 px-4">
          Terima kasih Kapten. Detail kontak tamu, alamat hotel, dan detail penjemputan telah dikirimkan secara pribadi ke WhatsApp Anda sekarang. Semoga pelayaran Anda menyenangkan! ⛵🐬
        </p>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-tr from-[#F2EFEA] via-[#F7F5F0] to-[#EAE7E1] min-h-screen py-16 px-4 md:px-8 relative overflow-hidden flex flex-col justify-center items-center text-deep-indigo">
      {/* Premium ambient depth circles */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-transformative-teal/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-coral-pop/5 blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        {/* Elegant Header with Logo */}
        <div className="text-center mb-10">
          <div className="relative w-16 h-16 mx-auto mb-4 transition-transform duration-500 hover:scale-105">
            <Image 
              src="/logo.svg" 
              alt="Lovina Ethical Marine Logo" 
              fill
              className="object-contain filter drop-shadow-sm"
              priority
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-transformative-teal block mb-2">Lovina Ethical Marine</span>
          <h1 className="text-4xl font-serif text-deep-indigo mb-3 font-semibold tracking-tight leading-tight">Kontrak Perilaku Kapten</h1>
          <p className="text-xs text-deep-indigo/70 max-w-sm mx-auto leading-relaxed">
            Harap setujui standar keselamatan dan kelestarian laut kami untuk membuka kunci kontak tamu untuk pesanan:
          </p>
        </div>

        {/* Premium Glassmorphic Form Card */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-6 sm:p-10 rounded-[32px] border border-deep-indigo/10 shadow-xl shadow-deep-indigo/[0.02] space-y-8">
          
          {/* Ticket/Boarding Pass Style Captain & Booking Details Card */}
          <div className="bg-deep-indigo/[0.03] border border-deep-indigo/10 p-5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-transformative-teal/[0.01] rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-deep-indigo/40 tracking-wider block">Nama Kapten</span>
                <span className="font-serif text-base font-semibold text-deep-indigo mt-0.5 block">{captainName || 'Kapten Mitra'}</span>
              </div>
              {captainPhone && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-deep-indigo/40 tracking-wider block">No. WhatsApp</span>
                  <span className="font-mono text-xs text-deep-indigo/70 mt-0.5 block">{captainPhone}</span>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-dashed border-deep-indigo/15">
              <span className="text-[9px] uppercase font-bold text-deep-indigo/40 tracking-wider block">Kode Booking (ID)</span>
              <span className="font-mono font-bold text-coral-pop break-all block mt-1.5 bg-coral-pop/[0.04] px-4 py-3 rounded-xl border border-coral-pop/10 text-xs shadow-inner">
                {bookingId}
              </span>
            </div>
          </div>

          {/* Guidelines Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-deep-indigo/10">
              <ShieldCheck className="w-4 h-4 text-transformative-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-deep-indigo/50">Aturan Wajib Kemitraan</h3>
            </div>
            
            {/* Rule 1 */}
            <div 
              onClick={() => handleRuleToggle('personalBoat')}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start active:scale-[0.99] ${
                rules.personalBoat 
                  ? 'border-transformative-teal bg-transformative-teal/[0.03] shadow-sm shadow-transformative-teal/[0.02]' 
                  : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                rules.personalBoat 
                  ? 'border-transformative-teal bg-transformative-teal text-white shadow-sm shadow-transformative-teal/20' 
                  : 'border-deep-indigo/20 bg-white'
              }`}>
                {rules.personalBoat && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo tracking-tight">Pernyataan Identitas Asli</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya menyatakan bahwa saya sendiri yang akan mengemudikan boat ini. Saya tidak akan mensubkontrakkan pesanan ini kepada kapten luar.</p>
              </div>
            </div>

            {/* Rule 2 */}
            <div 
              onClick={() => handleRuleToggle('noChasing')}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start active:scale-[0.99] ${
                rules.noChasing 
                  ? 'border-transformative-teal bg-transformative-teal/[0.03] shadow-sm shadow-transformative-teal/[0.02]' 
                  : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                rules.noChasing 
                  ? 'border-transformative-teal bg-transformative-teal text-white shadow-sm shadow-transformative-teal/20' 
                  : 'border-deep-indigo/20 bg-white'
              }`}>
                {rules.noChasing && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo tracking-tight">Larangan Mengejar Lumba-Lumba</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya setuju tidak akan mengejar lumba-lumba. Saya akan mendekati lumba-lumba secara paralel dengan kecepatan lambat (no chase).</p>
              </div>
            </div>

            {/* Rule 3 */}
            <div 
              onClick={() => handleRuleToggle('neutralEngines')}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start active:scale-[0.99] ${
                rules.neutralEngines 
                  ? 'border-transformative-teal bg-transformative-teal/[0.03] shadow-sm shadow-transformative-teal/[0.02]' 
                  : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                rules.neutralEngines 
                  ? 'border-transformative-teal bg-transformative-teal text-white shadow-sm shadow-transformative-teal/20' 
                  : 'border-deep-indigo/20 bg-white'
              }`}>
                {rules.neutralEngines && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo tracking-tight">Mesin Netral & Jarak Aman</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya akan mematikan mesin ke posisi netral saat berada dalam jarak 30 meter dari lumba-lumba untuk kenyamanan habitat mereka.</p>
              </div>
            </div>

            {/* Rule 4 */}
            <div 
              onClick={() => handleRuleToggle('cleanliness')}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start active:scale-[0.99] ${
                rules.cleanliness 
                  ? 'border-transformative-teal bg-transformative-teal/[0.03] shadow-sm shadow-transformative-teal/[0.02]' 
                  : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                rules.cleanliness 
                  ? 'border-transformative-teal bg-transformative-teal text-white shadow-sm shadow-transformative-teal/20' 
                  : 'border-deep-indigo/20 bg-white'
              }`}>
                {rules.cleanliness && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo tracking-tight">Standar Kebersihan Boat</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya memastikan boat dalam kondisi sangat bersih, tempat duduk nyaman, dan jaket keselamatan standar siap dipakai tamu.</p>
              </div>
            </div>

            {/* Rule 5 */}
            <div 
              onClick={() => handleRuleToggle('refreshments')}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 items-start active:scale-[0.99] ${
                rules.refreshments 
                  ? 'border-transformative-teal bg-transformative-teal/[0.03] shadow-sm shadow-transformative-teal/[0.02]' 
                  : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                rules.refreshments 
                  ? 'border-transformative-teal bg-transformative-teal text-white shadow-sm shadow-transformative-teal/20' 
                  : 'border-deep-indigo/20 bg-white'
              }`}>
                {rules.refreshments && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo tracking-tight">Penyediaan Kopi & Teh Hangat</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya akan menyediakan kopi Bali dan teh hangat yang disajikan secara higienis, serta buah-buahan lokal untuk tamu setelah snorkeling.</p>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!allAgreed || submitting}
            className="w-full bg-coral-pop disabled:bg-deep-indigo/10 disabled:text-deep-indigo/35 text-white py-4 rounded-full text-xs font-bold hover:bg-deep-indigo disabled:hover:bg-deep-indigo/10 transition-all duration-300 shadow-md shadow-coral-pop/10 hover:shadow-lg hover:shadow-deep-indigo/10 active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none mt-6 cursor-pointer"
          >
            {submitting ? 'Mengirim persetujuan...' : 'Saya Setuju & Tanda Tangani Kontrak'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CaptainAgreementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-transformative-teal border-t-transparent animate-spin" />
      </div>
    }>
      <CaptainAgreementContent />
    </Suspense>
  );
}
