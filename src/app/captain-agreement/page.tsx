'use client';

import { useState, useEffect, Suspense } from 'react';
import { Check } from 'lucide-react';

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
      <main className="bg-deep-indigo text-cloud-dancer min-h-screen px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-transformative-teal/20 border border-transformative-teal text-transformative-teal rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Check className="w-10 h-10" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-serif mb-4">Persetujuan Diterima!</h1>
        <p className="text-sm font-light leading-relaxed max-w-sm text-cloud-dancer/75">
          Terima kasih Kapten. Detail kontak tamu dan lokasi hotel sudah dikirimkan langsung ke WhatsApp pribadi Anda sekarang.
        </p>
      </main>
    );
  }

  return (
    <main className="bg-cloud-dancer min-h-screen px-6 py-12 lg:px-12 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-[9px] font-bold uppercase tracking-widest text-coral-pop block mb-2">Lovina Ethical Marine</span>
          <h1 className="text-3xl font-serif text-deep-indigo mb-3">Kontrak Perilaku Kapten</h1>
          <p className="text-xs text-deep-indigo/60 max-w-xs mx-auto">
            Harap setujui aturan etika berikut untuk membuka kunci (unlock) detail kontak tamu untuk pesanan <strong>{bookingId}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-deep-indigo/5 shadow-sm space-y-6">
          {/* Captain details card */}
          <div className="bg-deep-indigo/[0.02] border border-deep-indigo/5 p-4 rounded-2xl flex items-center justify-between text-xs mb-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-deep-indigo/40 block">Nama Kapten</span>
              <span className="font-semibold text-deep-indigo">{captainName || 'Kapten Kemitraan'}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-deep-indigo/40 block">Kode Pesanan</span>
              <span className="font-bold text-coral-pop">{bookingId}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-deep-indigo/40 pb-2 border-bottom border-deep-indigo/5">Aturan Wajib</h3>
            
            {/* Rule 1 */}
            <div 
              onClick={() => handleRuleToggle('personalBoat')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${rules.personalBoat ? 'border-transformative-teal bg-transformative-teal/[0.02]' : 'border-deep-indigo/10 hover:border-deep-indigo/20'}`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${rules.personalBoat ? 'border-transformative-teal bg-transformative-teal text-white' : 'border-deep-indigo/20 bg-white'}`}>
                {rules.personalBoat && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo">Pernyataan Identitas Asli</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya menyatakan bahwa saya sendiri yang akan mengemudikan boat ini. Saya tidak akan mensubkontrakkan pesanan ini kepada kapten luar.</p>
              </div>
            </div>

            {/* Rule 2 */}
            <div 
              onClick={() => handleRuleToggle('noChasing')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${rules.noChasing ? 'border-transformative-teal bg-transformative-teal/[0.02]' : 'border-deep-indigo/10 hover:border-deep-indigo/20'}`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${rules.noChasing ? 'border-transformative-teal bg-transformative-teal text-white' : 'border-deep-indigo/20 bg-white'}`}>
                {rules.noChasing && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo">Larangan Mengejar Lumba-Lumba</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya setuju tidak akan mengejar lumba-lumba. Saya akan mendekati lumba-lumba secara paralel dengan kecepatan lambat (no chase).</p>
              </div>
            </div>

            {/* Rule 3 */}
            <div 
              onClick={() => handleRuleToggle('neutralEngines')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${rules.neutralEngines ? 'border-transformative-teal bg-transformative-teal/[0.02]' : 'border-deep-indigo/10 hover:border-deep-indigo/20'}`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${rules.neutralEngines ? 'border-transformative-teal bg-transformative-teal text-white' : 'border-deep-indigo/20 bg-white'}`}>
                {rules.neutralEngines && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo">Mesin Netral & Jarak Aman</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya akan mematikan mesin ke posisi netral saat berada dalam jarak 30 meter dari lumba-lumba untuk kenyamanan habitat mereka.</p>
              </div>
            </div>

            {/* Rule 4 */}
            <div 
              onClick={() => handleRuleToggle('cleanliness')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${rules.cleanliness ? 'border-transformative-teal bg-transformative-teal/[0.02]' : 'border-deep-indigo/10 hover:border-deep-indigo/20'}`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${rules.cleanliness ? 'border-transformative-teal bg-transformative-teal text-white' : 'border-deep-indigo/20 bg-white'}`}>
                {rules.cleanliness && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo">Standar Kebersihan Boat</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya memastikan boat dalam kondisi sangat bersih, tempat duduk nyaman, dan jaket keselamatan standar siap dipakai tamu.</p>
              </div>
            </div>

            {/* Rule 5 */}
            <div 
              onClick={() => handleRuleToggle('refreshments')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${rules.refreshments ? 'border-transformative-teal bg-transformative-teal/[0.02]' : 'border-deep-indigo/10 hover:border-deep-indigo/20'}`}
            >
              <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${rules.refreshments ? 'border-transformative-teal bg-transformative-teal text-white' : 'border-deep-indigo/20 bg-white'}`}>
                {rules.refreshments && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-deep-indigo">Penyediaan Kopi & Teh Hangat</h4>
                <p className="text-[10px] text-deep-indigo/60 leading-relaxed mt-1">Saya akan menyediakan kopi Bali dan teh hangat yang disajikan secara higienis, serta buah-buahan lokal untuk tamu setelah snorkeling.</p>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!allAgreed || submitting}
            className="w-full bg-coral-pop disabled:bg-deep-indigo/10 disabled:text-deep-indigo/30 text-cloud-dancer py-4 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 disabled:scale-100 mt-4 cursor-pointer"
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
      <div className="min-h-screen bg-cloud-dancer flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-transformative-teal border-t-transparent animate-spin" />
      </div>
    }>
      <CaptainAgreementContent />
    </Suspense>
  );
}
